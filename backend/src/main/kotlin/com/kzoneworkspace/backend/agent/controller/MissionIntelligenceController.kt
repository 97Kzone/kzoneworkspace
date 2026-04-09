package com.kzoneworkspace.backend.agent.controller

import com.kzoneworkspace.backend.agent.entity.MissionContext
import com.kzoneworkspace.backend.agent.repository.MissionContextRepository
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/mission-intelligence")
class MissionIntelligenceController(
    private val missionContextRepository: MissionContextRepository
) {
    @GetMapping("/{roomId}")
    fun getMissionContext(@PathVariable roomId: String): ResponseEntity<List<MissionContext>> {
        return ResponseEntity.ok(missionContextRepository.findByRoomIdOrderByImportanceDescCreatedAtDesc(roomId))
    }
}
