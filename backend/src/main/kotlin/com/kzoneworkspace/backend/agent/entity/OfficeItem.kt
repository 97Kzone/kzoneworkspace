package com.kzoneworkspace.backend.agent.entity

import jakarta.persistence.*
import java.time.LocalDateTime

@Entity
@Table(name = "office_items")
class OfficeItem(
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    val id: Long = 0,

    @Column(nullable = false)
    var name: String,

    @Column(nullable = false)
    var type: String, // e.g., "REASONING_CORE", "EXTENDED_CONTEXT", "VECTOR_SEARCH"

    @Column
    var agentId: Long? = null, // Optional: owner of the item

    @Column(nullable = false)
    val createdAt: LocalDateTime = LocalDateTime.now(),

    @Column(name = "utilization_rate", nullable = false)
    var utilizationRate: Int = 0,

    @Column(name = "failure_prevented_count", nullable = false)
    var failurePreventedCount: Int = 0,

    @Column(name = "accumulated_time_seconds", nullable = false)
    var accumulatedTimeSeconds: Long = 0L,

    @Column(name = "last_activated_at")
    var lastActivatedAt: LocalDateTime? = null
)
