package com.kzoneworkspace.backend.agent.dto

import java.time.LocalDateTime

data class AgentStandup(
    val agentId: Long,
    val agentName: String,
    val agentRole: String,
    val pastAction: String,
    val todayFocus: String,
    val blocker: String?,
    val timestamp: LocalDateTime = LocalDateTime.now()
)
