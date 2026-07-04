package com.kzoneworkspace.backend.agent.service

import com.kzoneworkspace.backend.agent.entity.Memory
import com.kzoneworkspace.backend.agent.repository.AgentRepository
import com.kzoneworkspace.backend.agent.repository.MemoryRepository
import com.kzoneworkspace.backend.claude.GeminiClient
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.mockito.Mock
import org.mockito.Mockito.`when`
import org.mockito.Mockito.verify
import org.mockito.Mockito.verifyNoInteractions
import org.mockito.MockitoAnnotations
import kotlin.test.assertEquals
import kotlin.test.assertTrue

class MemoryServiceTest {

    @Mock
    private lateinit var memoryRepository: MemoryRepository

    @Mock
    private lateinit var agentRepository: AgentRepository

    @Mock
    private lateinit var geminiClient: GeminiClient

    private lateinit var memoryService: MemoryService

    @BeforeEach
    fun setUp() {
        MockitoAnnotations.openMocks(this)
        memoryService = MemoryService(memoryRepository, agentRepository, geminiClient)
    }

    @Test
    fun `saveMemory should save memory when content is valid`() {
        // Given
        val agentId = 1L
        val roomId = "test-room"
        val content = "This is a test memory"
        val embedding = listOf(0.1f, 0.2f, 0.3f)
        
        `when`(geminiClient.embedText("This is a test memory", "gemini-embedding-001")).thenReturn(embedding)
        
        // When
        memoryService.saveMemory(agentId, roomId, content)
        
        // Then
        verify(geminiClient).embedText("This is a test memory")
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

        `when`(geminiClient.embedText("test query", "gemini-embedding-001")).thenReturn(embedding)
        `when`(memoryRepository.findSimilarMemories(1L, "[0.1, 0.2, 0.3]", 3))
            .thenReturn(mockMemories)

        // When
        val results = memoryService.searchSimilarMemories(agentId, query)

        // Then
        assertEquals(2, results.size)
        assertEquals("Result 1", results[0])
        assertEquals("Result 2", results[1])
        verify(geminiClient).embedText("test query")
        verify(memoryRepository).findSimilarMemories(1L, "[0.1, 0.2, 0.3]", 3)
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
        `when`(geminiClient.embedText("error query", "gemini-embedding-001")).thenThrow(RuntimeException("API Error"))
        
        // When
        val results = memoryService.searchSimilarMemories(1L, "error query")
        
        // Then
        assertTrue(results.isEmpty())
    }

    @Test
    fun `getAllMemories should return list of MemoryResponse preserving importance and tags`() {
        // Given
        val mockMemories = listOf(
            Memory(id = 101L, content = "Important Memory", embedding = "[0.1]", roomId = "room1", agentId = 1L, importance = 9, tags = "CORE,TEST")
        )
        `when`(memoryRepository.findAllNative()).thenReturn(mockMemories)
        
        // When
        val results = memoryService.getAllMemories(10)
        
        // Then
        assertEquals(1, results.size)
        assertEquals(101L, results[0].id)
        assertEquals("Important Memory", results[0].content)
        assertEquals(9, results[0].importance)
        assertEquals("CORE,TEST", results[0].tags)
        verify(memoryRepository).findAllNative()
    }

    @Test
    fun `searchMemories should return similar memories preserving importance and tags`() {
        // Given
        val agentId = 1L
        val query = "search query"
        val embedding = listOf(0.1f, 0.2f)
        val mockMemories = listOf(
            Memory(id = 202L, content = "Found Memory", embedding = "[0.1, 0.2]", roomId = "room1", agentId = 1L, importance = 8, tags = "SEARCH")
        )
        `when`(geminiClient.embedText("search query", "gemini-embedding-001")).thenReturn(embedding)
        `when`(memoryRepository.findSimilarMemories(agentId, "[0.1, 0.2]", 5)).thenReturn(mockMemories)
        
        // When
        val results = memoryService.searchMemories(agentId, query, 5)
        
        // Then
        assertEquals(1, results.size)
        assertEquals(202L, results[0].id)
        assertEquals(8, results[0].importance)
        assertEquals("SEARCH", results[0].tags)
        verify(geminiClient).embedText("search query")
        verify(memoryRepository).findSimilarMemories(agentId, "[0.1, 0.2]", 5)
    }
}
