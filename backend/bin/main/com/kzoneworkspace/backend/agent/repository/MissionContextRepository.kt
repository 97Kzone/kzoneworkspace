package com.kzoneworkspace.backend.agent.repository

import com.kzoneworkspace.backend.agent.entity.MissionContext
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface MissionContextRepository : JpaRepository<MissionContext, Long> {
    fun findByRoomIdOrderByImportanceDescCreatedAtDesc(roomId: String): List<MissionContext>
    fun deleteByRoomId(roomId: String)
}
