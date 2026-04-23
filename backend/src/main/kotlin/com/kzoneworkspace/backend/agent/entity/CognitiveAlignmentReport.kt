package com.kzoneworkspace.backend.agent.entity

import jakarta.persistence.*
import java.time.LocalDateTime

@Entity
@Table(name = "cognitive_alignment_reports")
class CognitiveAlignmentReport(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long? = null,

    @Column(nullable = false)
    val roomId: String,

    @Column(nullable = false)
    val alignmentScore: Int, // 0-100

    @Column(columnDefinition = "TEXT")
    val conflicts: String, // JSON list of conflict points

    @Column(columnDefinition = "TEXT")
    val mediationStrategy: String,

    @Column(columnDefinition = "TEXT")
    val analysisReasoning: String,

    @Column(nullable = false)
    val createdAt: LocalDateTime = LocalDateTime.now()
)
