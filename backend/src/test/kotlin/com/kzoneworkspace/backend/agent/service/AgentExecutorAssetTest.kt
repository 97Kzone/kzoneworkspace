package com.kzoneworkspace.backend.agent.service

import com.kzoneworkspace.backend.agent.entity.*
import com.kzoneworkspace.backend.agent.repository.*
import com.kzoneworkspace.backend.claude.*
import com.kzoneworkspace.backend.task.service.TaskService
import com.kzoneworkspace.backend.websocket.ChatMessageRepository
import com.kzoneworkspace.backend.tools.BrowserService
import com.kzoneworkspace.backend.tools.GitService
import com.kzoneworkspace.backend.tools.CodeReviewService
import com.kzoneworkspace.backend.task.service.SchedulingService
import com.kzoneworkspace.backend.agent.service.CognitiveTraceService
import java.util.Collections
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test
import org.mockito.ArgumentMatchers.*
import org.mockito.Mockito.*
import org.springframework.messaging.simp.SimpMessagingTemplate

class AgentExecutorAssetTest {

    private val claudeClient = mock(ClaudeClient::class.java)
    private val geminiClient = mock(GeminiClient::class.java)
    private val agentService = mock(AgentService::class.java)
    private val taskService = mock(TaskService::class.java)
    private val projectContextService = mock(ProjectContextService::class.java)
    private val messagingTemplate = mock(SimpMessagingTemplate::class.java)
    private val chatMessageRepository = mock(ChatMessageRepository::class.java)
    private val browserService = mock(BrowserService::class.java)
    private val memoryService = mock(MemoryService::class.java)
    private val memoryExtractionService = mock(MemoryExtractionService::class.java)
    private val gitService = mock(GitService::class.java)
    private val collaborationService = mock(CollaborationService::class.java)
    private val codeReviewService = mock(CodeReviewService::class.java)
    private val activityLogService = mock(ActivityLogService::class.java)
    private val cognitiveTraceService = mock(CognitiveTraceService::class.java)
    private val schedulingService = mock(SchedulingService::class.java)
    private val codebaseIndexingService = mock(CodebaseIndexingService::class.java)
    private val shadowWorkspaceService = mock(ShadowWorkspaceService::class.java)
    private val lessonService = mock(LessonService::class.java)
    private val missionIntelligenceService = mock(MissionIntelligenceService::class.java)
    private val officeItemRepository = mock(OfficeItemRepository::class.java)
    private val assetUtilizationLogRepository = mock(AssetUtilizationLogRepository::class.java)
    private val apiTrafficService = mock(com.kzoneworkspace.backend.agent.service.ApiTrafficService::class.java)

    private fun createAgentExecutor() = AgentExecutor(
        claudeClient = claudeClient,
        geminiClient = geminiClient,
        agentService = agentService,
        taskService = taskService,
        projectContextService = projectContextService,
        messagingTemplate = messagingTemplate,
        chatMessageRepository = chatMessageRepository,
        browserService = browserService,
        memoryService = memoryService,
        memoryExtractionService = memoryExtractionService,
        gitService = gitService,
        collaborationService = collaborationService,
        codeReviewService = codeReviewService,
        activityLogService = activityLogService,
        cognitiveTraceService = cognitiveTraceService,
        schedulingService = schedulingService,
        codebaseIndexingService = codebaseIndexingService,
        shadowWorkspaceService = shadowWorkspaceService,
        lessonService = lessonService,
        missionIntelligenceService = missionIntelligenceService,
        officeItemRepository = officeItemRepository,
        assetUtilizationLogRepository = assetUtilizationLogRepository,
        apiTrafficService = apiTrafficService,
        serperApiKey = ""
    )

    @Test
    fun `컴퓨팅 자산 미배치 시 RAG 및 기억 탐색 기본 한도 튜닝 테스트`() {
        val agent = Agent(
            id = 1L,
            name = "Planner",
            role = "마스터 플래너",
            model = "claude-3-5-sonnet-20241022",
            provider = AiProvider.ANTHROPIC
        )

        `when`(officeItemRepository.findByAgentId(anyLong())).thenReturn(emptyList())
        `when`(codebaseIndexingService.search(anyString(), anyInt())).thenReturn(emptyList())
        `when`(memoryService.searchSimilarMemories(anyLong(), anyString(), anyInt())).thenReturn(emptyList())
        `when`(projectContextService.getProjectContext()).thenReturn("Default Context")
        
        `when`(taskService.createTask(anyString(), anyString(), any(), any(), any(), any())).thenReturn(
            com.kzoneworkspace.backend.task.entity.Task(roomId = "room1", command = "Test Goal", agent = agent)
        )

        val mockResponse = mock(com.fasterxml.jackson.databind.JsonNode::class.java)
        val contentArray = mock(com.fasterxml.jackson.databind.JsonNode::class.java)
        `when`(mockResponse.get("content")).thenReturn(contentArray)
        `when`(contentArray.iterator()).thenReturn(Collections.emptyIterator())

        `when`(claudeClient.sendMessageREST(anyString(), anyList(), anyString(), anyList(), any())).thenReturn(mockResponse)

        val executor = createAgentExecutor()
        executor.execute(agent, "room1", "Test Goal")

        // 호출 개수가 5와 2로 트리거되었는지 정밀 검증
        verify(codebaseIndexingService, times(1)).search(anyString(), eq(5))
        verify(memoryService, times(1)).searchSimilarMemories(eq(agent.id), anyString(), eq(2))
    }

    @Test
    fun `대용량 컨텍스트 메모리 및 실시간 벡터 DB 배치 시 스캔 확장 튜닝 테스트`() {
        val agent = Agent(
            id = 1L,
            name = "Planner",
            role = "마스터 플래너",
            model = "claude-3-5-sonnet-20241022",
            provider = AiProvider.ANTHROPIC
        )

        val extendedContext = OfficeItem(name = "대용량 컨텍스트", type = "EXTENDED_CONTEXT", x = 1, y = 1, agentId = agent.id)
        val vectorSearch = OfficeItem(name = "실시간 벡터 검색", type = "VECTOR_SEARCH", x = 2, y = 2, agentId = agent.id)
        
        `when`(officeItemRepository.findByAgentId(anyLong())).thenReturn(listOf(extendedContext, vectorSearch))
        `when`(codebaseIndexingService.search(anyString(), anyInt())).thenReturn(emptyList())
        `when`(memoryService.searchSimilarMemories(anyLong(), anyString(), anyInt())).thenReturn(emptyList())
        `when`(projectContextService.getProjectContext()).thenReturn("Default Context")
        
        `when`(taskService.createTask(anyString(), anyString(), any(), any(), any(), any())).thenReturn(
            com.kzoneworkspace.backend.task.entity.Task(roomId = "room1", command = "Test Goal", agent = agent)
        )

        val mockResponse = mock(com.fasterxml.jackson.databind.JsonNode::class.java)
        val contentArray = mock(com.fasterxml.jackson.databind.JsonNode::class.java)
        `when`(mockResponse.get("content")).thenReturn(contentArray)
        `when`(contentArray.iterator()).thenReturn(Collections.emptyIterator())

        `when`(claudeClient.sendMessageREST(anyString(), anyList(), anyString(), anyList(), any())).thenReturn(mockResponse)

        val executor = createAgentExecutor()
        executor.execute(agent, "room1", "Test Goal")

        // 호출 개수가 15와 10으로 기동되었는지 정밀 검증
        verify(codebaseIndexingService, times(1)).search(anyString(), eq(15))
        verify(memoryService, times(1)).searchSimilarMemories(eq(agent.id), anyString(), eq(10))
    }

    @Test
    fun `비용 최적화 엔진 배치 시 API 트래픽 토큰 소모량 20퍼센트 절감 보정 테스트`() {
        val agent = Agent(
            id = 1L,
            name = "Planner",
            role = "마스터 플래너",
            model = "claude-3-5-sonnet-20241022",
            provider = AiProvider.ANTHROPIC
        )

        val costOptimizer = OfficeItem(name = "비용 최적화 엔진", type = "COST_OPTIMIZER", x = 1, y = 1, agentId = agent.id)
        
        `when`(officeItemRepository.findByAgentId(anyLong())).thenReturn(listOf(costOptimizer))
        `when`(codebaseIndexingService.search(anyString(), anyInt())).thenReturn(emptyList())
        `when`(memoryService.searchSimilarMemories(anyLong(), anyString(), anyInt())).thenReturn(emptyList())
        `when`(projectContextService.getProjectContext()).thenReturn("Default Context")
        
        `when`(taskService.createTask(anyString(), anyString(), any(), any(), any(), any())).thenReturn(
            com.kzoneworkspace.backend.task.entity.Task(roomId = "room1", command = "Test Goal", agent = agent)
        )

        // Mock Claude REST Response with Usage Block
        val mockResponse = mock(com.fasterxml.jackson.databind.JsonNode::class.java)
        val contentArray = mock(com.fasterxml.jackson.databind.JsonNode::class.java)
        `when`(mockResponse.get("content")).thenReturn(contentArray)
        `when`(contentArray.iterator()).thenReturn(Collections.emptyIterator())

        val usageNode = mock(com.fasterxml.jackson.databind.JsonNode::class.java)
        val inputTokensNode = mock(com.fasterxml.jackson.databind.JsonNode::class.java)
        val outputTokensNode = mock(com.fasterxml.jackson.databind.JsonNode::class.java)
        `when`(mockResponse.get("usage")).thenReturn(usageNode)
        `when`(usageNode.get("input_tokens")).thenReturn(inputTokensNode)
        `when`(usageNode.get("output_tokens")).thenReturn(outputTokensNode)
        `when`(inputTokensNode.asLong()).thenReturn(1000L)
        `when`(outputTokensNode.asLong()).thenReturn(500L)

        `when`(claudeClient.sendMessageREST(anyString(), anyList(), anyString(), anyList(), any())).thenReturn(mockResponse)

        val executor = createAgentExecutor()
        executor.execute(agent, "room1", "Test Goal")

        // COST_OPTIMIZER가 적용되어 1000 -> 800, 500 -> 400 으로 logTraffic이 호출되어야 함
        verify(apiTrafficService, times(1)).logTraffic(
            agent.id,
            agent.name,
            agent.provider,
            agent.model,
            800L,
            400L
        )
    }
}
