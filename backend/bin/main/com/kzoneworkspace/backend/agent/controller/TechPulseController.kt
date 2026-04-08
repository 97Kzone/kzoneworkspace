package com.kzoneworkspace.backend.agent.controller

import com.kzoneworkspace.backend.agent.entity.TechPulse
import com.kzoneworkspace.backend.agent.service.TechPulseService
import org.slf4j.LoggerFactory
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/tech-pulses")
@CrossOrigin(origins = ["*"]) // UI에서 접근 가능하도록 허용
class TechPulseController(
    private val techPulseService: TechPulseService
) {
    private val logger = LoggerFactory.getLogger(TechPulseController::class.java)

    @GetMapping
    fun getAllPulses(): ResponseEntity<List<TechPulse>> {
        logger.info("GET /api/tech-pulses")
        return ResponseEntity.ok(techPulseService.getAllPulses())
    }

    @PostMapping("/refresh")
    fun refreshPulses(): ResponseEntity<List<TechPulse>> {
        logger.info("POST /api/tech-pulses/refresh")
        return ResponseEntity.ok(techPulseService.refreshTechPulses())
    }
}
