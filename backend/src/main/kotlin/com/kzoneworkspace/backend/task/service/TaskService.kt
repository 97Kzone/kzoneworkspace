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
    fun createTask(roomId: String, command: String, agent: Agent?, parentId: Long? = null, dependsOnIds: String? = null): Task =
        taskRepository.save(Task(roomId = roomId, command = command, agent = agent, parentId = parentId, dependsOnIds = dependsOnIds))

    @Transactional
    fun createSubTask(parentId: Long, roomId: String, command: String, agent: Agent?, dependsOnIds: String? = null): Task =
        taskRepository.save(Task(roomId = roomId, command = command, agent = agent, parentId = parentId, dependsOnIds = dependsOnIds))

    fun getSubTasks(parentId: Long): List<Task> = taskRepository.findByParentId(parentId)

    @Transactional
    fun setDecomposed(id: Long, decomposed: Boolean) {
        val task = getTaskById(id)
        task.isDecomposed = decomposed
        taskRepository.save(task)
    }

    @Transactional
    fun updateStatus(id: Long, status: TaskStatus, result: String? = null): Task {
        val task = getTaskById(id)
        task.status = status
        task.result = result ?: task.result
        task.updatedAt = LocalDateTime.now()
        
        // 만약 모든 하위 태스크가 완료되었다면 부모 태스크도 완료 처리 (간단한 로직)
        task.parentId?.let { pId ->
            val siblings = getSubTasks(pId)
            if (siblings.all { it.status == TaskStatus.COMPLETED }) {
                updateStatus(pId, TaskStatus.COMPLETED, "모든 하위 태스크가 완료되었습니다.")
            } else if (siblings.any { it.status == TaskStatus.FAILED }) {
                updateStatus(pId, TaskStatus.FAILED, "일부 하위 태스크 수행 중 오류가 발생했습니다.")
            }
        }
        
        return taskRepository.save(task)
    }
}