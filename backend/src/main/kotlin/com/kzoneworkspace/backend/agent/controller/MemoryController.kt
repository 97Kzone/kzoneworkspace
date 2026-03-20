package com.kzoneworkspace.backend.agent.controller

import com.kzoneworkspace.backend.agent.dto.MemoryResponse
import com.kzoneworkspace.backend.agent.service.MemoryService
import org.slf4j.LoggerFactory
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/memories")
@CrossOrigin(origins = ["http://localhost:8080"])
class MemoryController(
    private val memoryService: MemoryService
) {
    private val logger = LoggerFactory.getLogger(MemoryController::class.java)

    @GetMapping
    fun getAllMemories(@RequestParam(defaultValue = "50") limit: Int): ResponseEntity<List<MemoryResponse>> {
        logger.info("GET /api/memories?limit=$limit")
        return ResponseEntity.ok(memoryService.getAllMemories(limit))
    }

    @GetMapping("/search")
    fun searchMemories(
        @RequestParam query: String,
        @RequestParam(required = false) agentId: Long?,
        @RequestParam(defaultValue = "10") limit: Int
    ): ResponseEntity<List<MemoryResponse>> =
        ResponseEntity.ok(memoryService.searchMemories(agentId, query, limit))

    @GetMapping("/agent/{agentId}")
    fun getByAgent(
        @PathVariable agentId: Long,
        @RequestParam(defaultValue = "20") limit: Int
    ): ResponseEntity<List<MemoryResponse>> =
        ResponseEntity.ok(memoryService.getAllMemories(limit).filter { it.agentId == agentId })
}
