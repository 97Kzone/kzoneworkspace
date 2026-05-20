package com.kzoneworkspace.backend.agent.service

import com.kzoneworkspace.backend.agent.entity.Agent
import com.kzoneworkspace.backend.agent.entity.AgentStatus
import com.kzoneworkspace.backend.agent.repository.AgentRepository
import com.kzoneworkspace.backend.task.entity.TaskStatus
import com.kzoneworkspace.backend.task.repository.TaskRepository
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

data class AgentWorkloadMetric(
    val agentId: Long,
    val agentName: String,
    val agentRole: String,
    val activeTasks: Int,     // RUNNING + HEALING
    val pendingTasks: Int,    // PENDING
    val utilizationScore: Int // 0 ~ 100
)

data class RebalanceResult(
    val reassignedCount: Int,
    val messages: List<String>
)

@Service
class WorkloadBalancerService(
    private val agentRepository: AgentRepository,
    private val taskRepository: TaskRepository
) {
    private val log = LoggerFactory.getLogger(WorkloadBalancerService::class.java)

    /**
     * 전체 에이전트의 워크로드 매트릭스를 반환합니다.
     */
    @Transactional(readOnly = true)
    fun getWorkloadMetrics(): List<AgentWorkloadMetric> {
        val allAgents = agentRepository.findAll()
        val allTasks = taskRepository.findAll()

        return allAgents.map { agent ->
            val agentTasks = allTasks.filter { it.agent?.id == agent.id }
            
            val runningCount = agentTasks.count { it.status == TaskStatus.RUNNING || it.status == TaskStatus.HEALING }
            val pendingCount = agentTasks.count { it.status == TaskStatus.PENDING }
            
            // 단순 부하 점수 계산 (가중치: RUNNING은 30점, PENDING은 10점)
            val score = Math.min(100, (runningCount * 30) + (pendingCount * 10))

            AgentWorkloadMetric(
                agentId = agent.id,
                agentName = agent.name,
                agentRole = agent.role,
                activeTasks = runningCount,
                pendingTasks = pendingCount,
                utilizationScore = score
            )
        }.sortedByDescending { it.utilizationScore }
    }

    /**
     * 부하가 높은 에이전트의 PENDING 태스크를 유휴 에이전트에게 재분배합니다.
     */
    @Transactional
    fun autoRebalance(): RebalanceResult {
        log.info("Starting Auto Rebalance process...")
        val allAgents = agentRepository.findAll()
        val allTasks = taskRepository.findAll()

        // 1. 에이전트별 워크로드 계산
        val agentWorkloads = allAgents.map { agent ->
            val tasks = allTasks.filter { it.agent?.id == agent.id }
            val pending = tasks.count { it.status == TaskStatus.PENDING }
            val active = tasks.count { it.status == TaskStatus.RUNNING || it.status == TaskStatus.HEALING }
            
            object {
                val agent = agent
                val pendingTasks = allTasks.filter { it.agent?.id == agent.id && it.status == TaskStatus.PENDING }
                val loadScore = (active * 3) + pending
            }
        }.sortedBy { it.loadScore } // 오름차순 (가장 한가한 에이전트가 앞)

        if (agentWorkloads.isEmpty()) {
            return RebalanceResult(0, listOf("에이전트가 없습니다."))
        }

        val messages = mutableListOf<String>()
        var reassignedCount = 0

        // 2. 부하가 높은 에이전트(임계치: loadScore > 5) 찾기
        val overloadedAgents = agentWorkloads.filter { it.loadScore > 5 }.reversed()
        val idleAgents = agentWorkloads.filter { it.loadScore <= 2 }.toMutableList()

        if (overloadedAgents.isEmpty()) {
            messages.add("현재 군집의 부하가 안정적입니다. (재분배 불필요)")
            return RebalanceResult(0, messages)
        }
        if (idleAgents.isEmpty()) {
            messages.add("재분배할 수 있는 유휴(Idle) 에이전트가 부족합니다. 전체 군집의 부하가 높습니다.")
            return RebalanceResult(0, messages)
        }

        // 3. 재분배 로직 (간단한 라운드 로빈)
        var idleIndex = 0
        for (overloaded in overloadedAgents) {
            // 과부하된 에이전트의 PENDING 태스크를 가져옴
            val pendingTasks = overloaded.pendingTasks.toMutableList()
            
            // 최소한 1~2개는 남겨둠
            while (pendingTasks.size > 2) {
                if (idleIndex >= idleAgents.size) {
                    idleIndex = 0 // 처음 유휴 에이전트부터 다시
                }
                val targetAgent = idleAgents[idleIndex].agent
                val taskToMove = pendingTasks.removeAt(0)

                // 태스크 재할당
                taskToMove.agent = targetAgent
                taskRepository.save(taskToMove)
                
                messages.add("[${overloaded.agent.name}] -> [${targetAgent.name}] : 태스크(ID: ${taskToMove.id}) 재할당 완료")
                reassignedCount++
                idleIndex++
            }
        }

        if (reassignedCount > 0) {
            messages.add("총 ${reassignedCount}개의 태스크가 성공적으로 재분배되었습니다.")
        } else {
            messages.add("이동 가능한 대기열이 없습니다.")
        }

        log.info("Auto Rebalance completed. Reassigned: $reassignedCount")
        return RebalanceResult(reassignedCount, messages)
    }
}
