package com.kzoneworkspace.backend.tools

import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import java.io.File

@Service
class GitService {
    private val logger = LoggerFactory.getLogger(GitService::class.java)

    fun executeGitCommand(vararg args: String): String {
        return try {
            val isWindows = System.getProperty("os.name").lowercase().contains("win")
            val command = mutableListOf("git")
            command.addAll(args)

            val processBuilder = ProcessBuilder(command)
            processBuilder.directory(File(".")) // Root directory
            
            val process = processBuilder.start()
            val output = process.inputStream.bufferedReader().readText()
            val error = process.errorStream.bufferedReader().readText()
            
            val exitCode = process.waitFor()
            
            if (exitCode != 0) {
                "Error executing git ${args.joinToString(" ")}: $error"
            } else {
                output.ifEmpty { "Success" }
            }
        } catch (e: Exception) {
            "Failed to execute git command: ${e.message}"
        }
    }

    fun status(): String = executeGitCommand("status")

    fun diff(): String = executeGitCommand("diff")

    fun add(path: String): String = executeGitCommand("add", path)

    fun commit(message: String): String = executeGitCommand("commit", "-m", message)

    fun log(limit: Int = 5): String = executeGitCommand("log", "-n", limit.toString(), "--oneline")

    fun getChangedFiles(): List<String> {
        // Collect unstaged, staged, and untracked files
        val unstaged = executeGitCommand("diff", "--name-only").lines().filter { it.isNotBlank() }
        val staged = executeGitCommand("diff", "--cached", "--name-only").lines().filter { it.isNotBlank() }
        val untracked = executeGitCommand("ls-files", "--others", "--exclude-standard").lines().filter { it.isNotBlank() }
        
        return (unstaged + staged + untracked).distinct()
    }
}
