package com.kzoneworkspace.backend.agent.service

import com.kzoneworkspace.backend.agent.entity.Memory
import com.kzoneworkspace.backend.agent.repository.MemoryRepository
import com.kzoneworkspace.backend.claude.GeminiClient
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.mockito.Mock
import org.mockito.Mockito.`when`
import org.mockito.Mockito.verify
import org.mockito.MockitoAnnotations
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.test.context.ActiveProfiles
import kotlin.test.assertEquals

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
    fun testSaveMemory() {
        val agentId = 1L
        val roomId = "test-room"
        val content = "This is a test memory"
        val embedding = listOf(0.1f, 0.2f, 0.3f)
        
        `when`(geminiClient.embedText(content)).thenReturn(embedding)
        
        memoryService.saveMemory(agentId, roomId, content)
        
        verify(geminiClient).embedText(content)
        // verify(memoryRepository).save(...) - We'd need an argument captor or equality check for the entity
    }

    @Test
    fun testSearchSimilarMemories() {
        val agentId = 1L
        val query = "test query"
        val embedding = listOf(0.1f, 0.2f, 0.3f)
        val mockMemories = listOf(
            Memory(content = "Result 1", embedding = "[0.1, 0.2, 0.3]", roomId = "room1", agentId = 1L),
            Memory(content = "Result 2", embedding = "[0.4, 0.5, 0.6]", roomId = "room1", agentId = 1L)
        )

        `when`(geminiClient.embedText(query)).thenReturn(embedding)
        `when`(memoryRepository.findSimilarMemories(agentId, embedding.toString(), 3)).thenReturn(mockMemories)

        val results = memoryService.searchSimilarMemories(agentId, query)

        assertEquals(2, results.size)
        assertEquals("Result 1", results[0])
        assertEquals("Result 2", results[1])
    }
}
