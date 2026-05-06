package com.kzoneworkspace.backend.agent.controller

import com.kzoneworkspace.backend.agent.dto.ApiTrafficStatsResponse
import com.kzoneworkspace.backend.agent.service.ApiTrafficService
import org.springframework.web.bind.annotation.CrossOrigin
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/traffic")
@CrossOrigin
class ApiTrafficController(
    private val apiTrafficService: ApiTrafficService
) {

    @GetMapping("/stats")
    fun getStats(): ApiTrafficStatsResponse {
        return apiTrafficService.getStats()
    }
}
