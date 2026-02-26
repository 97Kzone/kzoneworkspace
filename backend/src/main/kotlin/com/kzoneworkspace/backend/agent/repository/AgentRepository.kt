package com.kzoneworkspace.backend.agent.repository

import com.kzoneworkspace.backend.agent.entity.Agent
import com.kzoneworkspace.backend.agent.entity.AgentStatus
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface AgentRepository : JpaRepository<Agent, Long> {
    fun findByStatus(status: AgentStatus): List<Agent>
    fun findByProvider(provider: com.kzoneworkspace.backend.agent.entity.AiProvider): List<Agent>
}