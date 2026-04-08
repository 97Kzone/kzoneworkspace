package com.kzoneworkspace.backend.agent.repository

import com.kzoneworkspace.backend.agent.entity.ActivityLog
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface ActivityLogRepository : JpaRepository<ActivityLog, Long> {
    fun findByRoomIdOrderByTimestampDesc(roomId: String): List<ActivityLog>
    fun findByAgentIdOrderByTimestampDesc(agentId: Long): List<ActivityLog>
    fun findByTimestampAfter(timestamp: java.time.LocalDateTime): List<ActivityLog>
}
