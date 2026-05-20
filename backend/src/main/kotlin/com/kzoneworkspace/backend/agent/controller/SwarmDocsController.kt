package com.kzoneworkspace.backend.agent.controller

import com.kzoneworkspace.backend.agent.service.SwarmDocsReportDto
import com.kzoneworkspace.backend.agent.service.SwarmDocsService
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.CrossOrigin
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/swarm-docs")
@CrossOrigin // CORS 지원 허용
class SwarmDocsController(
    private val swarmDocsService: SwarmDocsService
) {

    @GetMapping("/latest")
    fun getLatestReport(): ResponseEntity<SwarmDocsReportDto> {
        return ResponseEntity.ok(swarmDocsService.getLatestReport())
    }

    @PostMapping("/generate")
    fun generateNewReport(): ResponseEntity<SwarmDocsReportDto> {
        return ResponseEntity.ok(swarmDocsService.generateNewReport())
    }
}
