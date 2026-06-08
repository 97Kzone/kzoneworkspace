package com.kzoneworkspace.backend.agent.repository

import com.kzoneworkspace.backend.agent.entity.AssetUtilizationLog
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface AssetUtilizationLogRepository : JpaRepository<AssetUtilizationLog, Long> {
    fun findTop50ByOrderByTimestampDesc(): List<AssetUtilizationLog>
    fun findByAgentIdOrderByTimestampDesc(agentId: Long): List<AssetUtilizationLog>
}
