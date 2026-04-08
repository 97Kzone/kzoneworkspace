package com.kzoneworkspace.backend.agent.repository

import com.kzoneworkspace.backend.agent.entity.EvaluationRun
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface EvaluationRunRepository : JpaRepository<EvaluationRun, Long> {
    fun findByAgentIdOrderByStartTimeDesc(agentId: Long): List<EvaluationRun>
}
