package com.kzoneworkspace.backend.agent.repository

import com.kzoneworkspace.backend.agent.entity.AgentSynergy
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface AgentSynergyRepository : JpaRepository<AgentSynergy, Long> {
    fun findByAgent1NameAndAgent2Name(agent1Name: String, agent2Name: String): AgentSynergy?
    
    fun findByAgent1NameOrAgent2Name(agent1Name: String, agent2Name: String): List<AgentSynergy>
}
