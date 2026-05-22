package com.kzoneworkspace.backend.agent.dto

import java.time.LocalDateTime

data class EvaluationRequest(
    val agentId: Long,
    val targetModel: String? = null
)

data class EvaluationRunResponse(
    val id: Long,
    val agentName: String,
    val modelName: String,
    val status: String,
    val overallScore: Double,
    val totalTasks: Int,
    val completedTasks: Int,
    val startTime: LocalDateTime,
    val endTime: LocalDateTime?
)

data class EvaluationDetailResponse(
    val taskId: Long,
    val taskName: String,
    val inputPrompt: String,
    val expectedOutput: String?,
    val actualOutput: String?,
    val isSuccess: Boolean,
    val score: Double,
    val latencyMs: Long,
    val rationale: String?,
    val errorLog: String?
)

data class CreateBenchmarkTaskRequest(
    val name: String,
    val category: String,
    val inputPrompt: String,
    val expectedOutput: String?,
    val criteriaType: String, // EXACT_MATCH, CONTAINS, REGEX, SEMANTIC
    val difficulty: Int
)

data class BenchmarkTaskResponse(
    val id: Long,
    val name: String,
    val category: String,
    val inputPrompt: String,
    val expectedOutput: String?,
    val criteriaType: String,
    val difficulty: Int
)

