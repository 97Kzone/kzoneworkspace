package com.kzoneworkspace.backend.agent.controller

import com.kzoneworkspace.backend.agent.service.BriefingService
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/briefing")
class BriefingController(
    private val briefingService: BriefingService
) {
    @GetMapping
    fun getDailyBriefing(): Map<String, String> {
        val briefing = briefingService.generateDailyBriefing()
        return mapOf("content" to briefing)
    }
}
