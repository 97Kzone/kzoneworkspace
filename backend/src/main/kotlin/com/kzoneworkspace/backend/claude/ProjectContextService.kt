package com.kzoneworkspace.backend.claude

import org.springframework.stereotype.Service
import java.io.File

@Service
class ProjectContextService {

    fun getProjectContext(): String {
        val root = File(".")
        val context = StringBuilder()

        context.append("# 🚀 Project Context (Intelligence Boosted)\n\n")

        // 1. Recursive Directory Structure (Depth 3)
        context.append("## 📂 Repository Structure\n")
        context.append("```text\n")
        generateDirectoryTree(root, "", 0, 3, context)
        context.append("```\n\n")

        // 2. Automatically Identify Important Files
        val importantFilePatterns = listOf(
            "README.md", "../README.md",
            "compose.yaml", "../compose.yaml",
            "docker-compose.yml", "../docker-compose.yml",
            "build.gradle.kts", "backend/build.gradle.kts",
            "src/main/resources/application.properties", "backend/src/main/resources/application.properties",
            ".env", "backend/.env",
            "../frontend/package.json", "frontend/package.json",
            "../frontend/next.config.js", "frontend/next.config.js",
            "../frontend/src/app/page.tsx", "frontend/src/app/page.tsx"
        )

        context.append("## 📄 Key Project Files\n")
        for (filePath in importantFilePatterns) {
            val file = File(filePath)
            if (file.exists() && file.isFile) {
                context.append("### FILE: $filePath\n")
                context.append("```\n")
                // Read up to 1500 chars per file to stay within context limits
                val content = file.readText().take(1500)
                context.append(content)
                if (file.length() > 1500) context.append("\n... (truncated for brevity)")
                context.append("\n```\n\n")
            }
        }

        // 3. Tech Stack Summary (Derived from files)
        context.append("## 🛠️ Tech Stack Summary\n")
        if (File("backend").exists()) context.append("- **Backend**: Kotlin, Spring Boot, Gradle, PostgreSQL (pgvector)\n")
        if (File("frontend").exists()) context.append("- **Frontend**: Next.js, React, TypeScript, Tailwind CSS\n")
        if (File("compose.yaml").exists() || File("docker-compose.yml").exists()) context.append("- **Infrastructure**: Docker Compose\n")

        return context.toString()
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
