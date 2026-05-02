package com.kzoneworkspace.backend.agent.controller

import com.kzoneworkspace.backend.agent.dto.AgentStandup
import com.kzoneworkspace.backend.agent.service.StandupService
import org.springframework.web.bind.annotation.CrossOrigin
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/standup")
@CrossOrigin
class StandupController(
    private val standupService: StandupService
) {
    @GetMapping
    fun getDailyStandup(): List<AgentStandup> = standupService.generateDailyStandup()
}
