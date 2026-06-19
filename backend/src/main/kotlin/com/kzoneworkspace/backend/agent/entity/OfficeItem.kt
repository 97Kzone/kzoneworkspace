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

    @Column(nullable = false)
    var x: Int = 0,

    @Column(nullable = false)
    var y: Int = 0,

    @Column
    var agentId: Long? = null, // Optional: owner of the item

    @Column(nullable = false)
    val createdAt: LocalDateTime = LocalDateTime.now()
)
