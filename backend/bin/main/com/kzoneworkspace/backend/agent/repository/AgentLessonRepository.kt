package com.kzoneworkspace.backend.agent.repository

import com.kzoneworkspace.backend.agent.entity.AgentLesson
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface AgentLessonRepository : JpaRepository<AgentLesson, Long> {
    fun findByAgentName(agentName: String): List<AgentLesson>
    fun findByCategory(category: String): List<AgentLesson>
}
