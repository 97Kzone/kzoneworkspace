package com.kzoneworkspace.backend.agent.controller

import com.kzoneworkspace.backend.agent.service.ProjectHealthReport
import com.kzoneworkspace.backend.agent.service.ProjectHealthService
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/project-health")
class ProjectHealthController(private val projectHealthService: ProjectHealthService) {

    @GetMapping
    fun getProjectHealthReport(): ProjectHealthReport {
        return projectHealthService.getProjectHealthReport()
    }
}
