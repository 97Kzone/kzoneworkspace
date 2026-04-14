package com.kzoneworkspace.backend.agent.repository

import com.kzoneworkspace.backend.agent.entity.ScenarioSimulation
import com.kzoneworkspace.backend.agent.entity.ScenarioImpact
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface ScenarioRepository : JpaRepository<ScenarioSimulation, Long> {
    fun findByRoomIdOrderByCreatedAtDesc(roomId: String): List<ScenarioSimulation>
}

@Repository
interface ScenarioImpactRepository : JpaRepository<ScenarioImpact, Long> {
    fun findBySimulationIdOrderByAreaAsc(simulationId: Long): List<ScenarioImpact>
}
