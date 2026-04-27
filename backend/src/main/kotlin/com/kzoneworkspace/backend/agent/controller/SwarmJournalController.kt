package com.kzoneworkspace.backend.agent.controller

import com.kzoneworkspace.backend.agent.entity.SwarmJournal
import com.kzoneworkspace.backend.agent.service.SwarmJournalService
import org.springframework.web.bind.annotation.*
import java.time.LocalDate

@RestController
@RequestMapping("/api/agents/journals")
@CrossOrigin(origins = ["*"])
class SwarmJournalController(private val journalService: SwarmJournalService) {

    @GetMapping
    fun getAllJournals(): List<SwarmJournal> = journalService.getAllJournals()

    @GetMapping("/{date}")
    fun getJournalByDate(@PathVariable date: String): SwarmJournal? {
        val localDate = LocalDate.parse(date)
        return journalService.getJournalByDate(localDate)
    }

    @PostMapping("/generate")
    fun generateTodayJournal(): SwarmJournal {
        return journalService.generateDailyJournal(LocalDate.now())
    }
}
