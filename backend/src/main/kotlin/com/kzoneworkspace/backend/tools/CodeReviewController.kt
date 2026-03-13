package com.kzoneworkspace.backend.tools

import com.kzoneworkspace.backend.agent.service.AgentService
import com.kzoneworkspace.backend.claude.AgentExecutor
import org.springframework.beans.factory.ObjectProvider
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/code-review")
class CodeReviewController(
    private val codeReviewService: CodeReviewService,
    private val agentService: AgentService,
    private val agentExecutorProvider: ObjectProvider<AgentExecutor>
) {
    @PostMapping("/perform")
    fun performReview(@RequestParam roomId: String, @RequestParam agentName: String): String {
        val diff = codeReviewService.getDiff()
        if (diff.isBlank()) return "변경 사항이 없습니다."
        
        val reviewer = agentService.getAllAgents().find { it.name == agentName }
            ?: return "리뷰어 에이전트를 찾을 수 없습니다."
            
        // Trigger review via AgentExecutor to use the full reasoning loop
        agentExecutorProvider.ifAvailable { it.execute(reviewer, roomId, "다음 Git 변경 사항을 코드 리뷰해줘:\n\n$diff") }
        return "코드 리뷰가 요청되었습니다."
    }
}
