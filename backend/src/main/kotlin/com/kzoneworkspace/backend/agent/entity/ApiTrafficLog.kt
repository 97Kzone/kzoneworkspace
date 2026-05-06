package com.kzoneworkspace.backend.agent.entity

import jakarta.persistence.*
import java.time.LocalDateTime

@Entity
@Table(name = "api_traffic_logs")
class ApiTrafficLog(
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    val id: Long = 0,

    @Column(nullable = false)
    val agentId: Long,

    @Column(nullable = false)
    val agentName: String,

    @Enumerated(EnumType.STRING)
    val provider: AiProvider,

    @Column(nullable = false)
    val model: String,

    @Column(nullable = false)
    val inputTokens: Long,

    @Column(nullable = false)
    val outputTokens: Long,

    @Column(nullable = false)
    val estimatedCost: Double,

    @Column(nullable = false)
    val timestamp: LocalDateTime = LocalDateTime.now()
)
