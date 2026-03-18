package com.kzoneworkspace.backend.task.controller

import com.kzoneworkspace.backend.task.entity.ScheduledTask
import com.kzoneworkspace.backend.task.service.SchedulingService
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/scheduled-tasks")
@CrossOrigin(origins = ["*"])
class ScheduledTaskController(
    private val schedulingService: SchedulingService
) {
    @GetMapping
    fun getAllTasks(): List<ScheduledTask> = schedulingService.getAllScheduledTasks()

    @PostMapping
    fun create_task(@RequestBody request: CreateScheduledTaskRequest): ScheduledTask {
        return schedulingService.createScheduledTask(
            description = request.description,
            agentId = request.agentId,
            roomId = request.roomId,
            command = request.command,
            cronExpression = request.cronExpression
        )
    }

    @PostMapping("/{id}/toggle")
    fun toggleTask(@PathVariable id: Long): ScheduledTask = schedulingService.toggleTaskStatus(id)

    @DeleteMapping("/{id}")
    fun deleteTask(@PathVariable id: Long) = schedulingService.deleteTask(id)

    data class CreateScheduledTaskRequest(
        val description: String,
        val agentId: Long,
        val roomId: String,
        val command: String,
        val cronExpression: String
    )
}
