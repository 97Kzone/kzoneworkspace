package com.kzoneworkspace.backend.agent.repository

import com.kzoneworkspace.backend.agent.entity.CognitiveTrace
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import java.util.UUID

@Repository
interface CognitiveTraceRepository : JpaRepository<CognitiveTrace, UUID> {
    fun findByRoomIdOrderByTimestampAsc(roomId: String): List<CognitiveTrace>
    fun findByAgentIdOrderByTimestampAsc(agentId: Long): List<CognitiveTrace>
}
