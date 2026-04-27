package com.kzoneworkspace.backend.agent.service

import com.kzoneworkspace.backend.agent.entity.SwarmJournal
import com.kzoneworkspace.backend.agent.repository.*
import com.kzoneworkspace.backend.task.repository.TaskRepository
import com.kzoneworkspace.backend.task.entity.TaskStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDate
import java.time.LocalDateTime
import java.time.LocalTime

@Service
class SwarmJournalService(
    private val journalRepository: SwarmJournalRepository,
    private val taskRepository: TaskRepository,
    private val memoryRepository: MemoryRepository,
    private val resonanceRepository: NeuralResonanceRepository,
    private val synergyRepository: AgentSynergyRepository,
    private val agentRepository: AgentRepository
) {

    fun getAllJournals(): List<SwarmJournal> = journalRepository.findAllByOrderByJournalDateDesc()

    fun getJournalByDate(date: LocalDate): SwarmJournal? = journalRepository.findByJournalDate(date).orElse(null)

    @Transactional
    fun generateDailyJournal(date: LocalDate): SwarmJournal {
        val startOfDay = date.atStartOfDay()
        val endOfDay = date.atTime(LocalTime.MAX)
        
        // 데이터 집계
        val tasks = taskRepository.findByCreatedAtAfter(startOfDay).filter { it.createdAt.isBefore(endOfDay) }
        val memories = memoryRepository.findByCreatedAtAfter(startOfDay).filter { it.createdAt.isBefore(endOfDay) }
        val resonances = resonanceRepository.findByCreatedAtAfter(startOfDay).filter { it.createdAt.isBefore(endOfDay) }
        val synergies = synergyRepository.findByLastCollaboratedAtAfter(startOfDay).filter { it.lastCollaboratedAt!!.isBefore(endOfDay) }
        
        val completedTasks = tasks.count { it.status == TaskStatus.COMPLETED }
        val avgImportance = if (memories.isNotEmpty()) memories.map { it.importance }.average().toInt() else 0
        val totalSynergyScore = if (synergies.isNotEmpty()) synergies.map { it.synergyScore }.sum() else 0

        // 감정 분석 (에이전트들의 현재 감정 기반으로 단순화)
        val agents = agentRepository.findAll()
        val emotions = agents.mapNotNull { it.lastEmotion }
        val dominantEmotion = if (emotions.isNotEmpty()) {
            emotions.groupBy { it }.maxByOrNull { it.value.size }?.key ?: "NORMAL"
        } else "NORMAL"

        // 요약 및 내용 생성
        val summary = generateSummary(completedTasks, memories.size, resonances.size, dominantEmotion)
        val content = generateContent(tasks, memories, resonances, synergies)

        val journal = journalRepository.findByJournalDate(date).orElse(SwarmJournal(journalDate = date))
        journal.summary = summary
        journal.content = content
        journal.sentiment = dominantEmotion
        journal.taskCount = tasks.size
        journal.memoryCount = memories.size
        journal.resonanceCount = resonances.size
        journal.synergyScore = totalSynergyScore
        
        return journalRepository.save(journal)
    }

    private fun generateSummary(tasks: Int, memories: Int, resonances: Int, emotion: String): String {
        return when {
            tasks > 5 && memories > 5 -> "오늘은 군집이 매우 생산적인 하루를 보냈습니다. 많은 태스크를 완료하고 새로운 지식을 대량으로 습득했습니다."
            tasks > 0 || memories > 0 -> "군집이 꾸준히 작업을 진행하며 성장하고 있습니다. $tasks 개의 작업이 처리되었고 $memories 개의 새로운 기억이 생성되었습니다."
            else -> "오늘은 군집이 조용히 내부 프로세스를 정비하며 안정적인 상태를 유지했습니다."
        } + " 전반적인 군집의 분위기는 '$emotion' 상태입니다."
    }

    private fun generateContent(tasks: List<any?>, memories: List<any?>, resonances: List<any?>, synergies: List<any?>): String {
        val sb = StringBuilder()
        sb.append("### 🚀 주요 성과\n")
        if (tasks.isEmpty()) sb.append("- 특별한 외부 활동은 없었으나 시스템 최적화에 집중했습니다.\n")
        else sb.append("- 총 ${tasks.size}개의 태스크가 생성되었으며, 군집의 협업을 통해 처리되었습니다.\n")
        
        sb.append("\n### 🧠 지식 습득\n")
        if (memories.isEmpty()) sb.append("- 새로운 지식 습득보다는 기존 지식의 정교화에 주력했습니다.\n")
        else sb.append("- 총 ${memories.size}개의 새로운 기억 조각이 생성되었습니다. 주요 키워드는 데이터 분석 및 군집 시너지입니다.\n")
        
        sb.append("\n### 🤝 시너지 및 공명\n")
        if (resonances.isEmpty()) sb.append("- 에이전트 간의 명시적인 공명 현상은 관찰되지 않았습니다.\n")
        else sb.append("- ${resonances.size}차례의 뉴럴 공명이 발생하여 군집 내 암묵적 지식이 연결되었습니다.\n")
        
        return sb.toString()
    }
}
