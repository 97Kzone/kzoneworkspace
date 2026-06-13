package com.kzoneworkspace.backend.agent.service

import com.kzoneworkspace.backend.agent.controller.ApplyOptimizationResult
import com.kzoneworkspace.backend.agent.entity.*
import com.kzoneworkspace.backend.agent.repository.*
import com.kzoneworkspace.backend.task.repository.TaskRepository
import com.kzoneworkspace.backend.task.entity.Task
import com.kzoneworkspace.backend.task.entity.TaskStatus
import com.kzoneworkspace.backend.websocket.ChatMessage
import com.kzoneworkspace.backend.websocket.ChatMessageRepository
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.Test
import org.mockito.ArgumentMatchers.*
import org.mockito.Mockito.*
import org.springframework.messaging.simp.SimpMessagingTemplate
import java.time.LocalDateTime
import java.util.Optional

class WorkflowPipelineServiceTest {

    private val activityLogService = mock(ActivityLogService::class.java)
    private val chatMessageRepository = mock(ChatMessageRepository::class.java)
    private val messagingTemplate = mock(SimpMessagingTemplate::class.java)
    private val agentService = mock(AgentService::class.java)
    private val officeService = mock(OfficeService::class.java)
    private val taskRepository = mock(TaskRepository::class.java)
    private val officeItemRepository = mock(OfficeItemRepository::class.java)

    private val service = WorkflowPipelineService(
        activityLogService = activityLogService,
        chatMessageRepository = chatMessageRepository,
        messagingTemplate = messagingTemplate,
        agentService = agentService,
        officeService = officeService,
        taskRepository = taskRepository,
        officeItemRepository = officeItemRepository
    )

    @Test
    fun `최적화 추천 엔진이 연산 지표 및 미배치 자원을 정량 분석하여 제안을 동적 설계하는가`() {
        val planner = Agent(id = 1L, name = "Planner", role = "마스터 플래너", model = "test-model", contributionPoints = 200, reliabilityIndex = 95)
        val coder = Agent(id = 2L, name = "Coder", role = "개발자", model = "test-model", contributionPoints = 150, reliabilityIndex = 75) // successRate < 90
        val reviewer = Agent(id = 3L, name = "Reviewer", role = "리뷰어", model = "test-model", contributionPoints = 300, reliabilityIndex = 92)

        `when`(agentService.getAllAgents()).thenReturn(listOf(planner, coder, reviewer))
        `when`(officeItemRepository.findByAgentId(anyLong())).thenReturn(emptyList()) // 보유한 자산 없음

        // Mock tasks: Coder에게 속도 지연(120초)이 발생한 완료된 작업 1개와 실패한 작업 1개 모사
        val task1 = Task(roomId = "room1", command = "Test1", agent = coder)
        task1.status = TaskStatus.COMPLETED
        task1.startedAt = LocalDateTime.now().minusSeconds(120)
        task1.completedAt = LocalDateTime.now()

        val task2 = Task(roomId = "room1", command = "Test2", agent = coder)
        task2.status = TaskStatus.FAILED

        `when`(taskRepository.findAll()).thenReturn(listOf(task1, task2))

        val metrics = service.getMetrics()

        assertNotNull(metrics)
        assertTrue(metrics.overallEfficiency <= 100)

        val recommendations = metrics.recommendations
        // Coder는 완수율이 낮고(50%) 속도가 느려(120초) 코드 안정성 샌드박스와 추론 속도 가속 코어, 비용 최적화가 모두 추천되어야 함.
        val hasSandbox = recommendations.any { it.title.contains("코드 안정성 샌드박스 제안") }
        val hasReasoning = recommendations.any { it.title.contains("추론 속도 가속 제안") }
        val hasCost = recommendations.any { it.title.contains("API 비용 최적화 제안") }

        assertTrue(hasSandbox, "완수율 저하 시 코드 안정성 샌드박스 최적화가 제안되어야 합니다.")
        assertTrue(hasReasoning, "평균 처리 속도 지연 시 추론 속도 가속 코어 최적화가 제안되어야 합니다.")
        assertTrue(hasCost, "개발 단계에서 API 비용 최적화 처방이 제안되어야 합니다.")
    }

    @Test
    fun `추천된 최적화 제안을 실행 시 해당하는 생산성 컴퓨팅 자원이 실시간 자동 배치 및 할당되는가`() {
        val agent = Agent(id = 2L, name = "Coder", role = "개발자", model = "test-model", contributionPoints = 500)
        `when`(agentService.getAllAgents()).thenReturn(listOf(agent))
        `when`(officeService.allocateAsset(anyLong(), anyString(), anyString(), anyInt(), anyInt(), anyInt())).thenReturn(
            OfficeItem(name = "고성능 추론 가속 코어", type = "REASONING_CORE", x = 10, y = 10, agentId = 2L)
        )

        val result = service.applyOptimization("STAGE_DEV", "추론 속도 가속 제안: Coder")

        assertTrue(result.success)
        assertTrue(result.message.contains("고성능 추론 가속 코어"))
        
        // Kotlin non-null argument safety: Use anyString() and anyInt() instead of specific string matchers that return null
        verify(officeService, times(1)).allocateAsset(
            eq(2L),
            anyString(),
            anyString(),
            anyInt(),
            anyInt(),
            eq(150)
        )

        verify(activityLogService, times(1)).logActivity(
            eq(2L),
            anyString(),
            anyString(),
            any(),
            any()
        )
        verify(chatMessageRepository, times(1)).save(any(ChatMessage::class.java))
        verify(messagingTemplate, times(1)).convertAndSend(anyString(), any(ChatMessage::class.java))
    }

    @Test
    fun `성공 기여도 지표가 부족한 상태에서 최적화 적용 시 실패 처리가 발생하는가`() {
        val agent = Agent(id = 2L, name = "Coder", role = "개발자", model = "test-model", contributionPoints = 50) // 50 pts로 150 pts 자산 할당 시도

        `when`(agentService.getAllAgents()).thenReturn(listOf(agent))

        val result = service.applyOptimization("STAGE_DEV", "추론 속도 가속 제안: Coder")

        assertFalse(result.success)
        assertTrue(result.message.contains("성공 기여도"))
        verify(officeService, never()).allocateAsset(anyLong(), anyString(), anyString(), anyInt(), anyInt(), anyInt())
    }
}
