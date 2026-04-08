package com.kzoneworkspace.backend.agent.entity

import jakarta.persistence.*
import java.time.LocalDateTime
import java.util.UUID

enum class CognitiveStepType {
    PLANNING,
    INFERENCE,
    VALIDATION,
    CORRECTION,
    OBSERVATION
}

@Entity
@Table(name = "cognitive_traces")
class CognitiveTrace(
    @Id
    val id: UUID = UUID.randomUUID(),

    @Column(nullable = false)
    val agentId: Long,

    @Column(nullable = false)
    val roomId: String,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    val type: CognitiveStepType,

    @Column(columnDefinition = "TEXT", nullable = false)
    val content: String,

    @Column(nullable = false)
    val confidence: Double = 1.0,

    @Column(nullable = false)
    val timestamp: LocalDateTime = LocalDateTime.now()
)
