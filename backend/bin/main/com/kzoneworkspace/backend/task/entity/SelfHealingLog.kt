package com.kzoneworkspace.backend.task.entity

import jakarta.persistence.*
import java.time.LocalDateTime

@Entity
@Table(name = "self_healing_logs")
class SelfHealingLog(
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    val id: Long = 0,

    @Column(nullable = false)
    val taskId: Long,

    @Column(nullable = true)
    val agentName: String? = null,

    @Column(columnDefinition = "TEXT")
    val originalCommand: String,

    @Column(columnDefinition = "TEXT")
    val error: String,

    @Column(nullable = false)
    val strategyType: String, // RETRY_WITH_FIX, GIVE_UP

    @Column(columnDefinition = "TEXT")
    val suggestedCommand: String,

    @Column(columnDefinition = "TEXT")
    val reasoning: String,

    val createdAt: LocalDateTime = LocalDateTime.now()
)
