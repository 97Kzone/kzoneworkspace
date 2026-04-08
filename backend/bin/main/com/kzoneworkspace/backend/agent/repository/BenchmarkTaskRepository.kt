package com.kzoneworkspace.backend.agent.repository

import com.kzoneworkspace.backend.agent.entity.BenchmarkTask
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface BenchmarkTaskRepository : JpaRepository<BenchmarkTask, Long> {
    fun findByCategory(category: String): List<BenchmarkTask>
}
