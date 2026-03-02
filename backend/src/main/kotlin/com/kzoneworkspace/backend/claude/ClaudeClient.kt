package com.kzoneworkspace.backend.claude

import com.anthropic.client.AnthropicClient
import com.anthropic.client.okhttp.AnthropicOkHttpClient
import com.anthropic.models.messages.MessageCreateParams
import com.anthropic.models.messages.Model
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Component

@Component
class ClaudeClient(
    @Value("\${ANTHROPIC_API_KEY}") private val apiKey: String
) {
    private val client: AnthropicClient by lazy {
        AnthropicOkHttpClient.builder()
            .apiKey(apiKey)
            .build()
    }

    fun sendMessage(
        systemPrompt: String,
        userMessage: String,
        model: String = "claude-3-5-sonnet-20241022"
    ): String {
        val params = MessageCreateParams.builder()
            .model(Model.of(model))
            .maxTokens(4096)
            .system(systemPrompt)
            .addUserMessage(userMessage)
            .build()

        val response = client.messages().create(params)
        return response.content().first().asText().text()
    }
}