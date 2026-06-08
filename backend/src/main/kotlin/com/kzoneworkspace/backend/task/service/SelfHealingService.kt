package com.kzoneworkspace.backend.task.service

import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import com.kzoneworkspace.backend.claude.ClaudeClient
import com.kzoneworkspace.backend.task.entity.SelfHealingLog
import com.kzoneworkspace.backend.task.entity.Task
import com.kzoneworkspace.backend.task.repository.SelfHealingRepository
import com.kzoneworkspace.backend.agent.repository.AssetUtilizationLogRepository
import com.kzoneworkspace.backend.agent.entity.AssetUtilizationLog
import org.springframework.stereotype.Service

data class HealingStrategy(
    val type: StrategyType,
    val suggestedCommand: String,
    val reasoning: String
)

enum class StrategyType {
    RETRY_WITH_FIX,
    GIVE_UP
}

@Service
class SelfHealingService(
    private val claudeClient: ClaudeClient,
    private val selfHealingRepository: SelfHealingRepository,
    private val officeItemRepository: com.kzoneworkspace.backend.agent.repository.OfficeItemRepository,
    private val assetUtilizationLogRepository: AssetUtilizationLogRepository
) {
    private val objectMapper = jacksonObjectMapper()

    fun analyzeAndProposeFix(task: Task, error: String): HealingStrategy {
        val hasAuxiliaryInstance = task.agent?.let { agent ->
            officeItemRepository.findByAgentId(agent.id).any { it.type == "AUXILIARY_INSTANCE" }
        } ?: false

        if (hasAuxiliaryInstance && task.agent != null) {
            val agent = task.agent!!
            assetUtilizationLogRepository.save(AssetUtilizationLog(
                agentId = agent.id,
                agentName = agent.name,
                assetType = "AUXILIARY_INSTANCE",
                assetName = "보조 추론 및 자가 치유 인스턴스",
                actionType = "UTILIZATION",
                description = "${agent.name} 에이전트: 자가 치유(Self-Healing) 복구 로직 제안을 설계하는 과정에서 [보조 추론 및 자가 치유 인스턴스]의 병렬 복구 컴퓨팅 자원이 활성화되었습니다."
            ))
        }

        val auxiliaryPrompt = if (hasAuxiliaryInstance) {
            """
            * [고성능 장비 지원]: 현재 대상 에이전트는 '보조 추론 모델 인스턴스(AUXILIARY_INSTANCE)'가 추가 가동되어 다중 스레드로 병렬 연산 및 자가 치유 레이턴시 단축을 지원받고 있습니다. 
            더 엄밀하고 고도로 최적화된, 에러를 완벽하게 회피할 수 있는 정교한 복구 명령(suggestedCommand)을 적극적으로 설계해 제안하십시오.
            """.trimIndent()
        } else ""

        val systemPrompt = """
            당신은 AI 에이전트 워크플로우의 '자가 치유(Self-Healing)' 전문가입니다. 
            에이전트가 수행하려던 명령과 실시간으로 발생한 에러 로그를 분석하여, 문제를 해결하고 다시 성공할 수 있도록 '수정된 새로운 구체적 명령'을 제안하세요.
            
            [분석 및 복구 가이드라인]
            1. 에러의 근본 원인을 파악하세요 (예: 파일 경로 오타, 존재하지 않는 파일 읽기, 잘못된 도구 사용, 문법 오류 등).
            2. 문제를 해결하기 위한 '중간 단계'가 필요하다면 이를 포함한 새로운 지시사항을 만드세요.
               - 예: '파일이 없어서 실패했다'면 '파일을 새로 생성하고 내용을 작성해라'라는 명령으로 대체.
               - 예: '문법 오류가 났다'면 '해당 라인을 수정하여 다시 저장하라'는 명령으로 대체.
            3. 만약 3회 이상 실패했거나 도저히 수동 개입 없이 자동 복구가 불가능한 치명적 하드웨어/네트워크 에러라면 'GIVE_UP'을 선택하세요.
            4. 에이전트는 원본 할당된 에이전트(${task.agent?.name ?: "Unknown"})와 동일한 자격과 도구를 가지고 있다고 가정합니다.
            
            $auxiliaryPrompt
            
            응답은 반드시 아래 JSON 형식으로만 작성하세요. 텍스트 설명은 포함하지 마세요:
            {
              "type": "RETRY_WITH_FIX" 또는 "GIVE_UP",
              "suggestedCommand": "수정된 새로운 구체적 명령 (RETRY_WITH_FIX인 경우 필수)",
              "reasoning": "실패 원인 및 복구 전략에 대한 짧은 설명(한글)"
            }
        """.trimIndent()

        val userMessage = """
            [원본 목표]: ${task.command}
            [발생한 마지막 에러]: $error
            [담당 에이전트]: ${task.agent?.name ?: "Unknown"}
            
            이 상황을 분석하고 복구 전략을 제안해줘.
        """.trimIndent()

        val strategy = try {
            val response = claudeClient.sendMessage(systemPrompt, userMessage)
            parseResponse(response)
        } catch (e: Exception) {
            HealingStrategy(StrategyType.GIVE_UP, "", "복구 분석 중 예상치 못한 오류 발생: ${e.message}")
        }

        try {
            selfHealingRepository.save(
                SelfHealingLog(
                    taskId = task.id,
                    agentName = task.agent?.name,
                    originalCommand = task.command,
                    error = error,
                    strategyType = strategy.type.name,
                    suggestedCommand = strategy.suggestedCommand,
                    reasoning = strategy.reasoning
                )
            )
        } catch (e: Exception) {
            println("Failed to save self healing log: ${e.message}")
        }

        return strategy
    }

    private fun parseResponse(response: String): HealingStrategy {
        return try {
            val jsonStart = response.indexOf("{")
            val jsonEnd = response.lastIndexOf("}") + 1
            if (jsonStart == -1 || jsonEnd == -1) {
                return HealingStrategy(StrategyType.GIVE_UP, "", "분석 응답의 JSON 형식이 올바르지 않습니다.")
            }
            
            val jsonString = response.substring(jsonStart, jsonEnd)
            val node = objectMapper.readTree(jsonString)
            
            val typeStr = node["type"]?.asText() ?: "GIVE_UP"
            val type = if (typeStr == "RETRY_WITH_FIX") StrategyType.RETRY_WITH_FIX else StrategyType.GIVE_UP
            
            HealingStrategy(
                type = type,
                suggestedCommand = node["suggestedCommand"]?.asText() ?: "",
                reasoning = node["reasoning"]?.asText() ?: "원인을 분석할 수 없습니다."
            )
        } catch (e: Exception) {
            HealingStrategy(StrategyType.GIVE_UP, "", "응답 파싱 오류: ${e.message}")
        }
    }
}
