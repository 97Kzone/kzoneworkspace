package com.kzoneworkspace.backend.claude

import com.fasterxml.jackson.databind.DeserializationFeature
import com.fasterxml.jackson.databind.JsonNode
import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Component
import java.net.URI
import java.net.http.HttpClient
import java.net.http.HttpRequest
import java.net.http.HttpResponse
import java.time.Duration

@Component
class ClaudeClient(
    @Value("\${ANTHROPIC_API_KEY}") private val apiKey: String
) {
    private val client = HttpClient.newBuilder()
        .connectTimeout(Duration.ofSeconds(10))
        .build()
        
    private val objectMapper = jacksonObjectMapper().apply {
        configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false)
    }

    /**
     * 단순 텍스트 전송 (기존 하위 호환)
     */
    fun sendMessage(
        systemPrompt: String,
        userMessage: String,
        model: String = "claude-3-5-sonnet-20241022"
    ): String {
        val messages = listOf(mapOf("role" to "user", "content" to userMessage))
        val responseNode = sendMessageREST(systemPrompt, messages, model)
        val contentArray = responseNode["content"]
        var resultText = ""
        for (node in contentArray) {
            if (node["type"].asText() == "text") {
                resultText += node["text"].asText()
            }
        }
        return resultText
    }

    /**
     * REST API 방식을 직접 사용하여 구조화된 객체와 도구(Tools) 전달
     */
    fun sendMessageREST(
        systemPrompt: String,
        messages: List<Map<String, Any>>,
        model: String = "claude-3-5-sonnet-20241022",
        tools: List<Map<String, Any>>? = null
    ): JsonNode {
        val bodyMap = mutableMapOf<String, Any>(
            "model" to model,
            "max_tokens" to 4096,
            "system" to systemPrompt,
            "messages" to messages
        )
        if (tools != null && tools.isNotEmpty()) {
            bodyMap["tools"] = tools
        }

        val requestBody = objectMapper.writeValueAsString(bodyMap)

        val request = HttpRequest.newBuilder()
            .uri(URI.create("https://api.anthropic.com/v1/messages"))
            .header("x-api-key", apiKey)
            .header("anthropic-version", "2023-06-01")
            .header("content-type", "application/json")
            .POST(HttpRequest.BodyPublishers.ofString(requestBody, Charsets.UTF_8))
            .build()

        val response = client.send(request, HttpResponse.BodyHandlers.ofString(Charsets.UTF_8))
        
        if (response.statusCode() != 200) {
            throw RuntimeException("Anthropic API 오류 (${response.statusCode()}): ${response.body()}")
        }

        return objectMapper.readTree(response.body())
    }
}