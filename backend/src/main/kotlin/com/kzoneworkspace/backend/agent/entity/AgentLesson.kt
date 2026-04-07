package com.kzoneworkspace.backend.agent.entity

import jakarta.persistence.*
import java.time.LocalDateTime

@Entity
@Table(name = "agent_lessons")
class AgentLesson(
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    val id: Long = 0,

    @Column(nullable = false)
    val agentName: String,

    @Column(nullable = false)
    val taskId: Long,

    @Column(nullable = false)
    val category: String,

    @Column(columnDefinition = "TEXT")
    val failPattern: String?,

    @Column(columnDefinition = "TEXT", nullable = false)
    val wisdom: String,

    @Column(columnDefinition = "TEXT")
    val relatedFiles: String?,

    @Column(nullable = false)
    val importance: Int = 3,

    @Column(nullable = false)
    val createdAt: LocalDateTime = LocalDateTime.now()
)
