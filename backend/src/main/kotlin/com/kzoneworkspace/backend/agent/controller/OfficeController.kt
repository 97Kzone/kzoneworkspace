package com.kzoneworkspace.backend.agent.controller

import com.kzoneworkspace.backend.agent.entity.OfficeItem
import com.kzoneworkspace.backend.agent.entity.AssetUtilizationLog
import com.kzoneworkspace.backend.agent.dto.SwarmAssetAnalyticsDto
import com.kzoneworkspace.backend.agent.dto.AutoRebalanceResultDto

import com.kzoneworkspace.backend.agent.service.OfficeService
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/office")
@CrossOrigin(origins = ["http://localhost:3000"])
class OfficeController(
    private val officeService: OfficeService
) {
    @GetMapping("/items")
    fun getAllItems(): List<OfficeItem> = officeService.getAllItems()

    @GetMapping("/available-assets")
    fun getAvailableAssets(): List<com.kzoneworkspace.backend.agent.service.AvailableAssetDto> {
        return officeService.getAvailableAssets()
    }

    @GetMapping("/logs")
    fun getRecentLogs(): List<AssetUtilizationLog> = officeService.getRecentLogs()

    @GetMapping("/analytics/roi")
    fun getAssetAnalytics(): SwarmAssetAnalyticsDto = officeService.getAssetAnalytics()

    @GetMapping("/recommendations/{agentId}")
    fun getRecommendation(@PathVariable agentId: Long): com.kzoneworkspace.backend.agent.service.AvailableAssetDto? {
        return officeService.recommendAssetForAgent(agentId)
    }

    @PostMapping("/items/allocate")
    fun allocateAsset(@RequestBody request: AllocateAssetRequest): OfficeItem {
        return officeService.allocateAsset(
            agentId = request.agentId,
            name = request.name,
            type = request.type,
            x = request.x,
            y = request.y,
            cost = request.cost
        )
    }

    @PostMapping("/rebalance/auto")
    fun executeAutoRebalancing(): AutoRebalanceResultDto {
        return officeService.executeAutoRebalancing()
    }




    @DeleteMapping("/items/{id}")
    fun deleteItem(@PathVariable id: Long) = officeService.deleteItem(id)


    data class AllocateAssetRequest(
        val agentId: Long,
        val name: String,
        val type: String,
        val x: Int = 0,
        val y: Int = 0,
        val cost: Int
    )


}
