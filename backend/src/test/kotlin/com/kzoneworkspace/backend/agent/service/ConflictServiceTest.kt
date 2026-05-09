package com.kzoneworkspace.backend.agent.service

import com.kzoneworkspace.backend.agent.entity.Conflict
import com.kzoneworkspace.backend.agent.repository.ConflictRepository
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.Test
import org.mockito.ArgumentMatchers.any
import org.mockito.Mockito.`when`
import org.mockito.Mockito.mock
import java.util.*

class ConflictServiceTest {

    private val conflictRepository = mock(ConflictRepository::class.java)
    private val conflictService = ConflictService(conflictRepository)

    @Test
    fun `갈등 생성 테스트`() {
        // given
        val title = "테스트 갈등"
        val description = "내용"
        val agent1 = "AgentA"
        val agent2 = "AgentB"
        val expectedConflict = Conflict(title = title, description = description, agent1Name = agent1, agent2Name = agent2)
        
        `when`(conflictRepository.save(any(Conflict::class.java))).thenReturn(expectedConflict)

        // when
        val result = conflictService.createConflict(title, description, agent1, agent2)

        // then
        assertNotNull(result)
        assertEquals(title, result.title)
    }

    @Test
    fun `갈등 해결 테스트`() {
        // given
        val id = 1L
        val conflict = Conflict(id = id, title = "갈등", description = "내용", agent1Name = "A", agent2Name = "B")
        `when`(conflictRepository.findById(id)).thenReturn(Optional.of(conflict))
        `when`(conflictRepository.save(conflict)).thenReturn(conflict)

        // when
        val resolved = conflictService.resolveConflict(id, "해결책", "중재자")

        // then
        assertEquals("RESOLVED", resolved.status)
        assertEquals("해결책", resolved.resolution)
        assertEquals("중재자", resolved.mediatorName)
    }
}
