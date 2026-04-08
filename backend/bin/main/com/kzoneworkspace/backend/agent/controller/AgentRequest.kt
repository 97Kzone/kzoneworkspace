package com.kzoneworkspace.backend.agent.controller

import com.kzoneworkspace.backend.agent.entity.Agent
import com.kzoneworkspace.backend.agent.entity.AiProvider

data class AgentRequest (
    
    val name: String,
    val role: String,
    val systemPrompt: String = "",
    val provider: AiProvider,
    val model: String,
    val assignedSkills: List<String> = emptyList()
) {
    fun toEntity(): Agent = Agent(
        name = name,
        role = role,
        systemPrompt = systemPrompt,
        provider = provider,
        model = model,
        assignedSkills = assignedSkills.toMutableList()
    )
}
