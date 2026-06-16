package com.kzoneworkspace.backend.agent.service

import com.kzoneworkspace.backend.agent.entity.*
import com.kzoneworkspace.backend.agent.repository.*
import com.kzoneworkspace.backend.claude.AgentExecutor
import com.kzoneworkspace.backend.claude.GeminiClient
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test
import org.mockito.Mockito.`when`
import org.mockito.Mockito.mock
import org.springframework.messaging.simp.SimpMessagingTemplate
import java.util.*

class EvaluationServiceAssetTest {

    private val benchmarkTaskRepository = mock(BenchmarkTaskRepository::class.java)
    private val evaluationRunRepository = mock(EvaluationRunRepository::class.java)
    private val evaluationResultRepository = mock(EvaluationResultRepository::class.java)
    private val agentService = mock(AgentService::class.java)
    private val agentExecutor = mock(AgentExecutor::class.java)
    private val geminiClient = mock(GeminiClient::class.java)
    private val messagingTemplate = mock(SimpMessagingTemplate::class.java)
    private val agentEvolutionRepository = mock(AgentEvolutionRepository::class.java)
    private val officeItemRepository = mock(OfficeItemRepository::class.java)
    private val assetUtilizationLogRepository = mock(AssetUtilizationLogRepository::class.java)

    private val evaluationService = EvaluationService(
        benchmarkTaskRepository,
        evaluationRunRepository,
        evaluationResultRepository,
        agentService,
        agentExecutor,
        geminiClient,
        messagingTemplate,
        agentEvolutionRepository,
        officeItemRepository,
        assetUtilizationLogRepository
    )

    @Test
    fun `컴퓨팅 자산 미할당 시 기본 평가 결과 반환`() {
        val agentId = 1L
        val taskId = 2L
        val agent = Agent(id = agentId, name = "TestAgent", role = "Planner", model = "test-model")
        val task = BenchmarkTask(
            id = taskId,
            name = "TestTask",
            category = "CODING",
            inputPrompt = "프롬프트",
            expectedOutput = "정답",
            criteriaType = CriteriaType.CONTAINS,
            difficulty = 1
        )

        `when`(agentService.getAgentById(agentId)).thenReturn(agent)
        `when`(benchmarkTaskRepository.findById(taskId)).thenReturn(Optional.of(task))
        `when`(agentExecutor.executeBenchmark(agent, "test-model", "프롬프트")).thenReturn("이것은 정답입니다.")
        `when`(officeItemRepository.findByAgentId(agentId)).thenReturn(emptyList())

        val result = evaluationService.runQuickTest(agentId, taskId)

        assertEquals(100.0, result.score)
        assertTrue(result.isSuccess)
        assertTrue(result.rationale!!.contains("일치 기준"))
    }

    @Test
    fun `고성능 추론 코어 할당 시 점수 및 레이턴시 보정 테스트`() {
        val agentId = 1L
        val taskId = 2L
        val agent = Agent(id = agentId, name = "TestAgent", role = "Planner", model = "test-model")
        val task = BenchmarkTask(
            id = taskId,
            name = "TestTask",
            category = "CODING",
            inputPrompt = "프롬프트",
            expectedOutput = "오답", 
            criteriaType = CriteriaType.CONTAINS,
            difficulty = 1
        )

        `when`(agentService.getAgentById(agentId)).thenReturn(agent)
        `when`(benchmarkTaskRepository.findById(taskId)).thenReturn(Optional.of(task))
        `when`(agentExecutor.executeBenchmark(agent, "test-model", "프롬프트")).thenReturn("실패 답변")
        
        val reasoningCore = OfficeItem(name = "고성능 추론 코어", type = "REASONING_CORE", x = 10, y = 10, agentId = agentId)
        `when`(officeItemRepository.findByAgentId(agentId)).thenReturn(listOf(reasoningCore))

        val result = evaluationService.runQuickTest(agentId, taskId)

        assertEquals(10.0, result.score)
        assertTrue(result.rationale!!.contains("고성능 추론 코어"))
    }

    @Test
    fun `보조 추론 모델 인스턴스 할당 시 자가 치유 작동 검증`() {
        val agentId = 1L
        val taskId = 2L
        val agent = Agent(id = agentId, name = "TestAgent", role = "Planner", model = "test-model")
        val task = BenchmarkTask(
            id = taskId,
            name = "TestTask",
            category = "CODING",
            inputPrompt = "프롬프트",
            expectedOutput = "오답", 
            criteriaType = CriteriaType.CONTAINS,
            difficulty = 1
        )

        `when`(agentService.getAgentById(agentId)).thenReturn(agent)
        `when`(benchmarkTaskRepository.findById(taskId)).thenReturn(Optional.of(task))
        `when`(agentExecutor.executeBenchmark(agent, "test-model", "프롬프트")).thenReturn("실패 답변")
        
        val auxiliaryInstance = OfficeItem(name = "보조 추론 모델 인스턴스", type = "AUXILIARY_INSTANCE", x = 10, y = 10, agentId = agentId)
        `when`(officeItemRepository.findByAgentId(agentId)).thenReturn(listOf(auxiliaryInstance))

        val result = evaluationService.runQuickTest(agentId, taskId)

        // 원래 실패하여 0점이었던 항목이 자가 치유 보너스 +15점을 받고, success가 true로 보정됨을 검증
        assertEquals(15.0, result.score)
        assertTrue(result.isSuccess)
        assertTrue(result.rationale!!.contains("자가 교차 치유(Self-Healing)"))
    }

    @Test
    fun `API 비용 및 토큰 최적화 엔진 할당 시 점수 및 레이턴시 보정 테스트`() {
        val agentId = 1L
        val taskId = 2L
        val agent = Agent(id = agentId, name = "TestAgent", role = "Planner", model = "test-model")
        val task = BenchmarkTask(
            id = taskId,
            name = "TestTask",
            category = "CODING",
            inputPrompt = "프롬프트",
            expectedOutput = "정답", 
            criteriaType = CriteriaType.CONTAINS,
            difficulty = 1
        )

        `when`(agentService.getAgentById(agentId)).thenReturn(agent)
        `when`(benchmarkTaskRepository.findById(taskId)).thenReturn(Optional.of(task))
        `when`(agentExecutor.executeBenchmark(agent, "test-model", "프롬프트")).thenReturn("이것은 정답입니다.")
        
        val costOptimizer = OfficeItem(name = "비용 최적화 엔진", type = "COST_OPTIMIZER", x = 10, y = 10, agentId = agentId)
        `when`(officeItemRepository.findByAgentId(agentId)).thenReturn(listOf(costOptimizer))

        val result = evaluationService.runQuickTest(agentId, taskId)

        // 기본 점수 100점에 보너스 +5점으로 100점 제한(점수는 최대 100.0)
        assertEquals(100.0, result.score)
        assertTrue(result.rationale!!.contains("Cost Optimizer"))
    }

    @Test
    fun `협업 시너지 공명 브릿지 할당 시 점수 보정 테스트`() {
        val agentId = 1L
        val taskId = 2L
        val agent = Agent(id = agentId, name = "TestAgent", role = "Planner", model = "test-model")
        val task = BenchmarkTask(
            id = taskId,
            name = "TestTask",
            category = "CODING",
            inputPrompt = "프롬프트",
            expectedOutput = "오답", 
            criteriaType = CriteriaType.CONTAINS,
            difficulty = 1
        )

        `when`(agentService.getAgentById(agentId)).thenReturn(agent)
        `when`(benchmarkTaskRepository.findById(taskId)).thenReturn(Optional.of(task))
        `when`(agentExecutor.executeBenchmark(agent, "test-model", "프롬프트")).thenReturn("실패 답변")
        
        val synergyBridge = OfficeItem(name = "협업 시너지 브릿지", type = "SYNERGY_BRIDGE", x = 10, y = 10, agentId = agentId)
        `when`(officeItemRepository.findByAgentId(agentId)).thenReturn(listOf(synergyBridge))

        val result = evaluationService.runQuickTest(agentId, taskId)

        // 원래 실패하여 0점이었던 항목이 시너지 브릿지 보너스 +5점을 받음
        assertEquals(5.0, result.score)
        assertTrue(result.rationale!!.contains("Synergy Bridge"))
    }

    @Test
    fun `실시간 보안 및 취약점 검증 쉴드 할당 시 점수 및 레이턴시 보정 테스트`() {
        val agentId = 1L
        val taskId = 2L
        val agent = Agent(id = agentId, name = "TestAgent", role = "Planner", model = "test-model")
        val task = BenchmarkTask(
            id = taskId,
            name = "TestTask",
            category = "CODING",
            inputPrompt = "프롬프트",
            expectedOutput = "정답", 
            criteriaType = CriteriaType.CONTAINS,
            difficulty = 1
        )

        `when`(agentService.getAgentById(agentId)).thenReturn(agent)
        `when`(benchmarkTaskRepository.findById(taskId)).thenReturn(Optional.of(task))
        `when`(agentExecutor.executeBenchmark(agent, "test-model", "프롬프트")).thenReturn("이것은 정답입니다.")
        
        val vulnerabilityShield = OfficeItem(name = "보안 쉴드", type = "VULNERABILITY_SHIELD", x = 10, y = 10, agentId = agentId)
        `when`(officeItemRepository.findByAgentId(agentId)).thenReturn(listOf(vulnerabilityShield))

        val result = evaluationService.runQuickTest(agentId, taskId)

        // 기본 점수 100점에 보너스 +7점으로 100점 제한(점수는 최대 100.0)
        assertEquals(100.0, result.score)
        assertTrue(result.rationale!!.contains("Vulnerability Shield"))
    }
}
