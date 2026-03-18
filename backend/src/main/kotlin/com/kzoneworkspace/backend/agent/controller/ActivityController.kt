package com.kzoneworkspace.backend.agent.controller

import com.kzoneworkspace.backend.agent.entity.ActivityLog
import com.kzoneworkspace.backend.agent.service.ActivityLogService
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/activities")
@CrossOrigin(origins = ["*"])
class ActivityController(
    private val activityLogService: ActivityLogService
) {
    @GetMapping
    fun getAllLogs(): List<ActivityLog> {
        return activityLogService.getAllLogs()
    }

    @GetMapping("/room/{roomId}")
    fun getLogsByRoom(@PathVariable roomId: String): List<ActivityLog> {
        return activityLogService.getLogsByRoom(roomId)
    }
}
