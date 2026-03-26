package com.kzoneworkspace.backend.agent.service

import com.kzoneworkspace.backend.agent.repository.ActivityLogRepository
import com.kzoneworkspace.backend.agent.repository.MemoryRepository
import com.kzoneworkspace.backend.claude.GeminiClient
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import java.time.LocalDateTime
import java.time.format.DateTimeFormatter

@Service
class BriefingService(
    private val activityLogRepository: ActivityLogRepository,
    private val memoryRepository: MemoryRepository,
    private val geminiClient: GeminiClient
) {
    private val log = LoggerFactory.getLogger(BriefingService::class.java)

    fun generateDailyBriefing(): String {
        log.info("Generating daily briefing...")
        val last24h = LocalDateTime.now().minusDays(1)
        
        val recentLogs = activityLogRepository.findByTimestampAfter(last24h)
        val recentMemories = memoryRepository.findByCreatedAtAfter(last24h)
        
        if (recentLogs.isEmpty() && recentMemories.isEmpty()) {
            return "최근 24시간 동안 기록된 에이전트 활동이나 새로운 지식이 없습니다. 업무를 시작해 보세요!"
        }

        val logSummary = recentLogs.take(50).joinToString("\n") { 
            "-[${it.timestamp.format(DateTimeFormatter.ofPattern("HH:mm"))}] ${it.activityType}: ${it.toolName ?: ""} ${it.details ?: ""}" 
        }
        
        val memorySummary = recentMemories.joinToString("\n") { 
            "- ${it.content}" 
        }

        val prompt = """
            당신은 AI 워크스테이션의 오피스 매니저입니다. 지난 24시간 동안의 활동 로그와 추출된 기억을 바탕으로 사용자에게 '데일리 브리핑'을 제공하세요.
            
            로그 요약:
            $logSummary
            
            새로운 기억/지식:
            $memorySummary
            
            보고서 형식:
            1. 📊 **지난 24시간 활동 요약**: 수행한 주요 작업들과 성공/실패 여부를 간략히 요약하세요.
            2. 💡 **새롭게 학습한 내용**: 사용자의 선호도나 프로젝트 관련 중요한 사실들을 나열하세요.
            3. 🚀 **오늘의 추천 업무**: 현재 상황을 바탕으로 다음에 할 만한 업무 2-3가지를 제안하세요.
            
            톤앤매너: 전문적이면서도 친절하게 작성하세요. 마크다운 형식을 사용하여 읽기 좋게 만드세요.
        """.trimIndent()

        return try {
            val response = geminiClient.sendMessage(
                systemPrompt = "당신은 유능한 AI 오피스 매니저입니다.",
                messages = listOf(mapOf("role" to "user", "content" to prompt)),
                model = "gemini-2.0-flash"
            )
            
            val candidate = response.candidates().orElse(emptyList()).firstOrNull()
            val text = candidate?.content()?.orElse(null)?.parts()?.orElse(emptyList())?.firstOrNull()?.text()?.orElse("") ?: ""
            
            text.ifBlank { "브리핑 생성에 실패했습니다. 로그를 다시 확인해 주세요." }
        } catch (e: Exception) {
            log.error("Failed to generate briefing: ${e.message}")
            "브리핑 생성 중 오류가 발생했습니다: ${e.message}"
        }
    }
}
