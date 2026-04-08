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
    var type: String, // e.g., "COFFEE_MACHINE", "PLANT", "SERVER_RACK"

    @Column(nullable = false)
    var x: Int,

    @Column(nullable = false)
    var y: Int,

    @Column
    var agentId: Long? = null, // Optional: owner of the item

    @Column(nullable = false)
    val createdAt: LocalDateTime = LocalDateTime.now()
)
