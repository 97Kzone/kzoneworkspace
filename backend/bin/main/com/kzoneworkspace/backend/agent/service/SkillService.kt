package com.kzoneworkspace.backend.agent.service

import org.springframework.stereotype.Service
import java.io.File

data class SkillDTO(
    val id: String,
    val name: String,
    val description: String,
    val path: String
)

@Service
class SkillService {
    private val logger = org.slf4j.LoggerFactory.getLogger(SkillService::class.java)
    private val skillsDir: File by lazy {
        val currentDir = File(System.getProperty("user.dir"))
        val dirAtRoot = File(currentDir, ".agent/skills")
        val dirAtParent = File(currentDir.parentFile, ".agent/skills")

        val selected = if (dirAtRoot.exists() && dirAtRoot.isDirectory) {
            dirAtRoot
        } else if (dirAtParent.exists() && dirAtParent.isDirectory) {
            dirAtParent
        } else {
            dirAtRoot // Fallback
        }
        logger.info("Skill discovery directory: ${selected.absolutePath} (exists: ${selected.exists()})")
        selected
    }

    fun getAvailableSkills(): List<SkillDTO> {
        if (!skillsDir.exists() || !skillsDir.isDirectory) {
            logger.warn("Skills directory not found: ${skillsDir.absolutePath}")
            return emptyList()
        }

        val skillDirs = skillsDir.listFiles { file -> file.isDirectory }
        logger.info("Found ${skillDirs?.size ?: 0} potential skill directories")

        return skillDirs?.mapNotNull { dir ->
            parseSkillMetadata(dir)
        } ?: emptyList()
    }

    private fun parseSkillMetadata(dir: File): SkillDTO? {
        val skillFile = File(dir, "SKILL.md")
        if (!skillFile.exists()) return null

        val content = skillFile.readText()
        val name = extractMetadata(content, "name") ?: dir.name
        val description = extractMetadata(content, "description") ?: ""

        return SkillDTO(
            id = dir.name,
            name = name,
            description = description,
            path = dir.absolutePath
        )
    }

    private fun extractMetadata(content: String, key: String): String? {
        val regex = "^$key:\\s*(.*)$".toRegex(RegexOption.MULTILINE)
        return regex.find(content)?.groupValues?.get(1)?.trim()
    }
}
