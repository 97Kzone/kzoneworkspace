package com.kzoneworkspace.backend.agent.controller

import com.kzoneworkspace.backend.agent.entity.AgentEvolutionLog
import com.kzoneworkspace.backend.agent.service.AgentService
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/agents/evolution")
@CrossOrigin
class AgentEvolutionController(
    private val agentService: AgentService
) {
    @GetMapping("/{agentId}")
    fun getEvolutionHistory(@PathVariable agentId: Long): List<AgentEvolutionLog> =
        agentService.getEvolutionHistory(agentId)

    @GetMapping("/recent")
    fun getRecentEvolutions(): List<AgentEvolutionLog> =
        agentService.getRecentEvolutions()
}
