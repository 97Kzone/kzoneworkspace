package com.kzoneworkspace.backend.agent.controller

import com.kzoneworkspace.backend.agent.entity.ScenarioSimulation
import com.kzoneworkspace.backend.agent.service.ScenarioService
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/scenarios")
@CrossOrigin(origins = ["*"])
class ScenarioController(
    private val scenarioService: ScenarioService
) {
    @GetMapping
    fun getAll(@RequestParam roomId: String): List<ScenarioSimulation> =
        scenarioService.getAllSimulations(roomId)

    @PostMapping("/run")
    fun runSimulation(@RequestBody request: ScenarioRequest): ScenarioSimulation =
        scenarioService.runSimulation(request.roomId, request.title, request.description)
}

data class ScenarioRequest(
    val roomId: String,
    val title: String,
    val description: String
)
