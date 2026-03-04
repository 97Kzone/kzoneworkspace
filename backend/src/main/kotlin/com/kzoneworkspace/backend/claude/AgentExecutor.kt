package com.kzoneworkspace.backend.claude

import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import com.kzoneworkspace.backend.agent.entity.Agent
import com.kzoneworkspace.backend.agent.entity.AiProvider
import com.kzoneworkspace.backend.agent.service.AgentService
import com.kzoneworkspace.backend.task.entity.TaskStatus
import com.kzoneworkspace.backend.task.service.TaskService
import com.kzoneworkspace.backend.websocket.ChatMessage
import com.kzoneworkspace.backend.websocket.ChatMessageRepository
import com.kzoneworkspace.backend.websocket.MessageType
import org.springframework.messaging.simp.SimpMessagingTemplate
import org.springframework.stereotype.Service
import java.io.File
import com.google.genai.types.Part
import com.google.genai.types.FunctionCall

@Service
class AgentExecutor(
    private val claudeClient: ClaudeClient,
    private val geminiClient: GeminiClient,
    private val agentService: AgentService,
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
            val messages = mutableListOf<Map<String, Any>>()
            messages.add(mapOf("role" to "user", "content" to userMessage))

            val lastResponse = runReasoningLoop(agent, roomId, messages)

            taskService.updateStatus(task.id, TaskStatus.COMPLETED, lastResponse)
            sendMessage(roomId, agent.name, lastResponse, MessageType.AGENT)

        } catch (e: Exception) {
            val errorMsg = "업무 수행 중 오류가 발생했습니다: ${e.message}"
            sendMessage(roomId, agent.name, errorMsg, MessageType.AGENT)
            e.printStackTrace()
            taskService.updateStatus(task.id, TaskStatus.FAILED, errorMsg)
        }
    }

    private fun runReasoningLoop(
        agent: Agent,
        roomId: String,
        messages: MutableList<Map<String, Any>>
    ): String {
        // 도구(Tools) 정의
        val tools = mutableListOf(
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
                "description" to "파일의 내용을 읽합니니다. (전체 경로 입력)",
                "input_schema" to mapOf(
                    "type" to "object",
                    "properties" to mapOf(
                        "path" to mapOf("type" to "string", "description" to "읽을 파일의 전체 경로")
                    ),
                    "required" to listOf("path")
                )
            ),
            mapOf(
                "name" to "write_file",
                "description" to "파일을 생성하거나 내용을 덮어씁니다.",
                "input_schema" to mapOf(
                    "type" to "object",
                    "properties" to mapOf(
                        "path" to mapOf("type" to "string", "description" to "저장할 파일 경로"),
                        "content" to mapOf("type" to "string", "description" to "파일에 저장할 내용")
                    ),
                    "required" to listOf("path", "content")
                )
            ),
            mapOf(
                "name" to "list_directory",
                "description" to "특정 디렉토리의 파일 목록을 조회합니다.",
                "input_schema" to mapOf(
                    "type" to "object",
                    "properties" to mapOf(
                        "path" to mapOf("type" to "string", "description" to "조회할 디렉토리 경로 (기본: '.')")
                    ),
                    "required" to listOf("path")
                )
            ),
            mapOf(
                "name" to "delete_file",
                "description" to "파일을 삭제합니다.",
                "input_schema" to mapOf(
                    "type" to "object",
                    "properties" to mapOf(
                        "path" to mapOf("type" to "string", "description" to "삭제할 파일 경로")
                    ),
                    "required" to listOf("path")
                )
            ),
            mapOf(
                "name" to "run_command",
                "description" to "쉘 명령어를 실행합니다.",
                "input_schema" to mapOf(
                    "type" to "object",
                    "properties" to mapOf(
                        "command" to mapOf("type" to "string", "description" to "실행할 명령어")
                    ),
                    "required" to listOf("command")
                )
            ),
            mapOf(
                "name" to "call_agent",
                "description" to "다른 에이전트에게 업무를 요청합니다.",
                "input_schema" to mapOf(
                    "type" to "object",
                    "properties" to mapOf(
                        "agent_name" to mapOf("type" to "string", "description" to "호출할 에이전트 이름"),
                        "task" to mapOf("type" to "string", "description" to "요청할 업무 설명")
                    ),
                    "required" to listOf("agent_name", "task")
                )
            )
        )

        var loop = true
        var lastResponse: String = ""
        var iteration = 0
        val maxIterations = 10 // 무한 루프 방지

        while (loop && iteration < maxIterations) {
            iteration++
            val toolUseBlocks = mutableListOf<Map<String, Any>>()
            val assistantContentList = mutableListOf<Map<String, Any>>()
            var textResponseMessage = ""

            when (agent.provider) {
                AiProvider.ANTHROPIC -> {
                    val responseNode = claudeClient.sendMessageREST(
                        systemPrompt = agent.systemPrompt,
                        messages = messages,
                        model = agent.model,
                        tools = tools
                    )
                    val contentBlocks = responseNode["content"]
                    for (block in contentBlocks) {
                        val blockType = block["type"].asText()
                        if (blockType == "text") {
                            val text = block["text"].asText()
                            assistantContentList.add(mapOf("type" to "text", "text" to text))
                            textResponseMessage += text
                        } else if (blockType == "tool_use") {
                            val id = block["id"].asText()
                            val name = block["name"].asText()
                            val input = objectMapper.convertValue(block["input"], Map::class.java) as Map<String, Any>
                            assistantContentList.add(mapOf("type" to "tool_use", "id" to id, "name" to name, "input" to input))
                            toolUseBlocks.add(mapOf("id" to id, "name" to name, "input" to input))
                        }
                    }
                }
                AiProvider.GOOGLE -> {
                    val response = geminiClient.sendMessage(
                        systemPrompt = agent.systemPrompt,
                        messages = messages,
                        model = agent.model,
                        tools = tools
                    )
                    val candidates = response.candidates().orElse(null)
                    val candidate = if (candidates != null && candidates.isNotEmpty()) candidates[0] else null
                    val contentOpt = candidate?.content()
                    val partsOpt = contentOpt?.orElse(null)?.parts()
                    val parts = partsOpt?.orElse(null)
                    
                    parts?.forEach { part: Part ->
                        val textOpt = part.text()
                        if (textOpt.isPresent) {
                            val text = textOpt.get()
                            assistantContentList.add(mapOf("type" to "text", "text" to text))
                            textResponseMessage += text
                        }
                        val fcOpt = part.functionCall()
                        if (fcOpt.isPresent) {
                            val fc: FunctionCall = fcOpt.get()
                            val id = "gemini-${System.currentTimeMillis()}"
                            val name = fc.name().orElse("")
                            val args = fc.args().orElse(emptyMap<String, Any>()) as Map<String, Any>
                            assistantContentList.add(mapOf("type" to "tool_use", "id" to id, "name" to name, "input" to args))
                            toolUseBlocks.add(mapOf("id" to id, "name" to name, "input" to args))
                        }
                    }
                }
                else -> throw RuntimeException("지원되지 않는 프로바이더입니다.")
            }

            messages.add(mapOf("role" to "assistant", "content" to assistantContentList))

            if (toolUseBlocks.isEmpty()) {
                lastResponse = textResponseMessage
                loop = false
            } else {
                for (block in toolUseBlocks) {
                    val toolUseId = block["id"] as String
                    val toolName = block["name"] as String
                    val input = block["input"] as Map<String, Any>
                    
                    val inputStr = objectMapper.writeValueAsString(input)
                    sendMessage(roomId, agent.name, "🛠️ 도구 사용: $toolName ($inputStr)", MessageType.TOOL)

                    val result = try {
                        when (toolName) {
                            "search_files" -> handleSearchFiles(input["pattern"] as? String ?: "")
                            "read_file" -> handleReadFile(input["path"] as? String ?: "")
                            "write_file" -> handleWriteFile(input["path"] as? String ?: "", input["content"] as? String ?: "")
                            "list_directory" -> handleListDirectory(input["path"] as? String ?: ".")
                            "delete_file" -> handleDeleteFile(input["path"] as? String ?: "")
                            "run_command" -> handleRunCommand(input["command"] as? String ?: "")
                            "call_agent" -> handleCallAgent(input["agent_name"] as? String ?: "", input["task"] as? String ?: "", roomId)
                            else -> "알 수 없는 도구: $toolName"
                        }
                    } catch (e: Exception) {
                        "도구 실행 중 오류: ${e.message}"
                    }
                    
                    messages.add(mapOf(
                        "role" to "user",
                        "content" to listOf(mapOf(
                            "type" to "tool_result",
                            "name" to toolName,
                            "tool_use_id" to toolUseId,
                            "content" to result
                        ))
                    ))
                    
                    sendMessage(roomId, agent.name, "✅ 도구 결과: $toolName 실행 완료", MessageType.TOOL)
                }
            }
        }
        return lastResponse
    }

    private fun handleCallAgent(agentName: String, task: String, roomId: String): String {
        val targetAgent = agentService.getAllAgents().find { it.name == agentName }
            ?: return "에이전트 '$agentName'(을)를 찾을 수 없습니다."

        sendMessage(roomId, agentName, "🤝 [협업 요청 수신]: $task", MessageType.AGENT)
        
        val subMessages = mutableListOf<Map<String, Any>>()
        subMessages.add(mapOf("role" to "user", "content" to task))
        
        return try {
            val response = runReasoningLoop(targetAgent, roomId, subMessages)
            "에이전트 '$agentName'의 응답: $response"
        } catch (e: Exception) {
            "에이전트 호출 중 오류: ${e.message}"
        }
    }

    private fun handleSearchFiles(pattern: String): String {
        val root = File(".")
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
            else file.readText().take(10000)
        } catch (e: Exception) {
            "파일 읽기 오류: ${e.message}"
        }
    }

    private fun handleWriteFile(path: String, content: String): String {
        return try {
            val file = File(path)
            file.parentFile?.mkdirs()
            file.writeText(content)
            "파일 저장 완료: ${file.absolutePath}"
        } catch (e: Exception) {
            "파일 쓰기 오류: ${e.message}"
        }
    }

    private fun handleListDirectory(path: String): String {
        return try {
            val dir = File(path)
            if (!dir.exists() || !dir.isDirectory) return "디렉토리가 존재하지 않습니다: $path"
            val files = dir.listFiles()?.joinToString("\n") { 
                (if (it.isDirectory) "[DIR] " else "[FILE] ") + it.name 
            } ?: "디렉토리가 비어있거나 접근할 수 없습니다."
            "목록:\n$files"
        } catch (e: Exception) {
            "디렉토리 조회 오류: ${e.message}"
        }
    }

    private fun handleDeleteFile(path: String): String {
        return try {
            val file = File(path)
            if (!file.exists()) return "파일이 존재하지 않습니다: $path"
            if (file.delete()) "파일 삭제 완료: $path" else "파일 삭제 실패"
        } catch (e: Exception) {
            "파일 삭제 오류: ${e.message}"
        }
    }

    private fun handleRunCommand(command: String): String {
        return try {
            val process = Runtime.getRuntime().exec(command)
            val output = process.inputStream.bufferedReader().readText()
            val error = process.errorStream.bufferedReader().readText()
            
            if (error.isNotEmpty()) {
                "명령어 실행 결과:\n$output\n오류:\n$error"
            } else {
                "명령어 실행 결과:\n$output"
            }
        } catch (e: Exception) {
            "명령어 실행 오류: ${e.message}"
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