package com.kzoneworkspace.backend.tools

import com.kzoneworkspace.backend.agent.entity.CodeReviewResult
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/code-review")
class CodeReviewController(
    private val codeReviewService: CodeReviewService
) {
    @GetMapping("/results")
    fun getAllReviews(): List<CodeReviewResult> {
        return codeReviewService.getAllReviews()
    }

    @PostMapping("/perform")
    fun performReview(@RequestParam filePath: String): List<CodeReviewResult> {
        return codeReviewService.performReview(filePath)
    }

    @PostMapping("/{id}/apply")
    fun applyFix(@PathVariable id: Long): Map<String, Any> {
        val success = codeReviewService.applyFix(id)
        return mapOf(
            "success" to success,
            "message" to if (success) "수정 사항이 성공적으로 반영되었습니다." else "수정 사항 반영에 실패했습니다 (코드 조각 불일치 등)."
        )
    }
}
