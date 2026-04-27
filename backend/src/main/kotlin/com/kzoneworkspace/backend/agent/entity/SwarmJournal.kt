package com.kzoneworkspace.backend.agent.entity

import jakarta.persistence.*
import java.time.LocalDate
import java.time.LocalDateTime

@Entity
@Table(name = "swarm_journals")
class SwarmJournal(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,

    @Column(nullable = false, unique = true)
    val journalDate: LocalDate = LocalDate.now(),

    @Column(nullable = false, length = 500)
    var summary: String = "",

    @Column(columnDefinition = "TEXT")
    var content: String = "",

    @Column(nullable = false)
    var sentiment: String = "NORMAL",

    @Column(nullable = false)
    var taskCount: Int = 0,

    @Column(nullable = false)
    var memoryCount: Int = 0,

    @Column(nullable = false)
    var resonanceCount: Int = 0,

    @Column(nullable = false)
    var synergyScore: Int = 0,

    @Column(nullable = false)
    val createdAt: LocalDateTime = LocalDateTime.now()
)
