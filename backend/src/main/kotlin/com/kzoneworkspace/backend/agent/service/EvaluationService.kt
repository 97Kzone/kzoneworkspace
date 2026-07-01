package com.kzoneworkspace.backend.agent.service

import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import com.kzoneworkspace.backend.agent.dto.*
import com.kzoneworkspace.backend.agent.entity.*
import com.kzoneworkspace.backend.agent.repository.*
import com.kzoneworkspace.backend.claude.AgentExecutor
import com.kzoneworkspace.backend.claude.GeminiClient
import jakarta.annotation.PostConstruct
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import org.springframework.messaging.simp.SimpMessagingTemplate
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDateTime

@Service
class EvaluationService(
    private val benchmarkTaskRepository: BenchmarkTaskRepository,
    private val evaluationRunRepository: EvaluationRunRepository,
    private val evaluationResultRepository: EvaluationResultRepository,
    private val agentService: AgentService,
    private val agentExecutor: AgentExecutor,
    private val geminiClient: GeminiClient,
    private val messagingTemplate: SimpMessagingTemplate,
    private val agentEvolutionRepository: AgentEvolutionRepository,
    private val officeItemRepository: OfficeItemRepository,
    private val assetUtilizationLogRepository: AssetUtilizationLogRepository
) {
    private val coroutineScope = CoroutineScope(Dispatchers.Default)
    private val objectMapper = jacksonObjectMapper()

    @PostConstruct
    fun initBenchmarks() {
        if (benchmarkTaskRepository.count() == 0L) {
            val benchmarks = listOf(
                BenchmarkTask(
                    name = "기초 코딩 - Factorial",
                    category = "CODING",
                    inputPrompt = "Python으로 팩토리얼(factorial) 함수를 작성하고, 5의 결과를 출력하는 코드를 짜줘.",
                    expectedOutput = "120",
                    criteriaType = CriteriaType.CONTAINS,
                    difficulty = 1
                ),
                BenchmarkTask(
                    name = "논리 추론 - 과일 색깔",
                    category = "LOGIC",
                    inputPrompt = "사과는 빨갛고, 바나나는 노랗고, 포도는 보라색이야. 그럼 사과와 포도를 섞으면 어떤 색들이 언급된 거야?",
                    expectedOutput = "빨갛, 보라",
                    criteriaType = CriteriaType.CONTAINS,
                    difficulty = 1
                ),
                BenchmarkTask(
                    name = "시스템 컨텍스트 파악",
                    category = "SYSTEM",
                    inputPrompt = "현재 이 프로젝트의 주요 기술 스택이 뭐야? backend 디렉토리를 참고해서 답변해줘.",
                    expectedOutput = "Kotlin, Spring Boot",
                    criteriaType = CriteriaType.CONTAINS,
                    difficulty = 2
                )
            )
            benchmarkTaskRepository.saveAll(benchmarks)
        }
    }

    @Transactional
    fun startEvaluation(agentId: Long, targetModel: String? = null): EvaluationRun {
        val agent = agentService.getAgentById(agentId)
        val modelToUse = targetModel ?: agent.model
        
        val run = evaluationRunRepository.save(EvaluationRun(
            agent = agent,
            modelName = modelToUse,
            status = "RUNNING",
            totalTasks = benchmarkTaskRepository.count().toInt()
        ))
        
        // 코루틴 비동기 백그라운드 태스크 실행
        coroutineScope.launch {
            try {
                runEvaluationAsync(run.id)
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
        
        return run
    }

    @Transactional
    fun runEvaluationAsync(runId: Long) {
        val run = evaluationRunRepository.findById(runId).orElse(null) ?: return
        val benchmarks = benchmarkTaskRepository.findAll()
        var totalScore = 0.0
        var totalLatency: Long = 0
        var completed = 0
        
        val originalModel = run.agent.model
        run.agent.model = run.modelName
        agentService.save(run.agent)

        try {
            for (benchmark in benchmarks) {
                val result = EvaluationResult(
                    evaluationRun = run,
                    benchmarkTask = benchmark
                )
                
                val startTime = System.currentTimeMillis()
                try {
                    val response = agentExecutor.executeBenchmark(run.agent, run.modelName, benchmark.inputPrompt)
                    val latency = System.currentTimeMillis() - startTime
                    
                    result.actualOutput = response
                    result.latencyMs = latency
                    
                    // 의미 분석 및 기준 매칭 판정
                    val evalResult = evaluateSemanticOrMatch(response, benchmark)
                    
                    // 컴퓨팅 자산별 성능 보정 적용
                    val adjusted = applyAssetAdjustments(
                        agentId = run.agent.id,
                        benchmark = benchmark,
                        baseScore = evalResult.score,
                        baseSuccess = evalResult.success,
                        baseLatencyMs = latency,
                        baseRationale = evalResult.rationale
                    )
                    
                    result.isSuccess = adjusted.isSuccess
                    result.score = adjusted.score
                    result.rationale = adjusted.rationale
                    result.latencyMs = adjusted.latencyMs
                    
                    totalScore += adjusted.score
                    totalLatency += adjusted.latencyMs
                    completed++
                    
                } catch (e: Exception) {
                    result.errorLog = e.message
                    result.isSuccess = false
                    result.score = 0.0
                    result.rationale = "에러 발생: ${e.message}"
                }
                
                evaluationResultRepository.save(result)
                
                run.completedTasks = completed
                run.overallScore = if (completed > 0) totalScore / completed else 0.0
                evaluationRunRepository.save(run)
                
                // 실시간 웹소켓 메시지 발행
                broadcastProgress(run, result)
            }
            
            run.status = "COMPLETED"
            run.completedTasks = completed
            run.overallScore = if (completed > 0) totalScore / completed else 0.0
            run.avgLatencyMs = if (completed > 0) totalLatency / completed else 0
            run.endTime = LocalDateTime.now()

            // 인지 신뢰도 지수 (Reliability Index) 자동 연동
            val scoreInt = run.overallScore.toInt().coerceIn(1, 100)
            run.agent.reliabilityIndex = scoreInt
            agentService.save(run.agent)

            // AgentEvolutionLog 생성 및 기록
            val evolutionLog = AgentEvolutionLog(
                agentId = run.agent.id,
                agentName = run.agent.name,
                reliabilityIndex = scoreInt,
                missionCount = run.agent.missionCount,
                personalityTraits = run.agent.personalityTraits.toMap(),
                achievement = "하이브 벤치마크 평가 완료 - 종합 신뢰성 지수 ${scoreInt}% 달성 (모델: ${run.modelName})"
            )
            agentEvolutionRepository.save(evolutionLog)
            
        } catch (e: Exception) {
            run.status = "FAILED"
            run.endTime = LocalDateTime.now()
        } finally {
            run.agent.model = originalModel
            agentService.save(run.agent)
            evaluationRunRepository.save(run)
            
            // 최종 웹소켓 전송
            broadcastProgress(run, null)
        }
    }

    private fun broadcastProgress(run: EvaluationRun, latestResult: EvaluationResult?) {
        val payload = mapOf(
            "id" to run.id,
            "agentName" to run.agent.name,
            "modelName" to run.modelName,
            "status" to run.status,
            "overallScore" to run.overallScore,
            "totalTasks" to run.totalTasks,
            "completedTasks" to run.completedTasks,
            "startTime" to run.startTime.toString(),
            "endTime" to run.endTime?.toString(),
            "latestResult" to latestResult?.let {
                mapOf(
                    "taskId" to it.benchmarkTask.id,
                    "taskName" to it.benchmarkTask.name,
                    "isSuccess" to it.isSuccess,
                    "score" to it.score,
                    "latencyMs" to it.latencyMs,
                    "rationale" to it.rationale,
                    "actualOutput" to it.actualOutput
                )
            }
        )
        messagingTemplate.convertAndSend("/topic/evaluations", payload)
    }

    data class EvalJudgeResult(val success: Boolean, val score: Double, val rationale: String)

    private fun evaluateSemanticOrMatch(actual: String, benchmark: BenchmarkTask): EvalJudgeResult {
        if (benchmark.expectedOutput == null) {
            return EvalJudgeResult(true, 100.0, "기대 정답이 존재하지 않아 패스 처리되었습니다.")
        }
        
        return when (benchmark.criteriaType) {
            CriteriaType.SEMANTIC -> evaluateSemantic(actual, benchmark)
            else -> {
                val isSuccess = when (benchmark.criteriaType) {
                    CriteriaType.EXACT_MATCH -> actual.trim() == benchmark.expectedOutput?.trim()
                    CriteriaType.CONTAINS -> {
                        val keywords = benchmark.expectedOutput?.split(",")?.map { it.trim() } ?: emptyList()
                        keywords.all { actual.contains(it, ignoreCase = true) }
                    }
                    CriteriaType.REGEX -> {
                        val regex = benchmark.expectedOutput?.toRegex()
                        regex?.containsMatchIn(actual) ?: false
                    }
                    else -> true
                }
                EvalJudgeResult(
                    success = isSuccess,
                    score = if (isSuccess) 100.0 else 0.0,
                    rationale = if (isSuccess) "일치 기준(${benchmark.criteriaType})을 완벽히 만족합니다." else "기대하는 출력값 매칭 기준(${benchmark.criteriaType})을 미달하였습니다."
                )
            }
        }
    }

    private fun evaluateSemantic(actual: String, benchmark: BenchmarkTask): EvalJudgeResult {
        val systemPrompt = "당신은 AI 에이전트의 응답을 엄격하고 공정하게 채점하는 판정관입니다. 반드시 응답은 아래 지정된 JSON 포맷으로만 작성해야 하며, 어떠한 마크다운 코드 블록(```json)도 사용하지 말고 순수 JSON 문자열만 출력하세요."
        
        val judgePrompt = """
            사용자의 입력 프롬프트에 대해 AI 에이전트가 내놓은 실제 답변이 기대하는 올바른 답변의 의미 및 의도와 맥락적으로 일치하는지 평가해 주세요.
            
            [평가 대상 데이터]
            - 입력 프롬프트: ${benchmark.inputPrompt}
            - 기대하는 올바른 답변: ${benchmark.expectedOutput}
            - AI 에이전트의 실제 답변: $actual
            
            [채점 기준]
            - 기대하는 답변의 핵심 의미가 실제 답변에 모두 들어있고 오류가 없다면 100점 (success: true)
            - 핵심 의미가 포함되어 있으나 표현에 부차적인 차이가 있다면 70~90점 (success: true)
            - 기대하는 정답의 일부만 담겨있거나, 다소 불충분하면 50~60점 (success: false 또는 true 상황에 따라 유연하게)
            - 의미가 완전히 빗나가거나 잘못된 정보를 담고 있다면 0~40점 (success: false)
            
            [응답 포맷 (순수 JSON)]
            {
              "score": <0-100 사이의 숫자>,
              "success": <true 또는 false>,
              "rationale": "<평가 이유 요약 (한국어로 작성)>"
            }
        """.trimIndent()
        
        return try {
            val response = geminiClient.sendMessage(
                systemPrompt = systemPrompt,
                messages = listOf(mapOf("role" to "user", "content" to judgePrompt)),
                model = "gemini-2.0-flash"
            )
            val textRaw = response.candidates().orElse(null)?.firstOrNull()?.content()?.orElse(null)?.parts()?.orElse(null)?.firstOrNull()?.text()?.orElse("") ?: ""
            val cleanJson = textRaw.replace("```json", "").replace("```", "").trim()
            
            val jsonNode = objectMapper.readTree(cleanJson)
            val score = jsonNode["score"]?.asDouble() ?: 0.0
            val success = jsonNode["success"]?.asBoolean() ?: false
            val rationale = jsonNode["rationale"]?.asText() ?: "성공적으로 의미 분석을 마쳤습니다."
            
            EvalJudgeResult(success, score, rationale)
        } catch (e: Exception) {
            e.printStackTrace()
            val keywords = benchmark.expectedOutput?.split(",")?.map { it.trim() } ?: emptyList()
            val fallbackSuccess = keywords.all { actual.contains(it, ignoreCase = true) }
            EvalJudgeResult(
                success = fallbackSuccess,
                score = if (fallbackSuccess) 100.0 else 0.0,
                rationale = "Semantic 분석 엔진 호출 실패로 인해 기본 키워드 매칭(CONTAINS)으로 대체 채점되었습니다. 에러: ${e.message}"
            )
        }
    }

    @Transactional(readOnly = true)
    fun getAllBenchmarkTasks(): List<BenchmarkTask> = benchmarkTaskRepository.findAll()

    @Transactional
    fun createBenchmarkTask(request: CreateBenchmarkTaskRequest): BenchmarkTask {
        val task = BenchmarkTask(
            name = request.name,
            category = request.category,
            inputPrompt = request.inputPrompt,
            expectedOutput = request.expectedOutput,
            criteriaType = CriteriaType.valueOf(request.criteriaType),
            difficulty = request.difficulty
        )
        return benchmarkTaskRepository.save(task)
    }

    @Transactional
    fun deleteBenchmarkTask(id: Long) {
        benchmarkTaskRepository.deleteById(id)
    }

    fun getRunHistory(agentId: Long): List<EvaluationRun> =
        evaluationRunRepository.findByAgentIdOrderByStartTimeDesc(agentId)

    fun getRunDetails(runId: Long): List<EvaluationResult> =
        evaluationResultRepository.findByEvaluationRunId(runId)

    @Transactional
    fun runQuickTest(agentId: Long, taskId: Long, targetModel: String? = null): EvaluationDetailResponse {
        val agent = agentService.getAgentById(agentId)
        val task = benchmarkTaskRepository.findById(taskId).orElseThrow { IllegalArgumentException("Benchmark task not found") }
        val modelToUse = targetModel ?: agent.model

        val originalModel = agent.model
        agent.model = modelToUse
        agentService.save(agent)

        val startTime = System.currentTimeMillis()
        var actualOutput: String? = null
        var isSuccess = false
        var score = 0.0
        var rationale: String? = null
        var errorLog: String? = null
        var latency: Long = 0

        try {
            val response = agentExecutor.executeBenchmark(agent, modelToUse, task.inputPrompt)
            latency = System.currentTimeMillis() - startTime
            actualOutput = response

            val evalResult = evaluateSemanticOrMatch(response, task)
            
            // 컴퓨팅 자산별 성능 보정 적용
            val adjusted = applyAssetAdjustments(
                agentId = agent.id,
                benchmark = task,
                baseScore = evalResult.score,
                baseSuccess = evalResult.success,
                baseLatencyMs = latency,
                baseRationale = evalResult.rationale
            )
            
            isSuccess = adjusted.isSuccess
            score = adjusted.score
            rationale = adjusted.rationale
            latency = adjusted.latencyMs
        } catch (e: Exception) {
            latency = System.currentTimeMillis() - startTime
            errorLog = e.message
            isSuccess = false
            score = 0.0
            rationale = "에러 발생: ${e.message}"
        } finally {
            agent.model = originalModel
            agentService.save(agent)
        }

        return EvaluationDetailResponse(
            taskId = task.id,
            taskName = task.name,
            category = task.category,
            inputPrompt = task.inputPrompt,
            expectedOutput = task.expectedOutput,
            actualOutput = actualOutput,
            isSuccess = isSuccess,
            score = score,
            latencyMs = latency,
            rationale = rationale,
            errorLog = errorLog
        )
    }

    data class AssetAdjustmentResult(val score: Double, val isSuccess: Boolean, val latencyMs: Long, val rationale: String)

    private fun applyAssetAdjustments(
        agentId: Long,
        benchmark: BenchmarkTask,
        baseScore: Double,
        baseSuccess: Boolean,
        baseLatencyMs: Long,
        baseRationale: String?
    ): AssetAdjustmentResult {
        val assets = officeItemRepository.findByAgentId(agentId)
        if (assets.isEmpty()) {
            return AssetAdjustmentResult(baseScore, baseSuccess, baseLatencyMs, baseRationale ?: "")
        }

        val agent = agentService.getAgentById(agentId)

        var scoreBonus = 0.0
        var latencyMultiplier = 1.0
        val rationaleBuilders = mutableListOf<String>()

        assets.forEach { asset ->
            when (asset.type) {
                "REASONING_CORE" -> {
                    scoreBonus += 10.0
                    latencyMultiplier *= 0.85
                    rationaleBuilders.add("고성능 추론 코어(Reasoning Core) 가속 가동")
                }
                "EXTENDED_CONTEXT" -> {
                    if (benchmark.difficulty >= 2) {
                        scoreBonus += 10.0
                        rationaleBuilders.add("대용량 컨텍스트 메모리(Extended Context) 기반 대규모 구조 파악 성공")
                    }
                }
                "VECTOR_SEARCH" -> {
                    if (benchmark.criteriaType == CriteriaType.SEMANTIC || benchmark.criteriaType == CriteriaType.CONTAINS) {
                        scoreBonus += 8.0
                        rationaleBuilders.add("실시간 벡터 DB 검색(Vector DB Search)을 통한 고정밀 지식 검색")
                    }
                }
                "AUXILIARY_INSTANCE" -> {
                    latencyMultiplier *= 0.75
                    rationaleBuilders.add("보조 추론 인스턴스(Auxiliary Instance) 병렬 검증 연동")
                }
                "CODE_STABILITY_SANDBOX" -> {
                    scoreBonus += 12.0
                    latencyMultiplier *= 1.05
                    rationaleBuilders.add("코드 안정성 검증용 자율 샌드박스(Code Stability Sandbox) 가동으로 구문 오류 예방")
                }
                "COST_OPTIMIZER" -> {
                    scoreBonus += 5.0
                    latencyMultiplier *= 0.90
                    rationaleBuilders.add("실시간 API 비용 및 토큰 최적화 엔진(Cost Optimizer) 가동으로 컨텍스트 압축 및 레이턴시 단축")
                }
                "SYNERGY_BRIDGE" -> {
                    scoreBonus += 5.0
                    rationaleBuilders.add("협업 시너지 공명 브릿지(Synergy Bridge) 연동으로 에이전트 인지 정렬도 상승")
                }
                "VULNERABILITY_SHIELD" -> {
                    scoreBonus += 7.0
                    latencyMultiplier *= 1.02
                    rationaleBuilders.add("실시간 보안 및 취약점 검증 쉴드(Vulnerability Shield) 가동으로 잠재 보안 결함 차단")
                }
                "CI_CD_PIPELINE_EMULATOR" -> {
                    scoreBonus += 9.0
                    latencyMultiplier *= 0.95
                    rationaleBuilders.add("CI/CD 파이프라인 에뮬레이터(CI/CD Pipeline Emulator) 가동으로 가상 빌드 자동 검증")
                }
                "DEPRECATED_API_SCANNER" -> {
                    scoreBonus += 6.0
                    latencyMultiplier *= 0.98
                    rationaleBuilders.add("사용 제안 API 분석기(Deprecated API Scanner) 가동으로 레거시 호환성 사전 추적")
                }
            }
        }

        // 평가 연동 자산 가동 로그 남김
        assets.forEach { asset ->
            val description = when (asset.type) {
                "REASONING_CORE" -> "에이전트 평가 중 [고성능 추론 코어] 자원이 연동되어 평가 성능 점수 보정(+10.0) 및 레이턴시 단축(15%)이 적용되었습니다."
                "EXTENDED_CONTEXT" -> if (benchmark.difficulty >= 2) "에이전트 평가 중 [대용량 컨텍스트 메모리] 자원이 가동되어 고난도 문제 해결력 보정(+10.0)이 적용되었습니다." else null
                "VECTOR_SEARCH" -> if (benchmark.criteriaType == CriteriaType.SEMANTIC || benchmark.criteriaType == CriteriaType.CONTAINS) "에이전트 평가 중 [실시간 벡터 지식 검색 세션] 자원이 가동되어 의미 채점 정확도 보정(+8.0)이 적용되었습니다." else null
                "AUXILIARY_INSTANCE" -> "에이전트 평가 중 [보조 추론 및 자가 치유 인스턴스] 자원이 연동되어 레이턴시 단축(25%)이 적용되었습니다."
                "CODE_STABILITY_SANDBOX" -> "에이전트 평가 중 [코드 안정성 검증용 자율 샌드박스] 자원이 연동되어 구문 에러 방지 점수 보정(+12.0)이 적용되었습니다."
                "COST_OPTIMIZER" -> "에이전트 평가 중 [실시간 API 비용 및 토큰 최적화 엔진] 자원이 가동되어 평가 성능 점수 보정(+5.0) 및 레이턴시 단축(10%)이 적용되었습니다."
                "SYNERGY_BRIDGE" -> "에이전트 평가 중 [협업 시너지 공명 브릿지] 자원이 연동되어 인지 정렬도 및 성능 보정(+5.0)이 적용되었습니다."
                "VULNERABILITY_SHIELD" -> "에이전트 평가 중 [실시간 보안 및 취약점 검증 쉴드] 자원이 연동되어 보안성 보너스 점수 보정(+7.0) 및 레이턴시 보정(2% 지연)이 적용되었습니다."
                "CI_CD_PIPELINE_EMULATOR" -> "에이전트 평가 중 [CI/CD 파이프라인 에뮬레이터] 자원이 연동되어 가상 통합 테스트 점수 보정(+9.0) 및 레이턴시 단축(5%)이 적용되었습니다."
                "DEPRECATED_API_SCANNER" -> "에이전트 평가 중 [사용 제안 API 분석기] 자원이 가동되어 레거시 호환성 점수 보정(+6.0) 및 레이턴시 단축(2%)이 적용되었습니다."
                else -> null
            }
            if (description != null) {
                assetUtilizationLogRepository.save(AssetUtilizationLog(
                    agentId = agentId,
                    agentName = agent.name,
                    assetType = asset.type,
                    assetName = asset.name,
                    actionType = "UTILIZATION",
                    description = "${agent.name} 에이전트: $description"
                ))
            }
        }

        var finalScore = (baseScore + scoreBonus).coerceAtMost(100.0)
        var finalSuccess = baseSuccess

        if (assets.any { it.type == "AUXILIARY_INSTANCE" } && finalScore < 60.0) {
            finalScore = (finalScore + 15.0).coerceAtMost(95.0)
            finalSuccess = true
            rationaleBuilders.add("보조 인스턴스의 자가 교차 치유(Self-Healing) 작동")
            
            assetUtilizationLogRepository.save(AssetUtilizationLog(
                agentId = agentId,
                agentName = agent.name,
                assetType = "AUXILIARY_INSTANCE",
                assetName = "보조 추론 및 자가 치유 인스턴스",
                actionType = "UTILIZATION",
                description = "${agent.name} 에이전트: 평가 실패 복구 과정에서 [보조 추론 및 자가 치유 인스턴스]의 자가 교차 치유(Self-Healing) 알고리즘이 가동되었습니다."
            ))
        }
        
        if (finalScore >= 60.0) {
            finalSuccess = true
        }

        val finalLatency = (baseLatencyMs * latencyMultiplier).toLong()
        val suffix = if (rationaleBuilders.isNotEmpty()) {
            "\n[시스템 보전 분석]: " + rationaleBuilders.joinToString(", ") + " 완료"
        } else ""

        return AssetAdjustmentResult(
            score = finalScore,
            isSuccess = finalSuccess,
            latencyMs = finalLatency,
            rationale = (baseRationale ?: "") + suffix
        )
    }
}

