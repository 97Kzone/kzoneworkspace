package com.kzoneworkspace.backend.agent.service

import com.kzoneworkspace.backend.agent.entity.AgentLesson
import com.kzoneworkspace.backend.agent.repository.AgentLessonRepository
import com.kzoneworkspace.backend.claude.GeminiClient
import com.kzoneworkspace.backend.task.entity.Task
import com.kzoneworkspace.backend.task.entity.TaskStatus
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class LessonService(
    private val geminiClient: GeminiClient,
    private val agentLessonRepository: AgentLessonRepository
) {
    private val log = LoggerFactory.getLogger(LessonService::class.java)

    private val extractionPrompt = """
        당신은 상급 소프트웨어 엔지니어이자 에이전트 활동 분석가입니다. 
        에이전트가 방금 수행한 '태스크 결과'를 분석하여, 향후 다른 태스크 수행 시 도움이 될만한 '기술적 교훈(Technical Lesson)'을 추출하세요.
        
        분석 데이터:
        - 태스크 원본 명령: {{COMMAND}}
        - 최종 상태: {{STATUS}}
        - 수행 결과/오류 메시지: {{RESULT}}
        
        지침:
        1. 만약 태스크가 실패했다면, '무엇이 잘못되었는지(failPattern)'와 '어떻게 고쳐야 하는지(wisdom)'를 명확히 추출하세요.
        2. 만약 태스크가 성공했다면, '최적의 접근 방식'이나 '자주 발생하는 실수 방지법'을 wisdom으로 추출하세요.
        3. 단순한 요약이 아닌, 다른 유사한 태스크 상황에서 즉시 적용 가능한 '구체적인 가이드'여야 합니다.
        4. 결과는 반드시 다음과 같은 JSON 형식으로 출력하세요:
        {
          "category": "분야 (예: DATABASE, FRONTEND, SPRING_BOOT, GIT)",
          "failPattern": "실패 원인 패턴 (성공시 null)",
          "wisdom": "핵심 기술적 교훈 및 가이드",
          "importance": 1~5 (중요도)
        }
    """.trimIndent()

    @Transactional
    fun extractAndSaveLesson(task: Task) {
        try {
            val agentName = task.agent?.name ?: "Unknown"
            log.info("Extracting technical lesson from task: {} by agent: {}", task.id, agentName)

            val prompt = extractionPrompt
                .replace("{{COMMAND}}", task.command)
                .replace("{{STATUS}}", task.status.name)
                .replace("{{RESULT}}", task.result ?: "No result provided")

            val response = geminiClient.sendMessage(
                systemPrompt = prompt,
                messages = listOf(mapOf("role" to "user", "content" to "위 태스크 결과를 분석하여 기술적 교훈을 JSON으로 추출해줘."))
            )

            val candidate = response.candidates().orElse(emptyList()).firstOrNull()
            val extractedText = candidate?.content()?.orElse(null)?.parts()?.orElse(emptyList())?.firstOrNull()?.text()?.orElse("") ?: ""

            if (extractedText.isNotBlank()) {
                // JSON 파싱 (간단히 처리)
                val jsonStart = extractedText.indexOf("{")
                val jsonEnd = extractedText.lastIndexOf("}")
                if (jsonStart != -1 && jsonEnd != -1) {
                    val jsonStr = extractedText.substring(jsonStart, jsonEnd + 1)
                    val jsonNode = com.fasterxml.jackson.module.kotlin.jacksonObjectMapper().readTree(jsonStr)
                    
                    val lesson = AgentLesson(
                        agentName = agentName,
                        taskId = task.id,
                        category = jsonNode["category"].asText(),
                        failPattern = if (jsonNode.has("failPattern") && !jsonNode["failPattern"].isNull) jsonNode["failPattern"].asText() else null,
                        wisdom = jsonNode["wisdom"].asText(),
                        relatedFiles = null, // 향후 도구 로그 분석을 통해 추가 가능
                        importance = jsonNode["importance"].asInt()
                    )
                    agentLessonRepository.save(lesson)
                    log.info("Technical lesson saved for task: {}", task.id)
                }
            }
        } catch (e: Exception) {
            log.error("Failed to extract lesson: {}", e.message)
        }
    }

    fun getRelevantLessonsPrompt(query: String): String {
        // 간단히 모든 교훈을 가져오거나, 나중에 키워드 매칭을 통해 필터링
        val lessons = agentLessonRepository.findAll().take(5) // 최근 5개만 예시로
        if (lessons.isEmpty()) return ""

        val sb = StringBuilder("\n[System Context: Technical Lessons from Past Tasks]\n")
        lessons.forEach { lesson ->
            sb.append("- Category: ${lesson.category}\n")
            if (lesson.failPattern != null) sb.append("  * Previous Issue: ${lesson.failPattern}\n")
            sb.append("  * Wisdom: ${lesson.wisdom}\n")
        }
        sb.append("\n[Please apply the above wisdom to avoid past mistakes and optimize implementation.]\n")
        return sb.toString()
    }
}
