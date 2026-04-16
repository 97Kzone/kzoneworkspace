package com.kzoneworkspace.backend.task.service

import com.kzoneworkspace.backend.claude.ClaudeClient
import com.kzoneworkspace.backend.task.entity.MissionSession
import com.kzoneworkspace.backend.task.repository.MissionSessionRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDateTime

@Service
class MissionPostMortemService(
    private val taskService: TaskService,
    private val missionSessionRepository: MissionSessionRepository,
    private val claudeClient: ClaudeClient
) {
    @Transactional
    fun generateReport(missionId: Long) {
        val mission = missionSessionRepository.findById(missionId).orElse(null) ?: return
        if (mission.isSynthesized) return

        val tasks = taskService.getTasksByMission(missionId)
        
        val taskLogs = tasks.joinToString("\n") { task ->
            "- [${task.id}] 에이전트: ${task.agent?.name ?: "N/A"}, 명령: ${task.command}, 결과: ${task.result ?: "결과 없음"}, 상태: ${task.status}"
        }

        val systemPrompt = """
            당신은 'Mission Hive Synthesis Architect'입니다. 
            완료된 복합 미션의 데이터를 분석하여 전문가 수준의 '사후 분석(Post-Mortem) 보고서'를 작성하세요.
            이 보고서는 사용자가 프로젝트의 성과를 이해하고, 시스템의 지능적 협업 과정을 신뢰하게 만드는 역할을 합니다.

            [보고서 구성 가이드라인]
            1. 미션 개요: 원래 목표와 최종 성과 요약.
            2. 지능형 협업 분석: 어떤 에이전트들이 어떤 역할을 수행했는지, 어떻게 서로 협력했는지 분석.
            3. 기술적 해결 및 성과: 해결된 핵심 과제와 구현된 주요 기능 설명.
            4. 자가 치유 및 회복력(필요시): 오류나 문제 발생 시 시스템이 어떻게 스스로 복구했는지 강조.
            5. 향후 개선 방향: 이 미션에서 얻은 교훈을 바탕으로 한 추천 사항.

            마크다운 형식을 사용하여 세련되고 가독성 있게 작성하세요. 
            한국어로 작성하세요.
        """.trimIndent()

        val userPrompt = """
            다음 미션 데이터를 바탕으로 사후 분석 보고서를 작성해줘.
            
            [미션 목표]: ${mission.goal}
            [미션 시작일]: ${mission.createdAt}
            
            [태스크 실행 로그]:
            $taskLogs
        """.trimIndent()

        try {
            val report = claudeClient.sendMessage(systemPrompt, userPrompt)
            mission.postMortemReport = report
            mission.isSynthesized = true
            mission.updatedAt = LocalDateTime.now()
            missionSessionRepository.save(mission)
        } catch (e: Exception) {
            println("사후 분석 생성 중 오류 발생: ${e.message}")
        }
    }
}
