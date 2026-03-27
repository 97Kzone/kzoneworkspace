package com.kzoneworkspace.backend.task.dto

data class WorkstreamRequest(
    val roomId: String,
    val goal: String,
    val plannerAgentId: Long? = null
)

data class SubTaskDefinition(
    val agentName: String,
    val command: String,
    val description: String
)

data class DecompositionResponse(
    val subTasks: List<SubTaskDefinition>
)
