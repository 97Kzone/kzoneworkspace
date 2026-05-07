package com.kzoneworkspace.backend.agent.service

import com.kzoneworkspace.backend.agent.entity.IncidentSeverity
import com.kzoneworkspace.backend.agent.entity.IncidentStatus
import com.kzoneworkspace.backend.agent.entity.WarRoomIncident
import com.kzoneworkspace.backend.agent.repository.WarRoomRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDateTime

@Service
@Transactional
class WarRoomService(
    private val warRoomRepository: WarRoomRepository
) {
    fun escalate(title: String, description: String, severity: IncidentSeverity, involvedAgents: List<String>, relatedTaskId: Long? = null): WarRoomIncident {
        val incident = WarRoomIncident(
            title = title,
            description = description,
            severity = severity,
            status = IncidentStatus.ACTIVE,
            involvedAgents = involvedAgents.joinToString(","),
            relatedTaskId = relatedTaskId,
            createdAt = LocalDateTime.now(),
            updatedAt = LocalDateTime.now()
        )
        return warRoomRepository.save(incident)
    }

    fun resolve(incidentId: Long): WarRoomIncident? {
        val incident = warRoomRepository.findById(incidentId).orElse(null) ?: return null
        incident.status = IncidentStatus.RESOLVED
        incident.updatedAt = LocalDateTime.now()
        return warRoomRepository.save(incident)
    }

    @Transactional(readOnly = true)
    fun getActiveIncidents(): List<WarRoomIncident> {
        return warRoomRepository.findAllByStatus(IncidentStatus.ACTIVE)
    }

    fun provideStrategyPivot(incidentId: Long, instruction: String): WarRoomIncident? {
        val incident = warRoomRepository.findById(incidentId).orElse(null) ?: return null
        // 여기서는 지시 내용을 로그에 남기거나 상태를 업데이트하는 등의 시뮬레이션을 수행합니다.
        // 실제로는 이 지시사항이 에이전트들의 시스템 프롬프트나 태스크 컨텍스트에 주입되어야 합니다.
        incident.updatedAt = LocalDateTime.now()
        // 인시던트 내용에 지시사항 추가 (간이 구현)
        // 실제 구현에서는 Pivot History 테이블이 별도로 있는 것이 좋습니다.
        return warRoomRepository.save(incident)
    }
}
