package com.kzoneworkspace.backend.agent.service

import com.kzoneworkspace.backend.agent.dto.AgentStandup
import com.kzoneworkspace.backend.agent.repository.ActivityLogRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDateTime

@Service
@Transactional(readOnly = true)
class StandupService(
    private val agentService: AgentService,
    private val activityLogRepository: ActivityLogRepository
) {
    fun generateDailyStandup(): List<AgentStandup> {
        val agents = agentService.getAllAgents()
        
        return agents.map { agent ->
            val recentLogs = activityLogRepository.findByAgentIdOrderByTimestampDesc(agent.id)
            
            // "어제 한 일" 추론
            val pastAction = if (recentLogs.isNotEmpty()) {
                val lastTool = recentLogs.firstOrNull { it.activityType == "TOOL_CALL" }
                if (lastTool != null) {
                    "${lastTool.toolName} 도구를 사용하여 태스크를 처리했습니다."
                } else {
                    "주어진 백그라운드 태스크를 분석했습니다."
                }
            } else {
                "시스템 유지보수 및 대기 상태였습니다."
            }
            
            // "오늘 할 일" 추론 (역할 기반)
            val todayFocus = when (agent.role) {
                "마스터 플래너" -> "전체 미션 아키텍처 설계 및 에이전트 리소스 할당 최적화에 집중하겠습니다."
                "개발자", "Coder" -> "백엔드 로직 구현 및 프론트엔드 연동을 우선적으로 처리하겠습니다."
                "코드 리뷰어" -> "PR 리뷰 및 코드 품질 향상, 잠재적 버그 탐지에 주력하겠습니다."
                else -> "주어진 목표에 맞춰 할당된 업무를 신속하게 처리하겠습니다."
            }
            
            // "블로커" 추론 (임의 생성 혹은 로그 기반)
            val hasError = recentLogs.any { it.activityType == "ERROR" }
            val blocker = if (hasError) {
                "일부 모듈에서 예외가 발생하여 분석이 필요합니다."
            } else if (agent.status.name == "OVERLOADED") {
                "현재 할당된 태스크가 너무 많아 병목이 우려됩니다."
            } else if (agent.role == "개발자" && Math.random() > 0.8) {
                "플래너의 세부 요구사항 정의가 조금 더 명확했으면 좋겠습니다."
            } else {
                null
            }

            AgentStandup(
                agentId = agent.id,
                agentName = agent.name,
                agentRole = agent.role,
                pastAction = pastAction,
                todayFocus = todayFocus,
                blocker = blocker,
                timestamp = LocalDateTime.now()
            )
        }
    }
}
