package com.kzoneworkspace.backend.agent.repository

import com.kzoneworkspace.backend.agent.entity.TechPulse
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface TechPulseRepository : JpaRepository<TechPulse, Long> {
    fun findByOrderByCreatedAtDesc(): List<TechPulse>
}
