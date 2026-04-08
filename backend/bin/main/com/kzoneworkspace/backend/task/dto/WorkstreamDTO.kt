package com.kzoneworkspace.backend.task.dto

data class WorkstreamRequest(
    val roomId: String,
    val goal: String,
    val plannerAgentId: Long? = null
)

data class SubTaskDefinition(
    val id: String,
    val agentName: String,
    val command: String,
    val description: String,
    val dependsOn: List<String> = emptyList()
)

data class DecompositionResponse(
    val subTasks: List<SubTaskDefinition>
)
