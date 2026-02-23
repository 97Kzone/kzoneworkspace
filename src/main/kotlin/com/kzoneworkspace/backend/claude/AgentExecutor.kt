package com.kzoneworkspace.backend.claude

import com.kzoneworkspace.backend.agent.entity.Agent
import com.kzoneworkspace.backend.agent.entity.AiProvider
import com.kzoneworkspace.backend.websocket.ChatMessage
import com.kzoneworkspace.backend.websocket.MessageType
import org.springframework.messaging.simp.SimpMessagingTemplate
import org.springframework.stereotype.Service

@Service
class AgentExecutor(
    private val claudeClient: ClaudeClient,
    private val geminiClient: GeminiClient,
    private val messagingTemplate: SimpMessagingTemplate
) {

    fun execute(agent: Agent, roomId: String, userMessage: String) {
        sendMessage(roomId, agent.name, "처리 중...", MessageType.AGENT)

        try {
            val response = when (agent.provider) {
                AiProvider.ANTHROPIC -> claudeClient.sendMessage(
                    systemPrompt = agent.systemPrompt,
                    userMessage = userMessage,
                    model = agent.model
                )
                AiProvider.GOOGLE -> geminiClient.sendMessage(
                    systemPrompt = agent.systemPrompt,
                    userMessage = userMessage,
                    model = agent.model
                )
                AiProvider.OPENAI -> "OpenAI 연동 준비 중"
            }

            sendMessage(roomId, agent.name, response, MessageType.AGENT)

        } catch (e: Exception) {
            sendMessage(roomId, agent.name, "오류 발생: ${e.message}", MessageType.AGENT)
        }
    }

    private fun sendMessage(roomId: String, senderName: String, content: String, type: MessageType) {
        messagingTemplate.convertAndSend(
            "/topic/room/$roomId",
            ChatMessage(
                roomId = roomId,
                senderId = "agent",
                senderName = senderName,
                content = content,
                type = type
            )
        )
    }
}