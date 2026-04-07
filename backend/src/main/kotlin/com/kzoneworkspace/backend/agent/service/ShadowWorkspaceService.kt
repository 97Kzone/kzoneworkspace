package com.kzoneworkspace.backend.agent.service

import com.kzoneworkspace.backend.agent.entity.ShadowSession
import com.kzoneworkspace.backend.agent.entity.ShadowStatus
import com.kzoneworkspace.backend.agent.repository.ShadowSessionRepository
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.io.File
import java.nio.file.Files
import java.nio.file.Paths
import java.nio.file.StandardCopyOption
import java.time.LocalDateTime
import java.util.*

@Service
class ShadowWorkspaceService(
    private val shadowSessionRepository: ShadowSessionRepository
) {
    private val logger = LoggerFactory.getLogger(ShadowWorkspaceService::class.java)
    private val baseShadowDir = "temp/shadows"

    init {
        val dir = File(baseShadowDir)
        if (!dir.exists()) {
            dir.mkdirs()
        }
    }

    @Transactional
    fun createShadowSession(taskId: Long, roomId: String): ShadowSession {
        val sessionId = UUID.randomUUID().toString().substring(0, 8)
        val shadowPath = "$baseShadowDir/session-$sessionId"
        
        // Create the directory
        File(shadowPath).mkdirs()
        
        val session = ShadowSession(
            taskId = taskId,
            roomId = roomId,
            shadowPath = shadowPath,
            status = ShadowStatus.PENDING
        )
        return shadowSessionRepository.save(session)
    }

    fun findActiveSessionByRoomId(roomId: String): ShadowSession? {
        return shadowSessionRepository.findFirstByRoomIdAndStatusOrderByCreatedAtDesc(roomId, ShadowStatus.PENDING)
    }

    fun getShadowPath(sessionId: Long): String {
        val session = shadowSessionRepository.findById(sessionId).orElseThrow()
        return session.shadowPath
    }

    /**
     * Copies necessary files to the shadow workspace.
     * In a real scenario, this would be selective, but for MVP we copy small files.
     */
    fun syncToShadow(sessionId: Long, filePaths: List<String>) {
        val session = shadowSessionRepository.findById(sessionId).orElseThrow()
        val shadowRoot = File(session.shadowPath)
        
        filePaths.forEach { relPath ->
            try {
                val sourceFile = File(relPath)
                if (!sourceFile.exists()) return@forEach
                
                val destFile = File(shadowRoot, relPath)
                destFile.parentFile.mkdirs()
                
                if (sourceFile.isFile) {
                    Files.copy(sourceFile.toPath(), destFile.toPath(), StandardCopyOption.REPLACE_EXISTING)
                }
            } catch (e: Exception) {
                logger.error("Failed to sync file to shadow: $relPath", e)
            }
        }
    }

    /**
     * Merges changes from shadow back to the main project.
     */
    @Transactional
    fun mergeShadow(sessionId: Long) {
        val session = shadowSessionRepository.findById(sessionId).orElseThrow()
        if (session.status != ShadowStatus.PENDING) return
        
        val shadowRoot = File(session.shadowPath)
        
        // Find all files in shadow workspace (excluding hidden ones and node_modules)
        shadowRoot.walkTopDown().filter { it.isFile && !it.path.contains(".git") && !it.path.contains("node_modules") }.forEach { shadowFile ->
            val relPath = shadowFile.relativeTo(shadowRoot).path
            val targetFile = File(relPath)
            
            try {
                targetFile.parentFile.mkdirs()
                Files.copy(shadowFile.toPath(), targetFile.toPath(), StandardCopyOption.REPLACE_EXISTING)
                logger.info("Merged shadow file: $relPath")
            } catch (e: Exception) {
                logger.error("Failed to merge shadow file: $relPath", e)
            }
        }
        
        session.status = ShadowStatus.COMMITTED
        session.mergedAt = LocalDateTime.now()
        shadowSessionRepository.save(session)
    }

    /**
     * Discards the shadow session and cleans up.
     */
    @Transactional
    fun discardShadow(sessionId: Long) {
        val session = shadowSessionRepository.findById(sessionId).orElseThrow()
        session.status = ShadowStatus.DISCARDED
        shadowSessionRepository.save(session)
        
        // Clean up the temp directory
        File(session.shadowPath).deleteRecursively()
    }

    /**
     * Simple diff generator using the local 'diff' command (if available) or manual comparison.
     */
    fun getDiff(sessionId: Long): String {
        val session = shadowSessionRepository.findById(sessionId).orElseThrow()
        val shadowRoot = File(session.shadowPath)
        val sb = StringBuilder()
        
        shadowRoot.walkTopDown().filter { it.isFile }.forEach { shadowFile ->
            val relPath = shadowFile.relativeTo(shadowRoot).path
            val originalFile = File(relPath)
            
            if (!originalFile.exists()) {
                sb.append("--- NEW FILE: $relPath ---\n")
                sb.append(shadowFile.readText())
                sb.append("\n\n")
            } else {
                val shadowContent = shadowFile.readText()
                val originalContent = originalFile.readText()
                
                if (shadowContent != originalContent) {
                    sb.append("--- MODIFIED: $relPath ---\n")
                    // In a real app, we'd use a diff library, but here we just show the new version for simplicity in UI
                    sb.append(shadowContent)
                    sb.append("\n\n")
                }
            }
        }
        return sb.toString()
    }
}
