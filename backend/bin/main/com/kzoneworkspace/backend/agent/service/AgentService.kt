package com.kzoneworkspace.backend.agent.service

import com.kzoneworkspace.backend.agent.entity.Agent
import com.kzoneworkspace.backend.agent.entity.AgentStatus
import com.kzoneworkspace.backend.agent.repository.AgentRepository
import jakarta.annotation.PostConstruct
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDateTime
import com.kzoneworkspace.backend.agent.entity.AiProvider

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
    private val taskRepository: TaskRepository
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
        agent.updatedAt = LocalDateTime.now()
        return agentRepository.save(agent)
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
}