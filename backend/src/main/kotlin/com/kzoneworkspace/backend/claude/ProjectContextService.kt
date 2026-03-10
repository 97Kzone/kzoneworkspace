package com.kzoneworkspace.backend.claude

import org.springframework.stereotype.Service
import java.io.File

@Service
class ProjectContextService {

    fun getProjectContext(): String {
        val root = findProjectRoot()
        val context = StringBuilder()

        context.append("# 🚀 Project Context (Intelligence Boosted)\n\n")

        // 1. Recursive Directory Structure (Depth 3)
        context.append("## 📂 Repository Structure\n")
        context.append("```text\n")
        generateDirectoryTree(root, "", 0, 3, context)
        context.append("```\n\n")

        // 2. Automatically Identify Important Files
        val importantFilePaths = listOf(
            "README.md",
            "compose.yaml",
            "docker-compose.yml",
            "backend/build.gradle.kts",
            "backend/src/main/resources/application.properties",
            "backend/.env",
            "frontend/package.json",
            "frontend/next.config.js",
            "frontend/src/app/page.tsx"
        )

        context.append("## 📄 Key Project Files\n")
        for (relPath in importantFilePaths) {
            val file = File(root, relPath)
            if (file.exists() && file.isFile) {
                context.append("### FILE: $relPath\n")
                context.append("```\n")
                val content = file.readText().take(1500)
                context.append(content)
                if (file.length() > 1500) context.append("\n... (truncated for brevity)")
                context.append("\n```\n\n")
            }
        }

        // 3. Intelligent Component Discovery
        context.append("## 🧩 Identified Components\n")
        discoverComponents(root, context)
        context.append("\n")

        // 4. Tech Stack Summary
        context.append("## 🛠️ Tech Stack Summary\n")
        if (File(root, "backend").exists()) context.append("- **Backend**: Kotlin, Spring Boot, Gradle, PostgreSQL (pgvector)\n")
        if (File(root, "frontend").exists()) context.append("- **Frontend**: Next.js, React, TypeScript, Tailwind CSS\n")
        if (File(root, "compose.yaml").exists() || File(root, "docker-compose.yml").exists()) context.append("- **Infrastructure**: Docker Compose\n")

        return context.toString()
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

    private fun discoverComponents(root: File, context: StringBuilder) {
        val backendSrc = File(root, "backend/src/main/kotlin")
        if (!backendSrc.exists()) return

        val entities = mutableListOf<String>()
        val controllers = mutableListOf<String>()

        backendSrc.walkTopDown().forEach { file ->
            if (file.isFile && file.extension == "kt") {
                val content = file.readText()
                if (content.contains("@Entity")) entities.add(file.nameWithoutExtension)
                if (content.contains("@RestController") || content.contains("@Controller")) controllers.add(file.nameWithoutExtension)
            }
        }

        if (entities.isNotEmpty()) {
            context.append("- **Entities**: ${entities.joinToString(", ")}\n")
        }
        if (controllers.isNotEmpty()) {
            context.append("- **Controllers**: ${controllers.joinToString(", ")}\n")
        }
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
