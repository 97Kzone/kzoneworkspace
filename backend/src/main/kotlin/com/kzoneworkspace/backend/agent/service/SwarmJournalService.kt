package com.kzoneworkspace.backend.agent.service

import com.kzoneworkspace.backend.agent.entity.SwarmJournal
import com.kzoneworkspace.backend.agent.entity.Memory
import com.kzoneworkspace.backend.agent.entity.NeuralResonance
import com.kzoneworkspace.backend.agent.repository.*
import com.kzoneworkspace.backend.task.repository.TaskRepository
import com.kzoneworkspace.backend.task.entity.Task
import com.kzoneworkspace.backend.task.entity.TaskStatus
import com.kzoneworkspace.backend.claude.GeminiClient
import com.google.gson.Gson
import com.google.common.reflect.TypeToken
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
    private val agentRepository: AgentRepository,
    private val geminiClient: GeminiClient
) {
    private val gson = Gson()

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
        
        val completedTasksCount = tasks.count { it.status == TaskStatus.COMPLETED }
        val totalSynergyScore = if (synergies.isNotEmpty()) synergies.map { it.synergyScore }.sum() else 0

        // Gemini를 이용한 요약 및 내용 생성
        val promptData = buildPromptData(tasks, memories, resonances)
        val (summary, content, sentiment) = callGeminiForJournal(promptData)

        val journal = journalRepository.findByJournalDate(date).orElse(SwarmJournal(journalDate = date))
        journal.summary = summary
        journal.content = content
        journal.sentiment = sentiment
        journal.taskCount = tasks.size
        journal.memoryCount = memories.size
        journal.resonanceCount = resonances.size
        journal.synergyScore = totalSynergyScore
        
        return journalRepository.save(journal)
    }

    private fun buildPromptData(tasks: List<Task>, memories: List<Memory>, resonances: List<NeuralResonance>): String {
        val sb = StringBuilder()
        sb.append("[태스크 활동]\n")
        val completed = tasks.filter { it.status == TaskStatus.COMPLETED }
        val failed = tasks.filter { it.status == TaskStatus.FAILED }
        sb.append("- 완료된 태스크: ${completed.size}개\n")
        completed.take(5).forEach { sb.append("  * ${it.command}\n") }
        sb.append("- 실패한 태스크: ${failed.size}개\n")
        failed.take(5).forEach { sb.append("  * ${it.command}\n") }

        sb.append("\n[지식 습득]\n")
        sb.append("- 생성된 기억: ${memories.size}개\n")
        memories.take(5).forEach { sb.append("  * ${it.content}\n") }

        sb.append("\n[뉴럴 공명]\n")
        sb.append("- 공명 횟수: ${resonances.size}회\n")
        resonances.take(5).forEach { sb.append("  * ${it.sourceAgentName} -> ${it.targetAgentName}: ${it.resonanceTheme ?: "공통 주제"}\n") }

        return sb.toString()
    }

    private fun callGeminiForJournal(data: String): Triple<String, String, String> {
        val systemPrompt = """
            당신은 AI 에이전트 군집의 '일일 활동 기록가'입니다.
            제공된 데이터를 바탕으로 오늘의 군집 저널을 작성해야 합니다.
            
            응답은 반드시 JSON 형식으로만 제공하며, 다음 필드를 포함해야 합니다:
            - summary: 오늘 하루의 핵심 요약 (한국어, 2~3문장)
            - content: 상세 활동 내용 (Markdown 형식, 한국어). 주요 성과, 지식 습득, 시너지 등을 포함하여 풍부하게 작성하세요.
            - sentiment: 오늘의 전반적인 감정/분위기 (예: "NORMAL", "POSITIVE", "FOCUSED", "STRESS" 등)
        """.trimIndent()

        val userPrompt = """
            다음은 오늘 발생한 군집의 활동 데이터입니다:
            
            $data
            
            위 데이터를 바탕으로 오늘의 군집 저널을 JSON으로 작성하세요.
        """.trimIndent()

        return try {
            val response = geminiClient.sendMessage(
                systemPrompt = systemPrompt,
                messages = listOf(mapOf("role" to "user", "content" to userPrompt)),
                model = "gemini-2.0-flash"
            )

            val candidate = response.candidates().orElse(emptyList()).firstOrNull()
            var jsonText = candidate?.content()?.orElse(null)?.parts()?.orElse(emptyList())?.firstOrNull()?.text()?.orElse("") ?: ""
            
            if (jsonText.contains("```json")) {
                jsonText = jsonText.substringAfter("```json").substringBefore("```").trim()
            } else if (jsonText.contains("```")) {
                jsonText = jsonText.substringAfter("```").substringBefore("```").trim()
            }

            val resultType = object : TypeToken<Map<String, Any>>() {}.type
            val resultData: Map<String, Any> = gson.fromJson(jsonText, resultType)

            val summary = resultData["summary"] as? String ?: "요약을 생성할 수 없습니다."
            val content = resultData["content"] as? String ?: "내용을 생성할 수 없습니다."
            val sentiment = resultData["sentiment"] as? String ?: "NORMAL"

            Triple(summary, content, sentiment)
        } catch (e: Exception) {
            Triple("저널 생성 중 오류 발생", "오류 내용: ${e.message}", "NORMAL")
        }
    }
}
