package com.kzoneworkspace.backend.agent.service

import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import com.kzoneworkspace.backend.claude.GeminiClient
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service

@Service
class MemoryExtractionService(
    private val geminiClient: GeminiClient,
    private val memoryService: MemoryService
) {
    private val log = LoggerFactory.getLogger(MemoryExtractionService::class.java)
    private val gson = Gson()

    private val extractionPrompt = """
        당신은 기억 추출 전문가입니다. 사용자와 AI 에이전트 간의 대화 내용을 분석하여, 나중에 기억해야 할 '중요한 사실'이나 '사용자의 선호도'를 추출하세요.
        
        각 기억 항목에 대해 다음 정보를 JSON 형식으로 제공하세요:
        - content: 추출된 기억 내용 (짧고 명확한 단정적 문장)
        - importance: 이 정보의 중요도 (1~10 점수. 10이 가장 중요)
        - tags: 관련 태그 (쉼표로 구분된 문자열, 예: "선호도, 색상")
        
        규칙:
        1. 새로운 정보가 없다면 빈 리스트 `[]`를 반환하세요.
        2. 응답은 오직 JSON 리스트 형식이어야 합니다.
        
        대화 내용:
        {{CONTENT}}
    """.trimIndent()

    fun extractAndSaveMemory(agentId: Long, roomId: String, content: String) {
        try {
            log.info("Extracting memories for agentId: {}, roomId: {}", agentId, roomId)
            
            val prompt = extractionPrompt.replace("{{CONTENT}}", content)
            
            // GenerateContentResponse를 직접 다루는 대신, GeminiClient에 텍스트 생성 전용 메서드가 필요할 수 있음
            // 현재 GeminiClient의 sendMessage를 재활용하거나 새로 정의해야 함.
            // 여기서는 단순화를 위해 sendMessage의 응답 구조를 가정하거나 Client를 직접 사용.
            
            val response = geminiClient.sendMessage(
                systemPrompt = prompt,
                messages = listOf(mapOf("role" to "user", "content" to "위 대화에서 기억할 내용을 추출해줘."))
            )
            
            val candidate = response.candidates().orElse(emptyList()).firstOrNull()
            val contentObj = candidate?.content()?.orElse(null)
            val part = contentObj?.parts()?.orElse(emptyList())?.firstOrNull()
            val extractedText = part?.text()?.orElse("") ?: ""
            
            var cleanJson = extractedText.trim()
            if (cleanJson.contains("```json")) {
                cleanJson = cleanJson.substringAfter("```json").substringBefore("```").trim()
            } else if (cleanJson.contains("```")) {
                cleanJson = cleanJson.substringAfter("```").substringBefore("```").trim()
            }

            if (cleanJson.isNotBlank() && cleanJson != "[]") {
                val listType = object : TypeToken<List<Map<String, Any>>>() {}.type
                val facts: List<Map<String, Any>> = gson.fromJson(cleanJson, listType)
                
                facts.forEach { factMap ->
                    val factContent = factMap["content"] as? String ?: ""
                    val importance = (factMap["importance"] as? Double)?.toInt() ?: 3
                    val tags = factMap["tags"] as? String
                    
                    if (factContent.isNotBlank()) {
                        log.info("Extracted fact: {} (Importance: {}, Tags: {})", factContent, importance, tags)
                        memoryService.saveMemory(agentId, roomId, factContent, importance, tags)
                    }
                }
            }
        } catch (e: Exception) {
            log.error("Failed to extract memory: {}", e.message)
        }
    }
}
