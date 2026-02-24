package com.kzoneworkspace.backend.task.entity

import com.kzoneworkspace.backend.agent.entity.Agent
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.FetchType
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.Table
import java.time.LocalDateTime

@Entity
@Table(name = "tasks")
class Task(
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    val id: Long = 0,

    @Column(nullable = false)
    val roomId: String,                    // 어느 채팅방에서 시작된 태스크인지

    @Column(columnDefinition = "TEXT")
    val command: String,                   // 사용자가 내린 원본 명령

    @Column(columnDefinition = "TEXT")
    var result: String? = null,            // 에이전트 수행 결과

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "agent_id")
    var agent: Agent? = null,              // 담당 에이전트

    @Enumerated(EnumType.STRING)
    var status: TaskStatus = TaskStatus.PENDING,

    val createdAt: LocalDateTime = LocalDateTime.now(),
    var updatedAt: LocalDateTime = LocalDateTime.now()
)

enum class TaskStatus {
    PENDING,    // 대기중
    RUNNING,    // 진행중
    COMPLETED,  // 완료
    FAILED      // 실패
}