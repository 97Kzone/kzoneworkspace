package com.kzoneworkspace.backend.agent.service

import com.google.gson.Gson
import com.google.common.reflect.TypeToken
import com.kzoneworkspace.backend.agent.entity.CognitiveAlignmentReport
import com.kzoneworkspace.backend.agent.entity.StrategicRecommendation
import com.kzoneworkspace.backend.agent.repository.AgentRepository
import com.kzoneworkspace.backend.agent.repository.CognitiveAlignmentReportRepository
import com.kzoneworkspace.backend.agent.repository.CognitiveTraceRepository
import com.kzoneworkspace.backend.agent.repository.StrategicRecommendationRepository
import com.kzoneworkspace.backend.claude.GeminiClient
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDateTime

@Service
class CognitiveAlignmentService(
    private val traceRepository: CognitiveTraceRepository,
    private val alignmentReportRepository: CognitiveAlignmentReportRepository,
    private val agentRepository: AgentRepository,
    private val recommendationRepository: StrategicRecommendationRepository,
    private val geminiClient: GeminiClient
) {
    private val log = LoggerFactory.getLogger(CognitiveAlignmentService::class.java)
    private val gson = Gson()

    fun getLatestReport(roomId: String): CognitiveAlignmentReport? =
        alignmentReportRepository.findTopByRoomIdOrderByCreatedAtDesc(roomId)

    @Transactional
    fun analyzeAlignment(roomId: String): CognitiveAlignmentReport {
        log.info("Analyzing cognitive alignment for room: $roomId")

        // 1. 최근 인지 트레이스 수집 (최근 50개)
        val traces = traceRepository.findByRoomIdOrderByTimestampAsc(roomId).takeLast(50)
        if (traces.isEmpty()) {
            return CognitiveAlignmentReport(
                roomId = roomId,
                alignmentScore = 100,
                conflicts = "[]",
                mediationStrategy = "수집된 인지 트레이스가 없습니다. 분석을 시작하기 위해 에이전트 활동이 필요합니다.",
                analysisReasoning = "데이터 부족"
            )
        }

        val agents = agentRepository.findAll().associateBy { it.id }
        
        val traceSummary = traces.joinToString("\n") { trace ->
            val agentName = agents[trace.agentId]?.name ?: "Unknown"
            "[${trace.timestamp}] $agentName (${trace.type}): ${trace.content}"
        }

        // 2. Gemini를 이용한 분석
        val systemPrompt = """
            당신은 AI 에이전트 군집의 '협업 정렬 분석가'입니다. 
            에이전트들이 서로 다른 생각이나 계획을 가지고 충돌하고 있는지(인지적 불일치)를 분석해야 합니다.
            
            응답은 반드시 JSON 형식으로만 제공하며, 다음 필드를 포함해야 합니다:
            - alignmentScore: 0~100 사이의 정수 (높을수록 조화로움)
            - conflicts: 감지된 충돌 지점 리스트. 각 객체는 다음 필드를 포함:
                * agents: 충돌하는 에이전트 이름 리스트
                * topic: 충돌 주제
                * description: 충돌 내용 상세
                * severity: 'HIGH', 'MEDIUM', 'LOW'
            - mediationStrategy: 이 충돌들을 해결하기 위한 구체적인 중재 전략 (Markdown)
            - analysisReasoning: 분석 근거 및 종합 평가 (Markdown)
        """.trimIndent()

        val userPrompt = """
            다음은 '$roomId' 룸에서 발생한 에이전트들의 인지 트레이스입니다:
            
            $traceSummary
            
            위 데이터를 분석하여 인지 정렬 보고서를 JSON으로 작성하세요.
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

            val resultType = object : TypeToken<Map<String, Any>>() {}.type
            val data: Map<String, Any> = gson.fromJson(jsonText, resultType)

            val conflictsList = data["conflicts"] as? List<*> ?: emptyList<Any>()
            val conflictsJson = gson.toJson(conflictsList)

            val report = CognitiveAlignmentReport(
                roomId = roomId,
                alignmentScore = (data["alignmentScore"] as? Double)?.toInt() ?: 80,
                conflicts = conflictsJson,
                mediationStrategy = data["mediationStrategy"] as? String ?: "특이사항 없음",
                analysisReasoning = data["analysisReasoning"] as? String ?: "분석 완료"
            )

            val savedReport = alignmentReportRepository.save(report)

            // 3. 심각한 갈등이 있을 경우 전략적 제안으로 등록
            if (report.alignmentScore < 60) {
                recommendationRepository.save(
                    StrategicRecommendation(
                        title = "인지적 불일치 중재 요청: $roomId",
                        description = "에이전트 간의 심각한 인지적 불일치가 감지되었습니다.\n\n$conflictsJson",
                        category = "COLLABORATION",
                        priority = "HIGH",
                        estimatedEffort = "MEDIUM",
                        analysisReasoning = report.mediationStrategy
                    )
                )
            }

            return savedReport
        } catch (e: Exception) {
            log.error("Failed to analyze cognitive alignment", e)
            CognitiveAlignmentReport(
                roomId = roomId,
                alignmentScore = 50,
                conflicts = "[]",
                mediationStrategy = "분석 중 오류 발생: ${e.message}",
                analysisReasoning = "시스템 오류"
            )
        }
    }
}
