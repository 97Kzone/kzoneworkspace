package com.kzoneworkspace.backend.agent.controller

import com.kzoneworkspace.backend.agent.service.PipelineMetrics
import com.kzoneworkspace.backend.agent.service.WorkflowPipelineService
import org.springframework.web.bind.annotation.CrossOrigin
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/workflow-pipeline")
class WorkflowPipelineController(
    private val workflowPipelineService: WorkflowPipelineService
) {

    @GetMapping("/metrics")
    fun getMetrics(): PipelineMetrics {
        return workflowPipelineService.getMetrics()
    }
}
