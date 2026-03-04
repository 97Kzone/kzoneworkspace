package com.kzoneworkspace.backend.claude

import org.springframework.stereotype.Service
import java.io.File

@Service
class ProjectContextService {

    fun getProjectContext(): String {
        val root = File(".")
        val context = StringBuilder()

        context.append("# Project Context Overview\n\n")

        // 1. Directory Structure (Top Level)
        context.append("## Directory Structure\n")
        root.listFiles()?.filter { it.isDirectory && !it.name.startsWith(".") }
            ?.forEach { context.append("- ${it.name}/\n") }
        context.append("\n")

        // 2. Core Files
        val coreFiles = listOf(
            "README.md",
            "backend/build.gradle.kts",
            "frontend/package.json",
            "compose.yaml"
        )

        context.append("## Core Project Files\n")
        for (filePath in coreFiles) {
            val file = File(filePath)
            if (file.exists()) {
                context.append("### FILE: $filePath\n")
                context.append("```\n")
                // Read up to 2000 chars to avoid token blowup
                val content = file.readText().take(2000)
                context.append(content)
                if (file.length() > 2000) context.append("\n... (truncated)")
                context.append("\n```\n\n")
            }
        }

        return context.toString()
    }
}
