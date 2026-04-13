package com.kzoneworkspace.backend.agent.entity

import jakarta.persistence.*
import java.time.LocalDateTime

@Entity
@Table(name = "brainstorming_sessions")
class BrainstormingSession(
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    val id: Long = 0,

    @Column(nullable = false)
    val roomId: String,

    @Column(nullable = false, columnDefinition = "TEXT")
    val goal: String,

    @Enumerated(EnumType.STRING)
    var status: BrainstormingStatus = BrainstormingStatus.PROPOSING,

    @Column(columnDefinition = "TEXT")
    var finalBlueprint: String? = null,

    @OneToMany(mappedBy = "session", cascade = [CascadeType.ALL], fetch = FetchType.EAGER)
    var contributions: MutableList<BrainstormingContribution> = mutableListOf(),

    @Column(nullable = false)
    val createdAt: LocalDateTime = LocalDateTime.now()
)

@Entity
@Table(name = "brainstorming_contributions")
class BrainstormingContribution(
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    val id: Long = 0,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id")
    val session: BrainstormingSession,

    @Column(nullable = false)
    val agentName: String,

    @Column(nullable = false)
    val agentRole: String,

    @Column(nullable = false, columnDefinition = "TEXT")
    val content: String,

    @Column(nullable = false)
    val timestamp: LocalDateTime = LocalDateTime.now()
)

enum class BrainstormingStatus {
    PROPOSING,   // Parallel phase: agents are contributing
    SYNTHESIZING, // Architect is combining
    COMPLETED,
    FAILED
}
