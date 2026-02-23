package com.kzoneworkspace.backend.websocket

import org.springframework.messaging.handler.annotation.MessageMapping
import org.springframework.messaging.handler.annotation.Payload
import org.springframework.messaging.simp.SimpMessagingTemplate
import org.springframework.stereotype.Controller

@Controller
class ChatController(
    private val messagingTemplate: SimpMessagingTemplate,
) {
    @MessageMapping("/chat.send")
    fun sendMessage(@Payload message: ChatMessage) {
        messagingTemplate.convertAndSend(
            "/topic/room/${message.roomId}",
            message
        )
    }

    @MessageMapping("/chat.join")
    fun joinRoom(@Payload message: ChatMessage) {
        val systemMessage = message.copy(
            type = MessageType.SYSTEM,
            content = "${message.senderName}님이 입장했습니다."
        )
        messagingTemplate.convertAndSend(
            "/topic/room/${message.roomId}",
            systemMessage
        )
    }
}