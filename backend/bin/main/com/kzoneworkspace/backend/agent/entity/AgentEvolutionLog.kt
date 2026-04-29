package com.kzoneworkspace.backend.agent.entity

import jakarta.persistence.*
import java.time.LocalDateTime

@Entity
@Table(name = "agent_evolution_logs")
class AgentEvolutionLog(
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    val id: Long = 0,

    @Column(nullable = false)
    val agentId: Long,

    @Column(nullable = false)
    val agentName: String,

    @Column(nullable = false)
    val experienceLevel: Int,

    @Column(nullable = false)
    val missionCount: Int,

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "evolution_trait_snapshots", joinColumns = [JoinColumn(name = "log_id")])
    @MapKeyColumn(name = "trait_name")
    @Column(name = "trait_value")
    val personalityTraits: Map<String, Int>,

    @Column(columnDefinition = "TEXT")
    val achievement: String? = null,

    @Column(nullable = false)
    val createdAt: LocalDateTime = LocalDateTime.now()
)
