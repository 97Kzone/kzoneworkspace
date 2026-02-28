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
    private val agentExecutor: AgentExecutor,
    private val chatMessageRepository: ChatMessageRepository
) {

    @MessageMapping("/chat.send")
    fun sendMessage(@Payload message: ChatMessage) {
        // DB에 메시지 저장
        val savedMessage = chatMessageRepository.save(message)

        // 내 메시지 먼저 채팅방에 전송
        messagingTemplate.convertAndSend(
            "/topic/room/${savedMessage.roomId}",
            savedMessage
        )

        // @에이전트이름 으로 특정 에이전트 호출
        if (savedMessage.content.startsWith("@")) {
            val agentName = savedMessage.content.substringAfter("@").substringBefore(" ")
            val userMessage = savedMessage.content.substringAfter(" ")
            val agents = agentService.getAllAgents()
            val agent = agents.find { it.name == agentName }

            if (agent != null) {
                Thread {
                    agentExecutor.execute(agent, savedMessage.roomId, userMessage)
                }.start()
            } else {
                val errorMessage = ChatMessage(
                    roomId = savedMessage.roomId,
                    senderId = "system",
                    senderName = "시스템",
                    content = "에이전트 '$agentName'을 찾을 수 없습니다.",
                    type = MessageType.SYSTEM
                )
                val savedError = chatMessageRepository.save(errorMessage)
                messagingTemplate.convertAndSend(
                    "/topic/room/${savedMessage.roomId}",
                    savedError
                )
            }
        }
    }

    @MessageMapping("/chat.join")
    fun joinRoom(@Payload message: ChatMessage) {
        val systemMessage = ChatMessage(
            roomId = message.roomId,
            senderId = "system",
            senderName = "시스템",
            content = "${message.senderName}님이 입장했습니다.",
            type = MessageType.SYSTEM
        )
        val savedSystemMessage = chatMessageRepository.save(systemMessage)
        messagingTemplate.convertAndSend(
            "/topic/room/${message.roomId}",
            savedSystemMessage
        )
    }
}