package com.kzoneworkspace.backend.agent.service

import com.kzoneworkspace.backend.agent.entity.*
import com.kzoneworkspace.backend.agent.repository.*
import com.kzoneworkspace.backend.claude.AgentExecutor
import jakarta.annotation.PostConstruct
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDateTime
import kotlin.system.measureTimeMillis

@Service
class EvaluationService(
    private val benchmarkTaskRepository: BenchmarkTaskRepository,
    private val evaluationRunRepository: EvaluationRunRepository,
    private val evaluationResultRepository: EvaluationResultRepository,
    private val agentService: AgentService,
    private val agentExecutor: AgentExecutor
) {

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
        
        // 비동기로 실행하는 것이 좋으나, 일단 동기적으로 구현 (간단한 예제)
        // 실제 운영 환경에서는 @Async 등을 사용해야 함
        runEvaluationSync(run)
        
        return run
    }

    private fun runEvaluationSync(run: EvaluationRun) {
        val benchmarks = benchmarkTaskRepository.findAll()
        var totalScore = 0.0
        var totalLatency: Long = 0
        var completed = 0
        
        // 임시로 에이전트의 모델을 변경 (평가용)
        val originalModel = run.agent.model
        run.agent.model = run.modelName

        try {
            for (benchmark in benchmarks) {
                val result = EvaluationResult(
                    evaluationRun = run,
                    benchmarkTask = benchmark
                )
                
                val startTime = System.currentTimeMillis()
                try {
                    // AgentExecutor를 통해 실행 (평가용 전용 룸 사용)
                    // 실제 AgentExecutor 내부에서 발생하는 사이드 이펙트(포인트 지급 등)는 감수하거나 
                    // 별도의 리팩토링이 필요함. 여기서는 개념 증명을 위해 직접 호출.
                    
                    // 주의: AgentExecutor.execute는 결과를 리턴하지 않고 WebSocket으로 보냄.
                    // 따라서 평가를 위해서는 AgentExecutor의 로직 중 응답을 리턴하는 부분을 분리해야 함.
                    // 여기서는 runReasoningLoop와 유사한 로직을 직접 수행하거나 AgentExecutor를 수정해야 함.
                    
                    // 일단 TaskService를 통해 결과를 가져오는 방식으로 대략적 구현
                    // (실제 구현 시에는 AgentExecutor에 리턴값이 있는 메서드를 추가하는 것이 정석)
                    
                    val dummyRoomId = "eval-room-${run.id}"
                    
                    // AgentExecutor를 통해 실제 LLM 호출 수행
                    val response = agentExecutor.executeBenchmark(run.agent, run.modelName, benchmark.inputPrompt)
                    val latency = System.currentTimeMillis() - startTime
                    
                    result.actualOutput = response
                    result.latencyMs = latency
                    result.isSuccess = evaluate(response, benchmark)
                    result.score = if (result.isSuccess) 100.0 else 0.0
                    
                    totalScore += result.score
                    totalLatency += latency
                    completed++
                    
                } catch (e: Exception) {
                    result.errorLog = e.message
                    result.isSuccess = false
                    result.score = 0.0
                }
                
                evaluationResultRepository.save(result)
            }
            
            run.status = "COMPLETED"
            run.completedTasks = completed
            run.overallScore = if (completed > 0) totalScore / completed else 0.0
            run.avgLatencyMs = if (completed > 0) totalLatency / completed else 0
            run.endTime = LocalDateTime.now()
            
        } finally {
            // 모델 복구
            run.agent.model = originalModel
            evaluationRunRepository.save(run)
        }
    }

    private fun evaluate(actual: String, benchmark: BenchmarkTask): Boolean {
        if (benchmark.expectedOutput == null) return true
        
        return when (benchmark.criteriaType) {
            CriteriaType.EXACT_MATCH -> actual.trim() == benchmark.expectedOutput?.trim()
            CriteriaType.CONTAINS -> {
                val keywords = benchmark.expectedOutput?.split(",")?.map { it.trim() } ?: emptyList()
                keywords.all { actual.contains(it, ignoreCase = true) }
            }
            CriteriaType.REGEX -> {
                val regex = benchmark.expectedOutput?.toRegex()
                regex?.containsMatchIn(actual) ?: false
            }
            CriteriaType.SEMANTIC -> true // 추후 구현
        }
    }

    fun getRunHistory(agentId: Long): List<EvaluationRun> =
        evaluationRunRepository.findByAgentIdOrderByStartTimeDesc(agentId)

    fun getRunDetails(runId: Long): List<EvaluationResult> =
        evaluationResultRepository.findByEvaluationRunId(runId)
}
