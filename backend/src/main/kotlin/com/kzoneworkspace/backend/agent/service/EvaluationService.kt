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
    private val agentEvolutionRepository: AgentEvolutionRepository
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
                    result.isSuccess = evalResult.success
                    result.score = evalResult.score
                    result.rationale = evalResult.rationale
                    
                    totalScore += result.score
                    totalLatency += latency
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
}
