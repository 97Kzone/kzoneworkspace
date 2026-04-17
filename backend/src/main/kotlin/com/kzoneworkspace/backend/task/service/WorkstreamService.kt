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
import com.kzoneworkspace.backend.agent.service.MissionIntelligenceService
import kotlinx.coroutines.*
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import com.kzoneworkspace.backend.task.entity.MissionSession
import com.kzoneworkspace.backend.task.entity.MissionStatus
import com.kzoneworkspace.backend.task.repository.MissionSessionRepository

@Service
class WorkstreamService(
    private val taskService: TaskService,
    private val agentService: AgentService,
    private val agentExecutor: AgentExecutor,
    private val claudeClient: ClaudeClient,
    private val selfHealingService: SelfHealingService,
    private val missionIntelligenceService: MissionIntelligenceService,
    private val missionSessionRepository: MissionSessionRepository,
    private val missionPostMortemService: MissionPostMortemService,
    private val missionEvolutionService: MissionEvolutionService
) {
    private val objectMapper = jacksonObjectMapper()
    private val serviceScope = CoroutineScope(Dispatchers.IO + SupervisorJob())

    fun startWorkstream(request: WorkstreamRequest) {
        val parentTask = taskService.createTask(request.roomId, request.goal, null)
        
        // Create Persistent Mission Session
        val missionSession = missionSessionRepository.save(
            MissionSession(
                roomId = request.roomId,
                goal = request.goal,
                status = MissionStatus.ACTIVE
            )
        )
        parentTask.missionId = missionSession.id
        
        serviceScope.launch {
            try {
                // 0. Clear previous session context
                missionIntelligenceService.clearRoomContext(request.roomId)
                
                // 1. Goal Decomposition (using AI)
                val decomposition = decomposeGoal(request.goal)
                taskService.setDecomposed(parentTask.id, true)
                
                // Save decomposition structure to mission session
                missionSession.decompositionStructure = objectMapper.writeValueAsString(decomposition)
                missionSession.totalTasks = decomposition.subTasks.size
                missionSessionRepository.save(missionSession)
                
                // 2. Task Graph Execution
                val agents = agentService.getAllAgents()
                val taskIdMap = mutableMapOf<String, Long>() // AI_ID -> DB_ID
                
                // Create all tasks first in PENDING state
                decomposition.subTasks.forEach { subTaskDef ->
                    val agent = agents.find { it.name.equals(subTaskDef.agentName, ignoreCase = true) } 
                                ?: agents.find { it.role.contains("개발") } 
                                ?: agents[0]
                    
                    val subTask = taskService.createSubTask(parentTask.id, request.roomId, subTaskDef.command, agent, missionId = missionSession.id)
                    taskIdMap[subTaskDef.id] = subTask.id
                }

                // Update dependsOnIds with Database IDs
                decomposition.subTasks.forEach { subTaskDef ->
                    val dbId = taskIdMap[subTaskDef.id]!!
                    val depDbIds = subTaskDef.dependsOn.mapNotNull { taskIdMap[it]?.toString() }.joinToString(",")
                    if (depDbIds.isNotEmpty()) {
                        val task = taskService.getTaskById(dbId)
                        task.dependsOnIds = depDbIds
                        taskService.updateStatus(dbId, task.status, task.result) // Trick to save
                    }
                }
                
                // 3. Dispatch with Dependency Awareness
                val jobs = decomposition.subTasks.map { subTaskDef ->
                    launch {
                        val dbId = taskIdMap[subTaskDef.id]!!
                        
                        // Wait for dependencies
                        for (depId in subTaskDef.dependsOn) {
                            val depDbId = taskIdMap[depId]
                            if (depDbId == null) continue
                            
                            while (true) {
                                val depTask = taskService.getTaskById(depDbId)
                                if (depTask.status == TaskStatus.COMPLETED) break
                                if (depTask.status == TaskStatus.FAILED) {
                                    taskService.updateStatus(dbId, TaskStatus.FAILED, "선행 작업(${depId}) 실패로 인해 중단됨")
                                    return@launch
                                }
                                delay(2000) // Poll every 2 seconds
                            }
                        }
                        
                        // Execute current task with Self-Healing
                        val latestMission = missionSessionRepository.findById(missionSession.id).get()
                        val latestDecomposition = objectMapper.readValue<DecompositionResponse>(latestMission.decompositionStructure!!)
                        var currentCommand = latestDecomposition.subTasks.find { it.id == subTaskDef.id }?.command ?: subTaskDef.command
                        
                        var retryCount = 0
                        val maxRetries = 2

                        while (retryCount <= maxRetries) {
                            try {
                                val statusMsg = if (retryCount == 0) "의존성 충족됨: 실행 시작" else "자가 치유 재시도 ($retryCount/$maxRetries)"
                                taskService.updateStatus(dbId, if (retryCount > 0) TaskStatus.HEALING else TaskStatus.RUNNING, statusMsg)
                                
                                val agent = taskService.getTaskById(dbId).agent!!
                                // AgentExecutor.execute가 내부에서 FAILED로직을 타지 않도록 예외를 던지게 설계 변경 필요
                                agentExecutor.executeWithException(agent, request.roomId, currentCommand, dbId)
                                
                                taskService.updateStatus(dbId, TaskStatus.COMPLETED, if (retryCount > 0) "자가 치유 성공: 작업 완료" else "지능형 병렬 작업 완료")
                                
                                // Update Mission Progress
                                synchronized(missionSession) {
                                    missionSession.completedTasks += 1
                                    if (missionSession.completedTasks >= missionSession.totalTasks) {
                                        missionSession.status = MissionStatus.COMPLETED
                                    }
                                    missionSessionRepository.save(missionSession)
                                }

                                // 4. Check for Reflection/Recalibration (Trigger every 2 completed tasks)
                                if (missionSession.completedTasks > 0 && missionSession.completedTasks % 2 == 0 && missionSession.status == MissionStatus.ACTIVE) {
                                    missionEvolutionService.recalibrate(missionSession.id)
                                }
                                
                                break //성공 시 루프 탈출
                            } catch (e: Exception) {
                                retryCount++
                                if (retryCount > maxRetries) {
                                    taskService.updateStatus(dbId, TaskStatus.FAILED, "최대 재시도 횟수 초과: ${e.message}")
                                    break
                                }
                                
                                // 자가 치유 분석 수행
                                taskService.updateStatus(dbId, TaskStatus.HEALING, "오류 감지: AI 분석 및 복구 중... (${e.message})")
                                val strategy = selfHealingService.analyzeAndProposeFix(taskService.getTaskById(dbId), e.message ?: "알 수 없는 오류")
                                
                                if (strategy.type == StrategyType.RETRY_WITH_FIX) {
                                    currentCommand = strategy.suggestedCommand
                                    // 루프를 계속 돌아 재시도 수행
                                } else {
                                    taskService.updateStatus(dbId, TaskStatus.FAILED, "자가 치유 불가: ${strategy.reasoning}")
                                    break
                                }
                            }
                        }
                    }
                }
                
                jobs.joinAll()
                
                // 4. Mission Analysis Synthesis (Post-Mortem)
                if (missionSession.status == MissionStatus.COMPLETED) {
                    missionPostMortemService.generateReport(missionSession.id)
                }
                
            } catch (e: Exception) {
                taskService.updateStatus(parentTask.id, TaskStatus.FAILED, "스케줄링 중 치명적 오류: ${e.message}")
            }
        }
    }

    fun getMissionsByRoom(roomId: String): List<MissionSession> =
        missionSessionRepository.findByRoomIdOrderByCreatedAtDesc(roomId)

    fun getMissionById(id: Long): MissionSession =
        missionSessionRepository.findById(id).orElseThrow { RuntimeException("Mission not found: $id") }

    private fun decomposeGoal(goal: String): DecompositionResponse {
        val systemPrompt = """
            당신은 숙련된 프로젝트 관리 및 워크플로우 아키텍트입니다. 
            사용자의 전체 목표를 분석하여 '지능적으로 병렬화 가능한' 하위 태스크들로 분해하세요.
            
            [분해 가이드라인]
            1. 각 태스크는 고유한 ID(예: T1, T2...)를 가져야 합니다.
            2. 태스크 간의 선행 관계(dependsOn)를 명확히 정의하세요. 
               - 예: '코드 작성'은 '요구사항 분석' 이후에 실행되어야 하며, '코드 리뷰'는 '코드 작성' 이후여야 합니다.
            3. 서로 독립적인 태스크들은 병렬 실행될 수 있도록 의존성을 설정하지 마세요.
            4. 에이전트는 Planner(전략), Coder(코딩), Reviewer(검토) 중 적절한 에이전트를 지정하세요.
            
            응답은 반드시 아래 JSON 형식으로만 작성하세요:
            {
              "subTasks": [
                {
                  "id": "T1",
                  "agentName": "Planner",
                  "command": "구체적인 명령",
                  "description": "설명",
                  "dependsOn": []
                },
                {
                  "id": "T2",
                  "agentName": "Coder",
                  "command": "T1의 결과를 바탕으로 X 구현",
                  "description": "X 구현",
                  "dependsOn": ["T1"]
                }
              ]
            }
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
