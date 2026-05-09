package com.kzoneworkspace.backend.agent.controller

import com.kzoneworkspace.backend.agent.entity.Conflict
import com.kzoneworkspace.backend.agent.service.ConflictService
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/agent/conflicts")
class ConflictController(
    private val conflictService: ConflictService
) {

    @GetMapping
    fun getAllConflicts(): List<Conflict> = conflictService.getAllConflicts()

    @GetMapping("/status/{status}")
    fun getConflictsByStatus(@PathVariable status: String): List<Conflict> = 
        conflictService.getConflictsByStatus(status)

    @PostMapping
    fun createConflict(
        @RequestParam title: String,
        @RequestParam description: String,
        @RequestParam agent1Name: String,
        @RequestParam agent2Name: String
    ): Conflict = conflictService.createConflict(title, description, agent1Name, agent2Name)

    @PutMapping("/{id}/resolve")
    fun resolveConflict(
        @PathVariable id: Long,
        @RequestParam resolution: String,
        @RequestParam mediatorName: String
    ): Conflict = conflictService.resolveConflict(id, resolution, mediatorName)
}
