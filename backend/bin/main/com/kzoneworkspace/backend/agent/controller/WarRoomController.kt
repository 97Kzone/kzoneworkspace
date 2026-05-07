package com.kzoneworkspace.backend.agent.controller

import com.kzoneworkspace.backend.agent.entity.WarRoomIncident
import com.kzoneworkspace.backend.agent.service.WarRoomService
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/war-room")
class WarRoomController(
    private val warRoomService: WarRoomService
) {
    @GetMapping("/active")
    fun getActiveIncidents(): List<WarRoomIncident> {
        return warRoomService.getActiveIncidents()
    }

    @PostMapping("/resolve/{id}")
    fun resolveIncident(@PathVariable id: Long): WarRoomIncident? {
        return warRoomService.resolve(id)
    }

    @PostMapping("/pivot/{id}")
    fun provideStrategyPivot(
        @PathVariable id: Long,
        @RequestBody request: PivotRequest
    ): WarRoomIncident? {
        return warRoomService.provideStrategyPivot(id, request.instruction)
    }
}

data class PivotRequest(
    val instruction: String
)
