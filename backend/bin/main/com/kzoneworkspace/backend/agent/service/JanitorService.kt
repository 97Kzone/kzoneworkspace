package com.kzoneworkspace.backend.agent.service

import com.kzoneworkspace.backend.agent.entity.*
import com.kzoneworkspace.backend.agent.repository.MaintenanceIssueRepository
import com.kzoneworkspace.backend.tools.GitService
import com.kzoneworkspace.backend.websocket.ChatMessage
import com.kzoneworkspace.backend.websocket.ChatMessageRepository
import com.kzoneworkspace.backend.websocket.MessageType
import org.slf4j.LoggerFactory
import org.springframework.messaging.simp.SimpMessagingTemplate
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.io.File
import java.time.LocalDateTime

@Service
class JanitorService(
    private val maintenanceIssueRepository: MaintenanceIssueRepository,
    private val geminiClient: com.kzoneworkspace.backend.claude.GeminiClient,
    private val gitService: GitService,
    private val messagingTemplate: SimpMessagingTemplate,
    private val chatMessageRepository: ChatMessageRepository
) {
    private val logger = LoggerFactory.getLogger(JanitorService::class.java)

    @Transactional
    fun scanCodebase(targetDirs: List<String> = listOf("src/main/kotlin", "src/app")): Int {
        var foundCount = 0
        targetDirs.forEach { dirPath ->
            val root = File(dirPath)
            if (root.exists() && root.isDirectory) {
                root.walkTopDown().forEach { file ->
                    if (file.isFile && isSupportedExtension(file.extension)) {
                        foundCount += scanSingleFile(file)
                    }
                }
            } else if (root.exists() && root.isFile) {
                foundCount += scanSingleFile(root)
            }
        }
        return foundCount
    }

    private fun scanSingleFile(file: File): Int {
        val issues = analyzeFile(file)
        if (issues.isNotEmpty()) {
            maintenanceIssueRepository.saveAll(issues)
            return issues.size
        }
        return 0
    }

    /**
     * 자율 주행 모드: 최근 변경된 파일들만 골라 스캔합니다.
     * 매 1시간마다 실행 (cron: 0 0 * * * *)
     */
    @Scheduled(cron = "0 0 * * * *")
    @Transactional
    fun performRoutineScan() {
        logger.info("🚀 [Janitor Autopilot] Starting routine codebase scan...")
        val changedFiles = gitService.getChangedFiles()
        
        if (changedFiles.isEmpty()) {
            logger.info("✅ [Janitor Autopilot] No changed files detected. Skipping scan.")
            return
        }

        var newIssueCount = 0
        changedFiles.forEach { filePath ->
            val file = File(filePath)
            if (file.exists() && file.isFile && isSupportedExtension(file.extension)) {
                newIssueCount += scanSingleFile(file)
            }
        }

        if (newIssueCount > 0) {
            val reportMessage = "🛠️ [Janitor 자율 스캔 완료]\n최근 변경된 파일에서 **${newIssueCount}개**의 잠재적 관리 이슈가 발견되었습니다. 'Intelligence > AI Janitor' 탭에서 확인하세요."
            sendSystemNotification(reportMessage)
        }
        logger.info("✅ [Janitor Autopilot] Routine scan finished. Found $newIssueCount issues.")
    }

    private fun sendSystemNotification(content: String) {
        val systemMessage = ChatMessage(
            roomId = "default",
            senderId = "janitor_autopilot",
            senderName = "Janitor Autopilot",
            content = content,
            type = MessageType.SYSTEM
        )
        val saved = chatMessageRepository.save(systemMessage)
        messagingTemplate.convertAndSend("/topic/public", saved)
    }

    private fun isSupportedExtension(ext: String): Boolean {
        return listOf("kt", "java", "ts", "tsx", "js", "jsx", "html", "css").contains(ext.lowercase())
    }

    private fun analyzeFile(file: File): List<MaintenanceIssue> {
        val content = file.readText()
        if (content.isBlank()) return emptyList()

        val systemPrompt = """
            You are an expert software engineer and 'Codebase Janitor'. 
            Analyze the provided code for:
            1. UNUSED_CODE: dead code, unused imports, or variables.
            2. LINT_ERROR: blatant style violations or common pitfalls.
            3. LOGIC_SMELL: overly complex logic, potential bugs, or anti-patterns.
            4. PERFORMANCE: obvious performance bottlenecks.
            
            Return the results as a list of issues in the following format (split by '---ISSUE_BOUNDARY---'):
            CATEGORY|SEVERITY|DESCRIPTION|ORIGINAL_CODE|SUGGESTED_CODE
            
            If no issues found, return "NO_ISSUES".
            
            Example:
            UNUSED_CODE|MINOR|Unused import 'java.util.List'|import java.util.List||
            LOGIC_SMELL|MAJOR|Potential null pointer here|if (x == null) { x.do() }|if (x != null) { x.do() }
        """.trimIndent()

        val userMessage = "Analyze this file: ${file.path}\n\n```\n$content\n```"
        
        try {
            val response = geminiClient.sendMessage(systemPrompt, listOf(mapOf("role" to "user", "content" to userMessage)))
            val candidate = response.candidates().orElse(emptyList()).firstOrNull()
            val responseText = candidate?.content()?.orElse(null)?.parts()?.orElse(emptyList())?.firstOrNull()?.text()?.orElse("") ?: ""
            
            if (responseText.contains("NO_ISSUES")) return emptyList()

            return responseText.split("---ISSUE_BOUNDARY---").mapNotNull { block ->
                val parts = block.trim().split("|")
                if (parts.size >= 3) {
                    val categoryName = parts[0].trim().uppercase()
                    val severityName = parts[1].trim().uppercase()
                    
                    MaintenanceIssue(
                        filePath = file.path,
                        category = enumSafeValueOf<IssueCategory>(categoryName, IssueCategory.LOGIC_SMELL),
                        severity = enumSafeValueOf<IssueSeverity>(severityName, IssueSeverity.MINOR),
                        description = parts[2].trim(),
                        originalCode = parts.getOrNull(3)?.trim(),
                        suggestedCode = parts.getOrNull(4)?.trim()
                    )
                } else null
            }
        } catch (e: Exception) {
            logger.error("Failed to analyze file ${file.path}: ${e.message}")
            return emptyList()
        }
    }

    private inline fun <reified T : Enum<T>> enumSafeValueOf(name: String, default: T): T {
        return try {
            java.lang.Enum.valueOf(T::class.java, name)
        } catch (e: Exception) {
            default
        }
    }

    @Transactional
    fun getPendingIssues(): List<MaintenanceIssue> {
        return maintenanceIssueRepository.findByStatusOrderByCreatedAtDesc(MaintenanceStatus.PENDING)
    }

    @Transactional
    fun applyFix(id: Long): Pair<Boolean, String> {
        val issue = maintenanceIssueRepository.findById(id).orElse(null) ?: return false to "Issue not found"
        val original = issue.originalCode
        val suggested = issue.suggestedCode
        
        if (original == null || suggested == null) return false to "No suggested code provided"

        val file = File(issue.filePath)
        if (!file.exists()) return false to "File not found: ${issue.filePath}"

        try {
            val content = file.readText()
            // Simple string replacement for now. In a real scenario, we'd use line numbers or AST.
            if (!content.contains(original)) {
                return false to "Original code mismatch. The file might have changed."
            }
            
            val newContent = content.replace(original, suggested)
            file.writeText(newContent)
            
            issue.status = MaintenanceStatus.APPLIED
            maintenanceIssueRepository.save(issue)
            
            return true to "Successfully applied fix to ${issue.filePath}"
        } catch (e: Exception) {
            return false to "Failed to apply fix: ${e.message}"
        }
    }

    @Transactional
    fun ignoreIssue(id: Long) {
        maintenanceIssueRepository.findById(id).ifPresent {
            it.status = MaintenanceStatus.IGNORED
            maintenanceIssueRepository.save(it)
        }
    }
}
