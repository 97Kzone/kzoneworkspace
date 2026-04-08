package com.kzoneworkspace.backend.agent.controller

import com.kzoneworkspace.backend.agent.service.ShadowWorkspaceService
import com.kzoneworkspace.backend.claude.AgentExecutor
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/shadow")
class ShadowController(
    private val agentExecutor: AgentExecutor,
    private val shadowWorkspaceService: ShadowWorkspaceService
) {
    @PostMapping("/start")
    fun startShadow(@RequestParam roomId: String, @RequestParam taskId: Long) {
        agentExecutor.startShadowMode(roomId, taskId)
    }

    @PostMapping("/commit")
    fun commitShadow(@RequestParam roomId: String): String {
        return agentExecutor.commitShadowMode(roomId)
    }

    @PostMapping("/discard")
    fun discardShadow(@RequestParam roomId: String) {
        agentExecutor.discardShadowMode(roomId)
    }

    @GetMapping("/diff")
    fun getDiff(@RequestParam roomId: String): String {
        val session = shadowWorkspaceService.findActiveSessionByRoomId(roomId)
            ?: return "No active shadow session for this room."
        return shadowWorkspaceService.getDiff(session.id)
    }
}
