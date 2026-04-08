package com.kzoneworkspace.backend.agent.controller

import com.kzoneworkspace.backend.agent.entity.CodebaseChunk
import com.kzoneworkspace.backend.agent.service.CodebaseIndexingService
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/codebase")
class CodebaseController(
    private val codebaseIndexingService: CodebaseIndexingService
) {

    @PostMapping("/index")
    fun indexProject(): Map<String, String> {
        // Run indexing in background or directly (direct for now to keep it simple)
        // For production, this should be an async job.
        codebaseIndexingService.indexProject()
        return mapOf("status" to "success", "message" to "Project indexed successfully")
    }

    @GetMapping("/search")
    fun search(@RequestParam query: String, @RequestParam(defaultValue = "10") limit: Int): List<CodebaseChunk> {
        return codebaseIndexingService.search(query, limit)
    }
}
