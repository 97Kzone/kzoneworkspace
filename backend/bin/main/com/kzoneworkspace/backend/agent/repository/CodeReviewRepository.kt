package com.kzoneworkspace.backend.agent.repository

import com.kzoneworkspace.backend.agent.entity.CodeReviewResult
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface CodeReviewRepository : JpaRepository<CodeReviewResult, Long> {
    fun findByFilePathOrderByCreatedAtDesc(filePath: String): List<CodeReviewResult>
    fun findByOrderByCreatedAtDesc(): List<CodeReviewResult>
    fun findByStatusOrderByCreatedAtDesc(status: String): List<CodeReviewResult>
}
