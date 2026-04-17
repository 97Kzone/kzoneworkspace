package com.kzoneworkspace.backend.task.service

import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import com.fasterxml.jackson.module.kotlin.readValue
import com.kzoneworkspace.backend.agent.service.MissionIntelligenceService
import com.kzoneworkspace.backend.claude.ClaudeClient
import com.kzoneworkspace.backend.task.dto.DecompositionResponse
import com.kzoneworkspace.backend.task.dto.SubTaskDefinition
import com.kzoneworkspace.backend.task.entity.TaskStatus
import com.kzoneworkspace.backend.task.repository.MissionSessionRepository
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDateTime

@Service
class MissionEvolutionService(
    private val claudeClient: ClaudeClient,
    private val missionSessionRepository: MissionSessionRepository,
    private val taskService: TaskService,
    private val missionIntelligenceService: MissionIntelligenceService
) {
    private val logger = LoggerFactory.getLogger(MissionEvolutionService::class.java)
    private val objectMapper = jacksonObjectMapper()

    @Transactional
    fun recalibrate(missionId: Long) {
        val mission = missionSessionRepository.findById(missionId).orElse(null) ?: return
        val currentTasks = taskService.getTasksByMission(missionId)
        val intelligence = missionIntelligenceService.getContextPrompt(mission.roomId)
        
        val completedTasksSummary = currentTasks.filter { it.status == TaskStatus.COMPLETED }
            .joinToString("\n") { "- ${it.command}: ${it.result?.take(200)}" }

        val systemPrompt = """
            당신은 '스웜 지능 오케스트레이터'입니다. 
            현재 진행 중인 미션의 경과와 새롭게 발견된 지능(Intelligence)을 분석하여, 
            남은 계획(Pending Tasks)을 수정하거나 최적화해야 합니다.
            
            [분석 데이터]
            1. 미션 최종 목표: ${mission.goal}
            2. 현재까지 완료된 작업 결과 요약:
            $completedTasksSummary
            3. 발견된 핵심 지능:
            $intelligence
            
            [지시 사항]
            - 현재의 남은 계획이 여전히 최선인지 판단하세요.
            - 만약 새로운 제약 사항이나 더 나은 기술적 경로가 발견되었다면 계획을 수정하십시오.
            - 수정된 모든 태스크 구조를 포함한 전체 'subTasks' 목록을 반환하세요.
            - 이미 완료된 작업은 변경하지 말고, 'id'를 동일하게 유지하여 완료 상태를 보존하십시오.
            - 'PENDING' 상태인 작업의 내용을 수정하거나, 새로운 작업을 추가/삭제할 수 있습니다.
            
            [응답 형식]
            반드시 아래 JSON 형식으로만 응답하세요:
            {
              "recalibrationReason": "왜 계획을 수정했는지 혹은 유지했는지에 대한 짧은 한글 요약",
              "subTasks": [ 
                {
                  "id": "T1",
                  "agentName": "Planner",
                  "command": "내용",
                  "description": "설명",
                  "dependsOn": []
                }, ...
              ] 
            }
        """.trimIndent()

        try {
            val response = claudeClient.sendMessage(systemPrompt, "현재 계획을 성찰하고 최적화해줘.")
            val jsonStart = response.indexOf("{")
            val jsonEnd = response.lastIndexOf("}") + 1
            if (jsonStart == -1 || jsonEnd == -1) return

            val jsonString = response.substring(jsonStart, jsonEnd)
            val resultNode = objectMapper.readTree(jsonString)
            
            val reason = resultNode.get("recalibrationReason")?.asText() ?: "계획 자동 최적화 수행"
            val subTasksNode = resultNode.get("subTasks")
            
            val subTasks: List<SubTaskDefinition> = objectMapper.readValue(subTasksNode.toString())

            // Update Mission Session
            mission.decompositionStructure = objectMapper.writeValueAsString(DecompositionResponse(subTasks))
            mission.recalibrationLog = (mission.recalibrationLog ?: "") + "\n[${LocalDateTime.now()}] $reason"
            mission.updatedAt = LocalDateTime.now()
            
            missionSessionRepository.save(mission)
            logger.info("Mission [$missionId] Evolution Successful: $reason")
            
        } catch (e: Exception) {
            logger.error("Mission [$missionId] recalibration failed: ${e.message}")
        }
    }
}
