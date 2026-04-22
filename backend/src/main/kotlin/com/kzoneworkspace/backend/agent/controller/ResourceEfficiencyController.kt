package com.kzoneworkspace.backend.agent.controller

import com.kzoneworkspace.backend.agent.service.ResourceEfficiencyService
import com.kzoneworkspace.backend.agent.service.SwarmMetrics
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/agent/resource-efficiency")
class ResourceEfficiencyController(
    private val resourceEfficiencyService: ResourceEfficiencyService
) {
    @GetMapping
    fun getMetrics(): SwarmMetrics {
        return resourceEfficiencyService.getEfficiencyMetrics()
    }
}
