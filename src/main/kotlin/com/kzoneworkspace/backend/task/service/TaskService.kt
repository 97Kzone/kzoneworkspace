package com.kzoneworkspace.backend.task.service

import com.kzoneworkspace.backend.agent.entity.Agent
import com.kzoneworkspace.backend.task.entity.Task
import com.kzoneworkspace.backend.task.entity.TaskStatus
import com.kzoneworkspace.backend.task.repository.TaskRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDateTime

@Service
@Transactional(readOnly = true)
class TaskService (
    private val taskRepository: TaskRepository
) {
    fun getTasksByRoom(roomId: String): List<Task> =
        taskRepository.findByRoomIdOrderByCreatedAtDesc(roomId)

    fun getTaskById(id: Long): Task =
        taskRepository.findById(id).orElseThrow { RuntimeException("Task not found: $id") }

    @Transactional
    fun createTask(roomId: String, command: String, agent: Agent?): Task =
        taskRepository.save(Task(roomId = roomId, command = command, agent = agent))

    @Transactional
    fun updateStatus(id: Long, status: TaskStatus, result: String? = null): Task {
        val task = getTaskById(id)
        task.status = status
        task.result = result ?: task.result
        task.updatedAt = LocalDateTime.now()
        return taskRepository.save(task)
    }
}