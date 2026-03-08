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
import com.kzoneworkspace.backend.tools.BrowserService
import org.springframework.beans.factory.annotation.Value
import com.kzoneworkspace.backend.agent.service.MemoryService
import java.net.URLEncoder

@Service
class AgentExecutor(
    private val claudeClient: ClaudeClient,
    private val geminiClient: GeminiClient,
    private val agentService: AgentService,
    private val taskService: TaskService,
    private val projectContextService: ProjectContextService,
    private val messagingTemplate: SimpMessagingTemplate,
    private val chatMessageRepository: ChatMessageRepository,
    private val browserService: BrowserService,
    private val memoryService: MemoryService,
    @Value("\${SERPER_API_KEY:}") private val serperApiKey: String
) {
    private val objectMapper = jacksonObjectMapper()
    private val httpClient = java.net.http.HttpClient.newHttpClient()

    fun execute(agent: Agent, roomId: String, userMessage: String) {
        val task = taskService.createTask(roomId, userMessage, agent)
        taskService.updateStatus(task.id, TaskStatus.RUNNING)
        sendMessage(roomId, agent.name, "업무 분석 중...", MessageType.AGENT)

        try {
            val messages = mutableListOf<Map<String, Any>>()
            
            // 장기 기억 조회 (Semantic Search)
            val relatedMemories = memoryService.searchSimilarMemories(agent.id, userMessage)
            if (relatedMemories.isNotEmpty()) {
                val memoryContext = relatedMemories.joinToString("\n---\n")
                messages.add(mapOf(
                    "role" to "user",
                    "content" to "[System: Relevant Long-term Memories]\n$memoryContext\n\n[System Context: Please use the above memories if relevant to the user goal.]"
                ))
            }

            // 프로젝트 컨텍스트 주입 (지능 고도화)
            val projectContext = projectContextService.getProjectContext()
            messages.add(mapOf(
                "role" to "user", 
                "content" to "[System Context: Project Overview]\n$projectContext\n\n[User Goal]: $userMessage"
            ))

            val lastResponse = runReasoningLoop(agent, roomId, messages)

            taskService.updateStatus(task.id, TaskStatus.COMPLETED, lastResponse)
            sendMessage(roomId, agent.name, lastResponse, MessageType.AGENT)

            // 장기 기억 저장
            memoryService.saveMemory(agent.id, roomId, "User: $userMessage\nAgent: $lastResponse")

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
            ),
            mapOf(
                "name" to "web_search",
                "description" to "실시간 인터넷 검색을 수행하여 최신 정보를 가져옵니다.",
                "input_schema" to mapOf(
                    "type" to "object",
                    "properties" to mapOf(
                        "query" to mapOf("type" to "string", "description" to "검색어")
                    ),
                    "required" to listOf("query")
                )
            ),
            mapOf(
                "name" to "browse",
                "description" to "특정 웹 페이지의 내용을 읽어옵니다. (URL 입력)",
                "input_schema" to mapOf(
                    "type" to "object",
                    "properties" to mapOf(
                        "url" to mapOf("type" to "string", "description" to "접속할 웹 페이지 URL")
                    ),
                    "required" to listOf("url")
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
                            @Suppress("UNCHECKED_CAST")
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
                             @Suppress("UNCHECKED_CAST")
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
                    @Suppress("UNCHECKED_CAST")
                    val input = block["input"] as Map<String, Any>
                    
                    val inputStr = objectMapper.writeValueAsString(input)
                    sendMessage(roomId, agent.name, "🔍 **도구 사용**: `$toolName` \n> $inputStr", MessageType.TOOL)

                    val result = try {
                        when (toolName) {
                            "search_files" -> handleSearchFiles(input["pattern"] as? String ?: "")
                            "read_file" -> handleReadFile(input["path"] as? String ?: "")
                            "write_file" -> handleWriteFile(input["path"] as? String ?: "", input["content"] as? String ?: "")
                            "list_directory" -> handleListDirectory(input["path"] as? String ?: ".")
                             "delete_file" -> handleDeleteFile(input["path"] as? String ?: "")
                            "run_command" -> handleRunCommand(input["command"] as? String ?: "")
                            "call_agent" -> handleCallAgent(input["agent_name"] as? String ?: "", input["task"] as? String ?: "", roomId)
                            "web_search" -> handleWebSearch(input["query"] as? String ?: "")
                            "browse" -> handleBrowse(input["url"] as? String ?: "")
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
                    
                    sendMessage(roomId, agent.name, "✨ **도구 실행 완료**: `$toolName`", MessageType.TOOL)
                }
            }
        }
        return lastResponse
    }

    private fun handleCallAgent(agentName: String, task: String, roomId: String): String {
        val targetAgent = agentService.getAllAgents().find { it.name == agentName }
            ?: return "에이전트 '$agentName'(을)를 찾을 수 없습니다."

        sendMessage(roomId, agentName, "🤝 **[협업 요청 수신]**\n> **요청 내용**: $task", MessageType.AGENT)
        
        val subMessages = mutableListOf<Map<String, Any>>()
        subMessages.add(mapOf("role" to "user", "content" to task))
        
        return try {
            val response = runReasoningLoop(targetAgent, roomId, subMessages)
            "🙋 **${agentName}의 보고**: $response"
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
            val isWindows = System.getProperty("os.name").lowercase().contains("win")
            val processBuilder = if (isWindows) {
                ProcessBuilder("cmd.exe", "/c", command)
            } else {
                ProcessBuilder("sh", "-c", command)
            }
            
            val process = processBuilder.start()
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

    private fun handleWebSearch(query: String): String {
        if (serperApiKey.isEmpty()) {
            val searchUrl = "https://www.google.com/search?q=${URLEncoder.encode(query, "UTF-8")}"
            return "SERPER_API_KEY가 설정되어 있지 않아 브라우저를 통해 직접 검색을 시도합니다...\n\n" +
                   handleBrowse(searchUrl)
        }
        
        return try {
            val body = mapOf("q" to query)
            val request = java.net.http.HttpRequest.newBuilder()
                .uri(java.net.URI.create("https://google.serper.dev/search"))
                .header("X-API-KEY", serperApiKey)
                .header("Content-Type", "application/json")
                .POST(java.net.http.HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(body)))
                .build()

            val response = httpClient.send(request, java.net.http.HttpResponse.BodyHandlers.ofString())
            if (response.statusCode() != 200) {
                return "검색 오류 (${response.statusCode()}): ${response.body()}"
            }
            
            val json = objectMapper.readTree(response.body())
            val organic = json["organic"]
            val results = mutableListOf<String>()
            
            organic?.forEach { node ->
                val title = node["title"]?.asText() ?: ""
                val link = node["link"]?.asText() ?: ""
                val snippet = node["snippet"]?.asText() ?: ""
                results.add("- **$title**\n  $link\n  $snippet")
            }
            
            if (results.isEmpty()) "검색 결과가 없습니다." else "검색 결과:\n" + results.joinToString("\n\n")
        } catch (e: Exception) {
            "검색 실행 중 오류: ${e.message}"
        }
    }

    private fun handleBrowse(url: String): String {
        return try {
            val content = browserService.navigateAndGetText(url)
            if (content.length > 5000) {
                content.take(5000) + "\n... (truncated for brevity)"
            } else {
                content
            }
        } catch (e: Exception) {
            "브라우저 탐색 중 오류: ${e.message}"
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