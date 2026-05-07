package com.kzoneworkspace.backend.agent.repository

import com.kzoneworkspace.backend.agent.entity.IncidentStatus
import com.kzoneworkspace.backend.agent.entity.WarRoomIncident
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface WarRoomRepository : JpaRepository<WarRoomIncident, Long> {
    fun findAllByStatus(status: IncidentStatus): List<WarRoomIncident>
}
