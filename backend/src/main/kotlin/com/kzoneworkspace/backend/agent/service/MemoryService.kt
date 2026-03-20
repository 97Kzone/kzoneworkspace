package com.kzoneworkspace.backend.agent.service

import com.kzoneworkspace.backend.agent.entity.Memory
import com.kzoneworkspace.backend.agent.repository.AgentRepository
import com.kzoneworkspace.backend.agent.repository.MemoryRepository
import com.kzoneworkspace.backend.agent.dto.MemoryResponse
import com.kzoneworkspace.backend.claude.GeminiClient
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class MemoryService(
    private val memoryRepository: MemoryRepository,
    private val agentRepository: AgentRepository,
    private val geminiClient: GeminiClient
) {
    private val logger = LoggerFactory.getLogger(MemoryService::class.java)

    @Transactional
    fun saveMemory(agentId: Long, roomId: String, content: String) {
        logger.info("Starting saveMemory operation for agentId: {}, roomId: {}", agentId, roomId)
        if (content.isBlank()) {
            logger.debug("Empty content received for agentId: {}, roomId: {}. Skipping save.", agentId, roomId)
            logger.info("Finished saveMemory operation for agentId: {}, roomId: {} (skipped due to empty content).", agentId, roomId)
            return
        }

        try {
            logger.info("Saving memory for agentId: {}, roomId: {}", agentId, roomId)
            val embedding = geminiClient.embedText(content)
            val embeddingStr = embedding.toString() // e.g., "[0.1, 0.2, ...]"

            val memory = Memory(
                content = content,
                embedding = embeddingStr,
                roomId = roomId,
                agentId = agentId
            )
            memoryRepository.save(memory)
            logger.debug("Memory saved successfully for agentId: {}", agentId)
        } catch (e: Exception) {
            logger.error("Failed to save memory for agentId: {}, roomId: {}. Error: {}", agentId, roomId, e.message)
            throw e
        }
    }

    fun getAllMemories(limit: Int = 50): List<MemoryResponse> {
        return try {
            memoryRepository.findAllNative()
                .sortedByDescending { it.createdAt }
                .take(limit)
                .map { convertToResponse(it) }
        } catch (e: Exception) {
            logger.error("Error in getAllMemories: ${e.message}", e)
            throw e
        }
    }

    fun searchMemories(agentId: Long?, query: String, limit: Int = 10): List<MemoryResponse> {
        if (query.isBlank()) return emptyList()
        
        val queryEmbedding = geminiClient.embedText(query)
        val queryEmbeddingStr = queryEmbedding.toString()
        
        val memories = if (agentId != null) {
            memoryRepository.findSimilarMemories(agentId, queryEmbeddingStr, limit)
        } else {
            // If no agentId specified, we might need a global search or just search across all
            // For now, let's assume we can search across all if we have a global query
            memoryRepository.findSimilarAcrossAll(queryEmbeddingStr, limit)
        }
        
        return memories.map { convertToResponse(it) }
    }

    private fun convertToResponse(memory: Memory): MemoryResponse {
        logger.debug("Converting memory ${memory.id} to response")
        val agentName = try {
            agentRepository.findById(memory.agentId).map { it.name }.orElse("Unknown Agent")
        } catch (e: Exception) {
            logger.warn("Could not find agent ${memory.agentId} for memory ${memory.id}: ${e.message}")
            "Unknown Agent"
        }
        
        return MemoryResponse(
            id = memory.id,
            content = memory.content,
            agentId = memory.agentId,
            agentName = agentName,
            roomId = memory.roomId,
            createdAt = memory.createdAt
        )
    }

    fun searchSimilarMemories(agentId: Long, query: String, limit: Int = 3): List<String> {
        // ... (keep existing simple search if needed by other services)
        if (query.isBlank()) return emptyList()
        return try {
            val queryEmbedding = geminiClient.embedText(query)
            val queryEmbeddingStr = queryEmbedding.toString()
            val memories = memoryRepository.findSimilarMemories(agentId, queryEmbeddingStr, limit)
            memories.map { it.content }
        } catch (e: Exception) {
            emptyList()
        }
    }
}
