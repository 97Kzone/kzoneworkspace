package com.kzoneworkspace.backend.agent.repository

import com.kzoneworkspace.backend.agent.entity.StrategicRecommendation
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface StrategicRecommendationRepository : JpaRepository<StrategicRecommendation, Long> {
    fun findByStatusOrderByCreatedAtDesc(status: String): List<StrategicRecommendation>
    fun findByOrderByCreatedAtDesc(): List<StrategicRecommendation>
    fun findByTitle(title: String): StrategicRecommendation?
}
