package com.kzoneworkspace.backend.agent.service

import com.kzoneworkspace.backend.agent.entity.Memory
import com.kzoneworkspace.backend.agent.repository.MemoryRepository
import com.kzoneworkspace.backend.claude.GeminiClient
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.mockito.ArgumentMatchers.any
import org.mockito.ArgumentMatchers.eq
import org.mockito.Mock
import org.mockito.Mockito.`when`
import org.mockito.Mockito.verify
import org.mockito.Mockito.verifyNoInteractions
import org.mockito.MockitoAnnotations
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.test.context.ActiveProfiles
import kotlin.test.assertEquals
import kotlin.test.assertTrue

class MemoryServiceTest {

    @Mock
    private lateinit var memoryRepository: MemoryRepository

    @Mock
    private lateinit var geminiClient: GeminiClient

    private lateinit var memoryService: MemoryService

    @BeforeEach
    fun setUp() {
        MockitoAnnotations.openMocks(this)
        memoryService = MemoryService(memoryRepository, geminiClient)
    }

    @Test
    fun `saveMemory should save memory when content is valid`() {
        // Given
        val agentId = 1L
        val roomId = "test-room"
        val content = "This is a test memory"
        val embedding = listOf(0.1f, 0.2f, 0.3f)
        
        `when`(geminiClient.embedText(content)).thenReturn(embedding)
        
        // When
        memoryService.saveMemory(agentId, roomId, content)
        
        // Then
        verify(geminiClient).embedText(content)
        verify(memoryRepository).save(any())
    }

    @Test
    fun `saveMemory should not save when content is blank`() {
        // When
        memoryService.saveMemory(1L, "room", "   ")
        
        // Then
        verifyNoInteractions(geminiClient)
        verifyNoInteractions(memoryRepository)
    }

    @Test
    fun `searchSimilarMemories should return list of contents when query is valid`() {
        // Given
        val agentId = 1L
        val query = "test query"
        val embedding = listOf(0.1f, 0.2f, 0.3f)
        val mockMemories = listOf(
            Memory(content = "Result 1", embedding = "[0.1, 0.2, 0.3]", roomId = "room1", agentId = 1L),
            Memory(content = "Result 2", embedding = "[0.4, 0.5, 0.6]", roomId = "room1", agentId = 1L)
        )

        `when`(geminiClient.embedText(query)).thenReturn(embedding)
        `when`(memoryRepository.findSimilarMemories(eq(agentId), eq(embedding.toString()), eq(3)))
            .thenReturn(mockMemories)

        // When
        val results = memoryService.searchSimilarMemories(agentId, query)

        // Then
        assertEquals(2, results.size)
        assertEquals("Result 1", results[0])
        assertEquals("Result 2", results[1])
        verify(geminiClient).embedText(query)
        verify(memoryRepository).findSimilarMemories(eq(agentId), eq(embedding.toString()), eq(3))
    }

    @Test
    fun `searchSimilarMemories should return empty list when query is blank`() {
        // When
        val results = memoryService.searchSimilarMemories(1L, "")
        
        // Then
        assertTrue(results.isEmpty())
        verifyNoInteractions(geminiClient)
        verifyNoInteractions(memoryRepository)
    }

    @Test
    fun `searchSimilarMemories should return empty list when exception occurs`() {
        // Given
        `when`(geminiClient.embedText(any())).thenThrow(RuntimeException("API Error"))
        
        // When
        val results = memoryService.searchSimilarMemories(1L, "error query")
        
        // Then
        assertTrue(results.isEmpty())
    }
}
