package com.kzoneworkspace.backend.task.repository

import com.kzoneworkspace.backend.task.entity.ScheduledTask
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface ScheduledTaskRepository : JpaRepository<ScheduledTask, Long> {
    fun findByStatus(status: String): List<ScheduledTask>
}
