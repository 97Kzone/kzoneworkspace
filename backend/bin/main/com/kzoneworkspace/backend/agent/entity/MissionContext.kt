package com.kzoneworkspace.backend.agent.entity

import jakarta.persistence.*
import java.time.LocalDateTime

@Entity
@Table(name = "mission_contexts")
class MissionContext(
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    val id: Long = 0,

    @Column(nullable = false)
    val roomId: String,

    @Column(nullable = false)
    val intelKey: String,

    @Column(nullable = false, columnDefinition = "TEXT")
    val intelValue: String,

    @Column(nullable = false)
    val importance: Int = 1,

    @Column(nullable = false)
    val agentName: String,

    @Column(nullable = false)
    val createdAt: LocalDateTime = LocalDateTime.now()
)
