package com.kzoneworkspace.backend.agent.repository

import com.kzoneworkspace.backend.agent.entity.CognitiveAlignmentReport
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface CognitiveAlignmentReportRepository : JpaRepository<CognitiveAlignmentReport, Long> {
    fun findTopByRoomIdOrderByCreatedAtDesc(roomId: String): CognitiveAlignmentReport?
    fun findByRoomIdOrderByCreatedAtDesc(roomId: String): List<CognitiveAlignmentReport>
}
