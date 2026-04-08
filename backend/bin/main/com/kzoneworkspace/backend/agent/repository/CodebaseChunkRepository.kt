package com.kzoneworkspace.backend.agent.repository

import com.kzoneworkspace.backend.agent.entity.CodebaseChunk
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository

@Repository
interface CodebaseChunkRepository : JpaRepository<CodebaseChunk, Long> {

    @Query(value = """
        SELECT id, content, embedding::text as embedding, file_path, start_line, end_line, language, created_at 
        FROM codebase_chunks c 
        ORDER BY c.embedding::vector <=> cast(:queryEmbedding as vector) 
        LIMIT :limit
    """, nativeQuery = true)
    fun findSimilarChunks(
        @Param("queryEmbedding") queryEmbedding: String,
        @Param("limit") limit: Int
    ): List<CodebaseChunk>

    fun deleteByFilePath(filePath: String)
}
