package com.kzoneworkspace.backend.agent.entity

import jakarta.persistence.*
import java.time.LocalDateTime

@Entity
@Table(name = "agent_synergies")
class AgentSynergy(
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    val id: Long = 0,

    @Column(nullable = false)
    val agent1Name: String,

    @Column(nullable = false)
    val agent2Name: String,

    @Column(nullable = false)
    var synergyScore: Int = 50, // 0-100

    @Column(nullable = false)
    var collaborationCount: Int = 0,

    @Column(columnDefinition = "TEXT")
    var synergyNote: String? = null,

    @Column(nullable = false)
    var lastCollaboratedAt: LocalDateTime = LocalDateTime.now()
)
