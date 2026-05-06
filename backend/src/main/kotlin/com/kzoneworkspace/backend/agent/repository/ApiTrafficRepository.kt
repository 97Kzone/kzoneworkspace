package com.kzoneworkspace.backend.agent.repository

import com.kzoneworkspace.backend.agent.entity.ApiTrafficLog
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.stereotype.Repository

@Repository
interface ApiTrafficRepository : JpaRepository<ApiTrafficLog, Long> {
    
    @Query("SELECT SUM(a.estimatedCost) FROM ApiTrafficLog a")
    fun getTotalEstimatedCost(): Double?

    @Query("SELECT SUM(a.inputTokens) + SUM(a.outputTokens) FROM ApiTrafficLog a")
    fun getTotalTokens(): Long?

    fun findTop10ByOrderByTimestampDesc(): List<ApiTrafficLog>
}
