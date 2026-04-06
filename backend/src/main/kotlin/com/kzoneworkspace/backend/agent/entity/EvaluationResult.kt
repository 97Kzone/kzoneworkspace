package com.kzoneworkspace.backend.agent.entity

import jakarta.persistence.*
import java.time.LocalDateTime

@Entity
@Table(name = "evaluation_results")
class EvaluationResult(
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    val id: Long = 0,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "run_id", nullable = false)
    val evaluationRun: EvaluationRun,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "task_id", nullable = false)
    val benchmarkTask: BenchmarkTask,

    @Column(columnDefinition = "TEXT")
    var actualOutput: String? = null,

    var isSuccess: Boolean = false,

    var score: Double = 0.0, // 0.0 to 100.0

    var latencyMs: Long = 0,

    var tokenUsage: Long = 0,

    @Column(columnDefinition = "TEXT")
    var errorLog: String? = null,

    @Column(nullable = false)
    val createdAt: LocalDateTime = LocalDateTime.now()
)
