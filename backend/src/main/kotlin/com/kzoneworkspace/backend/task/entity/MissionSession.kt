package com.kzoneworkspace.backend.task.entity

import jakarta.persistence.*
import java.time.LocalDateTime

@Entity
@Table(name = "mission_sessions")
class MissionSession(
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    val id: Long = 0,

    @Column(nullable = false)
    val roomId: String,

    @Column(columnDefinition = "TEXT", nullable = false)
    val goal: String,

    @Column(columnDefinition = "TEXT")
    var decompositionStructure: String? = null, // JSON string of sub-task definitions

    @Enumerated(EnumType.STRING)
    var status: MissionStatus = MissionStatus.PENDING,

    @Column(nullable = false)
    var totalTasks: Int = 0,

    @Column(nullable = false)
    var completedTasks: Int = 0,

    val createdAt: LocalDateTime = LocalDateTime.now(),
    var updatedAt: LocalDateTime = LocalDateTime.now()
)

enum class MissionStatus {
    PENDING, ACTIVE, COMPLETED, FAILED
}
