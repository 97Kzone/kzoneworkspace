package com.kzoneworkspace.backend.agent.service

import com.kzoneworkspace.backend.agent.entity.CognitiveStepType
import com.kzoneworkspace.backend.agent.entity.CognitiveTrace
import com.kzoneworkspace.backend.agent.repository.CognitiveTraceRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class CognitiveTraceService(
    private val cognitiveTraceRepository: CognitiveTraceRepository
) {
    @Transactional
    fun recordThought(
        agentId: Long,
        roomId: String,
        type: CognitiveStepType,
        content: String,
        confidence: Double = 1.0
    ): CognitiveTrace {
        val trace = CognitiveTrace(
            agentId = agentId,
            roomId = roomId,
            type = type,
            content = content,
            confidence = confidence
        )
        return cognitiveTraceRepository.save(trace)
    }

    fun getTracesForRoom(roomId: String): List<CognitiveTrace> {
        return cognitiveTraceRepository.findByRoomIdOrderByTimestampAsc(roomId)
    }

    fun getTracesForAgent(agentId: Long): List<CognitiveTrace> {
        return cognitiveTraceRepository.findByAgentIdOrderByTimestampAsc(agentId)
    }
}
