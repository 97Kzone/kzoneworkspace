package com.kzoneworkspace.backend.agent.controller

import com.kzoneworkspace.backend.agent.service.AgentWorkloadMetric
import com.kzoneworkspace.backend.agent.service.RebalanceResult
import com.kzoneworkspace.backend.agent.service.WorkloadBalancerService
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/workload")
class WorkloadBalancerController(
    private val workloadBalancerService: WorkloadBalancerService
) {

    @GetMapping("/metrics")
    fun getMetrics(): List<AgentWorkloadMetric> {
        return workloadBalancerService.getWorkloadMetrics()
    }

    @PostMapping("/rebalance")
    fun autoRebalance(): RebalanceResult {
        return workloadBalancerService.autoRebalance()
    }
}
