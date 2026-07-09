package com.kzoneworkspace.backend.agent.service

import com.kzoneworkspace.backend.agent.entity.Agent
import com.kzoneworkspace.backend.agent.entity.OfficeItem
import com.kzoneworkspace.backend.agent.repository.*
import com.kzoneworkspace.backend.task.repository.TaskRepository
import com.kzoneworkspace.backend.task.repository.SelfHealingRepository
import com.kzoneworkspace.backend.agent.repository.CognitiveTraceRepository
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.mockito.Mockito.*
import org.mockito.ArgumentMatchers.*
import org.springframework.messaging.simp.SimpMessagingTemplate
import java.util.Optional

class OfficeServiceScaleOutTest {

    private lateinit var agentRepository: AgentRepository
    private lateinit var activityLogRepository: ActivityLogRepository
    private lateinit var taskRepository: TaskRepository
    private lateinit var synergyRepository: AgentSynergyRepository
    private lateinit var evolutionRepository: AgentEvolutionRepository
    private lateinit var officeItemRepository: OfficeItemRepository
    private lateinit var assetUtilizationLogRepository: AssetUtilizationLogRepository
    private lateinit var selfHealingRepository: SelfHealingRepository
    private lateinit var cognitiveTraceRepository: CognitiveTraceRepository
    private lateinit var messagingTemplate: SimpMessagingTemplate
    
    private lateinit var agentService: AgentService

    @BeforeEach
    fun setUp() {
        agentRepository = mock(AgentRepository::class.java)
        activityLogRepository = mock(ActivityLogRepository::class.java)
        taskRepository = mock(TaskRepository::class.java)
        synergyRepository = mock(AgentSynergyRepository::class.java)
        evolutionRepository = mock(AgentEvolutionRepository::class.java)
        officeItemRepository = mock(OfficeItemRepository::class.java)
        assetUtilizationLogRepository = mock(AssetUtilizationLogRepository::class.java)
        selfHealingRepository = mock(SelfHealingRepository::class.java)
        cognitiveTraceRepository = mock(CognitiveTraceRepository::class.java)
        messagingTemplate = mock(SimpMessagingTemplate::class.java)

        agentService = AgentService(
            agentRepository,
            activityLogRepository,
            taskRepository,
            synergyRepository,
            evolutionRepository,
            officeItemRepository,
            assetUtilizationLogRepository,
            selfHealingRepository,
            cognitiveTraceRepository,
            messagingTemplate
        )
    }

    @Test
    fun `에이전트의 스케일 정책이 정상적으로 변경되고 데이터베이스에 보존되는가`() {
        // given
        val dummyAgent = Agent(
            id = 1L,
            name = "분석가 AI",
            role = "ANALYST",
            model = "gemini-1.5-pro",
            contributionPoints = 300,
            reliabilityIndex = 85,
            scalingPolicy = "MANUAL"
        )
        `when`(agentRepository.findById(1L)).thenReturn(Optional.of(dummyAgent))
        `when`(agentRepository.save(any(Agent::class.java))).thenAnswer { it.arguments[0] as Agent }

        // when
        val updatedAgent = agentService.updateScalingPolicy(1L, "AUTO_LOAD")

        // then
        assertNotNull(updatedAgent)
        assertEquals("AUTO_LOAD", updatedAgent.scalingPolicy)
        verify(agentRepository, times(1)).save(dummyAgent)
    }

    @Test
    fun `AUTO_RECOVERY 정책이고 신뢰도가 60퍼센트 미만일 때 자가 복구 보조 인스턴스가 자동 스케일 아웃 배치되는가`() {
        // given
        val dummyAgent = Agent(
            id = 2L,
            name = "리뷰어 AI",
            role = "REVIEWER",
            model = "claude-3-5-sonnet",
            contributionPoints = 300,
            reliabilityIndex = 85,
            scalingPolicy = "AUTO_RECOVERY"
        )
        `when`(agentRepository.findById(2L)).thenReturn(Optional.of(dummyAgent))
        `when`(agentRepository.save(any(Agent::class.java))).thenAnswer { it.arguments[0] as Agent }
        
        // Mock task statistics resulting in < 60% reliability
        val task1 = com.kzoneworkspace.backend.task.entity.Task(id = 100L, roomId = "default", command = "T1", agent = dummyAgent).apply { status = com.kzoneworkspace.backend.task.entity.TaskStatus.FAILED }
        val task2 = com.kzoneworkspace.backend.task.entity.Task(id = 101L, roomId = "default", command = "T2", agent = dummyAgent).apply { status = com.kzoneworkspace.backend.task.entity.TaskStatus.FAILED }
        val task3 = com.kzoneworkspace.backend.task.entity.Task(id = 102L, roomId = "default", command = "T3", agent = dummyAgent).apply { status = com.kzoneworkspace.backend.task.entity.TaskStatus.FAILED }
        val task4 = com.kzoneworkspace.backend.task.entity.Task(id = 103L, roomId = "default", command = "T4", agent = dummyAgent).apply { status = com.kzoneworkspace.backend.task.entity.TaskStatus.FAILED }
        val task5 = com.kzoneworkspace.backend.task.entity.Task(id = 104L, roomId = "default", command = "T5", agent = dummyAgent).apply { status = com.kzoneworkspace.backend.task.entity.TaskStatus.COMPLETED }
        
        `when`(taskRepository.findByAgentId(2L)).thenReturn(listOf(task1, task2, task3, task4, task5))
        `when`(selfHealingRepository.findByTaskId(100L)).thenReturn(listOf(com.kzoneworkspace.backend.task.entity.SelfHealingLog(taskId = 100L, originalCommand = "T1", error = "err", strategyType = "GIVE_UP", suggestedCommand = "", reasoning = "")))
        `when`(cognitiveTraceRepository.findByAgentIdOrderByTimestampAsc(2L)).thenReturn(emptyList())
        
        // Make evolvePersonality fail to force reliability index drop below 60
        `when`(officeItemRepository.findByAgentId(2L)).thenReturn(emptyList())

        // when
        // complexity = 10, missionSuccess = false -> triggers drop in reliability
        agentService.evolvePersonality(2L, missionSuccess = false, complexity = 10)

        // then
        // Since contributionPoints is 300 and cost is 200, it should deduct points and save office item
        verify(officeItemRepository, times(1)).save(any(OfficeItem::class.java))
        verify(assetUtilizationLogRepository, times(1)).save(any())
    }
}
