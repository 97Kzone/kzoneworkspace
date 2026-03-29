package com.kzoneworkspace.backend.agent.entity

import jakarta.persistence.*
import java.time.LocalDateTime

@Entity
@Table(name = "tech_pulses")
class TechPulse(
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    val id: Long = 0,

    @Column(nullable = false)
    val title: String,

    @Column(nullable = false)
    val category: String, // e.g., "KOTLIN", "REACT", "AI", "SECURITY"

    @Column(columnDefinition = "TEXT", nullable = false)
    val description: String,

    @Column(nullable = false)
    val impactScore: Int, // 1-10

    @Column(columnDefinition = "TEXT")
    val projectImpact: String, // LLM 분석 내용 (Markdown)

    @Column
    val sourceUrl: String? = null,

    @Column(nullable = false)
    val createdAt: LocalDateTime = LocalDateTime.now()
)
