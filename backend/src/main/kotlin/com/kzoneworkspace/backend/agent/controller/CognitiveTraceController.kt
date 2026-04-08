package com.kzoneworkspace.backend.agent.controller

import com.kzoneworkspace.backend.agent.entity.CognitiveTrace
import com.kzoneworkspace.backend.agent.service.CognitiveTraceService
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/cognitive")
@CrossOrigin(origins = ["*"])
class CognitiveTraceController(
    private val cognitiveTraceService: CognitiveTraceService
) {
    @GetMapping("/room/{roomId}")
    fun getTracesByRoom(@PathVariable roomId: String): List<CognitiveTrace> {
        return cognitiveTraceService.getTracesForRoom(roomId)
    }

    @GetMapping("/agent/{agentId}")
    fun getTracesByAgent(@PathVariable agentId: Long): List<CognitiveTrace> {
        return cognitiveTraceService.getTracesForAgent(agentId)
    }
}
