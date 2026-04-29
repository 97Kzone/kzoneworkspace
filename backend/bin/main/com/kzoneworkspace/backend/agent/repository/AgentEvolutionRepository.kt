package com.kzoneworkspace.backend.agent.repository

import com.kzoneworkspace.backend.agent.entity.AgentEvolutionLog
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface AgentEvolutionRepository : JpaRepository<AgentEvolutionLog, Long> {
    fun findByAgentIdOrderByCreatedAtDesc(agentId: Long): List<AgentEvolutionLog>
    fun findTop10ByOrderByCreatedAtDesc(): List<AgentEvolutionLog>
}
