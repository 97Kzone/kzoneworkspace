package com.kzoneworkspace.backend.agent.service

import com.kzoneworkspace.backend.agent.entity.CodebaseChunk
import com.kzoneworkspace.backend.agent.repository.CodebaseChunkRepository
import com.kzoneworkspace.backend.claude.GeminiClient
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.io.File

@Service
class CodebaseIndexingService(
    private val codebaseChunkRepository: CodebaseChunkRepository,
    private val geminiClient: GeminiClient
) {
    private val logger = LoggerFactory.getLogger(CodebaseIndexingService::class.java)

    private val ignoredDirs = setOf(".git", ".gradle", ".idea", "build", "node_modules", "target", "out")
    private val targetExtensions = setOf("kt", "ts", "tsx", "js", "jsx", "py", "java", "gradle", "yml", "yaml", "md", "sql")

    @Transactional
    fun indexProject() {
        val root = findProjectRoot()
        logger.info("Starting project indexing from root: ${root.absolutePath}")
        
        // Clear existing codebase chunks to avoid duplicates on full re-index
        // Alternatively, we could do incremental indexing, but for now full clear is safer.
        codebaseChunkRepository.deleteAll()

        root.walkTopDown()
            .filter { shouldIndex(it) }
            .forEach { file ->
                try {
                    indexFile(file, root)
                } catch (e: Exception) {
                    logger.error("Failed to index file: ${file.path}. Error: ${e.message}")
                }
            }
        
        logger.info("Project indexing completed.")
    }

    private fun findProjectRoot(): File {
        var current = File(".").absoluteFile
        while (current.parentFile != null) {
            if (File(current, "backend").exists() && File(current, "frontend").exists()) {
                return current
            }
            if (File(current, "src/main/kotlin").exists()) { // Inside backend
                return current.parentFile ?: current
            }
            current = current.parentFile
        }
        return File(".")
    }

    private fun shouldIndex(file: File): Boolean {
        if (!file.isFile) return false
        if (file.name.startsWith(".")) return false
        
        val relativePath = file.path
        if (ignoredDirs.any { relativePath.contains("${File.separator}$it${File.separator}") || relativePath.startsWith("$it${File.separator}") }) {
            return false
        }
        
        return targetExtensions.contains(file.extension.lowercase())
    }

    private fun indexFile(file: File, root: File) {
        val relativePath = file.relativeTo(root).path
        logger.info("Indexing file: $relativePath")
        
        val content = file.readText()
        if (content.isBlank()) return

        val lines = content.lines()
        val chunkSize = 50
        val overlap = 10
        
        var start = 0
        while (start < lines.size) {
            val end = (start + chunkSize).coerceAtMost(lines.size)
            val chunkLines = lines.subList(start, end)
            val chunkContent = chunkLines.joinToString("\n")
            
            if (chunkContent.isNotBlank()) {
                val embedding = geminiClient.embedText(chunkContent)
                val chunk = CodebaseChunk(
                    content = chunkContent,
                    embedding = embedding.toString(),
                    filePath = relativePath,
                    startLine = start + 1,
                    endLine = end,
                    language = file.extension.lowercase()
                )
                codebaseChunkRepository.save(chunk)
            }
            
            if (end == lines.size) break
            start += (chunkSize - overlap)
        }
    }

    fun search(query: String, limit: Int = 10): List<CodebaseChunk> {
        if (query.isBlank()) return emptyList()
        val embedding = geminiClient.embedText(query)
        return codebaseChunkRepository.findSimilarChunks(embedding.toString(), limit)
    }
}
