package com.kzoneworkspace.backend.agent.entity

import jakarta.persistence.*
import java.time.LocalDateTime

@Entity
@Table(name = "conflicts")
class Conflict(
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    val id: Long = 0,

    @Column(nullable = false)
    var title: String,

    @Column(nullable = false, length = 1000)
    var description: String,

    @Column(nullable = false)
    var agent1Name: String,

    @Column(nullable = false)
    var agent2Name: String,

    @Column
    var mediatorName: String? = null,

    @Column(nullable = false)
    var status: String = "PENDING", // PENDING, RESOLVING, RESOLVED

    @Column(length = 1000)
    var resolution: String? = null,

    @Column(nullable = false)
    val createdAt: LocalDateTime = LocalDateTime.now(),

    @Column
    var resolvedAt: LocalDateTime? = null
)
