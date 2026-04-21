package com.kzoneworkspace.backend.agent.controller

import com.kzoneworkspace.backend.agent.entity.StrategicRecommendation
import com.kzoneworkspace.backend.agent.service.StrategicCouncilService
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/strategic-council")
@CrossOrigin(origins = ["*"])
class StrategicCouncilController(
    private val councilService: StrategicCouncilService
) {
    @GetMapping("/recommendations")
    fun getRecommendations(): List<StrategicRecommendation> =
        councilService.getAllRecommendations()

    @PostMapping("/execute/{id}")
    fun executeRecommendation(@PathVariable id: Long) {
        councilService.approveAndExecute(id)
    }

    @PostMapping("/reject/{id}")
    fun rejectRecommendation(@PathVariable id: Long) {
        councilService.reject(id)
    }
}
