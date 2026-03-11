package com.kzoneworkspace.backend.agent.service

import com.kzoneworkspace.backend.claude.GeminiClient
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service

@Service
class MemoryExtractionService(
    private val geminiClient: GeminiClient,
    private val memoryService: MemoryService
) {
    private val log = LoggerFactory.getLogger(MemoryExtractionService::class.java)

    private val extractionPrompt = """
        당신은 기억 추출 전문가입니다. 사용자와 AI 에이전트 간의 대화 내용을 분석하여, 나중에 기억해야 할 '중요한 사실'이나 '사용자의 선호도'를 추출하세요.
        
        규칙:
        1. 새로운 정보가 없다면 아무것도 출력하지 마세요.
        2. 추출된 정보는 짧고 명확한 문장으로 작성하세요. (예: "사용자는 남색을 좋아함", "사용자의 직업은 소프트웨어 엔지니어임")
        3. 문답 형식이 아닌 단정적인 문장으로 작성하세요.
        
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
            
            if (extractedText.isNotBlank()) {
                val facts = extractedText.lines()
                    .filter { it.isNotBlank() }
                    .map { it.trim().removePrefix("-").trim() }
                
                facts.forEach { fact ->
                    log.info("Extracted fact: {}", fact)
                    memoryService.saveMemory(agentId, roomId, fact)
                }
            }
        } catch (e: Exception) {
            log.error("Failed to extract memory: {}", e.message)
        }
    }
}
