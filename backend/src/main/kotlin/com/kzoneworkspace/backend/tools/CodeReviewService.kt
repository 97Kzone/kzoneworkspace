package com.kzoneworkspace.backend.tools

import com.kzoneworkspace.backend.claude.AgentExecutor
import com.kzoneworkspace.backend.agent.service.AgentService
import org.springframework.stereotype.Service
import java.io.File

@Service
class CodeReviewService(
    private val gitService: GitService,
    private val agentService: AgentService
) {
    fun getDiff(): String {
        return gitService.diff()
    }

    fun analyzeDiff(diff: String, agentName: String): String {
        if (diff.isBlank()) return "변경 사항이 없습니다."
        
        val reviewer = agentService.getAllAgents().find { it.name == agentName }
            ?: return "리뷰어 에이전트를 찾을 수 없습니다."
            
        // This will be called via AgentExecutor in practice to maintain context,
        // but the service provides the core logic and diff extraction.
        return diff
    }
}
