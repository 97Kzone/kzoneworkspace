package com.kzoneworkspace.backend.websocket

import org.springframework.messaging.simp.SimpMessagingTemplate
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/chat")
class ChatHistoryController(
    private val chatMessageRepository: ChatMessageRepository,
    private val messagingTemplate: SimpMessagingTemplate
) {

    @GetMapping("/history")
    fun getHistory(@RequestParam roomId: String): List<ChatMessage> {
        val history = chatMessageRepository.findByRoomIdOrderByTimestampAsc(roomId)
        println("📜 Fetching history for room: $roomId, count: ${history.size}")
        return history
    }

    @PostMapping("/send")
    fun sendMessage(@RequestBody message: ChatMessage): ChatMessage {
        val saved = chatMessageRepository.save(message)
        messagingTemplate.convertAndSend("/topic/messages", saved)
        messagingTemplate.convertAndSend("/topic/public", saved)
        return saved
    }
}
