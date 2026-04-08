package com.kzoneworkspace.backend.claude

import org.springframework.stereotype.Service
import java.io.File

@Service
class ProjectContextService {

    fun getProjectContext(): String {
        val root = findProjectRoot()
        val context = StringBuilder()

        context.append("# 🚀 Project Context (Intelligence Boosted)\n\n")

        // 1. Recursive Directory Structure (Depth 4 for better map)
        context.append("## 📂 Repository Structure\n")
        context.append("```text\n")
        generateDirectoryTree(root, "", 0, 4, context)
        context.append("```\n\n")

        // 2. Intelligent Technical Summary (Condensed Signatures)
        context.append("## 🏗️ Technical Architecture Map\n")
        val techMap = generateTechnicalMap(root)
        context.append(techMap)
        context.append("\n")

        // 3. Automatically Identify Important Files (Full snippet)
        val importantFilePaths = listOf(
            "README.md",
            "backend/build.gradle.kts",
            "frontend/package.json"
        )

        context.append("## 📄 Key Configuration Snippets\n")
        for (relPath in importantFilePaths) {
            val file = File(root, relPath)
            if (file.exists() && file.isFile) {
                context.append("### FILE: $relPath\n")
                context.append("```\n")
                val content = file.readText().take(1000)
                context.append(content)
                if (file.length() > 1000) context.append("\n... (truncated)")
                context.append("\n```\n\n")
            }
        }

        // 4. Tech Stack Summary
        context.append("## 🛠️ Tech Stack Summary\n")
        if (File(root, "backend").exists()) context.append("- **Backend**: Kotlin, Spring Boot, Gradle, PostgreSQL (pgvector)\n")
        if (File(root, "frontend").exists()) context.append("- **Frontend**: Next.js, React, TypeScript, Tailwind CSS\n")
        if (File(root, "compose.yaml").exists() || File(root, "docker-compose.yml").exists()) context.append("- **Infrastructure**: Docker Compose\n")

        return context.toString()
    }

    private fun generateTechnicalMap(root: File): String {
        val map = StringBuilder()
        val targetDirs = listOf("backend/src/main/kotlin", "frontend/src/app")
        
        for (dirPath in targetDirs) {
            val dir = File(root, dirPath)
            if (!dir.exists()) continue
            
            map.append("### Source: $dirPath\n")
            dir.walkTopDown().maxDepth(5).filter { it.isFile && (it.extension == "kt" || it.extension == "ts" || it.extension == "tsx") }.forEach { file ->
                val signatures = extractSignatures(file)
                if (signatures.isNotBlank()) {
                    map.append("- **${file.name}**: $signatures\n")
                }
            }
        }
        return map.toString()
    }

    private fun extractSignatures(file: File): String {
        return try {
            val lines = file.readLines()
            val signatures = mutableListOf<String>()
            
            // Very simple extraction logic for performance
            for (line in lines) {
                val trimmed = line.trim()
                if (trimmed.startsWith("class ") || trimmed.startsWith("interface ") || trimmed.startsWith("enum class ")) {
                    signatures.add(trimmed.substringBefore("{").trim())
                } else if (trimmed.startsWith("fun ") || (trimmed.startsWith("export const") && trimmed.contains("=>"))) {
                     val sig = if (trimmed.startsWith("fun ")) {
                         trimmed.substringBefore("{").trim()
                     } else {
                         trimmed.substringBefore("=").trim()
                     }
                     if (signatures.size < 5) signatures.add(sig) // Limit signatures per file
                }
            }
            
            if (signatures.isEmpty()) "" else signatures.joinToString(", ")
        } catch (e: Exception) {
            ""
        }
    }

    private fun findProjectRoot(): File {
        var current = File(".").absoluteFile
        while (current.parentFile != null) {
            if (File(current, "backend").exists() && File(current, "frontend").exists()) {
                return current
            }
            if (File(current, "src/main/kotlin").exists()) { // We are inside backend
                return current.parentFile ?: current
            }
            current = current.parentFile
        }
        return File(".")
    }

    private fun generateDirectoryTree(file: File, indent: String, depth: Int, maxDepth: Int, context: StringBuilder) {
        if (depth > maxDepth) return
        
        val files = file.listFiles()
            ?.filter { !it.name.startsWith(".") && it.name != "node_modules" && it.name != "build" && it.name != ".gradle" }
            ?.sortedBy { it.isFile } ?: return

        for (f in files) {
            context.append("$indent${if (f.isDirectory) "📁 " else "📄 "}${f.name}\n")
            if (f.isDirectory) {
                generateDirectoryTree(f, "$indent  ", depth + 1, maxDepth, context)
            }
        }
    }
}
