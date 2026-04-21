package com.kzoneworkspace.backend.agent.entity

import jakarta.persistence.*
import java.time.LocalDateTime

@Entity
@Table(name = "strategic_recommendations")
class StrategicRecommendation(
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    val id: Long = 0,

    @Column(nullable = false)
    val title: String,

    @Column(columnDefinition = "TEXT", nullable = false)
    val description: String,

    @Column(nullable = false)
    val category: String, // e.g., TECH_DEBT, INNOVATION, PERFORMANCE, SECURITY, COLLABORATION

    @Column(nullable = false)
    val priority: String, // e.g., HIGH, MEDIUM, LOW

    @Column(nullable = false)
    val estimatedEffort: String, // e.g., SMALL, MEDIUM, LARGE

    @Column(nullable = false)
    var status: String = "PENDING", // PENDING, APPROVED, REJECTED, EXECUTED

    @Column(columnDefinition = "TEXT")
    var analysisReasoning: String? = null,

    @Column(nullable = false)
    val createdAt: LocalDateTime = LocalDateTime.now()
)
