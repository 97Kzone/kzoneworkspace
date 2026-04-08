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
        if (agent.points < price) {
            throw RuntimeException("Not enough points to buy this item!")
        }
        
        agent.points -= price
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
}
