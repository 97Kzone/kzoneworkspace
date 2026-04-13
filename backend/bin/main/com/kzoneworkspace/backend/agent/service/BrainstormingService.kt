package com.kzoneworkspace.backend.agent.service

import com.google.common.reflect.TypeToken
import com.google.gson.Gson
import com.kzoneworkspace.backend.agent.entity.*
import com.kzoneworkspace.backend.agent.repository.AgentRepository
import com.kzoneworkspace.backend.agent.repository.BrainstormingContributionRepository
import com.kzoneworkspace.backend.agent.repository.BrainstormingRepository
import com.kzoneworkspace.backend.claude.GeminiClient
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDateTime

@Service
class BrainstormingService(
    private val brainstormingRepository: BrainstormingRepository,
    private val contributionRepository: BrainstormingContributionRepository,
    private val agentRepository: AgentRepository,
    private val geminiClient: GeminiClient,
    private val codebaseIndexingService: CodebaseIndexingService,
    private val collaborationService: CollaborationService
) {
    private val log = LoggerFactory.getLogger(BrainstormingService::class.java)
    private val gson = Gson()

    fun getAllSessions(roomId: String): List<BrainstormingSession> =
        brainstormingRepository.findByRoomIdOrderByCreatedAtDesc(roomId)

    @Transactional
    fun startSession(roomId: String, goal: String, agentIds: List<Long>): BrainstormingSession {
        log.info("Starting Brainstorming Session in room $roomId for goal: $goal")
        
        val session = BrainstormingSession(
            roomId = roomId,
            goal = goal,
            status = BrainstormingStatus.PROPOSING
        )
        val savedSession = brainstormingRepository.save(session)

        val agents = agentRepository.findAllById(agentIds)
        
        // Parallel Brainstorming Phase
        executeParallelPhase(savedSession, agents)
        
        // Synthesis Phase
        synthesizeBlueprint(savedSession, agents)

        return brainstormingRepository.save(savedSession)
    }

    private fun executeParallelPhase(session: BrainstormingSession, agents: List<Agent>) {
        log.info("Executing Parallel Phase for session ${session.id}")
        
        val codebaseContext = getCodebaseContext()
        
        agents.forEach { agent ->
            try {
                val systemPrompt = """
                    ${agent.systemPrompt}
                    ---
                    당신은 지금 그룹 브레인스토밍 세션에 참여하고 있습니다. 
                    다른 에이전트들의 의견을 듣기 전에, 본인의 역할과 전문성을 바탕으로 주어진 목표에 대한 초기 제안을 작성하세요.
                    코드베이스의 현재 상태와 최신 기술 트렌드를 고려하여 구체적이고 실행 가능한 아이디어를 제시해야 합니다.
                """.trimIndent()

                val userPrompt = """
                    [브레인스토밍 목표]
                    ${session.goal}
                    
                    [코드베이스 컨텍스트]
                    $codebaseContext
                    
                    위 목표를 달성하기 위해 당신의 관점에서 최선의 접근 방식과 핵심 고려사항을 제안해 주세요.
                    답변은 Markdown 형식으로 작성해 주세요.
                """.trimIndent()

                val response = geminiClient.sendMessage(
                    systemPrompt = systemPrompt,
                    messages = listOf(mapOf("role" to "user", "content" to userPrompt)),
                    model = if (agent.model.contains("gemini")) agent.model else "gemini-2.0-flash"
                )

                val content = extractText(response)
                
                val contribution = BrainstormingContribution(
                    session = session,
                    agentName = agent.name,
                    agentRole = agent.role,
                    content = content
                )
                contributionRepository.save(contribution)
                session.contributions.add(contribution)
                
                collaborationService.logInteraction(session.roomId, agent.name, "BRAINSTORM_HALL", "IDEA_PROPOSAL", "SUCCESS")
                
            } catch (e: Exception) {
                log.error("Agent ${agent.name} failed to contribute to brainstorming: ${e.message}")
            }
        }
    }

    private fun synthesizeBlueprint(session: BrainstormingSession, agents: List<Agent>) {
        log.info("Executing Synthesis Phase for session ${session.id}")
        session.status = BrainstormingStatus.SYNTHESIZING
        
        val contributionsSummary = session.contributions.joinToString("\n\n") { 
            "### Agent: ${it.agentName} (${it.agentRole})\n${it.content}"
        }

        val leadAgent = agents.firstOrNull { it.role.contains("Planner") || it.role.contains("Architect") } ?: agents.first()
        
        val systemPrompt = """
            당신은 프로젝트의 수석 아키텍트이자 전략가입니다. 
            여러 에이전트들이 제안한 브레인스토밍 결과물들을 분석하여, 하나의 일관된 '미션 블루프린트(Mission Blueprint)'를 생성하는 것이 당신의 임무입니다.
            
            [블루프린트 구성 요소]
            1. Executive Summary: 전체 해결 전략 요약
            2. Tech Stack: 제안된 기술 스택 및 라이브러리
            3. Architecture Plan: 시스템 구조 및 데이터 흐름
            4. Detailed Task List: 각 에이전트가 수행해야 할 구체적인 태스크 리스트 (JSON 형식으로도 포함 권장)
            5. Risk & Mitigation: 예상되는 위험 요소 및 대응 방안
            
            상호 모순되는 의견이 있다면 아키텍트의 관점에서 가장 합리적인 방향으로 결정하세요.
        """.trimIndent()

        val userPrompt = """
            [브레인스토밍 목표]
            ${session.goal}
            
            [에이전트별 제안 내역]
            $contributionsSummary
            
            위 제안들을 종합하여 최종 미션 블루프린트를 작성해 주세요. 
            답변은 Markdown 형식으로 작성하되, 마지막에 실행 가능한 태스크 리스트를 JSON 블록으로 포함해 주세요:
            ```json
            [
              {"command": "...", "description": "...", "priority": "HIGH"},
              ...
            ]
            ```
        """.trimIndent()

        try {
            val response = geminiClient.sendMessage(
                systemPrompt = systemPrompt,
                messages = listOf(mapOf("role" to "user", "content" to userPrompt)),
                model = "gemini-2.0-flash" // Synthesis uses high-performance model
            )

            val blueprint = extractText(response)
            session.finalBlueprint = blueprint
            session.status = BrainstormingStatus.COMPLETED
            
            collaborationService.logInteraction(session.roomId, leadAgent.name, "USER", "BLUEPRINT_GENERATION", "SUCCESS")
        } catch (e: Exception) {
            log.error("Failed to synthesize blueprint: ${e.message}")
            session.status = BrainstormingStatus.FAILED
        }
    }

    private fun getCodebaseContext(): String {
        return try {
            val chunks = codebaseIndexingService.search("project structure models api", 3)
            chunks.joinToString("\n") { "${it.filePath}: ${it.content.take(200)}..." }
        } catch (e: Exception) {
            "No codebase context available."
        }
    }

    private fun extractText(response: com.google.genai.types.GenerateContentResponse): String {
        val candidate = response.candidates().orElse(emptyList()).firstOrNull()
        return candidate?.content()?.orElse(null)?.parts()?.orElse(emptyList())?.firstOrNull()?.text()?.orElse("") ?: ""
    }
}
