package com.kzoneworkspace.backend.agent.entity

import jakarta.persistence.*
import java.time.LocalDateTime

@Entity
@Table(name = "evaluation_runs")
class EvaluationRun(
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    val id: Long = 0,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "agent_id", nullable = false)
    val agent: Agent,

    @Column(nullable = false)
    var modelName: String, // 사용자가 선택한 모델

    @Column(nullable = false)
    var status: String = "RUNNING", // RUNNING, COMPLETED, FAILED

    var overallScore: Double = 0.0,

    var totalTasks: Int = 0,

    var completedTasks: Int = 0,

    var avgLatencyMs: Long = 0,

    var totalTokens: Long = 0, // 추후 측정 용

    @Column(nullable = false)
    val startTime: LocalDateTime = LocalDateTime.now(),

    var endTime: LocalDateTime? = null
)
