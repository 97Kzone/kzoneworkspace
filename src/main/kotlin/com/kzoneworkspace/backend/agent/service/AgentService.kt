package com.kzoneworkspace.backend.agent.service

import com.kzoneworkspace.backend.agent.entity.Agent
import com.kzoneworkspace.backend.agent.entity.AgentStatus
import com.kzoneworkspace.backend.agent.repository.AgentRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDateTime

@Service
@Transactional(readOnly = true)
class AgentService(
    private val agentRepository: AgentRepository
) {

    fun getAllAgents(): List<Agent> = agentRepository.findAll()

    fun getAgentById(id: Long): Agent =
        agentRepository.findById(id).orElseThrow { RuntimeException("Agent not found: $id") }

    @Transactional
    fun createAgent(agent: Agent): Agent = agentRepository.save(agent)

    @Transactional
    fun updateAgent(id: Long, updated: Agent): Agent {
        val agent = getAgentById(id)
        agent.name = updated.name
        agent.role = updated.role
        agent.systemPrompt = updated.systemPrompt
        agent.provider = updated.provider
        agent.model = updated.model
        agent.updatedAt = LocalDateTime.now()
        return agentRepository.save(agent)
    }

    @Transactional
    fun updateStatus(id: Long, status: AgentStatus): Agent {
        val agent = getAgentById(id)
        agent.status = status
        agent.updatedAt = LocalDateTime.now()
        return agentRepository.save(agent)
    }

    @Transactional
    fun deleteAgent(id: Long) = agentRepository.deleteById(id)
}