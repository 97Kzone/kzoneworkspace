package com.kzoneworkspace.backend.agent.controller

import com.kzoneworkspace.backend.agent.entity.NeuralResonance
import com.kzoneworkspace.backend.agent.service.NeuralResonanceService
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/agent/resonance")
class NeuralResonanceController(
    private val resonanceService: NeuralResonanceService
) {
    @GetMapping("/latest")
    fun getLatest(): List<NeuralResonance> = resonanceService.getLatestResonances()

    @PostMapping("/analyze")
    fun triggerAnalysis() {
        resonanceService.detectResonances()
    }
}
