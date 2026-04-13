package com.kzoneworkspace.backend.agent.entity

import jakarta.persistence.*
import java.time.LocalDateTime

@Entity
@Table(name = "scenario_simulations")
class ScenarioSimulation(
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    val id: Long = 0,

    @Column(nullable = false)
    val roomId: String,

    @Column(nullable = false, columnDefinition = "TEXT")
    val title: String,

    @Column(nullable = false, columnDefinition = "TEXT")
    val description: String,

    @Enumerated(EnumType.STRING)
    var status: ScenarioStatus = ScenarioStatus.DESIGNING,

    @Column(columnDefinition = "TEXT")
    var finalReport: String? = null,

    @OneToMany(mappedBy = "simulation", cascade = [CascadeType.ALL], fetch = FetchType.EAGER)
    var impacts: MutableList<ScenarioImpact> = mutableListOf(),

    @Column(nullable = false)
    val createdAt: LocalDateTime = LocalDateTime.now()
)

@Entity
@Table(name = "scenario_impacts")
class ScenarioImpact(
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    val id: Long = 0,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "simulation_id")
    val simulation: ScenarioSimulation,

    @Column(nullable = false)
    val area: String, // Architecture, Security, Performance, Workload, etc.

    @Column(nullable = false)
    val score: Int, // 1-10 (Severity or Impact degree)

    @Column(nullable = false, columnDefinition = "TEXT")
    val observation: String,

    @Column(nullable = false)
    val createdAt: LocalDateTime = LocalDateTime.now()
)

enum class ScenarioStatus {
    DESIGNING,
    SIMULATING,
    COMPLETED,
    FAILED
}
