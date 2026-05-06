package com.kzoneworkspace.backend.agent.service

import com.kzoneworkspace.backend.agent.dto.ApiTrafficStatsResponse
import com.kzoneworkspace.backend.agent.dto.ApiTrafficSummary
import com.kzoneworkspace.backend.agent.entity.AiProvider
import com.kzoneworkspace.backend.agent.entity.ApiTrafficLog
import com.kzoneworkspace.backend.agent.repository.ApiTrafficRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class ApiTrafficService(
    private val apiTrafficRepository: ApiTrafficRepository
) {

    @Transactional
    fun logTraffic(
        agentId: Long,
        agentName: String,
        provider: AiProvider,
        model: String,
        inputTokens: Long,
        outputTokens: Long
    ) {
        val estimatedCost = calculateCost(provider, model, inputTokens, outputTokens)
        val log = ApiTrafficLog(
            agentId = agentId,
            agentName = agentName,
            provider = provider,
            model = model,
            inputTokens = inputTokens,
            outputTokens = outputTokens,
            estimatedCost = estimatedCost
        )
        apiTrafficRepository.save(log)
    }

    fun getStats(): ApiTrafficStatsResponse {
        val allLogs = apiTrafficRepository.findAll()
        val totalCost = apiTrafficRepository.getTotalEstimatedCost() ?: 0.0
        val totalTokens = apiTrafficRepository.getTotalTokens() ?: 0L

        val usageByProvider = allLogs.groupBy { it.provider }
            .mapValues { (_, logs) -> logs.sumOf { it.inputTokens + it.outputTokens } }

        val usageByModel = allLogs.groupBy { it.model }
            .mapValues { (_, logs) -> logs.sumOf { it.inputTokens + it.outputTokens } }

        val recentLogs = apiTrafficRepository.findTop10ByOrderByTimestampDesc().map {
            ApiTrafficSummary(
                id = it.id,
                agentName = it.agentName,
                provider = it.provider,
                model = it.model,
                totalTokens = it.inputTokens + it.outputTokens,
                estimatedCost = it.estimatedCost,
                timestamp = it.timestamp
            )
        }

        return ApiTrafficStatsResponse(
            totalCost = totalCost,
            totalTokens = totalTokens,
            usageByProvider = usageByProvider,
            usageByModel = usageByModel,
            recentLogs = recentLogs
        )
    }

    private fun calculateCost(provider: AiProvider, model: String, input: Long, output: Long): Double {
        // 단위: 100만 토큰당 달러 (추정치)
        val (inputRate, outputRate) = when {
            model.contains("claude-3-5-sonnet") -> 3.0 to 15.0
            model.contains("claude-3-opus") -> 15.0 to 75.0
            model.contains("gpt-4o") -> 5.0 to 15.0
            model.contains("gemini-1.5-pro") -> 3.5 to 10.5
            model.contains("gemini-1.5-flash") -> 0.075 to 0.3
            else -> 1.0 to 2.0
        }
        return (input.toDouble() / 1_000_000.0 * inputRate) + (output.toDouble() / 1_000_000.0 * outputRate)
    }
}
