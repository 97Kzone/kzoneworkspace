package com.kzoneworkspace.backend.agent.controller

import com.kzoneworkspace.backend.agent.entity.AgentSynergy
import com.kzoneworkspace.backend.agent.service.AgentService
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/synergy")
class AgentSynergyController(
    private val agentService: AgentService
) {
    @GetMapping
    fun getAllSynergies(): List<AgentSynergy> = agentService.getAllSynergies()
}
