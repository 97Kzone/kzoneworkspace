package com.kzoneworkspace.backend.agent.service

import com.kzoneworkspace.backend.agent.repository.*
import com.kzoneworkspace.backend.task.repository.TaskRepository
import org.springframework.stereotype.Service
import java.time.LocalDateTime
import com.kzoneworkspace.backend.claude.GeminiClient
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import org.slf4j.LoggerFactory

data class SwarmMetrics(
    val overallScore: Int,
    val agentMetrics: List<AgentMetric>,
    val swarmRadar: RadarData,
    val optimizationTips: List<OptimizationTip>,
    val updatedAt: LocalDateTime = LocalDateTime.now()
)

data class AgentMetric(
    val agentId: Long,
    val agentName: String,
    val role: String,
    val load: Int, // 0-100
    val efficiency: Int, // 0-100
    val status: String // ACTIVE, IDLE, OVERLOADED
)

data class RadarData(
    val velocity: Int,
    val intelligence: Int,
    val synergy: Int,
    val stability: Int,
    val innovation: Int
)

data class OptimizationTip(
    val title: String,
    val description: String,
    val impact: String // HIGH, MEDIUM, LOW
)

@Service
class ResourceEfficiencyService(
    private val agentRepository: AgentRepository,
    private val taskRepository: TaskRepository,
    private val activityLogRepository: ActivityLogRepository,
    private val memoryRepository: MemoryRepository,
    private val agentSynergyRepository: AgentSynergyRepository,
    private val geminiClient: GeminiClient
) {
    private val log = LoggerFactory.getLogger(ResourceEfficiencyService::class.java)
    private val gson = Gson()
    fun getEfficiencyMetrics(): SwarmMetrics {
        val agents = agentRepository.findAll()
        val tasks = taskRepository.findAll()
        val memories = memoryRepository.findAll()
        val synergies = agentSynergyRepository.findAll()
        val logs = activityLogRepository.findAll()

        // 1. 개별 에이전트 지표 계산
        val agentMetrics = agents.map { agent ->
            val agentTasks = tasks.filter { it.agent?.id == agent.id }
            val completedTasks = agentTasks.count { it.status.name == "COMPLETED" }
            val failedTasks = agentTasks.count { it.status.name == "FAILED" }
            
            val load = (agentTasks.size * 10).coerceAtMost(100)
            val efficiency = if (agentTasks.isNotEmpty()) {
                (completedTasks * 100 / agentTasks.size)
            } else 0

            val status = when {
                load > 80 -> "OVERLOADED"
                load > 20 -> "ACTIVE"
                else -> "IDLE"
            }

            AgentMetric(
                agentId = agent.id!!,
                agentName = agent.name,
                role = agent.role,
                load = load,
                efficiency = efficiency,
                status = status
            )
        }

        // 2. 군집 레이더 데이터 (Radar Data)
        val avgEfficiency = if (agentMetrics.isNotEmpty()) agentMetrics.map { it.efficiency }.average().toInt() else 0
        val stability = if (tasks.isNotEmpty()) (tasks.count { it.status.name == "COMPLETED" } * 100 / tasks.size) else 80
        val intelligence = (memories.size / 10).coerceAtMost(100)
        val synergyScore = if (synergies.isNotEmpty()) synergies.map { it.synergyScore }.average().toInt() else 50
        
        val swarmRadar = RadarData(
            velocity = avgEfficiency,
            intelligence = intelligence,
            synergy = synergyScore,
            stability = stability,
            innovation = 75 // Mock for now, could be based on TechPulse
        )

        // 3. 전체 점수
        val overallScore = (swarmRadar.velocity + swarmRadar.intelligence + swarmRadar.synergy + swarmRadar.stability + swarmRadar.innovation) / 5

        // 4. 최적화 팁 생성 (AI 기반)
        val tips = try {
            val systemPrompt = """
                당신은 AI 에이전트 군집의 리소스 최적화 전문가입니다.
                제공된 군집의 지표(에이전트 부하, 효율성, 레이더 데이터 등)를 분석하여 성능을 극대화하고 병목을 해결하기 위한 최적화 팁을 생성해야 합니다.
                
                응답은 반드시 다음 필드를 포함하는 JSON 리스트 형식이어야 합니다:
                - title: 팁 제목
                - description: 구체적인 최적화 조언
                - impact: 영향도 (HIGH, MEDIUM, LOW 중 하나)
                
                오직 JSON 리스트만 응답하세요. (예: [{"title": "...", ...}])
            """.trimIndent()

            val userPrompt = """
                현재 군집 상태:
                - 레이더 데이터: $swarmRadar
                - 에이전트 상태: $agentMetrics
                
                위 데이터를 바탕으로 가장 시급한 최적화 팁을 최대 3개 생성해 주세요.
            """.trimIndent()

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
            val tipsData: List<Map<String, Any>> = gson.fromJson(jsonText, listType)

            tipsData.map { data ->
                OptimizationTip(
                    title = data["title"] as? String ?: "Unknown Tip",
                    description = data["description"] as? String ?: "",
                    impact = data["impact"] as? String ?: "LOW"
                )
            }.toMutableList()
        } catch (e: Exception) {
            log.error("Failed to generate AI optimization tips: ${e.message}")
            // Fallback to hardcoded tips if AI fails
            val fallbackTips = mutableListOf<OptimizationTip>()
            if (agentMetrics.any { it.status == "OVERLOADED" }) {
                fallbackTips.add(OptimizationTip("업무 재배치 필요", "특정 에이전트에게 업무가 집중되어 있습니다. 작업 분산을 권장합니다.", "HIGH"))
            }
            if (synergyScore < 40) {
                fallbackTips.add(OptimizationTip("협업 강화", "에이전트 간의 시너지가 낮습니다. 공동 미션 배정을 늘려보세요.", "MEDIUM"))
            }
            if (intelligence < 30) {
                fallbackTips.add(OptimizationTip("지식 축적 부족", "메모리 추출 활동이 저조합니다. 문서화 에이전트 활동을 강화하세요.", "LOW"))
            }
            if (fallbackTips.isEmpty()) {
                fallbackTips.add(OptimizationTip("현재 상태 양호", "군집이 최적의 상태로 가동 중입니다.", "LOW"))
            }
            fallbackTips
        }

        return SwarmMetrics(
            overallScore = overallScore,
            agentMetrics = agentMetrics,
            swarmRadar = swarmRadar,
            optimizationTips = tips
        )
    }
}
