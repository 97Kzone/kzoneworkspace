package com.kzoneworkspace.backend.agent.entity

import jakarta.persistence.*
import java.time.LocalDateTime

@Entity
@Table(name = "war_room_incidents")
class WarRoomIncident(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long? = null,

    @Column(nullable = false)
    val title: String,

    @Column(columnDefinition = "TEXT")
    val description: String,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    val severity: IncidentSeverity = IncidentSeverity.HIGH,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    var status: IncidentStatus = IncidentStatus.ACTIVE,

    @Column(columnDefinition = "TEXT")
    val involvedAgents: String? = null, // JSON string of agent names

    @Column
    val relatedTaskId: Long? = null,

    @Column(nullable = false)
    val createdAt: LocalDateTime = LocalDateTime.now(),

    @Column(nullable = false)
    var updatedAt: LocalDateTime = LocalDateTime.now()
)

enum class IncidentSeverity {
    CRITICAL, HIGH, WARNING
}

enum class IncidentStatus {
    ACTIVE, RESOLVED, SUPPRESSED
}
