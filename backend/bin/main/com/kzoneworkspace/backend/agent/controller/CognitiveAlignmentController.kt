package com.kzoneworkspace.backend.agent.controller

import com.kzoneworkspace.backend.agent.entity.CognitiveAlignmentReport
import com.kzoneworkspace.backend.agent.service.CognitiveAlignmentService
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/alignment")
class CognitiveAlignmentController(
    private val alignmentService: CognitiveAlignmentService
) {
    @GetMapping("/{roomId}")
    fun getLatestReport(@PathVariable roomId: String): CognitiveAlignmentReport? {
        return alignmentService.getLatestReport(roomId)
    }

    @PostMapping("/{roomId}/analyze")
    fun analyzeAlignment(@PathVariable roomId: String): CognitiveAlignmentReport {
        return alignmentService.analyzeAlignment(roomId)
    }
}
