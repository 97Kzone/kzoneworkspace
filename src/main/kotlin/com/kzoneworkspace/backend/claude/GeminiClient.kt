package com.kzoneworkspace.backend.claude

import com.google.genai.Client
import com.google.genai.types.GenerateContentConfig
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Component

@Component
class GeminiClient(
    @Value("\${GEMINI_API_KEY}") private val apiKey: String
) {
    private val client: Client by lazy {
        Client.builder()
            .apiKey(apiKey)
            .build()
    }

    fun sendMessage(
        systemPrompt: String,
        userMessage: String,
        model: String = "gemini-2.0-flash"
    ): String {
        val response = client.models.generateContent(
            model,
            userMessage,
            GenerateContentConfig.builder()
                .systemInstruction(com.google.genai.types.Content.fromParts(
                    com.google.genai.types.Part.fromText(systemPrompt)
                ))
                .build()
        )
        return response.text() ?: "응답 없음"
    }
}