package com.kzoneworkspace.backend.agent.service

import com.google.gson.Gson
import com.kzoneworkspace.backend.agent.entity.*
import com.kzoneworkspace.backend.agent.repository.ScenarioImpactRepository
import com.kzoneworkspace.backend.agent.repository.ScenarioRepository
import com.kzoneworkspace.backend.claude.GeminiClient
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDateTime

@Service
class ScenarioService(
    private val scenarioRepository: ScenarioRepository,
    private val impactRepository: ScenarioImpactRepository,
    private val geminiClient: GeminiClient,
    private val codebaseIndexingService: CodebaseIndexingService,
    private val collaborationService: CollaborationService
) {
    private val log = LoggerFactory.getLogger(ScenarioService::class.java)
    private val gson = Gson()

    fun getAllSimulations(roomId: String): List<ScenarioSimulation> =
        scenarioRepository.findByRoomIdOrderByCreatedAtDesc(roomId)

    @Transactional
    fun runSimulation(roomId: String, title: String, description: String): ScenarioSimulation {
        log.info("Running Scenario Simulation in room $roomId: $title")
        
        val scenario = ScenarioSimulation(
            roomId = roomId,
            title = title,
            description = description,
            status = ScenarioStatus.SIMULATING
        )
        val savedScenario = scenarioRepository.save(scenario)

        val codebaseContext = getCodebaseContext()
        
        val systemPrompt = """
            당신은 'K-ZONE AI' 워크스테이션의 수석 전략 아키텍트이자 시뮬레이션 엔진입니다. 
            주어진 'What-If' 시나리오를 바탕으로 프로젝트에 미칠 기술적, 전략적 영향을 분석하십시오.
            
            [분석 레이어]
            1. Architecture: 구조적 변화, 의존성 전이, 모듈 재구성 필요성
            2. Security: 새로운 공격 벡터, 인증/인가 취약점 노출 가능성
            3. Performance: 레이턴시 증가, 자원 병목, 확장성 이슈
            4. Workload: 에이전트 및 개발 팀의 작업 부하 및 병목 구간
            5. Risk: 기술 부채 및 유지보수성 침해 요소
            
            [출력 형식]
            분석 결과는 반드시 JSON 블록을 포함한 Markdown 형식이어야 합니다.
            마지막에 각 영역별 임팩트 점수(1-10)와 관측 사항을 JSON 형식으로 포함하십시오.
            ```json
            [
              {"area": "Architecture", "score": 7, "observation": "..."},
              {"area": "Security", "score": 3, "observation": "..."},
              ...
            ]
            ```
        """.trimIndent()

        val userPrompt = """
            [시나리오 제목]
            $title
            
            [시나리오 내용]
            $description
            
            [코드베이즈 컨텍스트]
            $codebaseContext
            
            위 시나리오를 시뮬레이션하고 상세 보고서를 작성해 주십시오. 
            보고서에는 시나리오의 파급 효과와 전략적 로드맵이 포함되어야 합니다.
        """.trimIndent()

        try {
            val response = geminiClient.sendMessage(
                systemPrompt = systemPrompt,
                messages = listOf(mapOf("role" to "user", "content" to userPrompt)),
                model = "gemini-2.0-flash"
            )

            val fullText = extractText(response)
            savedScenario.finalReport = fullText
            
            // Parse impacts from JSON block
            parseAndSaveImpacts(savedScenario, fullText)
            
            savedScenario.status = ScenarioStatus.COMPLETED
            collaborationService.logInteraction(roomId, "S-LAB_ENGINE", "USER", "SCENARIO_SIMULATION", "SUCCESS")
            
        } catch (e: Exception) {
            log.error("Scenario simulation failed: ${e.message}")
            savedScenario.status = ScenarioStatus.FAILED
        }

        return scenarioRepository.save(savedScenario)
    }

    private fun parseAndSaveImpacts(scenario: ScenarioSimulation, text: String) {
        val jsonPattern = "```json\\s*([\\s\\S]*?)\\s*```".toRegex()
        val match = jsonPattern.find(text)
        
        if (match != null) {
            val json = match.groupValues[1]
            try {
                val impactData = gson.fromJson(json, Array<ImpactDto>::class.java)
                impactData.forEach { dto ->
                    val impact = ScenarioImpact(
                        simulation = scenario,
                        area = dto.area,
                        score = dto.score,
                        observation = dto.observation
                    )
                    impactRepository.save(impact)
                    scenario.impacts.add(impact)
                }
            } catch (e: Exception) {
                log.error("Failed to parse impact JSON: ${e.message}")
            }
        }
    }

    private fun getCodebaseContext(): String {
        return try {
            val chunks = codebaseIndexingService.search("project structure infrastructure core", 5)
            chunks.joinToString("\n") { "${it.filePath}: ${it.content.take(300)}..." }
        } catch (e: Exception) {
            "No codebase context available."
        }
    }

    private fun extractText(response: com.google.genai.types.GenerateContentResponse): String {
        val candidate = response.candidates().orElse(emptyList()).firstOrNull()
        return candidate?.content()?.orElse(null)?.parts()?.orElse(emptyList())?.firstOrNull()?.text()?.orElse("") ?: ""
    }

    data class ImpactDto(val area: String, val score: Int, val observation: String)
}
