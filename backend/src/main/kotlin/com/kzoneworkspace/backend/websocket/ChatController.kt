package com.kzoneworkspace.backend.websocket

import com.kzoneworkspace.backend.agent.service.AgentService
import com.kzoneworkspace.backend.claude.AgentExecutor
import org.springframework.messaging.handler.annotation.MessageMapping
import org.springframework.messaging.handler.annotation.Payload
import org.springframework.messaging.simp.SimpMessagingTemplate
import org.springframework.stereotype.Controller

@Controller
class ChatController(
    private val messagingTemplate: SimpMessagingTemplate,
    private val agentService: AgentService,
    private val agentExecutor: AgentExecutor
) {

    @MessageMapping("/chat.send")
    fun sendMessage(@Payload message: ChatMessage) {
        // 내 메시지 먼저 채팅방에 전송
        messagingTemplate.convertAndSend(
            "/topic/room/${message.roomId}",
            message
        )

        // @에이전트이름 으로 특정 에이전트 호출
        if (message.content.startsWith("@")) {
            val agentName = message.content.substringAfter("@").substringBefore(" ")
            val userMessage = message.content.substringAfter(" ")
            val agents = agentService.getAllAgents()
            val agent = agents.find { it.name == agentName }

            if (agent != null) {
                Thread {
                    agentExecutor.execute(agent, message.roomId, userMessage)
                }.start()
            } else {
                messagingTemplate.convertAndSend(
                    "/topic/room/${message.roomId}",
                    ChatMessage(
                        roomId = message.roomId,
                        senderId = "system",
                        senderName = "시스템",
                        content = "에이전트 '$agentName'을 찾을 수 없습니다.",
                        type = MessageType.SYSTEM
                    )
                )
            }
        }
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