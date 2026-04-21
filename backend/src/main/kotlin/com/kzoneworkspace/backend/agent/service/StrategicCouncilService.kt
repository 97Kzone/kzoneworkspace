package com.kzoneworkspace.backend.agent.service

import com.kzoneworkspace.backend.agent.entity.StrategicRecommendation
import com.kzoneworkspace.backend.agent.repository.StrategicRecommendationRepository
import com.kzoneworkspace.backend.task.dto.WorkstreamRequest
import com.kzoneworkspace.backend.task.service.WorkstreamService
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDateTime

@Service
class StrategicCouncilService(
    private val recommendationRepository: StrategicRecommendationRepository,
    private val workstreamService: WorkstreamService
) {
    private val log = LoggerFactory.getLogger(StrategicCouncilService::class.java)

    fun getAllRecommendations(): List<StrategicRecommendation> =
        recommendationRepository.findByOrderByCreatedAtDesc()

    @Transactional
    fun approveAndExecute(id: Long) {
        val recommendation = recommendationRepository.findById(id).orElseThrow {
            RuntimeException("Recommendation not found: $id")
        }

        if (recommendation.status == "EXECUTED") {
            throw RuntimeException("Recommendation already executed: $id")
        }

        log.info("Approving and executing strategic recommendation: ${recommendation.title}")

        // 1. Mark as APPROVED
        recommendation.status = "APPROVED"
        recommendationRepository.save(recommendation)

        // 2. Trigger Workstream
        val missionGoal = "전략적 제안 실행: ${recommendation.title}\n\n상세 내용: ${recommendation.description}"
        val roomId = "STRATEGIC_COUNCIL" // Common room for council missions
        
        workstreamService.startWorkstream(WorkstreamRequest(roomId, missionGoal))

        // 3. Mark as EXECUTED
        recommendation.status = "EXECUTED"
        recommendationRepository.save(recommendation)
        
        log.info("Strategic mission launched successfully for: ${recommendation.title}")
    }

    @Transactional
    fun reject(id: Long) {
        val recommendation = recommendationRepository.findById(id).orElseThrow {
            RuntimeException("Recommendation not found: $id")
        }
        recommendation.status = "REJECTED"
        recommendationRepository.save(recommendation)
    }
}
