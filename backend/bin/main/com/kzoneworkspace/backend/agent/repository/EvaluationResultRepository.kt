package com.kzoneworkspace.backend.agent.repository

import com.kzoneworkspace.backend.agent.entity.EvaluationResult
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface EvaluationResultRepository : JpaRepository<EvaluationResult, Long> {
    fun findByEvaluationRunId(runId: Long): List<EvaluationResult>
}
