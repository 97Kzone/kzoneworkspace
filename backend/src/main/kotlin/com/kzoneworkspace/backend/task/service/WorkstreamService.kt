package com.kzoneworkspace.backend.task.service

import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import com.fasterxml.jackson.module.kotlin.readValue
import com.kzoneworkspace.backend.agent.entity.Agent
import com.kzoneworkspace.backend.agent.service.AgentService
import com.kzoneworkspace.backend.claude.AgentExecutor
import com.kzoneworkspace.backend.claude.ClaudeClient
import com.kzoneworkspace.backend.task.dto.DecompositionResponse
import com.kzoneworkspace.backend.task.dto.WorkstreamRequest
import com.kzoneworkspace.backend.task.entity.TaskStatus
import kotlinx.coroutines.*
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class WorkstreamService(
    private val taskService: TaskService,
    private val agentService: AgentService,
    private val agentExecutor: AgentExecutor,
    private val claudeClient: ClaudeClient
) {
    private val objectMapper = jacksonObjectMapper()
    private val serviceScope = CoroutineScope(Dispatchers.IO + SupervisorJob())

    fun startWorkstream(request: WorkstreamRequest) {
        val parentTask = taskService.createTask(request.roomId, request.goal, null)
        
        serviceScope.launch {
            try {
                // 1. Goal Decomposition (using Planner)
                val decomposition = decomposeGoal(request.goal)
                taskService.setDecomposed(parentTask.id, true)
                
                // 2. Parallel Execution
                val agents = agentService.getAllAgents()
                
                val jobs = decomposition.subTasks.map { subTaskDef ->
                    launch {
                        val agent = agents.find { it.name.equals(subTaskDef.agentName, ignoreCase = true) } 
                                    ?: agents.find { it.role.contains("개발") } 
                                    ?: agents[0]
                        
                        val subTask = taskService.createSubTask(parentTask.id, request.roomId, subTaskDef.command, agent)
                        
                        try {
                            // 각 에이전트 실행 (비동기)
                            agentExecutor.execute(agent, request.roomId, subTaskDef.command)
                            taskService.updateStatus(subTask.id, TaskStatus.COMPLETED, "병렬 작업 완료")
                        } catch (e: Exception) {
                            taskService.updateStatus(subTask.id, TaskStatus.FAILED, "오류: ${e.message}")
                        }
                    }
                }
                
                jobs.joinAll()
                // TaskService.updateStatus에서 자식들이 다 끝나면 부모도 완료 처리하도록 로직이 이미 있음.
                
            } catch (e: Exception) {
                taskService.updateStatus(parentTask.id, TaskStatus.FAILED, "분해 중 오류: ${e.message}")
            }
        }
    }

    private fun decomposeGoal(goal: String): DecompositionResponse {
        val systemPrompt = """
            당신은 프로젝트 관리 전문가입니다. 사용자의 목표를 분석하여 병렬로 실행 가능한 하위 태스크들로 분해하세요.
            응답은 반드시 아래 JSON 형식으로만 작성하세요:
            {
              "subTasks": [
                {
                  "agentName": "에이전트 이름 (Planner, Coder, Reviewer 중 선택)",
                  "command": "에이전트에게 내릴 구체적인 지시",
                  "description": "태스크 설명"
                }
              ]
            }
            최대 5개까지만 분해하세요.
        """.trimIndent()

        val response = claudeClient.sendMessage(systemPrompt, "다음 목표를 분해해줘: $goal")
        
        // JSON 추출 (모델이 텍스트를 섞어 보낼 경우를 대비)
        val jsonStart = response.indexOf("{")
        val jsonEnd = response.lastIndexOf("}") + 1
        if (jsonStart == -1 || jsonEnd == -1) throw RuntimeException("응답이 올바른 JSON 형식이 아닙니다.")
        
        val jsonString = response.substring(jsonStart, jsonEnd)
        return objectMapper.readValue(jsonString)
    }
}
