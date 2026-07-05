package com.kzoneworkspace.backend.agent.service

import com.kzoneworkspace.backend.agent.entity.Agent
import com.kzoneworkspace.backend.agent.entity.OfficeItem
import com.kzoneworkspace.backend.agent.repository.AssetUtilizationLogRepository
import com.kzoneworkspace.backend.agent.repository.OfficeItemRepository
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.mockito.Mockito.*
import org.springframework.messaging.simp.SimpMessagingTemplate
import java.util.Optional


class OfficeServiceAnalyticsTest {

    private lateinit var officeItemRepository: OfficeItemRepository
    private lateinit var agentService: AgentService
    private lateinit var messagingTemplate: SimpMessagingTemplate
    private lateinit var assetUtilizationLogRepository: AssetUtilizationLogRepository
    private lateinit var officeService: OfficeService

    @BeforeEach
    fun setUp() {
        officeItemRepository = mock(OfficeItemRepository::class.java)
        agentService = mock(AgentService::class.java)
        messagingTemplate = mock(SimpMessagingTemplate::class.java)
        assetUtilizationLogRepository = mock(AssetUtilizationLogRepository::class.java)

        officeService = OfficeService(
            officeItemRepository,
            agentService,
            messagingTemplate,
            assetUtilizationLogRepository
        )
    }

    @Test
    fun `에이전트 자산 ROI 및 활용 효율성 정량 분석 결과를 올바르게 계산한다`() {
        // given
        val dummyAgent = Agent(
            id = 1L,
            name = "건설가 AI",
            role = "ARCHITECT",
            model = "claude-3-5-sonnet",
            contributionPoints = 300,
            reliabilityIndex = 85
        )
        val dummyItem = OfficeItem(
            id = 10L,
            name = "고성능 추론 가속 코어",
            type = "REASONING_CORE",
            agentId = 1L
        )

        `when`(agentService.getAllAgents()).thenReturn(listOf(dummyAgent))
        `when`(officeItemRepository.findAll()).thenReturn(listOf(dummyItem))

        // when
        val analytics = officeService.getAssetAnalytics()

        // then
        assertNotNull(analytics)
        assertEquals(150, analytics.totalAllocatedAssetCost) // REASONING_CORE cost is 150
        assertEquals(200.0, analytics.overallRoi) // 300 earned / 150 cost * 100 = 200.0%
        assertEquals(1, analytics.agentAnalytics.size)
        
        val agentDto = analytics.agentAnalytics.first()
        assertEquals("건설가 AI", agentDto.agentName)
        assertEquals(200.0, agentDto.roi)
        assertTrue(agentDto.utilizationEfficiency in 15..99)
    }

    @Test
    fun `가동률이 낮은 자산이 있는 경우 재배치 권장 대상을 올바르게 식별한다`() {
        // given
        val dummyAgent = Agent(
            id = 1L,
            name = "개발자 AI",
            role = "CODER",
            model = "claude-3-5-sonnet",
            contributionPoints = 100,
            reliabilityIndex = 80
        )
        val underutilizedItem = OfficeItem(
            id = 20L,
            name = "고성능 추론 가속 코어",
            type = "REASONING_CORE",
            agentId = 1L
        ).apply {
            utilizationRate = 5 // 15% 미만으로 유휴 자산에 해당
            failurePreventedCount = 0
            accumulatedTimeSeconds = 120L
        }

        `when`(agentService.getAllAgents()).thenReturn(listOf(dummyAgent))
        `when`(officeItemRepository.findAll()).thenReturn(listOf(underutilizedItem))

        // when
        val analytics = officeService.getAssetAnalytics()

        // then
        assertNotNull(analytics)
        assertEquals(1, analytics.rebalancingRecommendations.size)
        
        val recommendation = analytics.rebalancingRecommendations.first()
        assertEquals(20L, recommendation.assetId)
        assertEquals("개발자 AI", recommendation.agentName)
        assertEquals("REASONING_CORE", recommendation.type)
        assertTrue(recommendation.recommendationReason.contains("실시간 가동률"))
    }

    @Test
    fun `일괄 자동 재배치 시 비효율 자산을 정상적으로 회수하고 에이전트 맞춤형 자산을 신규 자동 배치한다`() {
        // given
        val dummyAgent = Agent(
            id = 1L,
            name = "개발자 AI",
            role = "CODER",
            model = "claude-3-5-sonnet",
            contributionPoints = 20,
            reliabilityIndex = 80
        )
        val underutilizedItem = OfficeItem(
            id = 20L,
            name = "고성능 추론 가속 코어",
            type = "REASONING_CORE",
            agentId = 1L
        ).apply {
            utilizationRate = 5
            failurePreventedCount = 0
            accumulatedTimeSeconds = 120L
        }

        `when`(agentService.getAllAgents()).thenReturn(listOf(dummyAgent))
        `when`(officeItemRepository.findAll()).thenReturn(listOf(underutilizedItem))
        `when`(officeItemRepository.findById(20L)).thenReturn(Optional.of(underutilizedItem))
        `when`(agentService.getAgentById(1L)).thenReturn(dummyAgent)
        `when`(officeItemRepository.save(any(OfficeItem::class.java))).thenAnswer { it.arguments[0] as OfficeItem }

        // when
        val result = officeService.executeAutoRebalancing()

        // then
        assertNotNull(result)
        assertEquals(1, result.rebalancedCount)
        verify(officeItemRepository).deleteById(20L)
        // 20pts + 150pts(환불) = 170pts. Coder 선호 자산인 CODE_STABILITY_SANDBOX(120pts)를 구매(배치)함.
        assertEquals(1, result.allocatedCount)
        verify(officeItemRepository).save(any(OfficeItem::class.java))
    }
}

