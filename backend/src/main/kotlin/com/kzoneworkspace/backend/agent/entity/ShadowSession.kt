package com.kzoneworkspace.backend.agent.entity

import jakarta.persistence.*
import org.springframework.data.jpa.repository.JpaRepository
import java.time.LocalDateTime

interface ShadowSessionRepository : JpaRepository<ShadowSession, Long> {
    fun findByTaskId(taskId: Long): ShadowSession?
    fun findFirstByRoomIdAndStatusOrderByCreatedAtDesc(roomId: String, status: ShadowStatus): ShadowSession?
}

@Entity
@Table(name = "shadow_sessions")
class ShadowSession(
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    val id: Long = 0,

    @Column(nullable = false)
    val taskId: Long,

    @Column(nullable = false)
    val roomId: String,

    @Column(nullable = false)
    val shadowPath: String,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    var status: ShadowStatus = ShadowStatus.PENDING,

    @Column(nullable = false)
    val createdAt: LocalDateTime = LocalDateTime.now(),

    @Column
    var mergedAt: LocalDateTime? = null
)

enum class ShadowStatus {
    PENDING, COMMITTED, DISCARDED
}
