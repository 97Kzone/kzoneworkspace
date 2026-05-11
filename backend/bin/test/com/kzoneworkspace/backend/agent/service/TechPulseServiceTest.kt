package com.kzoneworkspace.backend.agent.service

import com.kzoneworkspace.backend.agent.entity.TechPulse
import com.kzoneworkspace.backend.agent.repository.TechPulseRepository
import com.kzoneworkspace.backend.claude.GeminiClient
import com.kzoneworkspace.backend.task.service.WorkstreamService
import com.kzoneworkspace.backend.task.dto.WorkstreamRequest
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.Test
import org.mockito.ArgumentMatchers.any
import org.mockito.Mockito.`when`
import org.mockito.Mockito.mock
import java.util.*

class TechPulseServiceTest {

    private val techPulseRepository = mock(TechPulseRepository::class.java)
    private val geminiClient = mock(GeminiClient::class.java)
    private val codebaseIndexingService = mock(CodebaseIndexingService::class.java)
    private val workstreamService = mock(WorkstreamService::class.java)

    private val techPulseService = TechPulseService(
        techPulseRepository,
        geminiClient,
        codebaseIndexingService,
        workstreamService
    )

    @Test
    fun `TechPulse 기반 태스크 생성 테스트`() {
        // given
        val id = 1L
        val pulse = TechPulse(
            id = id,
            title = "테스트 트렌드",
            category = "AI",
            description = "설명",
            impactScore = 8,
            projectImpact = "영향"
        )
        `when`(techPulseRepository.findById(id)).thenReturn(Optional.of(pulse))
        val goal = "TechPulse 대응: 테스트 트렌드\n\n분석 내용:\n영향"
        val request = WorkstreamRequest(roomId = "tech-pulse", goal = goal)
        `when`(workstreamService.startWorkstream(request)).thenReturn(100L)
        `when`(techPulseRepository.save(pulse)).thenReturn(pulse)

        // when
        val missionId = techPulseService.createTaskFromPulse(id)

        // then
        assertEquals(100L, missionId)
        assertEquals(100L, pulse.missionId)
    }
}
