package com.kzoneworkspace.backend.task.entity

import jakarta.persistence.*
import java.time.LocalDateTime

@Entity
@Table(name = "scheduled_tasks")
class ScheduledTask(
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    val id: Long = 0,

    @Column(nullable = false)
    val description: String,

    @Column(nullable = false)
    val agentId: Long,

    @Column(nullable = false)
    val roomId: String,

    @Column(columnDefinition = "TEXT", nullable = false)
    val command: String, // 에이전트에게 내릴 명령

    @Column(nullable = false)
    val cronExpression: String, // Spring Cron 형식 (예: "0 0/1 * * * ?")

    @Column
    var lastRun: LocalDateTime? = null,

    @Column
    var nextRun: LocalDateTime? = null,

    @Column(nullable = false)
    var status: String = "ACTIVE", // "ACTIVE", "PAUSED"

    @Column(nullable = false)
    val createdAt: LocalDateTime = LocalDateTime.now()
)
