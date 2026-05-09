package com.kzoneworkspace.backend.agent.repository

import com.kzoneworkspace.backend.agent.entity.Conflict
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface ConflictRepository : JpaRepository<Conflict, Long> {
    fun findByStatus(status: String): List<Conflict>
    fun findByAgent1NameOrAgent2Name(agent1Name: String, agent2Name: String): List<Conflict>
}
