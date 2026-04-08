package com.kzoneworkspace.backend.websocket

import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface ChatMessageRepository : JpaRepository<ChatMessage, Long> {
    fun findByRoomIdOrderByTimestampAsc(roomId: String): List<ChatMessage>
}
