package com.kzoneworkspace.backend.agent.repository

import com.kzoneworkspace.backend.agent.entity.BrainstormingSession
import com.kzoneworkspace.backend.agent.entity.BrainstormingContribution
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface BrainstormingRepository : JpaRepository<BrainstormingSession, Long> {
    fun findByRoomIdOrderByCreatedAtDesc(roomId: String): List<BrainstormingSession>
}

@Repository
interface BrainstormingContributionRepository : JpaRepository<BrainstormingContribution, Long> {
    fun findBySessionIdOrderByTimestampAsc(sessionId: Long): List<BrainstormingContribution>
}
