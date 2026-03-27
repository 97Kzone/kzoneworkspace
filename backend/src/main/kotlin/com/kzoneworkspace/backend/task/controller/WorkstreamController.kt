package com.kzoneworkspace.backend.task.controller

import com.kzoneworkspace.backend.task.dto.WorkstreamRequest
import com.kzoneworkspace.backend.task.service.WorkstreamService
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/workstreams")
class WorkstreamController(
    private val workstreamService: WorkstreamService
) {
    @PostMapping("/start")
    fun startWorkstream(@RequestBody request: WorkstreamRequest): String {
        workstreamService.startWorkstream(request)
        return "워크스트림이 병합 실행을 시작했습니다."
    }
}
