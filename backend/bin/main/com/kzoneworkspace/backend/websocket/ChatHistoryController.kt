package com.kzoneworkspace.backend.websocket

import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/chat")
class ChatHistoryController(
    private val chatMessageRepository: ChatMessageRepository
) {

    @GetMapping("/history")
    fun getHistory(@RequestParam roomId: String): List<ChatMessage> {
        val history = chatMessageRepository.findByRoomIdOrderByTimestampAsc(roomId)
        println("📜 Fetching history for room: $roomId, count: ${history.size}")
        return history
    }
}
