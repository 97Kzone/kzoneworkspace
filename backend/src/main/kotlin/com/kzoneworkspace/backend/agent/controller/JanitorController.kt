package com.kzoneworkspace.backend.agent.controller

import com.kzoneworkspace.backend.agent.entity.MaintenanceIssue
import com.kzoneworkspace.backend.agent.service.JanitorService
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/janitor")
@CrossOrigin(origins = ["*"])
class JanitorController(
    private val janitorService: JanitorService
) {
    @GetMapping("/issues")
    fun getPendingIssues(): List<MaintenanceIssue> {
        return janitorService.getPendingIssues()
    }

    @PostMapping("/scan")
    fun triggerScan(): Map<String, Any> {
        val count = janitorService.scanCodebase()
        return mapOf("success" to true, "foundCount" to count)
    }

    @PostMapping("/fix/{id}")
    fun applyFix(@PathVariable id: Long): Map<String, Any> {
        val (success, message) = janitorService.applyFix(id)
        return mapOf("success" to success, "message" to message)
    }

    @PostMapping("/ignore/{id}")
    fun ignoreIssue(@PathVariable id: Long): Map<String, Any> {
        janitorService.ignoreIssue(id)
        return mapOf("success" to true)
    }
}
