package com.kzoneworkspace.backend.agent.service

import com.kzoneworkspace.backend.agent.entity.OfficeItem
import com.kzoneworkspace.backend.agent.entity.AssetUtilizationLog
import com.kzoneworkspace.backend.agent.repository.OfficeItemRepository
import com.kzoneworkspace.backend.agent.repository.AssetUtilizationLogRepository
import org.springframework.messaging.simp.SimpMessagingTemplate
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
@Transactional(readOnly = true)
class OfficeService(
    private val officeItemRepository: OfficeItemRepository,
    private val agentService: AgentService,
    private val messagingTemplate: SimpMessagingTemplate,
    private val assetUtilizationLogRepository: AssetUtilizationLogRepository
) {
    companion object {
        // 자산 타입별 기여 지표 소모량(가격) 정의
        private val ASSET_PRICES = mapOf(
            "REASONING_CORE" to 150,
            "EXTENDED_CONTEXT" to 100,
            "VECTOR_SEARCH" to 80,
            "AUXILIARY_INSTANCE" to 200,
            "CODE_STABILITY_SANDBOX" to 120,
            "SYNERGY_BRIDGE" to 130,
            "COST_OPTIMIZER" to 90,
            "VULNERABILITY_SHIELD" to 110
        )
    }

    fun getAllItems(): List<OfficeItem> = officeItemRepository.findAll()

    @Transactional
    fun allocateAsset(agentId: Long, name: String, type: String, x: Int = 0, y: Int = 0, price: Int): OfficeItem {
        val agent = agentService.getAgentById(agentId)
        if (agent.contributionPoints < price) {
            throw RuntimeException("생산성 컴퓨팅 자산 배치를 위한 성공 기여도가 부족합니다. (Not enough contribution points to allocate this asset)")
        }
        
        agent.contributionPoints -= price
        agentService.save(agent)

        val item = OfficeItem(
            name = name,
            type = type,
            x = x,
            y = y,
            agentId = agentId
        )
        val savedItem = officeItemRepository.save(item)

        // 자산 배치 로그 남김
        val log = AssetUtilizationLog(
            agentId = agentId,
            agentName = agent.name,
            assetType = type,
            assetName = name,
            actionType = "ALLOCATION",
            description = "${agent.name} 에이전트에 [${name}] 자산이 신규 배치되었습니다. 성공 기여도 ${price}pts가 배정되었습니다."
        )
        assetUtilizationLogRepository.save(log)

        // 자산 상태 및 에이전트 정보 실시간 동기화 브로드캐스트
        broadcastUpdates()

        return savedItem
    }


    @Transactional
    fun deleteItem(id: Long) {
        val item = officeItemRepository.findById(id).orElse(null) ?: return
        
        // 자산이 에이전트에 소속되어 있는 경우 소모했던 성공 기여도를 환불 처리
        if (item.agentId != null) {
            val agent = agentService.getAgentById(item.agentId!!)
            val refundPrice = ASSET_PRICES[item.type] ?: 0
            if (refundPrice > 0) {
                agent.contributionPoints += refundPrice
                agentService.save(agent)

                // 자산 회수 로그 남김
                val log = AssetUtilizationLog(
                    agentId = item.agentId!!,
                    agentName = agent.name,
                    assetType = item.type,
                    assetName = item.name,
                    actionType = "REVOCATION",
                    description = "${agent.name} 에이전트의 [${item.name}] 자산이 회수 및 반환 조치되었습니다. 성공 기여도 ${refundPrice}pts가 환불되었습니다."
                )
                assetUtilizationLogRepository.save(log)
            }
        }

        officeItemRepository.deleteById(id)

        // 자산 상태 및 에이전트 정보 실시간 동기화 브로드캐스트
        broadcastUpdates()
    }


    fun getRecentLogs(): List<AssetUtilizationLog> =
        assetUtilizationLogRepository.findTop50ByOrderByTimestampDesc()

    /**
     * 가상 오피스 자산 상태 및 에이전트 목록의 변경사항을 WebSocket 채널로 실시간 브로드캐스트합니다.
     */
    private fun broadcastUpdates() {
        try {
            messagingTemplate.convertAndSend("/topic/office", getAllItems())
            messagingTemplate.convertAndSend("/topic/agents", agentService.getAllAgents())
            messagingTemplate.convertAndSend("/topic/office/logs", getRecentLogs())
        } catch (e: Exception) {
            // 웹소켓 발행 실패 시 에러 로그 기록 (프로세스 중단 방지)
            println("웹소켓 브로드캐스트 에러: ${e.message}")
        }
    }
}

