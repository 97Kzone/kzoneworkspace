package com.kzoneworkspace.backend.agent.service
 
import com.kzoneworkspace.backend.agent.controller.ApplyOptimizationResult
import com.kzoneworkspace.backend.agent.entity.Agent
import com.kzoneworkspace.backend.task.repository.TaskRepository
import com.kzoneworkspace.backend.task.entity.TaskStatus
import com.kzoneworkspace.backend.websocket.ChatMessage
import com.kzoneworkspace.backend.websocket.ChatMessageRepository
import com.kzoneworkspace.backend.websocket.MessageType
import org.springframework.messaging.simp.SimpMessagingTemplate
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDateTime
import java.time.Duration
import kotlin.random.Random
 
data class PipelineStage(
    val id: String,
    val name: String,
    val status: String, // "ACTIVE", "IDLE", "BOTTLENECK"
    val agentName: String,
    val avgTimeSec: Int,
    val successRate: Double,
    val queueSize: Int,
    val bottleneckScore: Int // 0 to 100
)
 
data class PipelineMetrics(
    val overallEfficiency: Int,
    val stages: List<PipelineStage>,
    val recommendations: List<OptimizationRecommendation>,
    val updatedAt: LocalDateTime
)
 
data class OptimizationRecommendation(
    val title: String,
    val description: String,
    val targetStageId: String,
    val impact: String // "HIGH", "MEDIUM", "LOW"
)
 
@Service
class WorkflowPipelineService(
    private val activityLogService: ActivityLogService,
    private val chatMessageRepository: ChatMessageRepository,
    private val messagingTemplate: SimpMessagingTemplate,
    private val agentService: AgentService,
    private val officeService: OfficeService,
    private val taskRepository: TaskRepository
) {
 
    @Transactional
    fun applyOptimization(stageId: String, title: String): ApplyOptimizationResult {
        val agents = agentService.getAllAgents()
        
        // 대상 에이전트 식별
        val agent = when (stageId) {
            "STAGE_PLAN" -> agents.find { it.name.equals("Planner", ignoreCase = true) || it.role.contains("플래너") } ?: agents.firstOrNull()
            "STAGE_DEV" -> agents.find { it.name.equals("Coder", ignoreCase = true) || it.role.contains("개발자") } ?: agents.getOrNull(1)
            "STAGE_REVIEW" -> agents.find { it.name.equals("Reviewer", ignoreCase = true) || it.role.contains("리뷰어") } ?: agents.getOrNull(2)
            else -> agents.find { it.name.contains("tester", ignoreCase = true) || it.role.contains("QA") || it.role.contains("테스터") }
        }

        if (agent == null) {
            return ApplyOptimizationResult(
                success = false,
                message = "최적화 전략을 적용할 대상을 찾지 못했습니다."
            )
        }

        if (title.contains("스케일 아웃") || title.contains("제안")) {
            // 스케일 아웃 전략 적용: 성공 기여도 200 pts 필요 및 보조 인스턴스 자동 배치
            val cost = 200
            if (agent.contributionPoints < cost) {
                return ApplyOptimizationResult(
                    success = false,
                    message = "'${agent.name}' 에이전트의 성공 기여도(현재: ${agent.contributionPoints} pts)가 부족합니다. 스케일 아웃 배치를 위해서는 최소 200 pts가 필요합니다."
                )
            }

            try {
                // 가상 오피스에 컴퓨팅 자원 배치 및 성공 기여도 차감
                officeService.allocateAsset(
                    agentId = agent.id,
                    name = "보조 추론 모델 인스턴스 (${agent.name} 확장)",
                    type = "AUXILIARY_INSTANCE",
                    x = Random.nextInt(10, 90),
                    y = Random.nextInt(10, 90),
                    price = cost
                )

                // 활동 로그 기록
                activityLogService.logActivity(
                    agentId = agent.id,
                    roomId = "default",
                    activityType = "PIPELINE_OPTIMIZATION",
                    details = "스케일 아웃 최적화 적용: '${agent.name}' 에이전트에 병렬 연산 보조 추론 모델 자원 자동 배치 완료 (성공 기여도 200 pts 차감)"
                )

                // 시스템 메시지 채팅 발행
                val message = ChatMessage(
                    roomId = "default",
                    senderId = "system",
                    senderName = "System",
                    content = "⚙️ **[워크플로우 최적화]** '${agent.name}' 에이전트의 병목 해소를 위한 **스케일 아웃** 조치 완료! 보조 추론 모델 인스턴스(Auxiliary Instance)가 실시간 자동 할당되었습니다. (성공 기여도 200 pts 차감)",
                    type = MessageType.SYSTEM,
                    timestamp = LocalDateTime.now()
                )
                chatMessageRepository.save(message)
                messagingTemplate.convertAndSend("/topic/public", message)

                return ApplyOptimizationResult(
                    success = true,
                    message = "'${agent.name}' 에이전트에 대한 스케일 아웃 및 보조 인스턴스 자동 할당이 완료되었습니다."
                )
            } catch (e: Exception) {
                return ApplyOptimizationResult(
                    success = false,
                    message = "자산 자동 할당 중 오류 발생: ${e.message}"
                )
            }
        } else {
            // 컨텍스트 보강 전략 적용: 시스템 프롬프트 자동 튜닝 및 인지 신뢰도 약간 상승
            val optimizePrompt = "\n\n[AI 최적화 지침: 입력 요구사항 명세에 대한 엄밀한 분석을 우선 시행하고, 논리 정합성 자가 검증 루프를 필히 통과시키십시오.]"
            if (!agent.systemPrompt.contains("[AI 최적화 지침")) {
                agent.systemPrompt = agent.systemPrompt + optimizePrompt
            }
            
            // 인지 신뢰도 점수 소폭 상승 (최대 100)
            agent.reliabilityIndex = (agent.reliabilityIndex + 5).coerceAtMost(100)
            agentService.save(agent)

            activityLogService.logActivity(
                agentId = agent.id,
                roomId = "default",
                activityType = "PIPELINE_OPTIMIZATION",
                details = "컨텍스트 보강 최적화 적용: '${agent.name}' 에이전트의 프롬프트 실시간 튜닝 및 지능 최적화 완료 (신뢰도 +5% 상승)"
            )

            val message = ChatMessage(
                roomId = "default",
                senderId = "system",
                senderName = "System",
                content = "⚙️ **[워크플로우 최적화]** '${agent.name}' 에이전트의 인지 정합성 복구를 위한 **컨텍스트 보강 및 프롬프트 실시간 튜닝** 조치가 성공적으로 적용되었습니다. (지능 신뢰도 지수 및 응답 엄밀성 향상)",
                type = MessageType.SYSTEM,
                timestamp = LocalDateTime.now()
            )
            chatMessageRepository.save(message)
            messagingTemplate.convertAndSend("/topic/public", message)

            return ApplyOptimizationResult(
                success = true,
                message = "'${agent.name}' 에이전트에 대한 인지 컨텍스트 보강 및 프롬프트 실시간 최적화 튜닝이 성공적으로 완료되었습니다."
            )
        }
    }
 
    fun getMetrics(): PipelineMetrics {
        val agents = agentService.getAllAgents()
        val allTasks = taskRepository.findAll()

        // 1. 에이전트 분류
        val planner = agents.find { it.name.equals("Planner", ignoreCase = true) || it.role.contains("플래너") } ?: agents.firstOrNull()
        val coder = agents.find { it.name.equals("Coder", ignoreCase = true) || it.role.contains("개발자") } ?: agents.getOrNull(1) ?: planner
        val reviewer = agents.find { it.name.equals("Reviewer", ignoreCase = true) || it.role.contains("리뷰어") } ?: agents.getOrNull(2) ?: coder
        val qaAgent = agents.find { it.name.contains("tester", ignoreCase = true) || it.role.contains("QA") || it.role.contains("테스터") }

        // 2. 단계 생성 헬퍼 함수
        fun createStageForAgent(id: String, stageName: String, agent: Agent?, defaultAvgTime: Int, defaultSuccessRate: Double): PipelineStage {
            val agentName = agent?.name ?: "자율 기획 엔진"
            
            // 대기 큐 크기 계산 (RUNNING, HEALING, PENDING 상태의 태스크 수)
            val queueSize = if (agent != null) {
                allTasks.count { it.agent?.id == agent.id && (it.status == TaskStatus.RUNNING || it.status == TaskStatus.HEALING || it.status == TaskStatus.PENDING) }
            } else {
                0
            }

            // 태스크 완수율(성공률) 계산
            val successRate = if (agent != null) {
                val agentTasks = allTasks.filter { it.agent?.id == agent.id }
                val completed = agentTasks.count { it.status == TaskStatus.COMPLETED }
                val totalFinished = agentTasks.count { it.status == TaskStatus.COMPLETED || it.status == TaskStatus.FAILED }
                if (totalFinished > 0) {
                    (completed.toDouble() / totalFinished * 1000).toInt() / 10.0
                } else {
                    agent.reliabilityIndex.toDouble()
                }
            } else {
                defaultSuccessRate
            }

            // 평균 처리 시간 계산
            val avgTimeSec = if (agent != null) {
                val agentTasks = allTasks.filter { it.agent?.id == agent.id && it.status == TaskStatus.COMPLETED && it.startedAt != null && it.completedAt != null }
                if (agentTasks.isNotEmpty()) {
                    val totalDurationSec = agentTasks.sumOf { Duration.between(it.startedAt, it.completedAt).toSeconds() }
                    (totalDurationSec / agentTasks.size).toInt().coerceIn(5, 600)
                } else {
                    defaultAvgTime
                }
            } else {
                defaultAvgTime
            }

            // 병목 지표 계산 공식 (큐가 많거나 완수율이 떨어질 때 점수 상승)
            val queueWeight = 18
            val successPenalty = (100.0 - successRate).toInt()
            val bottleneckScore = (queueSize * queueWeight + successPenalty).coerceIn(0, 100)

            val status = when {
                bottleneckScore >= 75 -> "BOTTLENECK"
                queueSize > 0 -> "ACTIVE"
                else -> "IDLE"
            }

            return PipelineStage(
                id = id,
                name = stageName,
                status = status,
                agentName = agentName,
                avgTimeSec = avgTimeSec,
                successRate = successRate,
                queueSize = queueSize,
                bottleneckScore = bottleneckScore
            )
        }

        // 각 파이프라인 단계 빌드
        val planStage = createStageForAgent("STAGE_PLAN", "미션 기획 및 설계 단계", planner, 25, 98.5)
        val devStage = createStageForAgent("STAGE_DEV", "코드 자동 생성 단계", coder, 150, 85.0)
        val reviewStage = createStageForAgent("STAGE_REVIEW", "코드 품질 검증 및 리뷰 단계", reviewer, 45, 92.0)
        val qaStage = createStageForAgent("STAGE_QA", "QA 검증 및 통합 테스트 단계", qaAgent, 35, 95.0)

        val stages = listOf(planStage, devStage, reviewStage, qaStage)

        // 3. 병목 구간 식별 및 권장 사항 생성
        val recommendations = mutableListOf<OptimizationRecommendation>()
        
        val bottleneckStage = stages.maxByOrNull { it.bottleneckScore }
        if (bottleneckStage != null && bottleneckStage.bottleneckScore > 65) {
            recommendations.add(
                OptimizationRecommendation(
                    title = "스케일 아웃 제안: ${bottleneckStage.name}",
                    description = "[병목 감지] '${bottleneckStage.agentName}' 에이전트의 대기열이 집중되어 지연이 발생하고 있습니다. 병렬 보조 추론 모델 인스턴스(Auxiliary Instance) 자원을 즉시 배치하여 태스크 처리를 가속하세요.",
                    targetStageId = bottleneckStage.id,
                    impact = "HIGH"
                )
            )
        }

        if (stages.any { it.successRate < 90.0 }) {
            val weakStage = stages.first { it.successRate < 90.0 }
            recommendations.add(
                OptimizationRecommendation(
                    title = "컨텍스트 보강 필요: ${weakStage.name}",
                    description = "[완수율 저하] '${weakStage.agentName}' 에이전트의 최근 정합성 성공률이 기준치 미달입니다. 실시간 프롬프트 튜닝과 논리적 컨텍스트 강화를 통해 인지 정확도를 높이세요.",
                    targetStageId = weakStage.id,
                    impact = "MEDIUM"
                )
            )
        }

        val overallEfficiency = 100 - (stages.map { it.bottleneckScore }.average().toInt() / 2)

        return PipelineMetrics(
            overallEfficiency = overallEfficiency.coerceIn(0, 100),
            stages = stages,
            recommendations = recommendations,
            updatedAt = LocalDateTime.now()
        )
    }
}
