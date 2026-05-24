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
            avgLatencyMs = run.avgLatencyMs,
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
                avgLatencyMs = it.avgLatencyMs,
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
                category = it.benchmarkTask.category,
                inputPrompt = it.benchmarkTask.inputPrompt,
                expectedOutput = it.benchmarkTask.expectedOutput,
                actualOutput = it.actualOutput,
                isSuccess = it.isSuccess,
                score = it.score,
                latencyMs = it.latencyMs,
                rationale = it.rationale,
                errorLog = it.errorLog
            )
        }
        return ResponseEntity.ok(details)
    }

    // 벤치마크 태스크 CRUD API 신설
    @GetMapping("/tasks")
    fun getAllTasks(): ResponseEntity<List<BenchmarkTaskResponse>> {
        val tasks = evaluationService.getAllBenchmarkTasks().map {
            BenchmarkTaskResponse(
                id = it.id,
                name = it.name,
                category = it.category,
                inputPrompt = it.inputPrompt,
                expectedOutput = it.expectedOutput,
                criteriaType = it.criteriaType.name,
                difficulty = it.difficulty
            )
        }
        return ResponseEntity.ok(tasks)
    }

    @PostMapping("/tasks")
    fun createTask(@RequestBody request: CreateBenchmarkTaskRequest): ResponseEntity<BenchmarkTaskResponse> {
        val task = evaluationService.createBenchmarkTask(request)
        return ResponseEntity.ok(BenchmarkTaskResponse(
            id = task.id,
            name = task.name,
            category = task.category,
            inputPrompt = task.inputPrompt,
            expectedOutput = task.expectedOutput,
            criteriaType = task.criteriaType.name,
            difficulty = task.difficulty
        ))
    }

    @DeleteMapping("/tasks/{id}")
    fun deleteTask(@PathVariable id: Long): ResponseEntity<Map<String, String>> {
        evaluationService.deleteBenchmarkTask(id)
        return ResponseEntity.ok(mapOf("message" to "Benchmark task deleted successfully"))
    }
}

