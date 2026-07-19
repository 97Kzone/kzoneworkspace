package com.kzoneworkspace.backend.agent.service

import com.google.genai.types.Candidate
import com.google.genai.types.Content
import com.google.genai.types.GenerateContentResponse
import com.google.genai.types.Part
import com.kzoneworkspace.backend.agent.entity.*
import com.kzoneworkspace.backend.agent.repository.*
import com.kzoneworkspace.backend.claude.GeminiClient
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.mockito.ArgumentMatchers.anyList
import org.mockito.ArgumentMatchers.anyString
import org.mockito.Mock
import org.mockito.Mockito.*
import org.mockito.MockitoAnnotations
import java.util.Optional

class BrainstormingServiceTest {

    @Mock private lateinit var brainstormingRepository: BrainstormingRepository
    @Mock private lateinit var contributionRepository: BrainstormingContributionRepository
    @Mock private lateinit var agentRepository: AgentRepository
    @Mock private lateinit var geminiClient: GeminiClient
    @Mock private lateinit var codebaseIndexingService: CodebaseIndexingService
    @Mock private lateinit var collaborationService: CollaborationService
    @Mock private lateinit var synergyRepository: AgentSynergyRepository
    @Mock private lateinit var officeItemRepository: OfficeItemRepository
    @Mock private lateinit var assetUtilizationLogRepository: AssetUtilizationLogRepository
    @Mock private lateinit var agentService: AgentService

    private lateinit var brainstormingService: BrainstormingService

    @BeforeEach
    fun setUp() {
        MockitoAnnotations.openMocks(this)
        brainstormingService = BrainstormingService(
            brainstormingRepository,
            contributionRepository,
            agentRepository,
            geminiClient,
            codebaseIndexingService,
            collaborationService,
            synergyRepository,
            officeItemRepository,
            assetUtilizationLogRepository,
            agentService
        )
    }

    @Test
    fun `브레인스토밍 시작 및 정량분석 종합 보고서 합성 검증`() {
        val roomId = "room1"
        val goal = "새로운 실시간 알림 아키텍처 설계"
        val agentId1 = 1L
        val agentId2 = 2L
        
        val agent1 = Agent(
            id = agentId1, 
            name = "PlannerAgent", 
            role = "마스터 플래너", 
            model = "gemini-2.0-flash",
            contributionPoints = 200,
            reliabilityIndex = 85
        )
        val agent2 = Agent(
            id = agentId2, 
            name = "CoderAgent", 
            role = "개발자", 
            model = "gemini-2.0-flash",
            contributionPoints = 150,
            reliabilityIndex = 90
        )

        `when`(agentRepository.findAllById(listOf(agentId1, agentId2))).thenReturn(listOf(agent1, agent2))
        `when`(agentService.getPersonaPrompt(agent1)).thenReturn("Mock Persona Prompt 1")
        `when`(agentService.getPersonaPrompt(agent2)).thenReturn("Mock Persona Prompt 2")
        `when`(agentService.getAssetPrompt(agentId1)).thenReturn("Mock Asset Prompt 1")
        `when`(agentService.getAssetPrompt(agentId2)).thenReturn("Mock Asset Prompt 2")
        
        // Mock Session
        val session = BrainstormingSession(roomId = roomId, goal = goal, status = BrainstormingStatus.PROPOSING)
        `when`(brainstormingRepository.save(any(BrainstormingSession::class.java))).thenAnswer { invocation ->
            invocation.getArgument(0) as BrainstormingSession
        }

        // Mock Codebase context
        `when`(codebaseIndexingService.search(anyString(), anyInt())).thenReturn(emptyList())

        // Mock Gemini response
        val mockResponse = mock(GenerateContentResponse::class.java)
        val mockCandidate = mock(Candidate::class.java)
        val mockContent = mock(Content::class.java)
        val mockPart = mock(Part::class.java)
        
        `when`(mockResponse.candidates()).thenReturn(Optional.of(listOf(mockCandidate)))
        `when`(mockCandidate.content()).thenReturn(Optional.of(mockContent))
        `when`(mockContent.parts()).thenReturn(Optional.of(listOf(mockPart)))
        `when`(mockPart.text()).thenReturn(Optional.of("제안서 및 최종 블루프린트 내용입니다."))

        `when`(geminiClient.sendMessage(
            anyString(),
            anyList(),
            anyString(),
            any(),
            any()
        )).thenReturn(mockResponse)

        // Mock Synergy between agents
        val synergy = AgentSynergy(agent1Name = "CoderAgent", agent2Name = "PlannerAgent", synergyScore = 80)
        `when`(synergyRepository.findByAgent1NameAndAgent2Name("CoderAgent", "PlannerAgent")).thenReturn(synergy)

        // Mock Office Assets
        val costOptimizer = OfficeItem(name = "비용 최적화 엔진", type = "COST_OPTIMIZER", agentId = agentId1)
        val synergyBridge = OfficeItem(name = "협업 시너지 브릿지", type = "SYNERGY_BRIDGE", agentId = agentId2)
        `when`(officeItemRepository.findByAgentId(agentId1)).thenReturn(listOf(costOptimizer))
        `when`(officeItemRepository.findByAgentId(agentId2)).thenReturn(listOf(synergyBridge))

        // When
        val resultSession = brainstormingService.startSession(roomId, goal, listOf(agentId1, agentId2))

        // Then
        assertNotNull(resultSession)
        assertEquals(BrainstormingStatus.COMPLETED, resultSession.status)
        assertNotNull(resultSession.finalBlueprint)
        
        val blueprint = resultSession.finalBlueprint!!
        assertTrue(blueprint.contains("군집 지능 정량적 분석 보고서"))
        assertTrue(blueprint.contains("PlannerAgent"))
        assertTrue(blueprint.contains("CoderAgent"))
        
        // 두 에이전트의 신뢰성 지수 평균: (85 + 90) / 2 = 87.5%
        assertTrue(blueprint.contains("87.5%"))
        
        // 두 에이전트의 총 비즈니스 기여도: 200 + 150 = 350
        assertTrue(blueprint.contains("350 pts"))

        // Synergy Bridge가 활성화되었으므로 기본 시너지 80에 1.15를 곱하여 92.0%
        assertTrue(blueprint.contains("92.0%"))
        
        // Cost Optimizer가 있으므로 20%
        assertTrue(blueprint.contains("20%"))

        // 자산 활용 로그가 올바르게 호출 및 저장되었는지 검증
        verify(assetUtilizationLogRepository, atLeastOnce()).save(any(AssetUtilizationLog::class.java))

        // 에이전트 인지 특성 및 자산 프롬프트 생성 호출 검증
        verify(agentService, times(1)).getPersonaPrompt(agent1)
        verify(agentService, times(1)).getPersonaPrompt(agent2)
        verify(agentService, times(1)).getAssetPrompt(agentId1)
        verify(agentService, times(1)).getAssetPrompt(agentId2)
    }
}
