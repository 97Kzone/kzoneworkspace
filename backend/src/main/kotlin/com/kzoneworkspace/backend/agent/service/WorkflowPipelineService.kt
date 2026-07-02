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
import com.kzoneworkspace.backend.agent.repository.OfficeItemRepository
 
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
    private val taskRepository: TaskRepository,
    private val officeItemRepository: OfficeItemRepository
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

        if (title.contains("스케일 아웃")) {
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
                    cost = cost
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
        } else if (title.contains("추론 속도 가속")) {
            val cost = 150
            if (agent.contributionPoints < cost) {
                return ApplyOptimizationResult(
                    success = false,
                    message = "'${agent.name}' 에이전트의 성공 기여도(현재: ${agent.contributionPoints} pts)가 부족합니다. 고성능 추론 가속 코어 배치를 위해서는 최소 150 pts가 필요합니다."
                )
            }
            try {
                officeService.allocateAsset(
                    agentId = agent.id,
                    name = "고성능 추론 가속 코어 (${agent.name} 탑재)",
                    type = "REASONING_CORE",
                    x = Random.nextInt(10, 90),
                    y = Random.nextInt(10, 90),
                    cost = cost
                )
                activityLogService.logActivity(
                    agentId = agent.id,
                    roomId = "default",
                    activityType = "PIPELINE_OPTIMIZATION",
                    details = "추론 가속 최적화 적용: '${agent.name}' 에이전트에 고성능 추론 가속 코어 자동 배치 완료 (성공 기여도 150 pts 차감)"
                )
                val message = ChatMessage(
                    roomId = "default",
                    senderId = "system",
                    senderName = "System",
                    content = "⚙️ **[워크플로우 최적화]** '${agent.name}' 에이전트의 연산 지연 해소를 위한 **고성능 추론 가속 코어** 조치 완료! Strict Temp 0.1 모드 가속 연산이 실시간 자동 적용되었습니다. (성공 기여도 150 pts 차감)",
                    type = MessageType.SYSTEM,
                    timestamp = LocalDateTime.now()
                )
                chatMessageRepository.save(message)
                messagingTemplate.convertAndSend("/topic/public", message)
                return ApplyOptimizationResult(
                    success = true,
                    message = "'${agent.name}' 에이전트에 대한 고성능 추론 가속 코어 자동 할당이 완료되었습니다."
                )
            } catch (e: Exception) {
                return ApplyOptimizationResult(
                    success = false,
                    message = "자산 자동 할당 중 오류 발생: ${e.message}"
                )
            }
        } else if (title.contains("코드 안정성")) {
            val cost = 120
            if (agent.contributionPoints < cost) {
                return ApplyOptimizationResult(
                    success = false,
                    message = "'${agent.name}' 에이전트의 성공 기여도(현재: ${agent.contributionPoints} pts)가 부족합니다. 코드 안정성 검증용 자율 샌드박스 배치를 위해서는 최소 120 pts가 필요합니다."
                )
            }
            try {
                officeService.allocateAsset(
                    agentId = agent.id,
                    name = "코드 안정성 검증용 자율 샌드박스 (${agent.name} 보안)",
                    type = "CODE_STABILITY_SANDBOX",
                    x = Random.nextInt(10, 90),
                    y = Random.nextInt(10, 90),
                    cost = cost
                )
                activityLogService.logActivity(
                    agentId = agent.id,
                    roomId = "default",
                    activityType = "PIPELINE_OPTIMIZATION",
                    details = "코드 안정성 최적화 적용: '${agent.name}' 에이전트에 코드 안정성 검증용 자율 샌드박스 자동 배치 완료 (성공 기여도 120 pts 차감)"
                )
                val message = ChatMessage(
                    roomId = "default",
                    senderId = "system",
                    senderName = "System",
                    content = "⚙️ **[워크플로우 최적화]** '${agent.name}' 에이전트의 코드 구문 및 빌드 에러 차단을 위한 **코드 안정성 검증용 자율 샌드박스** 조치 완료! 격리 실행 환경이 실시간 자동 연동되었습니다. (성공 기여도 120 pts 차감)",
                    type = MessageType.SYSTEM,
                    timestamp = LocalDateTime.now()
                )
                chatMessageRepository.save(message)
                messagingTemplate.convertAndSend("/topic/public", message)
                return ApplyOptimizationResult(
                    success = true,
                    message = "'${agent.name}' 에이전트에 대한 코드 안정성 검증용 자율 샌드박스 자동 할당이 완료되었습니다."
                )
            } catch (e: Exception) {
                return ApplyOptimizationResult(
                    success = false,
                    message = "자산 자동 할당 중 오류 발생: ${e.message}"
                )
            }
        } else if (title.contains("비용 최적화")) {
            val cost = 90
            if (agent.contributionPoints < cost) {
                return ApplyOptimizationResult(
                    success = false,
                    message = "'${agent.name}' 에이전트의 성공 기여도(현재: ${agent.contributionPoints} pts)가 부족합니다. API 비용 및 토큰 최적화 엔진 배치를 위해서는 최소 90 pts가 필요합니다."
                )
            }
            try {
                officeService.allocateAsset(
                    agentId = agent.id,
                    name = "실시간 API 비용 및 토큰 최적화 엔진 (${agent.name} 최적화)",
                    type = "COST_OPTIMIZER",
                    x = Random.nextInt(10, 90),
                    y = Random.nextInt(10, 90),
                    cost = cost
                )
                activityLogService.logActivity(
                    agentId = agent.id,
                    roomId = "default",
                    activityType = "PIPELINE_OPTIMIZATION",
                    details = "API 비용 최적화 적용: '${agent.name}' 에이전트에 실시간 API 비용 및 토큰 최적화 엔진 자동 배치 완료 (성공 기여도 90 pts 차감)"
                )
                val message = ChatMessage(
                    roomId = "default",
                    senderId = "system",
                    senderName = "System",
                    content = "⚙️ **[워크플로우 최적화]** '${agent.name}' 에이전트의 API 비용 절감을 위한 **실시간 API 비용 및 토큰 최적화 엔진** 조치 완료! 추론 시 토큰 소모량 20% 절감 보정이 실시간 자동 적용되었습니다. (성공 기여도 90 pts 차감)",
                    type = MessageType.SYSTEM,
                    timestamp = LocalDateTime.now()
                )
                chatMessageRepository.save(message)
                messagingTemplate.convertAndSend("/topic/public", message)
                return ApplyOptimizationResult(
                    success = true,
                    message = "'${agent.name}' 에이전트에 대한 실시간 API 비용 및 토큰 최적화 엔진 자동 할당이 완료되었습니다."
                )
            } catch (e: Exception) {
                return ApplyOptimizationResult(
                    success = false,
                    message = "자산 자동 할당 중 오류 발생: ${e.message}"
                )
            }
        } else if (title.contains("시너지 공명") || title.contains("협업 시너지")) {
            val cost = 130
            if (agent.contributionPoints < cost) {
                return ApplyOptimizationResult(
                    success = false,
                    message = "'${agent.name}' 에이전트의 성공 기여도(현재: ${agent.contributionPoints} pts)가 부족합니다. 협업 시너지 공명 브릿지 배치를 위해서는 최소 130 pts가 필요합니다."
                )
            }
            try {
                officeService.allocateAsset(
                    agentId = agent.id,
                    name = "협업 시너지 공명 브릿지 (${agent.name} 연결)",
                    type = "SYNERGY_BRIDGE",
                    x = Random.nextInt(10, 90),
                    y = Random.nextInt(10, 90),
                    cost = cost
                )
                activityLogService.logActivity(
                    agentId = agent.id,
                    roomId = "default",
                    activityType = "PIPELINE_OPTIMIZATION",
                    details = "시너지 공명 최적화 적용: '${agent.name}' 에이전트에 협업 시너지 공명 브릿지 자동 배치 완료 (성공 기여도 130 pts 차감)"
                )
                val message = ChatMessage(
                    roomId = "default",
                    senderId = "system",
                    senderName = "System",
                    content = "⚙️ **[워크플로우 최적화]** '${agent.name}' 에이전트의 협업 시너지 개선을 위한 **협업 시너지 공명 브릿지** 조치 완료! 시너지 가속화 및 리스크 방어가 실시간 자동 적용되었습니다. (성공 기여도 130 pts 차감)",
                    type = MessageType.SYSTEM,
                    timestamp = LocalDateTime.now()
                )
                chatMessageRepository.save(message)
                messagingTemplate.convertAndSend("/topic/public", message)
                return ApplyOptimizationResult(
                    success = true,
                    message = "'${agent.name}' 에이전트에 대한 협업 시너지 공명 브릿지 자동 할당이 완료되었습니다."
                )
            } catch (e: Exception) {
                return ApplyOptimizationResult(
                    success = false,
                    message = "자산 자동 할당 중 오류 발생: ${e.message}"
                )
            }
        } else if (title.contains("지식 검색") || title.contains("벡터 지식")) {
            val cost = 80
            if (agent.contributionPoints < cost) {
                return ApplyOptimizationResult(
                    success = false,
                    message = "'${agent.name}' 에이전트의 성공 기여도(현재: ${agent.contributionPoints} pts)가 부족합니다. 실시간 벡터 지식 검색 세션 배치를 위해서는 최소 80 pts가 필요합니다."
                )
            }
            try {
                officeService.allocateAsset(
                    agentId = agent.id,
                    name = "실시간 벡터 지식 검색 세션 (${agent.name} 지식)",
                    type = "VECTOR_SEARCH",
                    x = Random.nextInt(10, 90),
                    y = Random.nextInt(10, 90),
                    cost = cost
                )
                activityLogService.logActivity(
                    agentId = agent.id,
                    roomId = "default",
                    activityType = "PIPELINE_OPTIMIZATION",
                    details = "벡터 검색 최적화 적용: '${agent.name}' 에이전트에 실시간 벡터 지식 검색 세션 자동 배치 완료 (성공 기여도 80 pts 차감)"
                )
                val message = ChatMessage(
                    roomId = "default",
                    senderId = "system",
                    senderName = "System",
                    content = "⚙️ **[워크플로우 최적화]** '${agent.name}' 에이전트의 인지 정밀 탐색을 위한 **실시간 벡터 지식 검색 세션** 조치 완료! RAG 스캔 깊이 확대 및 시맨틱 벡터 가속이 자동 적용되었습니다. (성공 기여도 80 pts 차감)",
                    type = MessageType.SYSTEM,
                    timestamp = LocalDateTime.now()
                )
                chatMessageRepository.save(message)
                messagingTemplate.convertAndSend("/topic/public", message)
                return ApplyOptimizationResult(
                    success = true,
                    message = "'${agent.name}' 에이전트에 대한 실시간 벡터 지식 검색 세션 자동 할당이 완료되었습니다."
                )
            } catch (e: Exception) {
                return ApplyOptimizationResult(
                    success = false,
                    message = "자산 자동 할당 중 오류 발생: ${e.message}"
                )
            }
        } else if (title.contains("보안 쉴드") || title.contains("취약점 검증") || title.contains("보안 및 취약점")) {
            val cost = 110
            if (agent.contributionPoints < cost) {
                return ApplyOptimizationResult(
                    success = false,
                    message = "'${agent.name}' 에이전트의 성공 기여도(현재: ${agent.contributionPoints} pts)가 부족합니다. 실시간 보안 및 취약점 검증 쉴드 배치를 위해서는 최소 110 pts가 필요합니다."
                )
            }
            try {
                officeService.allocateAsset(
                    agentId = agent.id,
                    name = "실시간 보안 및 취약점 검증 쉴드 (${agent.name} 보안)",
                    type = "VULNERABILITY_SHIELD",
                    x = Random.nextInt(10, 90),
                    y = Random.nextInt(10, 90),
                    cost = cost
                )
                activityLogService.logActivity(
                    agentId = agent.id,
                    roomId = "default",
                    activityType = "PIPELINE_OPTIMIZATION",
                    details = "보안 최적화 적용: '${agent.name}' 에이전트에 실시간 보안 및 취약점 검증 쉴드 자동 배치 완료 (성공 기여도 110 pts 차감)"
                )
                val message = ChatMessage(
                    roomId = "default",
                    senderId = "system",
                    senderName = "System",
                    content = "⚙️ **[워크플로우 최적화]** '${agent.name}' 에이전트의 코드 보안성 강화를 위한 **실시간 보안 및 취약점 검증 쉴드** 조치 완료! 보안 결함 사전 스캔 및 OWASP 차단 필터가 실시간 자동 가동되었습니다. (성공 기여도 110 pts 차감)",
                    type = MessageType.SYSTEM,
                    timestamp = LocalDateTime.now()
                )
                chatMessageRepository.save(message)
                messagingTemplate.convertAndSend("/topic/public", message)
                return ApplyOptimizationResult(
                    success = true,
                    message = "'${agent.name}' 에이전트에 대한 실시간 보안 및 취약점 검증 쉴드 자동 할당이 완료되었습니다."
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
        
        stages.forEach { stage ->
            val stageAgent = when (stage.id) {
                "STAGE_PLAN" -> planner
                "STAGE_DEV" -> coder
                "STAGE_REVIEW" -> reviewer
                else -> qaAgent
            }
            if (stageAgent != null) {
                val agentItems = officeItemRepository.findByAgentId(stageAgent.id)
                val hasAux = agentItems.any { it.type == "AUXILIARY_INSTANCE" }
                val hasCore = agentItems.any { it.type == "REASONING_CORE" }
                val hasSandbox = agentItems.any { it.type == "CODE_STABILITY_SANDBOX" }
                val hasCost = agentItems.any { it.type == "COST_OPTIMIZER" }
                val hasBridge = agentItems.any { it.type == "SYNERGY_BRIDGE" }
                val hasVector = agentItems.any { it.type == "VECTOR_SEARCH" }
                val hasShield = agentItems.any { it.type == "VULNERABILITY_SHIELD" }

                // 1. Scale-out (Auxiliary Instance): if bottleneck score is high & not yet allocated
                if (stage.bottleneckScore > 65 && !hasAux) {
                    recommendations.add(
                        OptimizationRecommendation(
                            title = "스케일 아웃 제안: ${stage.name}",
                            description = "[병목 감지] '${stage.agentName}' 에이전트의 대기열이 집중되어 지연이 발생하고 있습니다. 병렬 보조 추론 모델 인스턴스(Auxiliary Instance, 200 pts) 자원을 즉시 배치하여 태스크 처리를 가속하세요.",
                            targetStageId = stage.id,
                            impact = "HIGH"
                        )
                    )
                }

                // 2. Reasoning Core: if processing time is long (> 100s) & not yet allocated
                if (stage.avgTimeSec > 100 && !hasCore) {
                    recommendations.add(
                        OptimizationRecommendation(
                            title = "추론 속도 가속 제안: ${stage.name}",
                            description = "[연산 속도 개선] '${stage.agentName}' 에이전트의 평균 처리 레이턴시가 100초를 초과했습니다. 고성능 추론 가속 코어(REASONING_CORE, 150 pts)를 할당하여 추론 속도 및 엄밀함을 향상시키세요.",
                            targetStageId = stage.id,
                            impact = "HIGH"
                        )
                    )
                }

                // 3. Code Stability Sandbox: if success rate is low (< 90%) & not yet allocated
                if (stage.successRate < 90.0 && !hasSandbox) {
                    recommendations.add(
                        OptimizationRecommendation(
                            title = "코드 안정성 샌드박스 제안: ${stage.name}",
                            description = "[완수율 개선] '${stage.agentName}' 에이전트의 구문 및 빌드 성공률이 낮습니다. 코드 안정성 검증용 자율 샌드박스(CODE_STABILITY_SANDBOX, 120 pts)를 연동하여 구문 검증을 자동화하고 실패를 예방하세요.",
                            targetStageId = stage.id,
                            impact = "MEDIUM"
                        )
                    )
                }

                // 4. API Cost Optimizer: if it is development/review and not allocated
                if ((stage.id == "STAGE_DEV" || stage.id == "STAGE_REVIEW") && !hasCost) {
                    recommendations.add(
                        OptimizationRecommendation(
                            title = "API 비용 최적화 제안: ${stage.name}",
                            description = "[비용 절감] '${stage.agentName}' 에이전트의 추론 토큰 소모량이 누적되고 있습니다. 실시간 API 비용 및 토큰 최적화 엔진(COST_OPTIMIZER, 90 pts)을 배치하여 비용을 20% 절감하세요.",
                            targetStageId = stage.id,
                            impact = "LOW"
                        )
                    )
                }

                // 5. Synergy Bridge: if review or QA and not allocated
                if ((stage.id == "STAGE_REVIEW" || stage.id == "STAGE_QA") && !hasBridge) {
                    recommendations.add(
                        OptimizationRecommendation(
                            title = "협업 시너지 공명 브릿지 제안: ${stage.name}",
                            description = "[협업 조율] 타 에이전트와의 의존성 공유가 빈번하게 이루어지는 단계입니다. 협업 시너지 공명 브릿지(SYNERGY_BRIDGE, 130 pts)를 배치하여 시너지 효율을 가속하고 실패 패널티를 방어하세요.",
                            targetStageId = stage.id,
                            impact = "MEDIUM"
                        )
                    )
                }

                // 6. Vector Search: if plan or review where semantic lookup is critical, and not allocated
                if ((stage.id == "STAGE_PLAN" || stage.id == "STAGE_REVIEW") && !hasVector) {
                    recommendations.add(
                        OptimizationRecommendation(
                            title = "실시간 벡터 지식 검색 제안: ${stage.name}",
                            description = "[지능 검색 강화] 풍부한 코드베이스 및 기억 정보 탐색이 중요합니다. 실시간 벡터 지식 검색 세션(VECTOR_SEARCH, 80 pts)을 연동하여 RAG 검색 속도와 정확도를 향상시키세요.",
                            targetStageId = stage.id,
                            impact = "MEDIUM"
                        )
                    )
                }

                // 8. Vulnerability Shield: if review or QA and no shield allocated
                if ((stage.id == "STAGE_REVIEW" || stage.id == "STAGE_QA") && !hasShield) {
                    recommendations.add(
                        OptimizationRecommendation(
                            title = "실시간 보안 및 취약점 검증 쉴드 제안: ${stage.name}",
                            description = "[보안성 강화] '${stage.agentName}' 에이전트가 배포 전 보안 결함을 검출하기 위해 실시간 보안 및 취약점 검증 쉴드(VULNERABILITY_SHIELD, 110 pts)를 할당하여 안전한 코드 생성을 확보하세요.",
                            targetStageId = stage.id,
                            impact = "MEDIUM"
                        )
                    )
                }
            }
        }

        // 7. Fallback Context Boost if no recommendations or fallback trigger (just like the original successRate check)
        if (recommendations.isEmpty() && stages.any { it.successRate < 90.0 }) {
            val weakStage = stages.first { it.successRate < 90.0 }
            recommendations.add(
                OptimizationRecommendation(
                    title = "컨텍스트 보강 제안: ${weakStage.name}",
                    description = "[완수율 저하] '${weakStage.agentName}' 에이전트의 정합성 향상을 위해 실시간 프롬프트 튜닝과 논리적 컨텍스트 강화를 즉시 적용해 주십시오.",
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
