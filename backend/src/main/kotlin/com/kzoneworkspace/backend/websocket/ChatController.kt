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
        println("📝 Message saved to DB: ID=${savedMessage.id}, Room=${savedMessage.roomId}, Sender=${savedMessage.senderName}")

        // 내 메시지 먼저 채팅방에 전송
        messagingTemplate.convertAndSend(
            "/topic/public",
            savedMessage
        )

        // @에이전트이름 으로 특정 에이전트 호출
        if (savedMessage.content.startsWith("@")) {
            val contentAfterAt = savedMessage.content.substringAfter("@")
            val agents = agentService.getAllAgents()
            
            // 이름 전체(띄어쓰기 포함)가 매칭되는 에이전트 찾기
            val agent = agents.find { contentAfterAt.startsWith(it.name) }

            if (agent != null) {
                // 에이전트 이름을 제외한 실제 유저의 메시지 추출
                val userMessage = contentAfterAt.substring(agent.name.length).trim()
                Thread {
                    agentExecutor.execute(agent, savedMessage.roomId, userMessage)
                }.start()
            } else {
                val agentNameFallback = contentAfterAt.substringBefore(" ")
                val errorMessage = ChatMessage(
                    roomId = savedMessage.roomId,
                    senderId = "system",
                    senderName = "시스템",
                    content = "에이전트 '$agentNameFallback'(을)를 찾을 수 없습니다.",
                    type = MessageType.SYSTEM
                )
                val savedError = chatMessageRepository.save(errorMessage)
                messagingTemplate.convertAndSend(
                    "/topic/public",
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
            "/topic/public",
            savedSystemMessage
        )
    }
}