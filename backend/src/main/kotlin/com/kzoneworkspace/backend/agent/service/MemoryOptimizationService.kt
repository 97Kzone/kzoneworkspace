package com.kzoneworkspace.backend.agent.service

import com.google.gson.Gson
import com.google.common.reflect.TypeToken
import com.kzoneworkspace.backend.agent.entity.Memory
import com.kzoneworkspace.backend.agent.repository.MemoryRepository
import com.kzoneworkspace.backend.claude.GeminiClient
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

data class CompactionResult(
    val optimizedCount: Int,
    val deletedCount: Int,
    val message: String
)

@Service
class MemoryOptimizationService(
    private val memoryRepository: MemoryRepository,
    private val memoryService: MemoryService,
    private val geminiClient: GeminiClient
) {
    private val log = LoggerFactory.getLogger(MemoryOptimizationService::class.java)
    private val gson = Gson()

    @Transactional
    fun compactMemories(): CompactionResult {
        log.info("Starting Memory Compaction...")
        
        // 1. Get all memories
        val allMemories = memoryRepository.findAll()
        if (allMemories.size < 5) {
            log.info("Not enough memories to compact.")
            return CompactionResult(0, 0, "메모리 개수가 부족하여 압축을 생략합니다. (최소 5개 이상 필요)")
        }

        // 2. Prepare data for Gemini to analyze
        // Group them by agent to avoid mixing up personal contexts if possible, or just global compaction
        val memoryData = allMemories.joinToString("\n") { 
            "ID: ${it.id} | AgentID: ${it.agentId} | Importance: ${it.importance} | Content: ${it.content}" 
        }

        val systemPrompt = """
            당신은 AI 에이전트 군집의 지식 압축기(Memory Compactor)입니다.
            현재 시스템에 저장된 다수의 단편적인 기억(Memory)들을 분석하여, 중복되거나 유사한 주제의 기억들을 하나로 병합(핵심 지식화)하고,
            병합에 사용되어 삭제해도 되는 기존 기억들의 ID 목록을 반환해야 합니다.
            
            분석 규칙:
            1. 서로 연관성 높거나 중복된 기억들을 묶어 단일 '핵심 인사이트' 문장으로 작성합니다.
            2. 병합된 기억들은 삭제 대상 ID 목록에 추가합니다.
            3. 중요도가 낮고(Importance < 5) 파편화된 쓸모없는 기억도 삭제 대상 ID에 포함할 수 있습니다.
            4. AgentID가 동일한 경우에만 병합을 수행하는 것을 권장하지만, 전역적인 프로젝트 컨텍스트라면 통합해도 무방합니다.
            
            응답은 반드시 JSON 형식이어야 합니다:
            {
              "compactedMemories": [
                {
                  "agentId": 1, // 가장 관련있는 에이전트 ID
                  "content": "병합된 핵심 지식 내용 (명확하고 풍부하게)",
                  "tags": "태그1, 태그2"
                }
              ],
              "deleteIds": [1, 2, 3, 5]
            }
        """.trimIndent()

        val userPrompt = """
            다음은 현재 저장된 기억 데이터입니다:
            
            $memoryData
            
            위 데이터를 분석하여 병합된 기억과 삭제할 기억 ID 목록을 JSON 형식으로 반환하세요.
        """.trimIndent()

        try {
            val response = geminiClient.sendMessage(
                systemPrompt = systemPrompt,
                messages = listOf(mapOf("role" to "user", "content" to userPrompt))
            )

            val candidate = response.candidates().orElse(emptyList()).firstOrNull()
            var jsonText = candidate?.content()?.orElse(null)?.parts()?.orElse(emptyList())?.firstOrNull()?.text()?.orElse("") ?: ""
            
            if (jsonText.contains("```json")) {
                jsonText = jsonText.substringAfter("```json").substringBefore("```").trim()
            } else if (jsonText.contains("```")) {
                jsonText = jsonText.substringAfter("```").substringBefore("```").trim()
            }

            val resultType = object : TypeToken<Map<String, Any>>() {}.type
            val resultData: Map<String, Any> = gson.fromJson(jsonText, resultType)

            val compactedMemories = (resultData["compactedMemories"] as? List<Map<String, Any>>) ?: emptyList()
            val deleteIds = (resultData["deleteIds"] as? List<Double>)?.map { it.toLong() } ?: emptyList()

            // 3. Save new compacted memories
            var newlySaved = 0
            for (cm in compactedMemories) {
                val agentId = (cm["agentId"] as? Double)?.toLong() ?: allMemories.first().agentId
                val content = cm["content"] as? String ?: continue
                val tags = cm["tags"] as? String ?: "CORE"
                
                // 중요도를 9 (매우 높음)로 설정하여 핵심 지식임을 표시
                memoryService.saveMemory(
                    agentId = agentId,
                    roomId = "default",
                    content = "[압축된 지식] $content",
                    importance = 9,
                    tags = tags
                )
                newlySaved++
            }

            // 4. Delete old memories
            var actuallyDeleted = 0
            if (deleteIds.isNotEmpty()) {
                val validDeleteIds = deleteIds.filter { memoryRepository.existsById(it) }
                memoryRepository.deleteAllById(validDeleteIds)
                actuallyDeleted = validDeleteIds.size
            }

            val msg = "총 ${actuallyDeleted}개의 파편화된 기억이 삭제되고, ${newlySaved}개의 핵심 지식으로 압축되었습니다."
            log.info(msg)
            return CompactionResult(newlySaved, actuallyDeleted, msg)

        } catch (e: Exception) {
            log.error("Memory compaction failed", e)
            return CompactionResult(0, 0, "압축 과정 중 오류가 발생했습니다: ${e.message}")
        }
    }
}
