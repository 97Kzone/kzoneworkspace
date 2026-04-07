package com.kzoneworkspace.backend.agent.controller

import com.kzoneworkspace.backend.agent.entity.AgentLesson
import com.kzoneworkspace.backend.agent.repository.AgentLessonRepository
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/lessons")
class LessonController(
    private val agentLessonRepository: AgentLessonRepository
) {
    @GetMapping
    fun getAllLessons(): List<AgentLesson> {
        return agentLessonRepository.findAll()
    }

    @GetMapping("/agent/{name}")
    fun getLessonsByAgent(@PathVariable name: String): List<AgentLesson> {
        return agentLessonRepository.findByAgentName(name)
    }

    @GetMapping("/category/{cat}")
    fun getLessonsByCategory(@PathVariable cat: String): List<AgentLesson> {
        return agentLessonRepository.findByCategory(cat)
    }
}
