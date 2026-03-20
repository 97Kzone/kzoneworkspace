package com.kzoneworkspace.backend.agent.dto

import java.time.LocalDateTime

data class MemoryResponse(
    val id: Long,
    val content: String,
    val agentId: Long,
    val agentName: String?,
    val roomId: String,
    val createdAt: LocalDateTime
)
