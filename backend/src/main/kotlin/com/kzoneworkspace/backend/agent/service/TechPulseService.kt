package com.kzoneworkspace.backend.agent.service

import com.kzoneworkspace.backend.agent.entity.TechPulse
import com.kzoneworkspace.backend.agent.repository.TechPulseRepository
import com.kzoneworkspace.backend.claude.GeminiClient
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDateTime
import com.google.common.reflect.TypeToken
import com.google.gson.Gson

@Service
class TechPulseService(
    private val techPulseRepository: TechPulseRepository,
    private val geminiClient: GeminiClient,
    private val codebaseIndexingService: CodebaseIndexingService
) {
    private val log = LoggerFactory.getLogger(TechPulseService::class.java)
    private val gson = Gson()

    fun getAllPulses(): List<TechPulse> = techPulseRepository.findByOrderByCreatedAtDesc()

    @Transactional
    fun refreshTechPulses(): List<TechPulse> {
        log.info("Refreshing Tech Pulses...")
        
        // 1. Get codebase context (summary)
        val contextPrompt = "현재 프로젝트의 주요 기술 스택과 구조를 요약해 주세요. (Kotlin, Spring Boot, React, Next.js 활용 여부 등)"
        val contextChunks = codebaseIndexingService.search("project architecture stack", 5)
        val contextLines = contextChunks.joinToString("\n") { "${it.filePath}: ${it.content.take(100)}..." }

        // 2. Search for latest trends and analyze
        val systemPrompt = """
            당신은 최첨단 기술 트렌드 분석가이자 시니어 소프트웨어 아키텍트입니다. 
            현재 프로젝트의 기술 스택과 연관된 최신 뉴스, 업데이트, 보안 취약점 등을 검색하고 분석하여 보고서를 작성하세요.
            
            분석 대상 카테고리:
            - KOTLIN/SPRING: 백엔드 프레임워크 및 언어 업데이트
            - REACT/NEXTJS: 프론트엔드 최신 트렌드 및 성능 개선
            - AI/LLM: 신규 모델(Claude, Gemini 등) 및 에이전트 기술
            - SECURITY: 의존성 보안 이슈 및 베스트 프랙티스
        """.trimIndent()

        val userPrompt = """
            현재 프로젝트 컨텍스트:
            $contextLines
            
            위 컨텍스트를 바탕으로, 현재 시점에서 가장 중요한 기술 업데이트나 트렌드 3가지를 찾아서 JSON 형식으로 응답하세요.
            각 항목은 반드시 다음 필드를 포함해야 합니다:
            - title: 트렌드 제목
            - category: 카테고리 (KOTLIN, REACT, AI, SECURITY 중 하나)
            - description: 트렌드에 대한 간략한 설명
            - impactScore: 프로젝트에 미치는 영향도 (1~10)
            - projectImpact: 구체적으로 이 프로젝트의 어떤 부분에 영향을 주는지, 어떻게 대응해야 하는지 (Markdown 형식)
            - sourceUrl: 관련 뉴스나 문서 URL
            
            응답은 오직 JSON 리스트 형태로만 제공하세요. (예: [{"title": "...", ...}])
        """.trimIndent()

        return try {
            val response = geminiClient.sendMessage(
                systemPrompt = systemPrompt,
                messages = listOf(mapOf("role" to "user", "content" to userPrompt)),
                model = "gemini-2.0-flash"
            )

            val candidate = response.candidates().orElse(emptyList()).firstOrNull()
            var jsonText = candidate?.content()?.orElse(null)?.parts()?.orElse(emptyList())?.firstOrNull()?.text()?.orElse("") ?: ""
            
            // Extract JSON if wrapped in markdown
            if (jsonText.contains("```json")) {
                jsonText = jsonText.substringAfter("```json").substringBefore("```").trim()
            } else if (jsonText.contains("```")) {
                jsonText = jsonText.substringAfter("```").substringBefore("```").trim()
            }

            val listType = object : TypeToken<List<Map<String, Any>>>() {}.type
            val pulsesData: List<Map<String, Any>> = gson.fromJson(jsonText, listType)

            val newPulses = pulsesData.map { data ->
                TechPulse(
                    title = data["title"] as? String ?: "Unknown Trend",
                    category = data["category"] as? String ?: "GENERAL",
                    description = data["description"] as? String ?: "",
                    impactScore = (data["impactScore"] as? Double)?.toInt() ?: 5,
                    projectImpact = data["projectImpact"] as? String ?: "분석 내용 없음",
                    sourceUrl = data["sourceUrl"] as? String,
                    createdAt = LocalDateTime.now()
                )
            }

            // 기존 오래된 펄스는 삭제하거나 유지 (여기서는 최신 3개만 유지하기 위해 전체 삭제 후 삽입하거나, 그냥 추가)
            // 여기서는 매번 새로운 분석 결과를 추가하는 방식으로 진행
            techPulseRepository.saveAll(newPulses)
            log.info("Successfully refreshed ${newPulses.size} tech pulses.")
            newPulses
        } catch (e: Exception) {
            log.error("Failed to refresh tech pulses: ${e.message}")
            emptyList()
        }
    }
}
