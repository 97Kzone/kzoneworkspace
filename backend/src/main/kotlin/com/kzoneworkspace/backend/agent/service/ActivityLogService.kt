package com.kzoneworkspace.backend.agent.service

import com.kzoneworkspace.backend.agent.entity.ActivityLog
import com.kzoneworkspace.backend.agent.repository.ActivityLogRepository
import org.springframework.messaging.simp.SimpMessagingTemplate
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDateTime

@Service
class ActivityLogService(
    private val activityLogRepository: ActivityLogRepository,
    private val messagingTemplate: SimpMessagingTemplate
) {
    @Transactional
    fun logActivity(
        agentId: Long,
        roomId: String,
        activityType: String,
        toolName: String? = null,
        details: String? = null
    ): ActivityLog {
        val log = ActivityLog(
            agentId = agentId,
            roomId = roomId,
            activityType = activityType,
            toolName = toolName,
            details = details
        )
        val savedLog = activityLogRepository.save(log)
        try {
            messagingTemplate.convertAndSend("/topic/activities", savedLog)
        } catch (e: Exception) {
            println("Failed to broadcast activity log: ${e.message}")
        }
        return savedLog
    }

    fun getLogsByRoom(roomId: String): List<ActivityLog> {
        return activityLogRepository.findByRoomIdOrderByTimestampDesc(roomId)
    }

    fun getAllLogs(): List<ActivityLog> {
        return activityLogRepository.findAll().sortedByDescending { it.timestamp }
    }
}

