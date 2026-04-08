package com.kzoneworkspace.backend.agent.entity

import jakarta.persistence.*
import java.time.LocalDateTime

@Entity
@Table(name = "activity_logs")
class ActivityLog(
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    val id: Long = 0,

    @Column(nullable = false)
    val agentId: Long,

    @Column(nullable = false)
    val roomId: String,

    @Column(nullable = false)
    val activityType: String, // e.g., "TOOL_CALL", "ZONE_CHANGE", "FILE_WRITE"

    @Column
    val toolName: String? = null,

    @Column(columnDefinition = "TEXT")
    val details: String? = null,

    @Column(nullable = false)
    val timestamp: LocalDateTime = LocalDateTime.now()
)
