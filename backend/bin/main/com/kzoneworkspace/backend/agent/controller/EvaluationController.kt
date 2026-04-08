package com.kzoneworkspace.backend.agent.controller

import com.kzoneworkspace.backend.agent.dto.*
import com.kzoneworkspace.backend.agent.service.EvaluationService
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/evaluations")
class EvaluationController(
    private val evaluationService: EvaluationService
) {

    @PostMapping("/run")
    fun runEvaluation(@RequestBody request: EvaluationRequest): ResponseEntity<EvaluationRunResponse> {
        val run = evaluationService.startEvaluation(request.agentId, request.targetModel)
        return ResponseEntity.ok(EvaluationRunResponse(
            id = run.id,
            agentName = run.agent.name,
            modelName = run.modelName,
            status = run.status,
            overallScore = run.overallScore,
            totalTasks = run.totalTasks,
            completedTasks = run.completedTasks,
            startTime = run.startTime,
            endTime = run.endTime
        ))
    }

    @GetMapping("/history/{agentId}")
    fun getHistory(@PathVariable agentId: Long): ResponseEntity<List<EvaluationRunResponse>> {
        val history = evaluationService.getRunHistory(agentId).map {
            EvaluationRunResponse(
                id = it.id,
                agentName = it.agent.name,
                modelName = it.modelName,
                status = it.status,
                overallScore = it.overallScore,
                totalTasks = it.totalTasks,
                completedTasks = it.completedTasks,
                startTime = it.startTime,
                endTime = it.endTime
            )
        }
        return ResponseEntity.ok(history)
    }

    @GetMapping("/{runId}/details")
    fun getDetails(@PathVariable runId: Long): ResponseEntity<List<EvaluationDetailResponse>> {
        val details = evaluationService.getRunDetails(runId).map {
            EvaluationDetailResponse(
                taskId = it.benchmarkTask.id,
                taskName = it.benchmarkTask.name,
                inputPrompt = it.benchmarkTask.inputPrompt,
                expectedOutput = it.benchmarkTask.expectedOutput,
                actualOutput = it.actualOutput,
                isSuccess = it.isSuccess,
                score = it.score,
                latencyMs = it.latencyMs,
                errorLog = it.errorLog
            )
        }
        return ResponseEntity.ok(details)
    }
}
