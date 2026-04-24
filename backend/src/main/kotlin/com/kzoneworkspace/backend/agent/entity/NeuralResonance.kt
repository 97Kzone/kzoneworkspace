package com.kzoneworkspace.backend.agent.entity

import jakarta.persistence.*
import java.time.LocalDateTime

@Entity
@Table(name = "neural_resonances")
class NeuralResonance(
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    val id: Long = 0,

    @Column(nullable = false)
    val sourceId: Long,

    @Column(nullable = false)
    val targetId: Long,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    val sourceType: ResonanceEntityType,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    val targetType: ResonanceEntityType,

    @Column(nullable = false)
    val resonanceStrength: Double, // 0.0 to 1.0

    @Column(nullable = false)
    val sourceAgentName: String,

    @Column(nullable = false)
    val targetAgentName: String,

    @Column(columnDefinition = "TEXT")
    var resonanceTheme: String? = null,

    @Column(columnDefinition = "TEXT")
    var synthesizedInsight: String? = null,

    @Column(nullable = false)
    val createdAt: LocalDateTime = LocalDateTime.now()
)

enum class ResonanceEntityType {
    MEMORY, LESSON
}
