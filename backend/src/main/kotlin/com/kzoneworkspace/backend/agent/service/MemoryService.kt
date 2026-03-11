package com.kzoneworkspace.backend.agent.service

import com.kzoneworkspace.backend.agent.entity.Memory
import com.kzoneworkspace.backend.agent.repository.MemoryRepository
import com.kzoneworkspace.backend.claude.GeminiClient
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class MemoryService(
    private val memoryRepository: MemoryRepository,
    private val geminiClient: GeminiClient
) {
    private val log = LoggerFactory.getLogger(MemoryService::class.java)

    @Transactional
    fun saveMemory(agentId: Long, roomId: String, content: String) {
        if (content.isBlank()) {
            log.debug("Empty content received for agentId: {}, roomId: {}. Skipping save.", agentId, roomId)
            return
        }

        try {
            log.info("Saving memory for agentId: {}, roomId: {}", agentId, roomId)
            val embedding = geminiClient.embedText(content)
            val embeddingStr = embedding.toString() // e.g., "[0.1, 0.2, ...]"

            val memory = Memory(
                content = content,
                embedding = embeddingStr,
                roomId = roomId,
                agentId = agentId
            )
            memoryRepository.save(memory)
            log.debug("Memory saved successfully for agentId: {}", agentId)
        } catch (e: Exception) {
            log.error("Failed to save memory for agentId: {}, roomId: {}. Error: {}", agentId, roomId, e.message)
            throw e
        }
    }

    fun searchSimilarMemories(agentId: Long, query: String, limit: Int = 3): List<String> {
        if (query.isBlank()) {
            log.debug("Empty query received for agentId: {}. Returning empty list.", agentId)
            return emptyList()
        }

        return try {
            log.info("Searching similar memories for agentId: {}, query: {}", agentId, query)
            val queryEmbedding = geminiClient.embedText(query)
            val queryEmbeddingStr = queryEmbedding.toString()

            val memories = memoryRepository.findSimilarMemories(agentId, queryEmbeddingStr, limit)
            log.debug("Found {} similar memories for agentId: {}", memories.size, agentId)
            memories.map { it.content }
        } catch (e: Exception) {
            log.error("Error searching similar memories for agentId: {}. Error: {}", agentId, e.message)
            emptyList()
        }
    }
}
