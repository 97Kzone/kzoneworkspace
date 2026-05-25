package com.kzoneworkspace.backend.agent.service

import com.kzoneworkspace.backend.agent.entity.OfficeItem
import com.kzoneworkspace.backend.agent.repository.OfficeItemRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
@Transactional(readOnly = true)
class OfficeService(
    private val officeItemRepository: OfficeItemRepository,
    private val agentService: AgentService
) {
    fun getAllItems(): List<OfficeItem> = officeItemRepository.findAll()

    @Transactional
    fun buyItem(agentId: Long, name: String, type: String, x: Int, y: Int, price: Int): OfficeItem {
        val agent = agentService.getAgentById(agentId)
        if (agent.contributionPoints < price) {
            throw RuntimeException("자산 배치를 위한 기여도가 부족합니다. (Not enough contribution points to allocate this asset)")
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
        return officeItemRepository.save(item)
    }

    @Transactional
    fun deleteItem(id: Long) = officeItemRepository.deleteById(id)

    @Transactional
    fun moveItem(id: Long, x: Int, y: Int): OfficeItem {
        val item = officeItemRepository.findById(id).orElseThrow { RuntimeException("Item not found") }
        item.x = x
        item.y = y
        return officeItemRepository.save(item)
    }
}
