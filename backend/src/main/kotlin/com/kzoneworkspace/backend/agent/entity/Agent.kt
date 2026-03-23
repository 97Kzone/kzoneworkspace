package com.kzoneworkspace.backend.agent.entity

import jakarta.persistence.CollectionTable
import jakarta.persistence.Column
import jakarta.persistence.ElementCollection
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.FetchType
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.JoinColumn
import jakarta.persistence.Table
import java.time.LocalDateTime

@Entity
@Table(name = "agents")
class Agent(
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    val id: Long = 0,

    @Column(nullable = false)
    var name: String,

    @Column(nullable = false)
    var role: String,

    @Column(columnDefinition = "TEXT")
    var systemPrompt: String = "",

    @Enumerated(EnumType.STRING)
    var provider: AiProvider = AiProvider.ANTHROPIC,

    @Column(nullable = false)
    var model: String,

    @Enumerated(EnumType.STRING)
    var status: AgentStatus = AgentStatus.IDLE,

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "agent_skills", joinColumns = [JoinColumn(name = "agent_id")])
    @Column(name = "skill_name")
    var assignedSkills: MutableList<String> = mutableListOf(),

    @Column(nullable = false)
    val createdAt: LocalDateTime = LocalDateTime.now(),

    var updatedAt: LocalDateTime = LocalDateTime.now(),

    @Column(nullable = false)
    var points: Int = 0,

    @Column
    var lastEmotion: String? = null
) {
    fun addSkill(skill: String) {
        if (!assignedSkills.contains(skill)) {
            assignedSkills.add(skill)
        }
    }

    fun removeSkill(skill: String) {
        assignedSkills.remove(skill)
    }
}

enum class AgentStatus {
    IDLE, RUNNING, COMPLETED, ERROR
}

enum class AiProvider {
    ANTHROPIC, OPENAI, GOOGLE
}