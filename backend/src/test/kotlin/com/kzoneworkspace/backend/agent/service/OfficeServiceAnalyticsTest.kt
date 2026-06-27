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
}
