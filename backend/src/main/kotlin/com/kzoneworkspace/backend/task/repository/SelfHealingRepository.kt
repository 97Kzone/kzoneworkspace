package com.kzoneworkspace.backend.task.repository

import com.kzoneworkspace.backend.task.entity.SelfHealingLog
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface SelfHealingRepository : JpaRepository<SelfHealingLog, Long> {
    fun findByTaskId(taskId: Long): List<SelfHealingLog>
    fun findAllByOrderByCreatedAtDesc(): List<SelfHealingLog>
}
