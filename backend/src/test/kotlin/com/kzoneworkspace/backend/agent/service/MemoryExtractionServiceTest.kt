package com.kzoneworkspace.backend.agent.service

import com.kzoneworkspace.backend.claude.GeminiClient
import com.google.genai.types.GenerateContentResponse
import com.google.genai.types.Candidate
import com.google.genai.types.Content
import com.google.genai.types.Part
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.mockito.Mock
import org.mockito.Mockito.`when`
import org.mockito.Mockito.verify
import org.mockito.Mockito.mock
import org.mockito.MockitoAnnotations
import java.util.Optional

class MemoryExtractionServiceTest {

    @Mock
    private lateinit var geminiClient: GeminiClient

    @Mock
    private lateinit var memoryService: MemoryService

    private lateinit var memoryExtractionService: MemoryExtractionService

    @BeforeEach
    fun setUp() {
        MockitoAnnotations.openMocks(this)
        memoryExtractionService = MemoryExtractionService(geminiClient, memoryService)
    }

    @Test
    fun `extractAndSaveMemory should extract facts and save them`() {
        // Given
        val agentId = 1L
        val roomId = "room1"
        val content = "저는 서울에 살고 있고, 강아지를 키워요."
        
        // Mock Gemini response (올바른 JSON 포맷 리턴)
        val jsonResponse = """
            [
              {"content": "서울에 살고 있음", "importance": 5.0, "tags": "주거지"},
              {"content": "강아지를 키움", "importance": 7.0, "tags": "반려동물"}
            ]
        """.trimIndent()
        
        val mockResponse = mock(GenerateContentResponse::class.java)
        val mockCandidate = mock(Candidate::class.java)
        val mockContent = mock(Content::class.java)
        val mockPart = mock(Part::class.java)
        
        `when`(mockResponse.candidates()).thenReturn(Optional.of(listOf(mockCandidate)))
        `when`(mockCandidate.content()).thenReturn(Optional.of(mockContent))
        `when`(mockContent.parts()).thenReturn(Optional.of(listOf(mockPart)))
        `when`(mockPart.text()).thenReturn(Optional.of(jsonResponse))
        
        // 기대되는 프롬프트 문자열 조립 (프로덕션 내부 로직과 100% 동일)
        val expectedPrompt = """
            당신은 기억 추출 전문가입니다. 사용자와 AI 에이전트 간의 대화 내용을 분석하여, 나중에 기억해야 할 '중요한 사실'이나 '사용자의 선호도'를 추출하세요.
            
            각 기억 항목에 대해 다음 정보를 JSON 형식으로 제공하세요:
            - content: 추출된 기억 내용 (짧고 명확한 단정적 문장)
            - importance: 이 정보의 중요도 (1~10 점수. 10이 가장 중요)
            - tags: 관련 태그 (쉼표로 구분된 문자열, 예: "선호도, 색상")
            
            규칙:
            1. 새로운 정보가 없다면 빈 리스트 `[]`를 반환하세요.
            2. 응답은 오직 JSON 리스트 형식이어야 합니다.
            
            대화 내용:
            저는 서울에 살고 있고, 강아지를 키워요.
        """.trimIndent()

        // Matcher를 단 하나도 쓰지 않는 극단적이고 완전한 구체 값 매칭 (NPE 및 Matcher 에러 물리적 방지)
        `when`(geminiClient.sendMessage(
            expectedPrompt,
            listOf(mapOf("role" to "user", "content" to "위 대화에서 기억할 내용을 추출해줘.")),
            "gemini-2.0-flash",
            null,
            null
        )).thenReturn(mockResponse)

        // When
        memoryExtractionService.extractAndSaveMemory(agentId, roomId, content)

        // Then
        // verify 단계에서도 매처를 0개 사용하여 정적 타입 안정성 및 Null-safety 완전 격리
        verify(memoryService).saveMemory(1L, "room1", "서울에 살고 있음", 5, "주거지")
        verify(memoryService).saveMemory(1L, "room1", "강아지를 키움", 7, "반려동물")
    }
}
