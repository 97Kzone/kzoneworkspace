package com.kzoneworkspace.backend.agent.service

import com.kzoneworkspace.backend.agent.dto.*
import com.kzoneworkspace.backend.agent.entity.*
import com.kzoneworkspace.backend.agent.repository.*
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.Test
import org.mockito.Mockito.*
import org.springframework.messaging.simp.SimpMessagingTemplate
import java.util.Optional

class OfficeServiceRebalanceSimulateTest {

    private val officeItemRepository = mock(OfficeItemRepository::class.java)
    private val agentService = mock(AgentService::class.java)
    private val messagingTemplate = mock(SimpMessagingTemplate::class.java)
    private val assetUtilizationLogRepository = mock(AssetUtilizationLogRepository::class.java)

    private val officeService = OfficeService(
        officeItemRepository = officeItemRepository,
        agentService = agentService,
        messagingTemplate = messagingTemplate,
        assetUtilizationLogRepository = assetUtilizationLogRepository
    )

    @Test
    fun `자산 재배치 시뮬레이션 동작 검증`() {
        // Given
        val agentId = 1L
        val agent = Agent(
            id = agentId,
            name = "TestAgent",
            role = "마스터 코더 Developer",
            model = "gemini-2.0-flash",
            contributionPoints = 300,
            personalityTraits = mutableMapOf("ANALYTICAL" to 80, "CAUTIOUS" to 50, "EMPATHETIC" to 40, "BOLD" to 30, "CREATIVE" to 40),
            reliabilityIndex = 80
        )
        
        // 이 에이전트는 효율이 낮은 자산을 하나 가지고 있다고 설정 (가동률 5%)
        val underutilizedItem = OfficeItem(
            id = 100L,
            name = "유휴 가속 코어",
            type = "REASONING_CORE",
            agentId = agentId,
            utilizationRate = 5,
            failurePreventedCount = 0
        )

        `when`(agentService.getAllAgents()).thenReturn(listOf(agent))
        `when`(officeItemRepository.findAll()).thenReturn(listOf(underutilizedItem))

        // When
        val result = officeService.simulateRebalancing()

        // Then
        // 1. 회수 시뮬레이션 검증
        assertEquals(1, result.simulatedRevocations.size)
        val revocation = result.simulatedRevocations[0]
        assertEquals(100L, revocation.assetId)
        assertEquals("REASONING_CORE", revocation.type)
        assertEquals(150, revocation.cost) // REASONING_CORE cost is 150
        assertEquals("TestAgent", revocation.agentName)
        assertTrue(revocation.reason.contains("15% 미만"))

        // 2. 할당 시뮬레이션 검증
        assertTrue(result.simulatedAllocations.isNotEmpty())
        
        // 3. 총평 요약 점수 검증
        assertEquals(150, result.netRefundedPoints)
        assertTrue(result.netAllocatedPoints > 0)
        assertEquals(1, result.totalImpactedAgentsCount)
    }
}
