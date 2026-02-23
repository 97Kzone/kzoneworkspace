package com.kzoneworkspace.backend.agent.controller;


import com.kzoneworkspace.backend.agent.entity.Agent
import com.kzoneworkspace.backend.agent.entity.AgentStatus
import com.kzoneworkspace.backend.agent.service.AgentService;
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PatchMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/agents")
@CrossOrigin(origins = ["http://localhost:3000"])
public class AgentController(
    private val agentService:AgentService
) {
    @GetMapping
    fun getAllAgents(): ResponseEntity<List<Agent>> =
        ResponseEntity.ok(agentService.getAllAgents())

    @GetMapping("/{id}")
    fun getAgentById(@PathVariable id: Long): ResponseEntity<Agent> =
        ResponseEntity.ok(agentService.getAgentById(id))

    @PostMapping
    fun createAgent(@RequestBody request: AgentRequest): ResponseEntity<Agent> =
        ResponseEntity.ok(agentService.createAgent(request.toEntity()))

    @PutMapping("/{id}")
    fun updateAgent(@PathVariable id: Long, @RequestBody request: AgentRequest): ResponseEntity<Agent> =
        ResponseEntity.ok(agentService.updateAgent(id, request.toEntity()))

    @PatchMapping("/{id}/status")
    fun updateStatus(@PathVariable id: Long, @RequestParam status: AgentStatus): ResponseEntity<Agent> =
        ResponseEntity.ok(agentService.updateStatus(id, status))

    @DeleteMapping("/{id}")
    fun deleteAgent(@PathVariable id: Long): ResponseEntity<Unit> {
        agentService.deleteAgent(id)
        return ResponseEntity.noContent().build()
    }
}
