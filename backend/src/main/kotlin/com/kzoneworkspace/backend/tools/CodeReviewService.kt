package com.kzoneworkspace.backend.tools

import com.google.gson.reflect.TypeToken
import com.google.gson.Gson
import com.kzoneworkspace.backend.agent.entity.CodeReviewResult
import com.kzoneworkspace.backend.agent.repository.CodeReviewRepository
import com.kzoneworkspace.backend.agent.service.AgentService
import com.kzoneworkspace.backend.claude.GeminiClient
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.io.File
import java.time.LocalDateTime

@Service
class CodeReviewService(
    private val gitService: GitService,
    private val agentService: AgentService,
    private val geminiClient: GeminiClient,
    private val codeReviewRepository: CodeReviewRepository
) {
    private val log = LoggerFactory.getLogger(CodeReviewService::class.java)
    private val gson = Gson()

    fun getAllReviews(): List<CodeReviewResult> = codeReviewRepository.findByOrderByCreatedAtDesc()

    @Transactional
    fun performReview(filePath: String): List<CodeReviewResult> {
        log.info("Performing AI Code Review for file: $filePath")
        val file = File(filePath)
        if (!file.exists()) throw RuntimeException("파일을 찾을 수 없습니다: $filePath")
        
        val content = file.readText()
        
        val systemPrompt = """
            당신은 최고의 실력을 가진 시니어 풀스택 개발자이자 보안 전문가입니다. 
            제시된 코드를 정밀 분석하여 잠재적 버그, 성능 병목, 보안 취약점, 유지보수성 개선 사항을 찾아내세요.
            
            분석 가이드라인:
            1. 실질적이고 구체적인 문제점만 지적하세요.
            2. 발견된 문제에 대해 반드시 개선된 코드(suggestedCode)를 제안하세요.
            3. 응답은 반드시 JSON 리스트 형식이어야 합니다.
            4. 각 JSON은 title, issue, severity, originalCode, suggestedCode 필드를 포함해야 합니다.
        """.trimIndent()

        val userPrompt = """
            다음 파일에 대한 코드 리뷰를 수행해줘:
            파일 경로: $filePath
            
            코드 내용:
            ```
            $content
            ```
            
            각 결과는 다음 필드를 가진 JSON 객체여야 합니다:
            - title: 이슈의 짧은 제목
            - issue: 문제점에 대한 상세 설명 (Markdown 형식)
            - severity: HIGH, MEDIUM, LOW 중 하나
            - originalCode: 수정이 필요한 원래의 코드 조각 (정밀한 대체를 위해 가급적이면 작은 단위로 주세요)
            - suggestedCode: 개선된 코드 조각
            
            응답은 오직 JSON 리스트 형태로만 제공하세요. (예: [{"title": "...", ...}])
        """.trimIndent()

        return try {
            val response = geminiClient.sendMessage(
                systemPrompt = systemPrompt,
                messages = listOf(mapOf("role" to "user", "content" to userPrompt)),
                model = "gemini-2.0-flash"
            )

            val candidate = response.candidates().orElse(emptyList()).firstOrNull()
            var jsonText = candidate?.content()?.orElse(null)?.parts()?.orElse(emptyList())?.firstOrNull()?.text()?.orElse("") ?: ""
            
            if (jsonText.contains("```json")) {
                jsonText = jsonText.substringAfter("```json").substringBefore("```").trim()
            } else if (jsonText.contains("```")) {
                jsonText = jsonText.substringAfter("```").substringBefore("```").trim()
            }

            val listType = object : TypeToken<List<Map<String, Any>>>() {}.type
            val reviewDataList: List<Map<String, Any>> = gson.fromJson(jsonText, listType)

            val results = reviewDataList.map { data ->
                CodeReviewResult(
                    id = 0,
                    filePath = filePath,
                    title = data["title"] as? String ?: "Review Recommendation",
                    issue = data["issue"] as? String ?: "No details provided",
                    originalCode = data["originalCode"] as? String,
                    suggestedCode = data["suggestedCode"] as? String,
                    severity = data["severity"] as? String ?: "MEDIUM",
                    status = "PENDING",
                    createdAt = LocalDateTime.now()
                )
            }

            codeReviewRepository.saveAll(results).toList()
        } catch (e: Exception) {
            log.error("Failed to perform code review: ${e.message}")
            emptyList()
        }
    }

    @Transactional
    fun applyFix(reviewId: Long): Boolean {
        val review = codeReviewRepository.findById(reviewId).get() 
        if (review.status == "APPLIED") return true
        
        val original = review.originalCode ?: return false
        val suggested = review.suggestedCode ?: return false
        
        val file = File(review.filePath)
        if (!file.exists()) return false

        val currentContent = file.readText()
        if (!currentContent.contains(original)) return false

        val newContent = currentContent.replace(original, suggested)
        file.writeText(newContent)
        
        review.status = "APPLIED"
        codeReviewRepository.save(review)
        return true
    }
}
