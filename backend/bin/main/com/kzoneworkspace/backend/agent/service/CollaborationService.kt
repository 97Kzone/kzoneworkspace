package com.kzoneworkspace.backend.agent.service

import org.springframework.stereotype.Service
import java.time.LocalDateTime
import java.util.concurrent.ConcurrentHashMap

data class CollaborationLog(
    val id: String,
    val fromAgentName: String,
    val toAgentName: String,
    val task: String,
    val status: String,
    val timestamp: LocalDateTime = LocalDateTime.now()
)

@Service
class CollaborationService {
    private val logs = ConcurrentHashMap<String, MutableList<CollaborationLog>>()

    fun logInteraction(roomId: String, from: String, to: String, task: String, status: String) {
        val interaction = CollaborationLog(
            id = java.util.UUID.randomUUID().toString(),
            fromAgentName = from,
            toAgentName = to,
            task = task,
            status = status
        )
        logs.computeIfAbsent(roomId) { mutableListOf() }.add(interaction)
    }

    fun getInteractions(roomId: String): List<CollaborationLog> {
        return logs[roomId] ?: emptyList()
    }
}
