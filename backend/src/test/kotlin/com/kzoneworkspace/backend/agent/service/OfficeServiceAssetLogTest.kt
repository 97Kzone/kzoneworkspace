package com.kzoneworkspace.backend.agent.service

import com.kzoneworkspace.backend.agent.entity.*
import com.kzoneworkspace.backend.agent.repository.*
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.Test
import org.mockito.ArgumentMatchers.*
import org.mockito.Mockito.*
import org.springframework.messaging.simp.SimpMessagingTemplate
import java.util.Optional

class OfficeServiceAssetLogTest {

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
    fun `자산 할당 시 기여도 차감 및 가동 로그 저장 검증`() {
        val agentId = 1L
        val agent = Agent(id = agentId, name = "Planner", role = "마스터 플래너", model = "test-model", contributionPoints = 200)

        `when`(agentService.getAgentById(agentId)).thenReturn(agent)
        `when`(officeItemRepository.save(any(OfficeItem::class.java))).thenAnswer { it.arguments[0] as OfficeItem }

        val allocated = officeService.allocateAsset(agentId, "가속 코어", "REASONING_CORE", 10, 10, 150)

        assertEquals(50, agent.contributionPoints)
        assertNotNull(allocated)
        assertEquals("REASONING_CORE", allocated.type)

        // AssetUtilizationLog가 정상적으로 저장되었는지 검증
        verify(assetUtilizationLogRepository, times(1)).save(any(AssetUtilizationLog::class.java))
        verify(messagingTemplate, times(1)).convertAndSend(eq("/topic/office/logs"), anyList<AssetUtilizationLog>())
    }

    @Test
    fun `자산 회수 시 기여도 환불 및 가동 로그 저장 검증`() {
        val agentId = 1L
        val agent = Agent(id = agentId, name = "Planner", role = "마스터 플래너", model = "test-model", contributionPoints = 50)
        val item = OfficeItem(id = 10L, name = "가속 코어", type = "REASONING_CORE", x = 10, y = 10, agentId = agentId)

        `when`(officeItemRepository.findById(10L)).thenReturn(Optional.of(item))
        `when`(agentService.getAgentById(agentId)).thenReturn(agent)

        officeService.deleteItem(10L)

        assertEquals(200, agent.contributionPoints) // 50 + 150 (REASONING_CORE price)
        verify(officeItemRepository, times(1)).deleteById(10L)
        verify(assetUtilizationLogRepository, times(1)).save(any(AssetUtilizationLog::class.java))
        verify(messagingTemplate, times(1)).convertAndSend(eq("/topic/office/logs"), anyList<AssetUtilizationLog>())
    }
}
