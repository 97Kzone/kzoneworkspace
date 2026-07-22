package com.kzoneworkspace.backend.agent.service

import com.kzoneworkspace.backend.agent.dto.AgentStandup
import com.kzoneworkspace.backend.agent.repository.ActivityLogRepository
import com.kzoneworkspace.backend.agent.repository.MemoryRepository
import com.kzoneworkspace.backend.claude.GeminiClient
import com.google.gson.Gson
import com.google.common.reflect.TypeToken
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDateTime

@Service
@Transactional(readOnly = true)
class StandupService(
    private val agentService: AgentService,
    private val activityLogRepository: ActivityLogRepository,
    private val warRoomService: WarRoomService,
    private val memoryRepository: MemoryRepository,
    private val geminiClient: GeminiClient
) {
    private val gson = Gson()
    @Transactional
    fun generateDailyStandup(): List<AgentStandup> {
        val agents = agentService.getAllAgents()
        
        return agents.map { agent ->

            val recentLogs = activityLogRepository.findByAgentIdOrderByTimestampDesc(agent.id).take(10)
            val recentMemories = memoryRepository.findByCreatedAtAfter(LocalDateTime.now().minusHours(24))
                .filter { it.agentId == agent.id }
                .take(5)

            val logsData = recentLogs.joinToString("\n") { "- ${it.timestamp}: ${it.activityType} (${it.toolName ?: ""}) ${it.details ?: ""}" }
            val memoriesData = recentMemories.joinToString("\n") { "- ${it.createdAt}: ${it.content}" }

            val systemPrompt = """
                당신은 AI 에이전트 군집의 '스탠드업 마스터'입니다. 에이전트의 활동 로그와 기억을 바탕으로 데일리 스탠드업 보고서(어제 한 일, 오늘 할 일, 블로커)를 작성해야 합니다.
                응답은 반드시 JSON 형식으로만 제공하며, 다음 필드를 포함해야 합니다:
                - pastAction: 어제 완료한 일 또는 최근 활동 요약 (한국어, 1~2문장)
                - todayFocus: 오늘 집중할 일 또는 목표 (한국어, 1~2문장)
                - blocker: 현재 겪고 있는 문제나 방해 요소. 없으면 null (한국어, 1문장)
            """.trimIndent()

            val userPrompt = """
                다음은 에이전트 '${agent.name}' (${agent.role})의 최근 활동 데이터입니다:

                [활동 로그]
                ${if (logsData.isBlank()) "활동 로그 없음" else logsData}

                [최근 기억]
                ${if (memoriesData.isBlank()) "최근 기억 없음" else memoriesData}

                위 데이터를 바탕으로 스탠드업 보고서를 JSON으로 작성하세요.
            """.trimIndent()

            var pastAction = "시스템 유지보수 및 대기 상태였습니다."
            var todayFocus = "주어진 목표에 맞춰 할당된 업무를 신속하게 처리하겠습니다."
            var blocker: String? = null

            try {
                val response = geminiClient.sendMessage(
                    systemPrompt = systemPrompt,
                    messages = listOf(mapOf("role" to "user", "content" to userPrompt))
                )

                val candidate = response.candidates().orElse(emptyList()).firstOrNull()
                var jsonText = candidate?.content()?.orElse(null)?.parts()?.orElse(emptyList())?.firstOrNull()?.text()?.orElse("") ?: ""

                if (jsonText.contains("```json")) {
                    jsonText = jsonText.substringAfter("```json").substringBefore("```").trim()
                } else if (jsonText.contains("```")) {
                    jsonText = jsonText.substringAfter("```").substringBefore("```").trim()
                }

                val resultType = object : TypeToken<Map<String, Any>>() {}.type
                val resultData: Map<String, Any> = gson.fromJson(jsonText, resultType)

                pastAction = resultData["pastAction"] as? String ?: pastAction
                todayFocus = resultData["todayFocus"] as? String ?: todayFocus
                blocker = resultData["blocker"] as? String
                if (blocker == "null") blocker = null

            } catch (e: Exception) {
                // Fallback to simple heuristics if Gemini fails
                val hasError = recentLogs.any { it.activityType == "ERROR" }
                blocker = if (hasError) "일부 모듈에서 예외가 발생하여 분석이 필요합니다." else null
            }

            // Blocker가 있으면 워룸으로 에스컬레이션
            val hasError = recentLogs.any { it.activityType == "ERROR" }
            if (blocker != null) {
                warRoomService.escalate(
                    title = "${agent.name} 에이전트 병목 감지",
                    description = blocker,
                    severity = if (hasError) com.kzoneworkspace.backend.agent.entity.IncidentSeverity.CRITICAL else com.kzoneworkspace.backend.agent.entity.IncidentSeverity.HIGH,
                    involvedAgents = listOf(agent.name)
                )
            }

            AgentStandup(
                agentId = agent.id,
                agentName = agent.name,
                agentRole = agent.role,
                pastAction = pastAction,
                todayFocus = todayFocus,
                blocker = blocker,
                timestamp = LocalDateTime.now()
            )
        }
    }
}
