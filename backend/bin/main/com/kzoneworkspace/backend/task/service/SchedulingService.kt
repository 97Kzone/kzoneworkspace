package com.kzoneworkspace.backend.task.service

import com.kzoneworkspace.backend.agent.repository.AgentRepository
import com.kzoneworkspace.backend.agent.service.ActivityLogService
import com.kzoneworkspace.backend.claude.AgentExecutor
import com.kzoneworkspace.backend.task.entity.ScheduledTask
import com.kzoneworkspace.backend.task.repository.ScheduledTaskRepository
import jakarta.annotation.PostConstruct
import org.springframework.context.annotation.Lazy
import org.springframework.scheduling.TaskScheduler
import org.springframework.scheduling.support.CronExpression
import org.springframework.scheduling.support.CronTrigger
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDateTime
import java.time.ZoneId
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.ScheduledFuture


@Service
class SchedulingService(
    private val scheduledTaskRepository: ScheduledTaskRepository,
    private val agentRepository: AgentRepository,
    private val activityLogService: ActivityLogService,
    @Lazy private val agentExecutor: AgentExecutor,
    private val taskScheduler: TaskScheduler
) {
    private val scheduledTasksMap = ConcurrentHashMap<Long, ScheduledFuture<*>>()

    @PostConstruct
    fun init() {
        // 앱 시작 시 활성화된 태스크들을 스케줄링
        val activeTasks = scheduledTaskRepository.findByStatus("ACTIVE")
        activeTasks.forEach { scheduleTask(it) }
    }

    @Transactional
    fun createScheduledTask(
        description: String,
        agentId: Long,
        roomId: String,
        command: String,
        cronExpression: String
    ): ScheduledTask {
        val task = ScheduledTask(
            description = description,
            agentId = agentId,
            roomId = roomId,
            command = command,
            cronExpression = cronExpression
        )
        val savedTask = scheduledTaskRepository.save(task)
        scheduleTask(savedTask)
        return savedTask
    }

    fun getAllScheduledTasks(): List<ScheduledTask> = scheduledTaskRepository.findAll()

    @Transactional
    fun toggleTaskStatus(id: Long): ScheduledTask {
        val task = scheduledTaskRepository.findById(id).orElseThrow { RuntimeException("Task not found") }
        if (task.status == "ACTIVE") {
            task.status = "PAUSED"
            cancelTask(id)
        } else {
            task.status = "ACTIVE"
            scheduleTask(task)
        }
        return scheduledTaskRepository.save(task)
    }

    @Transactional
    fun deleteTask(id: Long) {
        cancelTask(id)
        scheduledTaskRepository.deleteById(id)
    }

    fun runNow(id: Long): ScheduledTask {
        val task = scheduledTaskRepository.findById(id).orElseThrow { RuntimeException("Task not found") }
        executeTask(id, isManual = true)
        return scheduledTaskRepository.findById(id).get()
    }

    private fun scheduleTask(task: ScheduledTask) {
        cancelTask(task.id) // 기존에 돌고 있다면 취소 후 재등록
        
        // 다음 실행 시간 계산 및 저장
        updateNextRun(task)
        
        val future = taskScheduler.schedule({
            executeTask(task.id)
        }, CronTrigger(task.cronExpression))
        
        if (future != null) {
            scheduledTasksMap[task.id] = future
        }
    }

    private fun cancelTask(taskId: Long) {
        scheduledTasksMap[taskId]?.cancel(false)
        scheduledTasksMap.remove(taskId)
    }

    private fun executeTask(taskId: Long, isManual: Boolean = false) {
        val task = scheduledTaskRepository.findById(taskId).orElse(null) ?: return
        if (!isManual && task.status != "ACTIVE") return

        val agent = agentRepository.findById(task.agentId).orElse(null) ?: return
        
        try {
            // 에이전트 실행 (비동기적으로 실행되는 것을 권장하지만 현재 구성을 따름)
            agentExecutor.execute(agent, task.roomId, task.command)
            
            // 활동 로그 기록
            activityLogService.logActivity(
                agentId = task.agentId,
                roomId = task.roomId,
                activityType = if (isManual) "MANUAL_TASK_EXECUTION" else "SCHEDULED_TASK_EXECUTION",
                toolName = "ScheduledTask",
                details = "Executed command: ${task.command} (Task: ${task.description})"
            )

            // 실행 정보 업데이트
            task.lastRun = LocalDateTime.now()
            updateNextRun(task)
            scheduledTaskRepository.save(task)
        } catch (e: Exception) {
            println("스케줄 작업 실행 실패 (ID: ${task.id}): ${e.message}")
        }
    }

    private fun updateNextRun(task: ScheduledTask) {
        try {
            val cron = CronExpression.parse(task.cronExpression)
            val next = cron.next(LocalDateTime.now().atZone(ZoneId.systemDefault()))
            task.nextRun = next?.toLocalDateTime()
        } catch (e: Exception) {
            println("크론 표현식 해석 실패: ${task.cronExpression}")
            task.nextRun = null
        }
    }
}
