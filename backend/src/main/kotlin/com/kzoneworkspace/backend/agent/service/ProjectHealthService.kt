package com.kzoneworkspace.backend.agent.service

import com.google.common.reflect.TypeToken
import com.google.gson.Gson
import com.kzoneworkspace.backend.agent.repository.ActivityLogRepository
import com.kzoneworkspace.backend.agent.repository.AgentRepository
import com.kzoneworkspace.backend.agent.repository.TechPulseRepository
import com.kzoneworkspace.backend.claude.GeminiClient
import com.kzoneworkspace.backend.task.repository.TaskRepository
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import java.time.LocalDateTime

data class ActionableStrategy(
    val title: String,
    val description: String,
    val category: String, // TECH_DEBT, INNOVATION, PERFORMANCE, SECURITY, COLLABORATION
    val priority: String, // HIGH, MEDIUM, LOW
    val estimatedEffort: String // SMALL, MEDIUM, LARGE
)

data class ProjectHealthReport(
    val score: Int,
    val status: String,
    val synergyLevel: String,
    val risks: List<String>,
    val recommendations: List<ActionableStrategy>,
    val analysisReasoning: String,
    val generatedAt: LocalDateTime = LocalDateTime.now()
)

@Service
class ProjectHealthService(
    private val taskRepository: TaskRepository,
    private val activityLogRepository: ActivityLogRepository,
    private val techPulseRepository: TechPulseRepository,
    private val agentRepository: AgentRepository,
    private val geminiClient: GeminiClient
) {
    private val log = LoggerFactory.getLogger(ProjectHealthService::class.java)
    private val gson = Gson()

    fun getProjectHealthReport(): ProjectHealthReport {
        log.info("Generating Project Health Report...")

        // 1. 데이터 수집
        val tasks = taskRepository.findAll()
        val totalTasks = tasks.size
        val completedTasks = tasks.count { it.status.name == "COMPLETED" }
        val failedTasks = tasks.count { it.status.name == "FAILED" }
        
        val agents = agentRepository.findAll()
        val agentVoices = agents.joinToString("\n") { 
            "- ${it.name} (${it.role}): ${it.points}pts, Emotion: ${it.lastEmotion ?: "Neutral"}"
        }

        val recentLogs = activityLogRepository.findAll().sortedByDescending { it.timestamp }.take(30)
        val activitySummary = recentLogs.joinToString("\n") { 
            "[${it.timestamp}] Agent ${it.agentId}: ${it.activityType} (${it.toolName ?: ""})"
        }

        val techPulses = techPulseRepository.findByOrderByCreatedAtDesc().take(5)
        val pulseSummary = techPulses.joinToString("\n") {
            "- ${it.title} (Impact: ${it.impactScore})"
        }

        // 2. prompt 구성
        val systemPrompt = """
            당신은 전지전능한 프로젝트 관리형 AI 아키텍트입니다. 
            현재 AI 에이전트 워크스테이션의 모든 데이터를 분석하여, 프로젝트의 '건강도'와 '전략적 방향'을 제시해야 합니다.
            
            응답은 반드시 JSON 형식으로만 제공하며, 다음 필드를 포함해야 합니다:
            - score: 0~100 사이의 정수 (프로젝트 건강도)
            - status: 'EXCELLENT', 'GOOD', 'STABLE', 'WARNING', 'CRITICAL' 중 하나
            - synergyLevel: 'HIGH', 'MEDIUM', 'LOW' (에이전트 간의 협업 및 감정 상태 기준)
            - risks: 현재 프로젝트에서 발견된 잠재적 위험 요소 리스트 (문자열 리스트)
            - recommendations: 구체적이고 실행 가능한 전략 카드 리스트. 각 객체는 다음 필드를 포함함:
                * title: 전략의 제목
                * description: 상세 설명 (어떤 행동을 해야 하는지)
                * category: 'TECH_DEBT', 'INNOVATION', 'PERFORMANCE', 'SECURITY', 'COLLABORATION' 중 하나
                * priority: 'HIGH', 'MEDIUM', 'LOW' 중 하나
                * estimatedEffort: 'SMALL', 'MEDIUM', 'LARGE' 중 하나
            - analysisReasoning: 왜 이런 점수를 주었는지에 대한 간략한 설명 (Markdown 형식)
        """.trimIndent()

        val userPrompt = """
            [프로젝트 데이터 스냅샷]
            
            1. 업무 현황:
            - 총 작업 수: $totalTasks
            - 완료됨: $completedTasks
            - 실패함: $failedTasks
            
            2. 에이전트 팀 상태:
            $agentVoices
            
            3. 최근 활동 (Last 30):
            $activitySummary
            
            4. 최신 기술 트렌드 (영향도):
            $pulseSummary
            
            위 데이터를 분석하여 프로젝트 건강 보고서를 JSON으로 작성하세요.
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

            ProjectHealthReport(
                score = (data["score"] as? Double)?.toInt() ?: 70,
                status = data["status"] as? String ?: "STABLE",
                synergyLevel = data["synergyLevel"] as? String ?: "MEDIUM",
                risks = (data["risks"] as? List<*>)?.filterIsInstance<String>() ?: emptyList(),
                recommendations = (data["recommendations"] as? List<*>)?.mapNotNull { item ->
                    val m = item as? Map<*, *>
                    if (m != null) {
                        ActionableStrategy(
                            title = m["title"] as? String ?: "",
                            description = m["description"] as? String ?: "",
                            category = m["category"] as? String ?: "INNOVATION",
                            priority = m["priority"] as? String ?: "MEDIUM",
                            estimatedEffort = m["estimatedEffort"] as? String ?: "MEDIUM"
                        )
                    } else null
                } ?: emptyList(),
                analysisReasoning = data["analysisReasoning"] as? String ?: "데이터 분석 결과가 정상적으로 생성되었습니다."
            )
        } catch (e: Exception) {
            log.error("Failed to generate health report", e)
            ProjectHealthReport(
                score = 50,
                status = "ERROR",
                synergyLevel = "LOW",
                risks = listOf("분석 오류 발생"),
                recommendations = listOf(
                    ActionableStrategy(
                        title = "시스템 로그 확인",
                        description = "분석 중 예외가 발생했습니다: ${e.message}",
                        category = "TECH_DEBT",
                        priority = "HIGH",
                        estimatedEffort = "SMALL"
                    )
                ),
                analysisReasoning = "데이터 분석 과정에서 기술적 오류가 발생했습니다."
            )
        }
    }
}
