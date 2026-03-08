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

        val googleTools = mutableListOf<com.google.genai.types.Tool>()
        
        // Add custom tools if provided
        if (tools != null && tools.isNotEmpty()) {
            googleTools.addAll(tools.map { tool ->
                val name = tool["name"] as String
                val description = tool["description"] as String
                
                @Suppress("UNCHECKED_CAST")
                val inputSchema = tool["input_schema"] as? Map<*, *> ?: emptyMap<String, Any>()
                
                val properties = inputSchema["properties"] as? Map<*, *>
                val required = inputSchema["required"] as? List<*>
                
                val schemaBuilder = com.google.genai.types.Schema.builder()
                    .type("OBJECT")
                
                val propSchemas = properties?.map { (k, v) ->
                    val key = k as? String ?: ""
                    val vMap = v as? Map<*, *>
                    key to com.google.genai.types.Schema.builder()
                        .type(vMap?.get("type") as? String ?: "string")
                        .description(vMap?.get("description") as? String ?: "")
                        .build()
                }?.toMap() ?: emptyMap()
                
                schemaBuilder.properties(propSchemas)
                schemaBuilder.required(required?.filterIsInstance<String>() ?: emptyList())

                com.google.genai.types.Tool.builder()
                    .functionDeclarations(listOf(
                        com.google.genai.types.FunctionDeclaration.builder()
                            .name(name)
                            .description(description)
                            .parameters(schemaBuilder.build())
                            .build()
                    ))
                    .build()
            })
            configBuilder.tools(googleTools)
        } else {
            // Only add Google Search grounding if NO custom tools are provided
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
                    @Suppress("UNCHECKED_CAST")
                    val blockMap = block as? Map<String, Any>
                    val type = blockMap?.get("type") as? String
                    when (type) {
                        "text" -> parts.add(Part.fromText(blockMap["text"] as String))
                        "tool_use" -> {
                            @Suppress("UNCHECKED_CAST")
                            val argsMap = blockMap["input"] as? Map<String, Any?> ?: emptyMap()
                            val fc = FunctionCall.builder()
                                .name(blockMap["name"] as? String ?: "")
                                .args(argsMap)
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

    fun embedText(text: String, model: String = "gemini-embedding-001"): List<Float> {
        val response = client.models.embedContent(
            model,
            text,
            null
        )
        val embeddings = response.embeddings().orElse(emptyList())
        if (embeddings.isEmpty()) return emptyList()
        return embeddings[0].values().orElse(emptyList())
    }
}