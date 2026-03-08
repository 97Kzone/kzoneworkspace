package com.kzoneworkspace.backend.agent.service

import com.kzoneworkspace.backend.agent.entity.Memory
import com.kzoneworkspace.backend.agent.repository.MemoryRepository
import com.kzoneworkspace.backend.claude.GeminiClient
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class MemoryService(
    private val memoryRepository: MemoryRepository,
    private val geminiClient: GeminiClient
) {

    @Transactional
    fun saveMemory(agentId: Long, roomId: String, content: String) {
        if (content.isBlank()) return

        val embedding = geminiClient.embedText(content)
        val embeddingStr = embedding.toString() // e.g., "[0.1, 0.2, ...]"

        val memory = Memory(
            content = content,
            embedding = embeddingStr,
            roomId = roomId,
            agentId = agentId
        )
        memoryRepository.save(memory)
    }

    fun searchSimilarMemories(agentId: Long, query: String, limit: Int = 3): List<String> {
        if (query.isBlank()) return emptyList()

        val queryEmbedding = geminiClient.embedText(query)
        val queryEmbeddingStr = queryEmbedding.toString()

        val memories = memoryRepository.findSimilarMemories(agentId, queryEmbeddingStr, limit)
        return memories.map { it.content }
    }
}
