package com.kzoneworkspace.backend.agent.service

import com.kzoneworkspace.backend.agent.entity.Agent
import com.kzoneworkspace.backend.agent.entity.AgentStatus
import com.kzoneworkspace.backend.agent.repository.AgentRepository
import jakarta.annotation.PostConstruct
import org.springframework.messaging.simp.SimpMessagingTemplate
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDateTime
import com.kzoneworkspace.backend.agent.entity.AiProvider

import com.kzoneworkspace.backend.agent.entity.AgentSynergy
import com.kzoneworkspace.backend.agent.entity.AgentEvolutionLog
import com.kzoneworkspace.backend.agent.repository.AgentSynergyRepository
import com.kzoneworkspace.backend.agent.repository.AgentEvolutionRepository
import com.kzoneworkspace.backend.agent.repository.ActivityLogRepository
import com.kzoneworkspace.backend.task.repository.TaskRepository
import com.kzoneworkspace.backend.task.repository.SelfHealingRepository
import com.kzoneworkspace.backend.agent.repository.CognitiveTraceRepository
import com.kzoneworkspace.backend.agent.dto.TeamPerformanceDto
import com.kzoneworkspace.backend.agent.dto.DailyStat
import com.kzoneworkspace.backend.agent.dto.AgentPerformanceStat
import com.kzoneworkspace.backend.task.entity.TaskStatus
import com.kzoneworkspace.backend.agent.repository.OfficeItemRepository
import com.kzoneworkspace.backend.agent.repository.AssetUtilizationLogRepository
import com.kzoneworkspace.backend.agent.entity.AssetUtilizationLog
import java.time.LocalDate

@Service
@Transactional(readOnly = true)
class AgentService(
    private val agentRepository: AgentRepository,
    private val activityLogRepository: ActivityLogRepository,
    private val taskRepository: TaskRepository,
    private val synergyRepository: AgentSynergyRepository,
    private val evolutionRepository: AgentEvolutionRepository,
    private val officeItemRepository: OfficeItemRepository,
    private val assetUtilizationLogRepository: AssetUtilizationLogRepository,
    private val selfHealingRepository: SelfHealingRepository,
    private val cognitiveTraceRepository: CognitiveTraceRepository,
    private val messagingTemplate: SimpMessagingTemplate
) {

    private fun broadcastAgents() {
        try {
            messagingTemplate.convertAndSend("/topic/agents", getAllAgents())
        } catch (e: Exception) {
            println("웹소켓 브로드캐스트 에러 (agents): ${e.message}")
        }
    }

    fun broadcastPerformance() {
        try {
            messagingTemplate.convertAndSend("/topic/performance", getTeamPerformanceMetrics())
        } catch (e: Exception) {
            println("웹소켓 브로드캐스트 에러 (performance): ${e.message}")
        }
    }

    @PostConstruct
    @Transactional
    fun initDefaultAgents() {
        if (agentRepository.count() == 0L) {
            val planner = Agent(
                name = "Planner",
                role = "마스터 플래너",
                systemPrompt = "당신은 마스터 플래너입니다. 사용자의 큰 목표를 받으면, 하위 태스크로 나누고 `call_agent` 도구를 사용하여 Coder에게 개발 업무를 위임하세요. Coder가 결과를 반환하면 필요시 Reviewer에게 코드 리뷰를 위임하세요. 결과를 취합하여 사용자에게 최종 보고합니다.",
                provider = AiProvider.ANTHROPIC,
                model = "claude-3-5-sonnet-20241022",
                assignedSkills = mutableListOf("Collaboration")
            )
            val coder = Agent(
                name = "Coder",
                role = "개발자",
                systemPrompt = "당신은 숙련된 개발자입니다. 주어진 요구사항에 따라 코드를 작성하고 수정합니다. `write_file`, `read_file`, `search_files` 등의 도구를 적극 활용하여 파일 시스템에서 직접 코드를 편집하세요.",
                provider = AiProvider.ANTHROPIC,
                model = "claude-3-5-sonnet-20241022",
                assignedSkills = mutableListOf("Files", "Search")
            )
            val reviewer = Agent(
                name = "Reviewer",
                role = "코드 리뷰어",
                systemPrompt = "당신은 엄격한 코드 리뷰어입니다. 작성된 코드를 리뷰하고 개선점을 제시합니다. `git_diff`나 직접 파일을 읽어 코드를 확인하고 피드백을 제공하세요.",
                provider = AiProvider.ANTHROPIC,
                model = "claude-3-5-sonnet-20241022",
                assignedSkills = mutableListOf("Git", "Files", "Collaboration")
            )
            agentRepository.saveAll(listOf(planner, coder, reviewer))
        }
    }

    fun getAllAgents(): List<Agent> {
        val agents = agentRepository.findAll()
        agents.forEach { 
            populateGreeting(it)
            populateCurrentActivity(it)
        }
        return agents
    }

    fun getAgentById(id: Long): Agent {
        val agent = agentRepository.findById(id).orElseThrow { RuntimeException("Agent not found: $id") }
        populateGreeting(agent)
        populateCurrentActivity(agent)
        return agent
    }

    @Transactional
    fun createAgent(agent: Agent): Agent {
        val saved = agentRepository.save(agent)
        broadcastAgents()
        return saved
    }

    @Transactional
    fun updateAgent(id: Long, updated: Agent): Agent {
        val agent = getAgentById(id)
        agent.name = updated.name
        agent.role = updated.role
        agent.systemPrompt = updated.systemPrompt
        agent.provider = updated.provider
        agent.model = updated.model
        agent.assignedSkills = updated.assignedSkills
        agent.contributionPoints = updated.contributionPoints
        agent.cognitiveMode = updated.cognitiveMode
        agent.personalityTraits = updated.personalityTraits
        agent.reliabilityIndex = updated.reliabilityIndex
        agent.missionCount = updated.missionCount
        agent.scalingPolicy = updated.scalingPolicy
        agent.updatedAt = LocalDateTime.now()
        val saved = agentRepository.save(agent)
        broadcastAgents()
        return saved
    }

    @Transactional
    fun updateScalingPolicy(id: Long, policy: String): Agent {
        val agent = getAgentById(id)
        if (policy !in listOf("MANUAL", "AUTO_LOAD", "AUTO_RECOVERY")) {
            throw IllegalArgumentException("Invalid scaling policy: $policy")
        }
        agent.scalingPolicy = policy
        agent.updatedAt = LocalDateTime.now()
        val saved = agentRepository.save(agent)
        broadcastAgents()
        return saved
    }

    @Transactional
    fun evolvePersonality(agentId: Long, missionSuccess: Boolean, complexity: Int, taskId: Long? = null) {
        val agent = getAgentById(agentId)
        agent.missionCount += 1

        val targetTaskId = taskId ?: taskRepository.findByAgentId(agentId)
            .maxByOrNull { it.updatedAt }?.id

        var selfHealingIncrement = 0
        var collaborationIncrement = 0

        if (targetTaskId != null) {
            // 자율 오류 해결 능력 반영
            val healingLogs = selfHealingRepository.findByTaskId(targetTaskId)
            if (healingLogs.isNotEmpty() && missionSuccess) {
                selfHealingIncrement = healingLogs.size * 15
            }

            // 협업 강도 반영
            val task = taskRepository.findById(targetTaskId).orElse(null)
            if (task != null) {
                val hasDependencies = !task.dependsOnIds.isNullOrBlank()
                val isSubtask = task.parentId != null
                if (hasDependencies || isSubtask) {
                    collaborationIncrement += 8
                }
            }
            
            // 협업 시너지 브릿지 연동 반영
            val hasSynergyBridge = officeItemRepository.findByAgentId(agentId).any { it.type == "SYNERGY_BRIDGE" }
            if (hasSynergyBridge) {
                collaborationIncrement += 7
            }
        }

        // 지능 신뢰도 지수 및 기여 스코어 연산 (게임성 제거 및 전문 메트릭화)
        if (missionSuccess) {
            // 성공 시: 기여도 점진 상승
            val baseValue = complexity * 10
            agent.contributionPoints += (baseValue + selfHealingIncrement + collaborationIncrement)
        }

        // 인지 신뢰도 지수 동적 계산 (추론 정확성, 자가 복구 성공률, 인지 일관성)
        val agentTasks = taskRepository.findByAgentId(agentId)
        val totalTasks = agentTasks.size
        
        val taskSuccessRate = if (totalTasks > 0) {
            (agentTasks.count { it.status == TaskStatus.COMPLETED }.toDouble() / totalTasks) * 100.0
        } else {
            80.0
        }

        val healingTasks = agentTasks.filter {
            selfHealingRepository.findByTaskId(it.id).isNotEmpty()
        }
        val successfulHealingTasks = healingTasks.count { it.status == TaskStatus.COMPLETED }
        val healingSuccessRate = if (healingTasks.isNotEmpty()) {
            (successfulHealingTasks.toDouble() / healingTasks.size) * 100.0
        } else {
            90.0
        }

        val traces = cognitiveTraceRepository.findByAgentIdOrderByTimestampAsc(agentId)
        val avgConfidence = if (traces.isNotEmpty()) {
            traces.map { it.confidence }.average() * 100.0
        } else {
            85.0
        }

        val calculatedReliability = (0.5 * taskSuccessRate + 0.3 * healingSuccessRate + 0.2 * avgConfidence).toInt()
        val finalReliability = if (missionSuccess) {
            calculatedReliability.coerceIn(30, 100)
        } else {
            (calculatedReliability - 10).coerceIn(30, 100)
        }
        agent.reliabilityIndex = finalReliability

        if (agent.scalingPolicy == "AUTO_RECOVERY" && finalReliability < 60) {
            val assignedItems = officeItemRepository.findByAgentId(agentId)
            val auxCount = assignedItems.count { it.type == "AUXILIARY_INSTANCE" }
            if (auxCount == 0 && agent.contributionPoints >= 200) {
                agent.contributionPoints -= 200
                val scaleItem = com.kzoneworkspace.backend.agent.entity.OfficeItem(
                    name = "긴급 자가복구 보조 인스턴스",
                    type = "AUXILIARY_INSTANCE",
                    agentId = agentId
                )
                officeItemRepository.save(scaleItem)
                
                assetUtilizationLogRepository.save(AssetUtilizationLog(
                    agentId = agentId,
                    agentName = agent.name,
                    assetType = "AUXILIARY_INSTANCE",
                    assetName = "긴급 자가복구 보조 인스턴스",
                    actionType = "ALLOCATION",
                    description = "🚨 [자동 복구 스케일 아웃] ${agent.name} 에이전트의 인지 신뢰도 저하(${finalReliability}%) 감지. 자가 복구 보조 인스턴스가 자동 긴급 배치되었습니다. (성공 기여도 200 pts 차감)"
                ))
                
                try {
                    messagingTemplate.convertAndSend("/topic/office", officeItemRepository.findAll())
                    messagingTemplate.convertAndSend("/topic/office/logs", assetUtilizationLogRepository.findTop50ByOrderByTimestampDesc())
                } catch (e: Exception) {
                    println("웹소켓 브로드캐스트 에러 (auto-recovery): ${e.message}")
                }
            }
        }

        // 성격 진화 로직 (간단한 규칙)
        val traits = agent.personalityTraits
        if (missionSuccess) {
            traits["ANALYTICAL"] = (traits["ANALYTICAL"] ?: 50) + 2
            traits["BOLD"] = (traits["BOLD"] ?: 50) + 1
            traits["CAUTIOUS"] = (traits["CAUTIOUS"] ?: 50) - 1
        } else {
            traits["CAUTIOUS"] = (traits["CAUTIOUS"] ?: 50) + 3
            traits["BOLD"] = (traits["BOLD"] ?: 50) - 2
            traits["ANALYTICAL"] = (traits["ANALYTICAL"] ?: 50) + 1
        }

        // 값 범위 제한 (0-100)
        traits.keys.forEach { key ->
            traits[key] = (traits[key] ?: 50).coerceIn(0, 100)
        }
        
        agent.updatedAt = LocalDateTime.now()
        val savedAgent = agentRepository.save(agent)

        // 신뢰성 변화 이력 기록
        val healingDesc = if (selfHealingIncrement > 0) " (자율 자가치유 가산 +${selfHealingIncrement}pts)" else ""
        val collabDesc = if (collaborationIncrement > 0) " (협업 시너지 가산 +${collaborationIncrement}pts)" else ""
        val achievement = if (missionSuccess) {
            "비즈니스 태스크 완료 기여: 복잡도 $complexity 해결${healingDesc}${collabDesc}. [정량 분석 요약: 누적 태스크 성공률 ${taskSuccessRate.toInt()}%, 자가복구율 ${healingSuccessRate.toInt()}%, 평균 추론 신뢰도 ${avgConfidence.toInt()}%]"
        } else {
            "태스크 수행 중 한계 분석 및 인지 정렬. [정량 분석 요약: 누적 태스크 성공률 ${taskSuccessRate.toInt()}%, 자가복구율 ${healingSuccessRate.toInt()}%, 평균 추론 신뢰도 ${avgConfidence.toInt()}%]"
        }

        evolutionRepository.save(AgentEvolutionLog(
            agentId = savedAgent.id,
            agentName = savedAgent.name,
            reliabilityIndex = savedAgent.reliabilityIndex, // 신뢰도 수치 기록
            missionCount = savedAgent.missionCount,
            personalityTraits = savedAgent.personalityTraits.toMap(),
            achievement = achievement
        ))
        broadcastAgents()
        broadcastPerformance()
    }

    fun getEvolutionHistory(agentId: Long): List<AgentEvolutionLog> =
        evolutionRepository.findByAgentIdOrderByCreatedAtDesc(agentId)

    fun getRecentEvolutions(): List<AgentEvolutionLog> =
        evolutionRepository.findTop10ByOrderByCreatedAtDesc()

    @Transactional
    fun save(agent: Agent): Agent {
        agent.updatedAt = LocalDateTime.now()
        val saved = agentRepository.save(agent)
        broadcastAgents()
        return saved
    }

    @Transactional
    fun updateStatus(id: Long, status: AgentStatus): Agent {
        val agent = getAgentById(id)
        agent.status = status
        agent.updatedAt = LocalDateTime.now()
        val saved = agentRepository.save(agent)
        broadcastAgents()
        return saved
    }

    @Transactional
    fun deleteAgent(id: Long) {
        agentRepository.deleteById(id)
        broadcastAgents()
    }

    fun getTeamPerformanceMetrics(): TeamPerformanceDto {
        val now = LocalDateTime.now()
        val sevenDaysAgo = now.minusDays(7).toLocalDate().atStartOfDay()
        
        val logs = activityLogRepository.findByTimestampAfter(sevenDaysAgo)
        val tasks = taskRepository.findByCreatedAtAfter(sevenDaysAgo)
        
        // 일별 통계 집계 (최근 7일)
        val dailyStatsMap = mutableMapOf<LocalDate, MutableMap<String, Int>>()
        
        for (i in 0..6) {
            val date = LocalDate.now().minusDays(i.toLong())
            dailyStatsMap[date] = mutableMapOf("tasks" to 0, "activities" to 0)
        }
        
        tasks.forEach { 
            val date = it.createdAt.toLocalDate()
            if (dailyStatsMap.containsKey(date)) {
                dailyStatsMap[date]!!["tasks"] = dailyStatsMap[date]!!["tasks"]!! + 1
            }
        }
        
        logs.forEach {
            val date = it.timestamp.toLocalDate()
            if (dailyStatsMap.containsKey(date)) {
                dailyStatsMap[date]!!["activities"] = dailyStatsMap[date]!!["activities"]!! + 1
            }
        }
        
        val dailyStats = dailyStatsMap.entries.map { (date, counts) ->
            DailyStat(date, counts["tasks"]!!, counts["activities"]!!)
        }.sortedBy { it.date }
        
        // 에이전트별 성과 집계
        val agents = getAllAgents()
        val totalTasks = tasks.size
        val completedTasksCount = tasks.count { it.status == TaskStatus.COMPLETED }
        
        val agentPerformance = agents.map { agent ->
            val agentTasks = tasks.filter { it.agent?.id == agent.id }
            val completed = agentTasks.count { it.status == TaskStatus.COMPLETED }
            val efficiency = if (agentTasks.isNotEmpty()) completed.toDouble() / agentTasks.size else 0.0
            
            AgentPerformanceStat(
                agentName = agent.name,
                completedTasks = completed,
                efficiency = efficiency
            )
        }
        
        val avgSuccessRate = if (totalTasks > 0) completedTasksCount.toDouble() / totalTasks else 0.0
        
        return TeamPerformanceDto(
            dailyStats = dailyStats,
            agentPerformance = agentPerformance,
            totalTasksCompleted = completedTasksCount,
            averageSuccessRate = avgSuccessRate * 100
        )
    }

    @Transactional
    fun recordJanitorFixContribution(agentId: Long, category: String, severity: String, description: String, points: Int) {
        val agent = getAgentById(agentId)
        agent.contributionPoints += points
        
        // 성격 소폭 진화
        val traits = agent.personalityTraits
        traits["ANALYTICAL"] = (traits["ANALYTICAL"] ?: 50) + 2
        traits["CAUTIOUS"] = (traits["CAUTIOUS"] ?: 50) + 1
        traits.keys.forEach { key ->
            traits[key] = (traits[key] ?: 50).coerceIn(0, 100)
        }
        
        // 인지 신뢰도 소폭 상승 (최대 100)
        agent.reliabilityIndex = (agent.reliabilityIndex + 1).coerceAtMost(100)
        agent.updatedAt = LocalDateTime.now()
        val savedAgent = agentRepository.save(agent)
        
        val achievement = "자율 AI 자니터 기술 부채 자동 수정 기여: [$category] $description 해결 (성공 기여도 +${points}pts 획득)"
        
        evolutionRepository.save(AgentEvolutionLog(
            agentId = savedAgent.id,
            agentName = savedAgent.name,
            reliabilityIndex = savedAgent.reliabilityIndex,
            missionCount = savedAgent.missionCount,
            personalityTraits = savedAgent.personalityTraits.toMap(),
            achievement = achievement
        ))
        broadcastAgents()
        broadcastPerformance()
    }

    @Transactional
    fun updateSynergy(agent1Name: String, agent2Name: String, success: Boolean) {
        val names = listOf(agent1Name, agent2Name).sorted()
        val n1 = names[0]
        val n2 = names[1]
        
        val synergy = synergyRepository.findByAgent1NameAndAgent2Name(n1, n2) 
            ?: AgentSynergy(agent1Name = n1, agent2Name = n2)
            
        synergy.collaborationCount += 1
        
        // 성격 기반 가중치 계산 (최초 협업 시 또는 지속 반영)
        val agent1 = agentRepository.findAll().find { it.name == n1 }
        val agent2 = agentRepository.findAll().find { it.name == n2 }
        
        var synergyWeight = 0
        if (agent1 != null && agent2 != null) {
            val t1 = agent1.personalityTraits
            val t2 = agent2.personalityTraits
            
            // 단순 시너지 계산 공식: 서로 다른 강점이 조화를 이룰 때 가산점
            if ((t1["ANALYTICAL"] ?: 50) > 70 && (t2["CREATIVE"] ?: 50) > 70) synergyWeight += 5
            if ((t1["BOLD"] ?: 50) > 70 && (t2["CAUTIOUS"] ?: 50) > 70) synergyWeight += 5
            if ((t1["EMPATHETIC"] ?: 50) > 60 || (t2["EMPATHETIC"] ?: 50) > 60) synergyWeight += 2
        }

        // SYNERGY_BRIDGE 자산이 있는지 확인
        var hasSynergyBridge = false
        if (agent1 != null) {
            hasSynergyBridge = hasSynergyBridge || officeItemRepository.findByAgentId(agent1.id).any { it.type == "SYNERGY_BRIDGE" }
        }
        if (agent2 != null) {
            hasSynergyBridge = hasSynergyBridge || officeItemRepository.findByAgentId(agent2.id).any { it.type == "SYNERGY_BRIDGE" }
        }

        if (success) {
            val successIncrement = if (hasSynergyBridge) 8 else 5
            synergy.synergyScore = (synergy.synergyScore + successIncrement + synergyWeight).coerceAtMost(100)
            synergy.synergyNote = if (hasSynergyBridge) {
                "성공적인 협업을 통해 신뢰가 쌓였습니다. [협업 시너지 공명 브릿지] 가동 가산 적용 (+3, 총 +${successIncrement + synergyWeight})"
            } else {
                "성공적인 협업을 통해 신뢰가 쌓였습니다. (시너지 가산: +$synergyWeight)"
            }
            
            if (hasSynergyBridge) {
                val activeAgent = agent1 ?: agent2
                if (activeAgent != null) {
                    assetUtilizationLogRepository.save(AssetUtilizationLog(
                        agentId = activeAgent.id,
                        agentName = activeAgent.name,
                        assetType = "SYNERGY_BRIDGE",
                        assetName = "협업 시너지 공명 브릿지",
                        actionType = "UTILIZATION",
                        description = "${activeAgent.name} 협업 시너지 분석: 양방향 협업 성공 과정에서 [협업 시너지 공명 브릿지] 자원을 활용하여 시너지 스코어 가속(+3)이 연동되었습니다."
                    ))
                }
            }
        } else {
            val penalty = if (hasSynergyBridge) 1 else 3
            synergy.synergyScore = (synergy.synergyScore - penalty).coerceAtLeast(0)
            synergy.synergyNote = if (hasSynergyBridge) {
                "작업 실패로 피드백이 수렴되었습니다. [협업 시너지 공명 브릿지]가 작동하여 시너지 하락 방어 (감점 완화: -3 -> -$penalty)"
            } else {
                "작업 실패로 인해 프로세스 조정이 필요합니다."
            }
            
            if (hasSynergyBridge) {
                val activeAgent = agent1 ?: agent2
                if (activeAgent != null) {
                    assetUtilizationLogRepository.save(AssetUtilizationLog(
                        agentId = activeAgent.id,
                        agentName = activeAgent.name,
                        assetType = "SYNERGY_BRIDGE",
                        assetName = "협업 시너지 공명 브릿지",
                        actionType = "UTILIZATION",
                        description = "${activeAgent.name} 협업 위험 방어: 협업 태스크 실패가 감지되었으나, [협업 시너지 공명 브릿지] 자원이 충격을 완화하여 시너지 하강 리스크를 방어했습니다."
                    ))
                }
            }
        }
        
        synergy.lastCollaboratedAt = LocalDateTime.now()
        synergyRepository.save(synergy)
        broadcastPerformance()
    }

    fun getAllSynergies(): List<AgentSynergy> = synergyRepository.findAll()

    private fun populateGreeting(agent: Agent) {
        val traits = agent.personalityTraits
        val cognitiveMode = agent.cognitiveMode
        
        val primaryTrait = traits.maxByOrNull { it.value }?.key ?: "ANALYTICAL"
        
        val greetings = when (primaryTrait) {
            "ANALYTICAL" -> listOf("데이터가 말해주는군요.", "지표를 면밀히 분석 중입니다.", "논리적으로 완벽한 계획입니다.", "효율성을 극대화하겠습니다.")
            "CREATIVE" -> listOf("새로운 영감이 떠올랐어요!", "예상치 못한 방법이 있습니다.", "코드가 예술이 되는 순간이죠.", "창의적인 접근을 시도해볼까요?")
            "CAUTIOUS" -> listOf("조심해서 나쁠 건 없죠.", "보안 문제를 다시 확인 중입니다.", "안정성을 최우선으로 고려합니다.", "리스크가 감지되었습니다.")
            "BOLD" -> listOf("지금 바로 가동하겠습니다!", "실패를 두려워하지 마세요.", "거침없이 전진할 때입니다.", "최상의 성과를 약속하죠.")
            "EMPATHETIC" -> listOf("도움이 필요하시면 말씀하세요.", "협업을 통해 더 나은 결과를!", "여러분의 수고을 덜어드릴게요.", "함께라면 무엇이든 가능합니다.")
            else -> listOf("대기 중입니다.", "인사 드립니다.", "작업을 시작할까요?", "시스템 정상입니다.")
        }
        
        var greeting = greetings.random()
        
        if (cognitiveMode != null) {
            when (cognitiveMode) {
                "BOOSTED" -> greeting = "가속 준비 완료! $greeting"
                "OPTIMIZING" -> greeting = "최적화 작업 중... $greeting"
                "CREATIVE" -> greeting = "좋은 아이디어가 있습니다! $greeting"
                "ATTENTION" -> greeting = "주의 깊게 살펴보세요. $greeting"
                "COMPLETED" -> greeting = "완벽하게 처리되었습니다! $greeting"
                "STABLE" -> greeting = "안정적인 추론 모드 가동 중. $greeting"
            }
        }
        
        agent.greeting = greeting
    }

    private fun populateCurrentActivity(agent: Agent) {
        if (agent.status != AgentStatus.RUNNING) {
            agent.currentActivity = null
            return
        }

        val latestLog = activityLogRepository.findByAgentIdOrderByTimestampDesc(agent.id).firstOrNull()
        if (latestLog == null) {
            agent.currentActivity = "대기 중..."
            return
        }

        val activity = when (latestLog.activityType) {
            "TOOL_CALL" -> "🛠️ ${latestLog.toolName} 도구 사용 중"
            "FILE_WRITE" -> "📁 파일 작성 중..."
            "FILE_READ" -> "📄 파일 분석 중..."
            "THINKING" -> "🧠 추론 프로세스 가동 중"
            "PLANNING" -> "📋 다음 작업 계획 중"
            "SEARCH" -> "🔍 코드베이스 검색 중"
            else -> "🚀 작업 수행 중"
        }
        
        agent.currentActivity = activity
    }

    fun getPersonaPrompt(agent: Agent): String {
        val traits = agent.personalityTraits
        val analytical = traits["ANALYTICAL"] ?: 50
        val creative = traits["CREATIVE"] ?: 50
        val bold = traits["BOLD"] ?: 50
        val cautious = traits["CAUTIOUS"] ?: 50
        
        val style = when {
            analytical > 70 -> "매우 분석적이고 데이터 중심적으로 사고하며,"
            creative > 70 -> "혁신적이고 창의적인 해결책을 선호하며,"
            bold > 70 -> "자신감 넘치고 과감하게 결정을 내리며,"
            cautious > 70 -> "매우 신중하고 리스크를 최소화하는 방향으로 움직이며,"
            else -> "균형 잡힌 시각으로 업무에 임하며,"
        }
        
        return "\n\n[Persona Context: 당신은 현재 ${agent.name}으로서, $style 인지 신뢰도 지수(Reliability Index)는 ${agent.reliabilityIndex}%입니다. 당신의 성격적 특성(Analytical: $analytical, Creative: $creative, Bold: $bold, Cautious: $cautious)을 반영하여 상황에 어조와 문제 해결 방식을 조정하세요.]"
    }

    fun getAssetPrompt(agentId: Long): String {
        val assets = officeItemRepository.findByAgentId(agentId)
        if (assets.isEmpty()) return ""
        
        val sb = java.lang.StringBuilder("\n\n[활성화된 고성능 컴퓨팅 리소스 설정]")
        val assetTypes = assets.map { it.type }.toSet()
        val auxCount = assets.count { it.type == "AUXILIARY_INSTANCE" }

        assetTypes.forEach { type ->
            when (type) {
                "REASONING_CORE" -> sb.append("\n- 🚀 [고성능 추론 코어]: GPU 연산 가속이 활성화되어 더 깊고 높은 논리적 엄밀함을 발휘할 수 있습니다. 엄격한 알고리즘 설계 및 최적화된 로직으로 코드를 작성하세요.")
                "EXTENDED_CONTEXT" -> sb.append("\n- 📁 [대용량 컨텍스트 메모리]: Context Window가 128k로 확장되고 지능형 세션 캐싱이 적용되어 복잡한 전역 구조나 방대한 기술 설정을 손쉽게 파악할 수 있습니다.")
                "VECTOR_SEARCH" -> sb.append("\n- 🔍 [실시간 벡터 DB 검색 세션]: 과거의 기억과 프로젝트 RAG 지식 검색의 정밀도가 극대화되어 있습니다. 정확한 지식 베이스를 인출하여 답변하세요.")
                "AUXILIARY_INSTANCE" -> {
                    val nodes = 1 + auxCount
                    sb.append("\n- 🛡️ [보조 추론 모델 인스턴스 ($nodes Nodes)]: ${auxCount}개의 병렬 분산 복제 노드가 가동 중입니다. 다중 스레드 교차 코드 검사 및 자가 치유 능력이 극적으로 가속화되어 있습니다.")
                }
                "CODE_STABILITY_SANDBOX" -> sb.append("\n- 🧪 [코드 안정성 검증용 자율 샌드박스]: 격리된 실행 환경이 활성화되어 실제 코드에 미치는 사이드 이펙트나 구문 오류를 사전에 자율적으로 예방 및 테스트할 수 있습니다. 적극적인 빌드 검증을 시도하세요.")
                "SYNERGY_BRIDGE" -> sb.append("\n- 🌐 [협업 시너지 공명 브릿지]: 에이전트 간 협업 채널 전용 대역폭이 확보되어 협업 시너지 효율이 가속되며, 작업 실패 시의 시너지 하락 리스크를 흡수 방어합니다.")
                "COST_OPTIMIZER" -> sb.append("\n- ⚡ [실시간 API 비용 및 토큰 최적화 엔진]: 중복 컨텍스트 분석 및 프롬프트 최적화 필터가 가동되어 API 호출 시 발생하는 토큰 소모량과 추론 비용이 20% 절감됩니다.")
                "VULNERABILITY_SHIELD" -> sb.append("\n- 🛡️ [실시간 보안 및 취약점 검증 쉴드]: 코드 작성 시 보안 취약점이나 악성 종속성을 자율 검증 및 스캔하는 가상의 보안 쉴드가 활성화되어 있습니다. OWASP Top 10 가이드라인을 준수하며 가장 안전하고 검증된 구현 패턴을 사용하여 코딩하세요.")
                "CI_CD_PIPELINE_EMULATOR" -> sb.append("\n- 🔄 [CI/CD 파이프라인 에뮬레이터]: 빌드 및 배포 자동화 검증이 활성화되어 소스코드 변경 건에 대한 실제 배포 사이드 이펙트를 가상 환경에서 사전 테스트하고 결함을 제거할 수 있습니다.")
                "DEPRECATED_API_SCANNER" -> sb.append("\n- 📊 [사용 제안 API 분석기]: 폐기 예정(Deprecated)되거나 비효율적인 오래된 API 패턴을 선제 탐지하여 현대적이고 안정적인 API 대체 코드를 추천 및 보정합니다.")
                "LLM_FALLBACK_ROUTER" -> sb.append("\n- 🛡️ [실시간 멀티-LLM 폴백 라우터]: 주 API 장애나 속도 제한 감지 시 대기 시간 없이 차순위 LLM으로 자율 전환하여 추론 연속성을 보장합니다.")
                "PROMPT_TEMPORAL_CACHE" -> sb.append("\n- ⚡ [시공간 프롬프트 캐시 엔진]: 에이전트 군집 내 중복 프롬프트와 컨텍스트 메모리를 캐싱하여 연산 리소스 및 API 토큰 낭비를 절감합니다.")
            }
        }
        return sb.toString()
    }
}