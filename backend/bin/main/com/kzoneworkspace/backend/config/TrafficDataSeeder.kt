package com.kzoneworkspace.backend.config

import com.kzoneworkspace.backend.agent.entity.AiProvider
import com.kzoneworkspace.backend.agent.entity.ApiTrafficLog
import com.kzoneworkspace.backend.agent.repository.ApiTrafficRepository
import com.kzoneworkspace.backend.agent.repository.AgentRepository
import org.springframework.boot.context.event.ApplicationReadyEvent
import org.springframework.context.event.EventListener
import org.springframework.stereotype.Component
import java.time.LocalDateTime
import kotlin.random.Random

@Component
class TrafficDataSeeder(
    private val apiTrafficRepository: ApiTrafficRepository,
    private val agentRepository: AgentRepository
) {

    @EventListener(ApplicationReadyEvent::class)
    fun seedData() {
        if (apiTrafficRepository.count() > 0) return

        val agents = agentRepository.findAll()
        if (agents.isEmpty()) return

        val providers = listOf(AiProvider.ANTHROPIC, AiProvider.GOOGLE, AiProvider.OPENAI)
        val models = mapOf(
            AiProvider.ANTHROPIC to listOf("claude-3-5-sonnet-20241022", "claude-3-opus-20240229"),
            AiProvider.GOOGLE to listOf("gemini-1.5-pro", "gemini-1.5-flash"),
            AiProvider.OPENAI to listOf("gpt-4o", "gpt-4o-mini")
        )

        val now = LocalDateTime.now()
        val logs = mutableListOf<ApiTrafficLog>()

        repeat(50) { i ->
            val agent = agents.random()
            val provider = providers.random()
            val model = models[provider]?.random() ?: "unknown"
            val input = Random.nextLong(100, 5000)
            val output = Random.nextLong(50, 2000)
            
            // 비용 계산 (Service와 동일 로직)
            val cost = calculateMockCost(provider, model, input, output)
            
            logs.add(ApiTrafficLog(
                agentId = agent.id,
                agentName = agent.name,
                provider = provider,
                model = model,
                inputTokens = input,
                outputTokens = output,
                estimatedCost = cost,
                timestamp = now.minusHours(Random.nextLong(1, 168)) // 최근 1주일
            ))
        }

        apiTrafficRepository.saveAll(logs)
        println("✅ Seeded 50 API traffic logs for demo.")
    }

    private fun calculateMockCost(provider: AiProvider, model: String, input: Long, output: Long): Double {
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
