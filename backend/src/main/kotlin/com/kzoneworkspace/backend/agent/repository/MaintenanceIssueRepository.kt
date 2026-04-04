package com.kzoneworkspace.backend.agent.repository

import com.kzoneworkspace.backend.agent.entity.MaintenanceIssue
import com.kzoneworkspace.backend.agent.entity.MaintenanceStatus
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface MaintenanceIssueRepository : JpaRepository<MaintenanceIssue, Long> {
    fun findByStatusOrderByCreatedAtDesc(status: MaintenanceStatus): List<MaintenanceIssue>
    fun findByFilePath(filePath: String): List<MaintenanceIssue>
}
