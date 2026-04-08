package com.kzoneworkspace.backend.agent.entity

import jakarta.persistence.*
import java.time.LocalDateTime

@Entity
@Table(name = "codebase_chunks")
class CodebaseChunk(
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    val id: Long = 0,

    @Column(nullable = false, columnDefinition = "TEXT")
    val content: String,

    @Column(nullable = false, columnDefinition = "TEXT")
    val embedding: String,

    @Column(nullable = false)
    val filePath: String,

    @Column(nullable = false)
    val startLine: Int,

    @Column(nullable = false)
    val endLine: Int,

    @Column
    val language: String? = null,

    @Column(nullable = false)
    val createdAt: LocalDateTime = LocalDateTime.now()
)
