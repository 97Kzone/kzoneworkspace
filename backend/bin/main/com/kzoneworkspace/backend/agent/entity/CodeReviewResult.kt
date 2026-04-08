package com.kzoneworkspace.backend.agent.entity

import jakarta.persistence.*
import java.time.LocalDateTime

@Entity
@Table(name = "code_review_results")
class CodeReviewResult(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,

    @Column(nullable = false)
    val filePath: String,

    @Column(nullable = false)
    val title: String,

    @Column(columnDefinition = "TEXT")
    val issue: String,

    @Column(columnDefinition = "TEXT")
    val originalCode: String? = null,

    @Column(columnDefinition = "TEXT")
    val suggestedCode: String? = null,

    @Column(nullable = false)
    val severity: String = "MEDIUM", // HIGH, MEDIUM, LOW

    @Column(nullable = false)
    var status: String = "PENDING", // PENDING, APPLIED, DISCARDED

    @Column(nullable = false)
    val createdAt: LocalDateTime = LocalDateTime.now()
)
