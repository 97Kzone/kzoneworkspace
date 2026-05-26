package com.kzoneworkspace.backend.agent.service

import com.kzoneworkspace.backend.agent.controller.ApplyOptimizationResult
import com.kzoneworkspace.backend.websocket.ChatMessage
import com.kzoneworkspace.backend.websocket.ChatMessageRepository
import com.kzoneworkspace.backend.websocket.MessageType
import org.springframework.messaging.simp.SimpMessagingTemplate
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDateTime
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
    private val messagingTemplate: SimpMessagingTemplate
) {

    @Transactional
    fun applyOptimization(stageId: String, title: String): ApplyOptimizationResult {
        // 1. 에이전트 시스템 활동 로그 기록
        activityLogService.logActivity(
            agentId = 1L, // 기본 관리자/시스템 에이전트 ID
            roomId = "default",
            activityType = "PIPELINE_OPTIMIZATION",
            details = "워크플로우 파이프라인 단계 '$stageId'에 대해 최적화 전략 '$title' 적용 완료"
        )

        // 2. 실시간 채팅 창에 시스템 알림 메시지 추가 및 저장
        val message = ChatMessage(
            roomId = "default",
            senderId = "system",
            senderName = "System",
            content = "⚙️ **[워크플로우 파이프라인 최적화]** AI가 제안한 최적화 전략 *'$title'*이(가) 시스템에 성공적으로 반영되었습니다. (대상 단계: $stageId)",
            type = MessageType.SYSTEM,
            timestamp = LocalDateTime.now()
        )
        chatMessageRepository.save(message)
        messagingTemplate.convertAndSend("/topic/public", message)

        return ApplyOptimizationResult(
            success = true,
            message = "워크플로우 파이프라인 최적화 전략 '$title'이(가) 실시간으로 군집 지능 시스템에 적용되었습니다."
        )
    }

    fun getMetrics(): PipelineMetrics {
        // 임의의 파이프라인 단계 생성
        val stages = listOf(
            PipelineStage(
                id = "STAGE_PLAN",
                name = "Mission Planning",
                status = "ACTIVE",
                agentName = "Architect-X",
                avgTimeSec = Random.nextInt(10, 45),
                successRate = 98.5,
                queueSize = Random.nextInt(0, 5),
                bottleneckScore = Random.nextInt(5, 20)
            ),
            PipelineStage(
                id = "STAGE_DEV",
                name = "Code Generation",
                status = "BOTTLENECK",
                agentName = "Coder-Pro",
                avgTimeSec = Random.nextInt(120, 300),
                successRate = 85.0,
                queueSize = Random.nextInt(8, 25),
                bottleneckScore = Random.nextInt(80, 100)
            ),
            PipelineStage(
                id = "STAGE_REVIEW",
                name = "Code Review",
                status = "ACTIVE",
                agentName = "Review-Bot",
                avgTimeSec = Random.nextInt(30, 90),
                successRate = 92.0,
                queueSize = Random.nextInt(2, 10),
                bottleneckScore = Random.nextInt(30, 60)
            ),
            PipelineStage(
                id = "STAGE_QA",
                name = "QA & Testing",
                status = "IDLE",
                agentName = "Test-Master",
                avgTimeSec = Random.nextInt(20, 60),
                successRate = 95.0,
                queueSize = 0,
                bottleneckScore = Random.nextInt(0, 10)
            )
        )

        // 병목 구간 식별 및 권장 사항 생성
        val recommendations = mutableListOf<OptimizationRecommendation>()
        
        val bottleneckStage = stages.maxByOrNull { it.bottleneckScore }
        if (bottleneckStage != null && bottleneckStage.bottleneckScore > 70) {
            recommendations.add(
                OptimizationRecommendation(
                    title = "스케일 아웃 제안: ${bottleneckStage.name}",
                    description = "${bottleneckStage.name} 단계에 현재 대기열이 집중되고 있습니다. 추가 에이전트를 할당하거나 병렬 처리를 활성화하여 병목을 해소하세요.",
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
                    description = "${weakStage.name} 단계의 성공률이 기준치 이하입니다. 이전 단계에서의 명세 전달 방식을 개선하거나 프롬프트를 세부화하세요.",
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
