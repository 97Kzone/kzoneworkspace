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
import org.mockito.Mockito.times
import org.mockito.Mockito.any
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
        
        // Mock Gemini response
        val mockResponse = MockGenerateContentResponse("서울에 살고 있음\n강아지를 키움")
        
        `when`(geminiClient.sendMessage(any(), any(), any(), any())).thenReturn(mockResponse)

        // When
        memoryExtractionService.extractAndSaveMemory(agentId, roomId, content)

        // Then
        verify(memoryService).saveMemory(agentId, roomId, "서울에 살고 있음")
        verify(memoryService).saveMemory(agentId, roomId, "강아지를 키움")
    }

    // Helper to mock complex Gemini response
    private fun MockGenerateContentResponse(text: String): GenerateContentResponse {
        val part = Part.builder().text(text).build()
        val content = Content.builder().parts(listOf(part)).build()
        val candidate = Candidate.builder().content(content).build()
        return GenerateContentResponse.builder().candidates(listOf(candidate)).build()
    }
}
