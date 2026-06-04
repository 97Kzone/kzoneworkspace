package com.kzoneworkspace.backend.agent.controller

import com.kzoneworkspace.backend.agent.entity.OfficeItem
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

    @PostMapping("/items/allocate")
    fun allocateAsset(@RequestBody request: AllocateAssetRequest): OfficeItem {
        return officeService.allocateAsset(
            agentId = request.agentId,
            name = request.name,
            type = request.type,
            x = request.x,
            y = request.y,
            price = request.price
        )
    }



    @DeleteMapping("/items/{id}")
    fun deleteItem(@PathVariable id: Long) = officeService.deleteItem(id)

    @PutMapping("/items/{id}/move")
    fun moveItem(@PathVariable id: Long, @RequestBody request: MoveItemRequest): OfficeItem {
        return officeService.moveItem(id, request.x, request.y)
    }

    data class MoveItemRequest(
        val x: Int,
        val y: Int
    )

    data class AllocateAssetRequest(
        val agentId: Long,
        val name: String,
        val type: String,
        val x: Int,
        val y: Int,
        val price: Int
    )


}
