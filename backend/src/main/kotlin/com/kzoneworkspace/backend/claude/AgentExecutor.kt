package com.kzoneworkspace.backend.claude

import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import com.kzoneworkspace.backend.agent.entity.Agent
import com.kzoneworkspace.backend.agent.entity.AiProvider
import com.kzoneworkspace.backend.task.entity.TaskStatus
import com.kzoneworkspace.backend.task.service.TaskService
import com.kzoneworkspace.backend.websocket.ChatMessage
import com.kzoneworkspace.backend.websocket.ChatMessageRepository
import com.kzoneworkspace.backend.websocket.MessageType
import org.springframework.messaging.simp.SimpMessagingTemplate
import org.springframework.stereotype.Service
import java.io.File

@Service
class AgentExecutor(
    private val claudeClient: ClaudeClient,
    private val geminiClient: GeminiClient,
    private val taskService: TaskService,
    private val messagingTemplate: SimpMessagingTemplate,
    private val chatMessageRepository: ChatMessageRepository
) {
    private val objectMapper = jacksonObjectMapper()

    fun execute(agent: Agent, roomId: String, userMessage: String) {
        val task = taskService.createTask(roomId, userMessage, agent)
        taskService.updateStatus(task.id, TaskStatus.RUNNING)
        sendMessage(roomId, agent.name, "업무 분석 중...", MessageType.AGENT)

        try {
            // 메시지 히스토리 초기화
            val messages = mutableListOf<Map<String, Any>>()
            messages.add(mapOf("role" to "user", "content" to userMessage))

            // 도구(Tools) 정의 (순수 맵 사용으로 SDK 오류 회피)
            val tools = listOf(
                mapOf(
                    "name" to "search_files",
                    "description" to "워크스페이스 내의 파일을 검색합니다. (파일명 패턴 입력)",
                    "input_schema" to mapOf(
                        "type" to "object",
                        "properties" to mapOf(
                            "pattern" to mapOf("type" to "string", "description" to "검색할 파일명 패턴 (예: *.kt)")
                        ),
                        "required" to listOf("pattern")
                    )
                ),
                mapOf(
                    "name" to "read_file",
                    "description" to "파일의 내용을 읽습니다. (전체 경로 입력)",
                    "input_schema" to mapOf(
                        "type" to "object",
                        "properties" to mapOf(
                            "path" to mapOf("type" to "string", "description" to "읽을 파일의 전체 경로")
                        ),
                        "required" to listOf("path")
                    )
                )
            )

            var loop = true
            var lastResponse: String = ""

            while (loop) {
                // REST API 직접 호출
                val responseNode = when (agent.provider) {
                    AiProvider.ANTHROPIC -> claudeClient.sendMessageREST(
                        systemPrompt = agent.systemPrompt,
                        messages = messages,
                        model = agent.model,
                        tools = tools
                    )
                    else -> throw RuntimeException("지원되지 않는 프로바이더의 도구 사용입니다.")
                }

                val contentBlocks = responseNode["content"]
                val assistantContentList = mutableListOf<Map<String, Any>>()
                val toolUseBlocks = mutableListOf<com.fasterxml.jackson.databind.JsonNode>()

                // 응답 블록 파싱 및 어시스턴트 메시지 기록 확장
                for (block in contentBlocks) {
                    val blockType = block["type"].asText()
                    if (blockType == "text") {
                        assistantContentList.add(
                            mapOf("type" to "text", "text" to block["text"].asText())
                        )
                    } else if (blockType == "tool_use") {
                        val inputMap = objectMapper.convertValue(block["input"], Map::class.java) as Map<String, Any>
                        assistantContentList.add(
                            mapOf(
                                "type" to "tool_use",
                                "id" to block["id"].asText(),
                                "name" to block["name"].asText(),
                                "input" to inputMap
                            )
                        )
                        toolUseBlocks.add(block)
                    }
                }
                
                // 생성된 어시스턴트(AI)의 메시지를 컨텍스트에 추가
                messages.add(mapOf("role" to "assistant", "content" to assistantContentList))

                if (toolUseBlocks.isEmpty()) {
                    // 도구 사용 요청이 없으면 루프 종료
                    val textBlocks = mutableListOf<String>()
                    for (block in contentBlocks) {
                        if (block["type"].asText() == "text") {
                            textBlocks.add(block["text"].asText())
                        }
                    }
                    lastResponse = textBlocks.joinToString("\n")
                    loop = false
                } else {
                    // 도구 사용 처리
                    val toolResults = mutableListOf<Map<String, Any>>()
                    
                    for (block in toolUseBlocks) {
                        val toolUseId = block["id"].asText()
                        val toolName = block["name"].asText()
                        val input = block["input"]
                        
                        val result = try {
                            when (toolName) {
                                "search_files" -> {
                                    val pattern = if (input.has("pattern")) input["pattern"].asText() else ""
                                    handleSearchFiles(pattern)
                                }
                                "read_file" -> {
                                    val path = if (input.has("path")) input["path"].asText() else ""
                                    handleReadFile(path)
                                }
                                else -> "알 수 없는 도구: $toolName"
                            }
                        } catch (e: Exception) {
                            "도구 실행 중 오류: ${e.message}"
                        }
                        
                        toolResults.add(
                            mapOf(
                                "type" to "tool_result",
                                "tool_use_id" to toolUseId,
                                "content" to result
                            )
                        )
                        
                        // 시스템 메시지로 알림
                        val inputStr = objectMapper.writeValueAsString(input)
                        sendMessage(roomId, "시스템", "[도구 사용] $toolName: $inputStr", MessageType.SYSTEM)
                    }
                    
                    // 도구 실행 결과를 사용자(user) 롤의 메시지로 이어서 전달
                    messages.add(mapOf("role" to "user", "content" to toolResults))
                }
            }

            taskService.updateStatus(task.id, TaskStatus.COMPLETED, lastResponse)
            sendMessage(roomId, agent.name, lastResponse, MessageType.AGENT)

        } catch (e: Exception) {
            val errorMsg = "업무 수행 중 오류가 발생했습니다: ${e.message}"
            sendMessage(roomId, agent.name, errorMsg, MessageType.AGENT)
            e.printStackTrace()
            taskService.updateStatus(task.id, TaskStatus.FAILED, errorMsg)
        }
    }

    private fun handleSearchFiles(pattern: String): String {
        val root = File(".").absoluteFile.parentFile ?: File(".")
        val results = mutableListOf<String>()
        val regex = try {
            pattern.replace(".", "\\.").replace("*", ".*").toRegex(RegexOption.IGNORE_CASE)
        } catch (e: Exception) {
            return "잘못된 패턴입니다: $pattern"
        }
        
        root.walkTopDown().maxDepth(6).forEach { file ->
            if (file.isFile && regex.containsMatchIn(file.name)) {
                results.add(file.path)
            }
        }
        return if (results.isEmpty()) "'$pattern'에 매칭되는 파일 없음." else "검색 결과:\n" + results.joinToString("\n")
    }

    private fun handleReadFile(path: String): String {
        return try {
            val file = File(path)
            if (!file.exists()) "파일이 존재하지 않습니다: $path"
            else if (file.length() > 500_000) "파일이 너무 커서 읽을 수 없습니다. (500KB 제한)"
            else file.readText().take(10000) // 최대 10,000자 요약 제공으로 토큰 한도 보호
        } catch (e: Exception) {
            "파일 읽기 오류: ${e.message}"
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
        chatMessageRepository.save(message)
        messagingTemplate.convertAndSend("/topic/public", message)
    }
}