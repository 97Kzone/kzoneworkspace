package com.kzoneworkspace.backend.agent.entity

import jakarta.persistence.*
import java.time.LocalDateTime

@Entity
@Table(name = "benchmark_tasks")
class BenchmarkTask(
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    val id: Long = 0,

    @Column(nullable = false)
    var name: String,

    @Column(nullable = false)
    var category: String, // e.g., CODING, LOGIC, CREATIVE

    @Column(columnDefinition = "TEXT", nullable = false)
    var inputPrompt: String,

    @Column(columnDefinition = "TEXT")
    var expectedOutput: String? = null,

    @Enumerated(EnumType.STRING)
    var criteriaType: CriteriaType = CriteriaType.CONTAINS,

    var difficulty: Int = 1,

    @Column(nullable = false)
    val createdAt: LocalDateTime = LocalDateTime.now()
)

enum class CriteriaType {
    EXACT_MATCH,
    CONTAINS,
    REGEX,
    SEMANTIC // 향후 LLM-as-a-Judge 용
}
