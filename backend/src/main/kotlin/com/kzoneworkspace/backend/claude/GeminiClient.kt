package com.kzoneworkspace.backend.claude

import com.google.genai.Client
import com.google.genai.types.GenerateContentConfig
import com.google.genai.types.Content
import com.google.genai.types.Part
import com.google.genai.types.FunctionCall
import com.google.genai.types.FunctionResponse
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
        messages: List<Map<String, Any>>,
        model: String = "gemini-2.0-flash",
        tools: List<Map<String, Any>>? = null
    ): com.google.genai.types.GenerateContentResponse {
        val configBuilder = GenerateContentConfig.builder()
            .systemInstruction(com.google.genai.types.Content.fromParts(
                com.google.genai.types.Part.fromText(systemPrompt)
            ))

        if (tools != null && tools.isNotEmpty()) {
            val googleTools = tools.map { tool ->
                // ... (rest of tool mapping)
                val name = tool["name"] as String
                val description = tool["description"] as String
                val inputSchema = tool["input_schema"] as Map<String, Any>
                
                val properties = inputSchema["properties"] as Map<String, Any>
                val required = inputSchema["required"] as List<String>
                
                val schemaBuilder = com.google.genai.types.Schema.builder()
                    .type("OBJECT")
                
                val propSchemas = properties.mapValues { (_, value) ->
                    val vMap = value as Map<String, Any>
                    com.google.genai.types.Schema.builder()
                        .type(vMap["type"] as String)
                        .description(vMap["description"] as String)
                        .build()
                }
                
                schemaBuilder.properties(propSchemas)
                schemaBuilder.required(required)

                com.google.genai.types.Tool.builder()
                    .functionDeclarations(listOf(
                        com.google.genai.types.FunctionDeclaration.builder()
                            .name(name)
                            .description(description)
                            .parameters(schemaBuilder.build())
                            .build()
                    ))
                    .build()
            }
            configBuilder.tools(googleTools)
        } else {
            // Only enable Google Search grounding if NO custom tools are provided
            // Gemini does not support combining built-in tools and custom functions in the same request.
            val searchTool = com.google.genai.types.Tool.builder()
                .googleSearch(com.google.genai.types.GoogleSearch.builder().build())
                .build()
            configBuilder.tools(listOf(searchTool))
        }

        val contents = messages.map { msg ->
            val role = if (msg["role"] == "assistant") "model" else "user"
            val parts = mutableListOf<Part>()
            val body = msg["content"]
            
            if (body is String) {
                parts.add(Part.fromText(body))
            } else if (body is List<*>) {
                body.forEach { block ->
                    val blockMap = block as? Map<String, Any>
                    val type = blockMap?.get("type") as? String
                    when (type) {
                        "text" -> parts.add(Part.fromText(blockMap["text"] as String))
                        "tool_use" -> {
                            val fc = FunctionCall.builder()
                                .name(blockMap["name"] as String)
                                .args(blockMap["input"] as Map<String, Any>)
                                .build()
                            parts.add(Part.builder().functionCall(fc).build())
                        }
                        "tool_result" -> {
                            val fr = FunctionResponse.builder()
                                .name(blockMap["name"] as? String ?: "")
                                .response(mapOf("result" to (blockMap["content"] ?: "")))
                                .build()
                            parts.add(Part.builder().functionResponse(fr).build())
                        }
                    }
                }
            }
            
            Content.builder()
                .role(role)
                .parts(parts)
                .build()
        }

        return client.models.generateContent(
            model,
            contents,
            configBuilder.build()
        )
    }
}