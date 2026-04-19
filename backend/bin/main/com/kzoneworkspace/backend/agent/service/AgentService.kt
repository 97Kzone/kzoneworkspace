package com.kzoneworkspace.backend.agent.service

import com.kzoneworkspace.backend.agent.entity.Agent
import com.kzoneworkspace.backend.agent.entity.AgentStatus
import com.kzoneworkspace.backend.agent.repository.AgentRepository
import jakarta.annotation.PostConstruct
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDateTime
import com.kzoneworkspace.backend.agent.entity.AiProvider

import com.kzoneworkspace.backend.agent.entity.AgentSynergy
import com.kzoneworkspace.backend.agent.repository.AgentSynergyRepository
import com.kzoneworkspace.backend.agent.repository.ActivityLogRepository
import com.kzoneworkspace.backend.task.repository.TaskRepository
import com.kzoneworkspace.backend.agent.dto.TeamPerformanceDto
import com.kzoneworkspace.backend.agent.dto.DailyStat
import com.kzoneworkspace.backend.agent.dto.AgentPerformanceStat
import com.kzoneworkspace.backend.task.entity.TaskStatus
import java.time.LocalDate

@Service
@Transactional(readOnly = true)
class AgentService(
    private val agentRepository: AgentRepository,
    private val activityLogRepository: ActivityLogRepository,
    private val taskRepository: TaskRepository,
    private val synergyRepository: AgentSynergyRepository
) {

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

    fun getAllAgents(): List<Agent> = agentRepository.findAll()

    fun getAgentById(id: Long): Agent =
        agentRepository.findById(id).orElseThrow { RuntimeException("Agent not found: $id") }

    @Transactional
    fun createAgent(agent: Agent): Agent = agentRepository.save(agent)

    @Transactional
    fun updateAgent(id: Long, updated: Agent): Agent {
        val agent = getAgentById(id)
        agent.name = updated.name
        agent.role = updated.role
        agent.systemPrompt = updated.systemPrompt
        agent.provider = updated.provider
        agent.model = updated.model
        agent.assignedSkills = updated.assignedSkills
        agent.points = updated.points
        agent.lastEmotion = updated.lastEmotion
        agent.personalityTraits = updated.personalityTraits
        agent.experienceLevel = updated.experienceLevel
        agent.missionCount = updated.missionCount
        agent.updatedAt = LocalDateTime.now()
        return agentRepository.save(agent)
    }

    @Transactional
    fun evolvePersonality(agentId: Long, missionSuccess: Boolean, complexity: Int) {
        val agent = getAgentById(agentId)
        agent.missionCount += 1
        
        // 경험치 및 레벨업 로직
        val expGain = if (missionSuccess) complexity * 10 else complexity * 2
        val totalExp = agent.experienceLevel * 100 + agent.points + expGain
        agent.experienceLevel = totalExp / 100
        agent.points = totalExp % 100

        // 성격 진화 로직 (간단한 규칙)
        val traits = agent.personalityTraits
        if (missionSuccess) {
            // 성공 시 성격 변화: 분석력과 자신감(Bold) 상승
            traits["ANALYTICAL"] = (traits["ANALYTICAL"] ?: 50) + 2
            traits["BOLD"] = (traits["BOLD"] ?: 50) + 1
            traits["CAUTIOUS"] = (traits["CAUTIOUS"] ?: 50) - 1
        } else {
            // 실패 시 성격 변화: 신중함 상승, 자신감 하락
            traits["CAUTIOUS"] = (traits["CAUTIOUS"] ?: 50) + 3
            traits["BOLD"] = (traits["BOLD"] ?: 50) - 2
            traits["ANALYTICAL"] = (traits["ANALYTICAL"] ?: 50) + 1
        }

        // 창의성 및 공감 능력은 특정 활동 로그나 추론 과정에 따라 변화하도록 나중에 확장 가능
        // 값 범위 제한 (0-100)
        traits.keys.forEach { key ->
            traits[key] = (traits[key] ?: 50).coerceIn(0, 100)
        }
        
        agent.updatedAt = LocalDateTime.now()
        agentRepository.save(agent)
    }

    @Transactional
    fun save(agent: Agent): Agent {
        agent.updatedAt = LocalDateTime.now()
        return agentRepository.save(agent)
    }

    @Transactional
    fun updateStatus(id: Long, status: AgentStatus): Agent {
        val agent = getAgentById(id)
        agent.status = status
        agent.updatedAt = LocalDateTime.now()
        return agentRepository.save(agent)
    }

    @Transactional
    fun deleteAgent(id: Long) = agentRepository.deleteById(id)

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
        
        var bonus = 0
        if (agent1 != null && agent2 != null) {
            val t1 = agent1.personalityTraits
            val t2 = agent2.personalityTraits
            
            // 단순 시너지 계산 공식: 서로 다른 강점이 조화를 이룰 때 보너스
            if ((t1["ANALYTICAL"] ?: 50) > 70 && (t2["CREATIVE"] ?: 50) > 70) bonus += 5
            if ((t1["BOLD"] ?: 50) > 70 && (t2["CAUTIOUS"] ?: 50) > 70) bonus += 5
            if ((t1["EMPATHETIC"] ?: 50) > 60 || (t2["EMPATHETIC"] ?: 50) > 60) bonus += 2
        }

        if (success) {
            synergy.synergyScore = (synergy.synergyScore + 5 + bonus).coerceAtMost(100)
            synergy.synergyNote = "성공적인 협업을 통해 신뢰가 쌓였습니다. (Bonus: +$bonus)"
        } else {
            synergy.synergyScore = (synergy.synergyScore - 3).coerceAtLeast(0)
            synergy.synergyNote = "작업 실패로 인해 프로세스 조정이 필요합니다."
        }
        
        synergy.lastCollaboratedAt = LocalDateTime.now()
        synergyRepository.save(synergy)
    }

    fun getAllSynergies(): List<AgentSynergy> = synergyRepository.findAll()
}