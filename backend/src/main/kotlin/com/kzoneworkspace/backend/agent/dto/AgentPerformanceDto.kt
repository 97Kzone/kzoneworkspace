package com.kzoneworkspace.backend.agent.dto

import java.time.LocalDate

data class TeamPerformanceDto(
    val dailyStats: List<DailyStat>,
    val agentPerformance: List<AgentPerformanceStat>,
    val totalTasksCompleted: Int,
    val averageSuccessRate: Double
)

data class DailyStat(
    val date: LocalDate,
    val taskCount: Int,
    val activityCount: Int
)

data class AgentPerformanceStat(
    val agentName: String,
    val completedTasks: Int,
    val efficiency: Double // 0.0 ~ 1.0 (based on execution time or success)
)
