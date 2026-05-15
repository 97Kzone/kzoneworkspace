package com.kzoneworkspace.backend.task.controller

import com.kzoneworkspace.backend.task.repository.SelfHealingRepository
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/self-healing")
class SelfHealingController(
    private val selfHealingRepository: SelfHealingRepository
) {
    @GetMapping("/logs")
    fun getLogs() = selfHealingRepository.findAllByOrderByCreatedAtDesc()
}
