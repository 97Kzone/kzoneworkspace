package com.kzoneworkspace.backend.task.repository

import com.kzoneworkspace.backend.task.entity.MissionSession
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface MissionSessionRepository : JpaRepository<MissionSession, Long> {
    fun findByRoomIdOrderByCreatedAtDesc(roomId: String): List<MissionSession>
}
