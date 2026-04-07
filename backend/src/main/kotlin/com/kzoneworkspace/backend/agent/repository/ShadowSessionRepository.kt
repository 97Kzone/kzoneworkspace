package com.kzoneworkspace.backend.agent.repository

import com.kzoneworkspace.backend.agent.entity.ShadowSession
import com.kzoneworkspace.backend.agent.entity.ShadowStatus
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface ShadowSessionRepository : JpaRepository<ShadowSession, Long> {
    fun findByTaskId(taskId: Long): ShadowSession?
    fun findFirstByRoomIdAndStatusOrderByCreatedAtDesc(roomId: String, status: ShadowStatus): ShadowSession?
}
