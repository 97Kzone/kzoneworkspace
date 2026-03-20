package com.kzoneworkspace.backend.agent.controller

import com.kzoneworkspace.backend.agent.service.SkillDTO
import com.kzoneworkspace.backend.agent.service.SkillService
import org.springframework.web.bind.annotation.CrossOrigin
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/skills")
class SkillController(
    private val skillService: SkillService
) {
    @GetMapping
    fun getAvailableSkills(): List<SkillDTO> = skillService.getAvailableSkills()
}
