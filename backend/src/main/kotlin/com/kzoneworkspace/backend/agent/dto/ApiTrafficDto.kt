package com.kzoneworkspace.backend.agent.dto

import com.kzoneworkspace.backend.agent.entity.AiProvider
import java.time.LocalDateTime

data class ApiTrafficStatsResponse(
    val totalCost: Double,
    val totalTokens: Long,
    val usageByProvider: Map<AiProvider, Long>,
    val usageByModel: Map<String, Long>,
    val recentLogs: List<ApiTrafficSummary>
)

data class ApiTrafficSummary(
    val id: Long,
    val agentName: String,
    val provider: AiProvider,
    val model: String,
    val totalTokens: Long,
    val estimatedCost: Double,
    val timestamp: LocalDateTime
)
