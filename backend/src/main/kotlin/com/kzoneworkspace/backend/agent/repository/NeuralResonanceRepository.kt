package com.kzoneworkspace.backend.agent.repository

import com.kzoneworkspace.backend.agent.entity.NeuralResonance
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface NeuralResonanceRepository : JpaRepository<NeuralResonance, Long> {
    fun findTop10ByOrderByCreatedAtDesc(): List<NeuralResonance>
    fun findByCreatedAtAfter(timestamp: java.time.LocalDateTime): List<NeuralResonance>
}
