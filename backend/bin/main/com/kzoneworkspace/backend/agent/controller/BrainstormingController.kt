package com.kzoneworkspace.backend.agent.controller

import com.kzoneworkspace.backend.agent.entity.BrainstormingSession
import com.kzoneworkspace.backend.agent.service.BrainstormingService
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/brainstorming")
class BrainstormingController(
    private val brainstormingService: BrainstormingService
) {

    @GetMapping
    fun getAllSessions(@RequestParam roomId: String): ResponseEntity<List<BrainstormingSession>> =
        ResponseEntity.ok(brainstormingService.getAllSessions(roomId))

    @PostMapping("/start")
    fun startSession(@RequestBody request: BrainstormingRequest): ResponseEntity<BrainstormingSession> =
        ResponseEntity.ok(brainstormingService.startSession(request.roomId, request.goal, request.agentIds))
}

data class BrainstormingRequest(
    val roomId: String,
    val goal: String,
    val agentIds: List<Long>
)
