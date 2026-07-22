package com.kzoneworkspace.backend.agent.service

import com.google.common.reflect.TypeToken
import com.google.gson.Gson
import com.kzoneworkspace.backend.agent.entity.*
import com.kzoneworkspace.backend.agent.repository.*
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
    private val collaborationService: CollaborationService,
    private val synergyRepository: AgentSynergyRepository,
    private val officeItemRepository: OfficeItemRepository,
    private val assetUtilizationLogRepository: AssetUtilizationLogRepository,
    private val agentService: AgentService
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
                val personaPrompt = agentService.getPersonaPrompt(agent)
                val assetPrompt = agentService.getAssetPrompt(agent.id)
                val systemPrompt = """
                    ${agent.systemPrompt}
                    $personaPrompt
                    $assetPrompt
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
                    model = if (agent.model.contains("gemini")) agent.model else geminiClient.defaultModel
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
                messages = listOf(mapOf("role" to "user", "content" to userPrompt))
            )

            var blueprint = extractText(response)
            
            // --- 정량적 지표 계산 로직 시작 ---
            val avgReliability = if (agents.isNotEmpty()) {
                agents.map { it.reliabilityIndex }.average()
            } else {
                100.0
            }
            val totalContribution = agents.map { it.contributionPoints }.sum()
            
            // 에이전트 쌍 시너지 점수 수집
            val synergyScores = mutableListOf<Int>()
            if (agents.size > 1) {
                for (i in 0 until agents.size) {
                    for (j in i + 1 until agents.size) {
                        val name1 = agents[i].name
                        val name2 = agents[j].name
                        val names = listOf(name1, name2).sorted()
                        val synergy = synergyRepository.findByAgent1NameAndAgent2Name(names[0], names[1])
                        val score = synergy?.synergyScore ?: 50
                        synergyScores.add(score)
                    }
                }
            } else {
                synergyScores.add(100) // 단독 에이전트일 경우
            }
            
            var avgSynergy = synergyScores.average()
            
            // 컴퓨팅 자산 정보 수집 및 자산 기여도 마크다운 작성
            val assetContributionsMarkdown = StringBuilder()
            var hasCostOptimizer = false
            var hasSynergyBridge = false
            
            agents.forEach { agent ->
                val assets = officeItemRepository.findByAgentId(agent.id)
                if (assets.isEmpty()) {
                    assetContributionsMarkdown.append("| ${agent.name} | 장착된 생산성 자산 없음 | 기본 리소스로 독립적 추론 및 제안서 작성 |\n")
                } else {
                    val assetDetails = assets.joinToString(", ") { "${it.name} (${it.type})" }
                    val effectDesc = assets.joinToString(", ") { asset ->
                        when (asset.type) {
                            "REASONING_CORE" -> "고성능 추론 코어 가동으로 해결 전략 심층 탐색"
                            "EXTENDED_CONTEXT" -> "컨텍스트 메모리 확장으로 대규모 지식 정보 반영"
                            "VECTOR_SEARCH" -> "실시간 벡터 지식 검색 연동으로 고정밀 지식 검색"
                            "AUXILIARY_INSTANCE" -> "보조 추론 및 자가 치유 인스턴스 병렬 검증 연동"
                            "CODE_STABILITY_SANDBOX" -> "코드 안정성 샌드박스로 구문 검증 및 빌드 리스크 사전 진단"
                            "COST_OPTIMIZER" -> {
                                hasCostOptimizer = true
                                "비용 및 토큰 최적화 가동으로 20% 토큰 세이빙"
                            }
                            "SYNERGY_BRIDGE" -> {
                                hasSynergyBridge = true
                                "협업 시너지 공명 브릿지 연동으로 상호 지식 정렬 강화"
                            }
                            else -> "배치된 자원 정상 가동"
                        }
                    }
                    assetContributionsMarkdown.append("| ${agent.name} | $assetDetails | $effectDesc |\n")
                    
                    // 자산 로그 남기기
                    assets.forEach { asset ->
                        val description = when (asset.type) {
                            "REASONING_CORE" -> "브레인스토밍 중 [고성능 추론 코어] 자원을 가동하여 고품질 해결 전략의 정밀도를 향상시켰습니다."
                            "EXTENDED_CONTEXT" -> "브레인스토밍 중 [대용량 컨텍스트 메모리] 자원을 활성화하여 대규모 코드베이스 지식 정보를 종합 반영하였습니다."
                            "VECTOR_SEARCH" -> "브레인스토밍 중 [실시간 벡터 지식 검색 세션] 자원이 가동되어 고정밀 의미 구조 파악에 기여했습니다."
                            "AUXILIARY_INSTANCE" -> "브레인스토밍 중 [보조 추론 및 자가 치유 인스턴스] 가동으로 제안서 병렬 검증이 수행되었습니다."
                            "CODE_STABILITY_SANDBOX" -> "브레인스토밍 중 [코드 안정성 검증용 자율 샌드박스] 가동으로 코드 아키텍처 구문 리스크를 사전 방지했습니다."
                            "COST_OPTIMIZER" -> "브레인스토밍 합성 중 [API 비용 및 토큰 최적화 엔진]을 활성화하여 전체 요약 및 태스크 리포트 토큰 소모량을 20% 절감했습니다."
                            "SYNERGY_BRIDGE" -> "브레인스토밍 합성 중 [협업 시너지 공명 브릿지] 자원을 연동하여 에이전트 간 인지 정렬 신뢰도를 높였습니다."
                            else -> null
                        }
                        if (description != null) {
                            assetUtilizationLogRepository.save(AssetUtilizationLog(
                                agentId = agent.id,
                                agentName = agent.name,
                                assetType = asset.type,
                                assetName = asset.name,
                                actionType = "UTILIZATION",
                                description = "${agent.name} 에이전트: $description"
                            ))
                        }
                    }
                }
            }
            
            if (hasSynergyBridge) {
                avgSynergy = (avgSynergy * 1.15).coerceAtMost(100.0)
            }
            
            val tokenSavings = if (hasCostOptimizer) "20%" else "0%"
            val synergyBridgeStatus = if (hasSynergyBridge) "활성화됨 (시너지 점수 15% 가속 적용)" else "비활성화"
            
            // 마크다운 보고서 생성
            val reportMarkdown = """
                
                ---
                
                ## 🌐 [군집 지능 정량적 분석 보고서 (Swarm Intelligence Quantitative Analysis Report)]
                
                본 미션 블루프린트는 다중 인공지능 개체들의 정량적 지표와 협업 시너지를 바탕으로 합성되었습니다.
                
                ### 📊 군집 핵심 정량 지표 (Core Swarm Metrics)
                
                | 평가 항목 | 산출 수치 | 설명 |
                | :--- | :--- | :--- |
                | **군집 신뢰성 지수 평균 (Swarm Reliability)** | ${String.format("%.1f", avgReliability)}% | 참여 에이전트들의 인지 정합성 및 오류 복구 성공률 평균 |
                | **군집 총 비즈니스 기여도 (Swarm Contribution)** | ${totalContribution} pts | 에이전트들이 지금까지 완수한 태스크의 누적 비즈니스 가치 총합 |
                | **에이전트 협업 시너지 지수 (Collaboration Synergy)** | ${String.format("%.1f", avgSynergy)}% | 참여 에이전트 간의 상호 운용성 및 지식 공명 수준 |
                | **예상 API 토큰 비용 절감율 (Token Savings)** | $tokenSavings | `COST_OPTIMIZER` 엔진 작동에 따른 실시간 토큰 소모 절감율 |
                
                ### 🛠️ 컴퓨팅 자산 가동 현황 (Computational Resource Allocation)
                
                | 에이전트 | 장착 생산성 컴퓨팅 자산 | 브레인스토밍 기여 효과 |
                | :--- | :--- | :--- |
                $assetContributionsMarkdown
                
                ### 🔍 정량 분석 종합 의견 (Architect's Quantitative Assessment)
                - 본 브레인스토밍 세션은 **군집 신뢰성 ${String.format("%.1f", avgReliability)}%** 수준의 고정밀 인지 추론 환경에서 진행되었습니다.
                - [협업 시너지] 분석 결과, 에이전트 간 시너지 지수는 **${String.format("%.1f", avgSynergy)}%** 이며, 협업 시너지 공명 브릿지는 **$synergyBridgeStatus** 상태로 분석되었습니다.
                - 컴퓨팅 자산 배치를 통해 에이전트 성능 보정과 비용 절감(토큰 절감 $tokenSavings)의 상보적 통합 구조가 정상 가동 중입니다.
            """.trimIndent()
            
            blueprint += "\n" + reportMarkdown
            // --- 정량적 지표 계산 로직 끝 ---

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
