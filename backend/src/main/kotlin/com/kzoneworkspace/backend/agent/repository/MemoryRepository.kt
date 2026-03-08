package com.kzoneworkspace.backend.agent.repository

import com.kzoneworkspace.backend.agent.entity.Memory
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository

@Repository
interface MemoryRepository : JpaRepository<Memory, Long> {

    @Query(value = """
        SELECT * FROM memories m 
        WHERE m.agent_id = :agentId 
        ORDER BY m.embedding::vector <=> cast(:queryEmbedding as vector) 
        LIMIT :limit
    """, nativeQuery = true)
    fun findSimilarMemories(
        @Param("agentId") agentId: Long,
        @Param("queryEmbedding") queryEmbedding: String,
        @Param("limit") limit: Int
    ): List<Memory>
}
