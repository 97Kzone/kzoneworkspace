package com.kzoneworkspace.backend.agent.entity

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.Table
import java.time.LocalDateTime

@Entity
@Table(name = "memories")
class Memory(
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    val id: Long = 0,

    @Column(nullable = false, columnDefinition = "TEXT")
    val content: String,

    // Store vector as string for compatibility with pgvector via native queries
    // Format: "[0.1, 0.2, ...]"
    @Column(nullable = false, columnDefinition = "TEXT")
    val embedding: String,

    @Column(nullable = false)
    val roomId: String,

    @Column(nullable = false)
    val agentId: Long,

    @Column(nullable = false)
    val importance: Int = 3,

    @Column(nullable = true)
    val tags: String? = null,

    @Column(nullable = false)
    val createdAt: LocalDateTime = LocalDateTime.now()
)
