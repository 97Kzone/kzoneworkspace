package com.kzoneworkspace.backend.agent.controller

import com.kzoneworkspace.backend.agent.service.PipelineMetrics
import com.kzoneworkspace.backend.agent.service.WorkflowPipelineService
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.CrossOrigin
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

data class ApplyOptimizationRequest(
    val stageId: String,
    val title: String
)

data class ApplyOptimizationResult(
    val success: Boolean,
    val message: String
)

@RestController
@RequestMapping("/api/workflow-pipeline")
@CrossOrigin
class WorkflowPipelineController(
    private val workflowPipelineService: WorkflowPipelineService
) {

    @GetMapping("/metrics")
    fun getMetrics(): PipelineMetrics {
        return workflowPipelineService.getMetrics()
    }

    @PostMapping("/apply")
    fun applyOptimization(
        @RequestBody request: ApplyOptimizationRequest
    ): ResponseEntity<ApplyOptimizationResult> {
        val result = workflowPipelineService.applyOptimization(request.stageId, request.title)
        return ResponseEntity.ok(result)
    }
}
