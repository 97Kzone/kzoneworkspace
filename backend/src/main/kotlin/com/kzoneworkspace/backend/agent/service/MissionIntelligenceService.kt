package com.kzoneworkspace.backend.agent.service

import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import com.fasterxml.jackson.module.kotlin.readValue
import com.kzoneworkspace.backend.agent.entity.MissionContext
import com.kzoneworkspace.backend.agent.repository.MissionContextRepository
import com.kzoneworkspace.backend.claude.ClaudeClient
import com.kzoneworkspace.backend.task.entity.Task
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDateTime

data class IntelligenceExtraction(
    val key: String,
    val value: String,
    val importance: Int
)

data class ExtractionResponse(
    val discoveries: List<IntelligenceExtraction>
)

@Service
class MissionIntelligenceService(
    private val missionContextRepository: MissionContextRepository,
    private val claudeClient: ClaudeClient
) {
    private val logger = LoggerFactory.getLogger(MissionIntelligenceService::class.java)
    private val objectMapper = jacksonObjectMapper()

    @Transactional
    fun extractAndSync(task: Task, result: String) {
        val systemPrompt = """
            당신은 프로젝트의 '집단 미션 지능(Mission Intelligence)'을 관리하는 아키텍트입니다. 
            에이전트가 수행한 태스크의 설명과 그 결과물(로그, 코드 등)을 분석하여, 
            이후 다른 에이전트들이 미션을 수행할 때 반드시 알아야 할 '핵심 기술적 사실'이나 '발견된 제약 사항'을 추출하세요.
            
            [추출 가이드라인]
            1. 범용적인 지식보다는 현재 미션(Room)에 특화된 지식을 우선하세요.
            2. 파일 구조, 새로운 API 엔드포인트, 데이터베이스 스키마 변경, 특정 도구의 버그 등을 찾으세요.
            3. 너무 세부적인 구현보다는 다른 작업에 영향을 줄 수 있는 '전역적 정보'를 추출하세요.
            4. 중요도는 1(참고)에서 5(치명적/필수) 사이로 지정하세요.
            
            응답은 반드시 아래 JSON 형식으로만 작성하세요. 텍스트 설명은 포함하지 마세요:
            {
              "discoveries": [
                {
                  "key": "지식의 핵심 키워드 (예: DB_CONNECTION_POLICY, AUTH_ENDPOINT)",
                  "value": "지식의 상세 내용 (한글)",
                  "importance": 1~5
                }
              ]
            }
        """.trimIndent()

        val userMessage = """
            [태스크 목표]: ${task.command}
            [실행 결과 요약]: ${result.take(5000)}
            [수행 에이전트]: ${task.agent?.name ?: "Unknown"}
            
            이 결과에서 다음 에이전트들에게 공유할 미션 지능을 추출해줘.
        """.trimIndent()

        try {
            val response = claudeClient.sendMessage(systemPrompt, userMessage)
            val jsonStart = response.indexOf("{")
            val jsonEnd = response.lastIndexOf("}") + 1
            if (jsonStart == -1 || jsonEnd == -1) return

            val jsonString = response.substring(jsonStart, jsonEnd)
            val extraction: ExtractionResponse = objectMapper.readValue(jsonString)

            extraction.discoveries.forEach { discovery ->
                val context = MissionContext(
                    roomId = task.roomId,
                    intelKey = discovery.key,
                    intelValue = discovery.value,
                    importance = discovery.importance,
                    agentName = task.agent?.name ?: "Unknown"
                )
                missionContextRepository.save(context)
                logger.info("New Mission Intelligence Synced: ${discovery.key} in ${task.roomId}")
            }
        } catch (e: Exception) {
            logger.error("Failed to extract mission intelligence: ${e.message}")
        }
    }

    fun getContextPrompt(roomId: String): String {
        val contexts = missionContextRepository.findByRoomIdOrderByImportanceDescCreatedAtDesc(roomId)
        if (contexts.isEmpty()) return ""

        val contextStr = contexts.joinToString("\n") { ctx ->
            "- [${ctx.intelKey}] (중요도: ${ctx.importance}): ${ctx.intelValue} (발견자: ${ctx.agentName})"
        }

        return """
            
            [Shared Mission Intelligence - IMPORTANT]
            현재 세션에서 다른 에이전트들이 발견한 핵심 정보들입니다. 작업 시 이 내용을 최우선으로 고려하세요:
            $contextStr
            
        """.trimIndent()
    }

    @Transactional
    fun clearRoomContext(roomId: String) {
        missionContextRepository.deleteByRoomId(roomId)
    }
}
