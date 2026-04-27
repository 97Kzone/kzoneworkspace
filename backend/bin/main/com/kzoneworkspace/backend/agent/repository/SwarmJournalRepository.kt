package com.kzoneworkspace.backend.agent.repository

import com.kzoneworkspace.backend.agent.entity.SwarmJournal
import org.springframework.data.jpa.repository.JpaRepository
import java.time.LocalDate
import java.util.*

interface SwarmJournalRepository : JpaRepository<SwarmJournal, Long> {
    fun findByJournalDate(date: LocalDate): Optional<SwarmJournal>
    fun findAllByOrderByJournalDateDesc(): List<SwarmJournal>
}
