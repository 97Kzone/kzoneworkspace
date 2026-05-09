package com.kzoneworkspace.backend.agent.service

import com.kzoneworkspace.backend.agent.entity.Conflict
import com.kzoneworkspace.backend.agent.repository.ConflictRepository
import jakarta.annotation.PostConstruct
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDateTime

@Service
class ConflictService(private val conflictRepository: ConflictRepository) {

    fun getAllConflicts(): List<Conflict> {
        return conflictRepository.findAll()
    }

    fun getConflictsByStatus(status: String): List<Conflict> {
        return conflictRepository.findByStatus(status)
    }

    @Transactional
    fun createConflict(title: String, description: String, agent1Name: String, agent2Name: String): Conflict {
        val conflict = Conflict(
            title = title,
            description = description,
            agent1Name = agent1Name,
            agent2Name = agent2Name
        )
        return conflictRepository.save(conflict)
    }

    @Transactional
    fun resolveConflict(id: Long, resolution: String, mediatorName: String): Conflict {
        val conflict = conflictRepository.findById(id).orElseThrow { IllegalArgumentException("Conflict not found") }
        conflict.status = "RESOLVED"
        conflict.resolution = resolution
        conflict.mediatorName = mediatorName
        conflict.resolvedAt = LocalDateTime.now()
        return conflictRepository.save(conflict)
    }

    @PostConstruct
    fun initData() {
        if (conflictRepository.count() == 0L) {
            conflictRepository.save(Conflict(
                title = "코드 스타일 논쟁",
                description = "에이전트 A는 함수형 프로그래밍 스타일을 선호하는 반면, 에이전트 B는 객체지향 스타일을 고집하여 코드 리뷰에서 충돌이 발생했습니다.",
                agent1Name = "AgentA",
                agent2Name = "AgentB",
                status = "RESOLVED",
                mediatorName = "MediatorAgent",
                resolution = "두 스타일의 장점을 결합하여, 상태 관리는 객체지향으로 하되 비즈니스 로직은 순수 함수로 작성하기로 합의했습니다.",
                createdAt = LocalDateTime.now().minusDays(2),
                resolvedAt = LocalDateTime.now().minusDays(1)
            ))

            conflictRepository.save(Conflict(
                title = "API 엔드포인트 네이밍 충돌",
                description = "새로운 기능의 API 엔드포인트 이름을 두고 에이전트 C와 에이전트 D의 의견이 일치하지 않습니다.",
                agent1Name = "AgentC",
                agent2Name = "AgentD",
                status = "PENDING",
                createdAt = LocalDateTime.now().minusHours(5)
            ))

            conflictRepository.save(Conflict(
                title = "리소스 할당 경쟁",
                description = "두 에이전트가 동시에 대용량 데이터 처리를 위해 동일한 컴퓨팅 리소스를 요청하여 병목 현상이 예상됩니다.",
                agent1Name = "AgentE",
                agent2Name = "AgentF",
                status = "RESOLVING",
                mediatorName = "ResourceManager",
                createdAt = LocalDateTime.now().minusHours(2)
            ))
        }
    }
}
