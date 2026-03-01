package com.kzoneworkspace.backend.claude

import com.kzoneworkspace.backend.agent.entity.Agent
import com.kzoneworkspace.backend.agent.entity.AiProvider
import com.kzoneworkspace.backend.task.entity.TaskStatus
import com.kzoneworkspace.backend.task.service.TaskService
import com.kzoneworkspace.backend.websocket.ChatMessage
import com.kzoneworkspace.backend.websocket.ChatMessageRepository
import com.kzoneworkspace.backend.websocket.MessageType
import org.springframework.messaging.simp.SimpMessagingTemplate
import org.springframework.stereotype.Service

@Service
class AgentExecutor(
    private val claudeClient: ClaudeClient,
    private val geminiClient: GeminiClient,
    private val taskService: TaskService,
    private val messagingTemplate: SimpMessagingTemplate,
    private val chatMessageRepository: ChatMessageRepository
) {

    fun execute(agent: Agent, roomId: String, userMessage: String) {
        // Task 생성 (PENDING → RUNNING)
        val task = taskService.createTask(roomId, userMessage, agent)
        taskService.updateStatus(task.id, TaskStatus.RUNNING)
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

            // COMPLETED + 결과 저장
            taskService.updateStatus(task.id, TaskStatus.COMPLETED, response)
            sendMessage(roomId, agent.name, response, MessageType.AGENT)

        } catch (e: Exception) {
            sendMessage(roomId, agent.name, "오류 발생: ${e.message}", MessageType.AGENT)
        }
    }

    private fun sendMessage(roomId: String, senderName: String, content: String, type: MessageType) {
        val message = ChatMessage(
            roomId = roomId,
            senderId = "agent",
            senderName = senderName,
            content = content,
            type = type
        )
        val savedMessage = chatMessageRepository.save(message)
        messagingTemplate.convertAndSend(
            "/topic/public",
            savedMessage
        )
    }
}