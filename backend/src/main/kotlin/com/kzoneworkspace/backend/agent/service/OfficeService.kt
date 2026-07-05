package com.kzoneworkspace.backend.agent.service

import com.kzoneworkspace.backend.agent.entity.OfficeItem
import com.kzoneworkspace.backend.agent.entity.AssetUtilizationLog
import com.kzoneworkspace.backend.agent.repository.OfficeItemRepository
import com.kzoneworkspace.backend.agent.repository.AssetUtilizationLogRepository
import com.kzoneworkspace.backend.agent.dto.SwarmAssetAnalyticsDto
import com.kzoneworkspace.backend.agent.dto.AgentAssetAnalyticsDto
import com.kzoneworkspace.backend.agent.dto.AssetTypeAnalyticsDto
import com.kzoneworkspace.backend.agent.dto.AssetRebalancingRecommendationDto
import com.kzoneworkspace.backend.agent.dto.AutoRebalanceResultDto

import org.springframework.messaging.simp.SimpMessagingTemplate
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
@Transactional(readOnly = true)
class OfficeService(
    private val officeItemRepository: OfficeItemRepository,
    private val agentService: AgentService,
    private val messagingTemplate: SimpMessagingTemplate,
    private val assetUtilizationLogRepository: AssetUtilizationLogRepository
) {
    companion object {
        // 자산 타입별 기여 지표 소모량(비용) 정의
        private val ASSET_COSTS = mapOf(
            "REASONING_CORE" to 150,
            "EXTENDED_CONTEXT" to 100,
            "VECTOR_SEARCH" to 80,
            "AUXILIARY_INSTANCE" to 200,
            "CODE_STABILITY_SANDBOX" to 120,
            "SYNERGY_BRIDGE" to 130,
            "COST_OPTIMIZER" to 90,
            "VULNERABILITY_SHIELD" to 110,
            "CI_CD_PIPELINE_EMULATOR" to 140,
            "DEPRECATED_API_SCANNER" to 95
        )
    }

    fun getAssetCost(type: String): Int = ASSET_COSTS[type] ?: 0

    fun getAllItems(): List<OfficeItem> = officeItemRepository.findAll()

    @Transactional
    fun allocateAsset(agentId: Long, name: String, type: String, x: Int = 0, y: Int = 0, cost: Int): OfficeItem {
        val agent = agentService.getAgentById(agentId)
        if (agent.contributionPoints < cost) {
            throw RuntimeException("생산성 컴퓨팅 자산 배치를 위한 성공 기여도가 부족합니다. (Not enough contribution points to allocate this asset)")
        }
        
        agent.contributionPoints -= cost
        agentService.save(agent)

        val item = OfficeItem(
            name = name,
            type = type,
            x = x,
            y = y,
            agentId = agentId
        )
        val savedItem = officeItemRepository.save(item)

        // 자산 배치 로그 남김
        val log = AssetUtilizationLog(
            agentId = agentId,
            agentName = agent.name,
            assetType = type,
            assetName = name,
            actionType = "ALLOCATION",
            description = "${agent.name} 에이전트에 [${name}] 자산이 신규 배치되었습니다. 성공 기여도 ${cost}pts가 배정되었습니다."
        )
        assetUtilizationLogRepository.save(log)

        // 자산 상태 및 에이전트 정보 실시간 동기화 브로드캐스트
        broadcastUpdates()

        return savedItem
    }


    @Transactional
    fun deleteItem(id: Long) {
        val item = officeItemRepository.findById(id).orElse(null) ?: return
        
        // 자산이 에이전트에 소속되어 있는 경우 소모했던 성공 기여도를 환불 처리
        if (item.agentId != null) {
            val agent = agentService.getAgentById(item.agentId!!)
            val refundCost = ASSET_COSTS[item.type] ?: 0
            if (refundCost > 0) {
                agent.contributionPoints += refundCost
                agentService.save(agent)

                // 자산 회수 로그 남김
                val log = AssetUtilizationLog(
                    agentId = item.agentId!!,
                    agentName = agent.name,
                    assetType = item.type,
                    assetName = item.name,
                    actionType = "REVOCATION",
                    description = "${agent.name} 에이전트의 [${item.name}] 자산이 회수 및 반환 조치되었습니다. 성공 기여도 ${refundCost}pts가 환불되었습니다."
                )
                assetUtilizationLogRepository.save(log)
            }
        }

        officeItemRepository.deleteById(id)

        // 자산 상태 및 에이전트 정보 실시간 동기화 브로드캐스트
        broadcastUpdates()
    }


    fun getRecentLogs(): List<AssetUtilizationLog> =
        assetUtilizationLogRepository.findTop50ByOrderByTimestampDesc()

    /**
     * 가상 오피스 자산 상태 및 에이전트 목록의 변경사항을 WebSocket 채널로 실시간 브로드캐스트합니다.
     */
    fun broadcastUpdates() {
        try {
            messagingTemplate.convertAndSend("/topic/office", getAllItems())
            messagingTemplate.convertAndSend("/topic/agents", agentService.getAllAgents())
            messagingTemplate.convertAndSend("/topic/office/logs", getRecentLogs())
            messagingTemplate.convertAndSend("/topic/office/analytics", getAssetAnalytics())
        } catch (e: Exception) {
            // 웹소켓 발행 실패 시 에러 로그 기록 (프로세스 중단 방지)
            println("웹소켓 브로드캐스트 에러: ${e.message}")
        }
    }

    /**
     * 에이전트별 컴퓨팅 자산 투자 대비 기여도 획득률(ROI) 및 활용 효율성을 정량 분석합니다.
     */
    fun getAssetAnalytics(): SwarmAssetAnalyticsDto {
        val allItems = officeItemRepository.findAll()
        val agents = agentService.getAllAgents()

        val agentAnalyticsList = agents.map { agent ->
            val assignedItems = allItems.filter { it.agentId == agent.id }
            val totalCost = assignedItems.sumOf { ASSET_COSTS[it.type] ?: 0 }
            val earnedPoints = agent.contributionPoints
            
            val roi = if (totalCost > 0) {
                (earnedPoints.toDouble() / totalCost) * 100
            } else 0.0

            val reliability = agent.reliabilityIndex
            val efficiency = if (assignedItems.isNotEmpty()) {
                ((roi / 2.5) + (reliability / 2.0)).toInt().coerceIn(15, 99)
            } else 0

            AgentAssetAnalyticsDto(
                agentId = agent.id!!,
                agentName = agent.name,
                allocatedAssetCount = assignedItems.size,
                totalAssetCost = totalCost,
                earnedContributionPoints = earnedPoints,
                roi = Math.round(roi * 10.0) / 10.0,
                utilizationEfficiency = efficiency
            )
        }

        val totalCostSum = agentAnalyticsList.sumOf { it.totalAssetCost }
        val overallRoi = if (totalCostSum > 0) {
            val totalEarned = agentAnalyticsList.sumOf { it.earnedContributionPoints }
            Math.round((totalEarned.toDouble() / totalCostSum * 100) * 10.0) / 10.0
        } else 0.0

        val assetTypeGroup = allItems.groupBy { it.type }
        val assetTypeAnalyticsList = ASSET_COSTS.map { (type, cost) ->
            val itemsForType = assetTypeGroup[type] ?: emptyList()
            val count = itemsForType.size
            val assetName = itemsForType.firstOrNull()?.name ?: type
            
            // 타입별 평균 ROI 계산
            val avgRoiForType = if (count > 0) {
                val sumRoi = itemsForType.mapNotNull { item ->
                    agentAnalyticsList.find { it.agentId == item.agentId }?.roi
                }.sum()
                Math.round((sumRoi / count) * 10.0) / 10.0
            } else 0.0

            AssetTypeAnalyticsDto(
                assetType = type,
                assetName = assetName,
                allocationCount = count,
                totalCostAllocated = count * cost,
                avgRoi = avgRoiForType
            )
        }

        // 재배치 및 회수 권장 엔진 연산
        val rebalancingRecommendations = allItems.mapNotNull { item ->
            if (item.agentId == null) return@mapNotNull null
            val agent = agents.find { it.id == item.agentId } ?: return@mapNotNull null
            val agentAnalytic = agentAnalyticsList.find { it.agentId == agent.id } ?: return@mapNotNull null
            
            val isUnderutilized = item.utilizationRate < 15
            val hasLowEfficiency = agentAnalytic.utilizationEfficiency < 40 && item.utilizationRate < 30
            val isUnusedDefenseAsset = item.failurePreventedCount == 0 && 
                    (item.type == "VULNERABILITY_SHIELD" || item.type == "CODE_STABILITY_SANDBOX")
            
            if (isUnderutilized || hasLowEfficiency || isUnusedDefenseAsset) {
                val cost = ASSET_COSTS[item.type] ?: 0
                val reason = when {
                    isUnderutilized -> "실시간 가동률(${item.utilizationRate}%)이 15% 미만인 유휴 상태로, 리소스 낭비가 의심됩니다."
                    hasLowEfficiency -> "소속 에이전트의 종합 자산 효율성(${agentAnalytic.utilizationEfficiency}/100)이 낮고 가동률이 저조하여 회수 조치를 권장합니다."
                    isUnusedDefenseAsset -> "오류 방어 검증 실적이 전혀 없는 무가동 보안 자산입니다."
                    else -> "자산 활용성 대비 성과 가중 비효율로 재배치 대상군에 포함되었습니다."
                }
                
                AssetRebalancingRecommendationDto(
                    assetId = item.id,
                    assetName = item.name,
                    agentName = agent.name,
                    type = item.type,
                    currentEfficiency = agentAnalytic.utilizationEfficiency,
                    cost = cost,
                    recommendationReason = reason
                )
            } else {
                null
            }
        }

        return SwarmAssetAnalyticsDto(
            totalAllocatedAssetCost = totalCostSum,
            overallRoi = overallRoi,
            agentAnalytics = agentAnalyticsList,
            assetTypeAnalytics = assetTypeAnalyticsList,
            rebalancingRecommendations = rebalancingRecommendations
        )
    }

    fun getAvailableAssets(): List<AvailableAssetDto> {
        return listOf(
            AvailableAssetDto(
                id = "reasoning_core",
                name = "고성능 추론 가속 코어",
                type = "REASONING_CORE",
                description = "고부하 추론 처리를 위한 GPU 가속 컴퓨팅 코어를 추가 할당합니다.",
                cost = ASSET_COSTS["REASONING_CORE"] ?: 150
            ),
            AvailableAssetDto(
                id = "extended_context",
                name = "대용량 컨텍스트 메모리 확장",
                type = "EXTENDED_CONTEXT",
                description = "Context Window를 최대 128k로 확장하고 세션 캐싱 메모리를 확보합니다.",
                cost = ASSET_COSTS["EXTENDED_CONTEXT"] ?: 100
            ),
            AvailableAssetDto(
                id = "vector_search",
                name = "실시간 벡터 지식 검색 세션",
                type = "VECTOR_SEARCH",
                description = "에이전트 단/장기 기억 검색의 정확도를 높이고 시맨틱 검색 속도를 극대화합니다.",
                cost = ASSET_COSTS["VECTOR_SEARCH"] ?: 80
            ),
            AvailableAssetDto(
                id = "auxiliary_instance",
                name = "보조 추론 및 자가 치유 인스턴스",
                type = "AUXILIARY_INSTANCE",
                description = "다중 스레드 병렬 연산을 지원하여 로직 검증 및 자가 치유 레이턴시를 단축합니다.",
                cost = ASSET_COSTS["AUXILIARY_INSTANCE"] ?: 200
            ),
            AvailableAssetDto(
                id = "code_stability_sandbox",
                name = "코드 안정성 검증용 자율 샌드박스",
                type = "CODE_STABILITY_SANDBOX",
                description = "자율 실행 격리 테스트 환경을 구축하여 빌드 오류 및 런타임 결함을 예방하고, 에이전트의 안정성을 극대화합니다.",
                cost = ASSET_COSTS["CODE_STABILITY_SANDBOX"] ?: 120
            ),
            AvailableAssetDto(
                id = "synergy_bridge",
                name = "협업 시너지 공명 브릿지",
                type = "SYNERGY_BRIDGE",
                description = "에이전트 간의 협업 채널 전용 대역폭을 확보하여 협업 시너지를 가속하고, 업무 실패 시 발생하는 시너지 하락 리스크를 방어합니다.",
                cost = ASSET_COSTS["SYNERGY_BRIDGE"] ?: 130
            ),
            AvailableAssetDto(
                id = "cost_optimizer",
                name = "실시간 API 비용 및 토큰 최적화 엔진",
                type = "COST_OPTIMIZER",
                description = "추론 프롬프트 및 컨텍스트를 실시간으로 압축하여 호출 시 발생하는 API 비용과 토큰 소모량을 20% 절감합니다.",
                cost = ASSET_COSTS["COST_OPTIMIZER"] ?: 90
            ),
            AvailableAssetDto(
                id = "vulnerability_shield",
                name = "실시간 보안 및 취약점 검증 쉴드",
                type = "VULNERABILITY_SHIELD",
                description = "에이전트가 코드를 변경하거나 패키지를 추가할 때 보안 결함이나 알려진 취약점을 실시간 스캔하여 차단하고, 프로젝트의 안전성을 극대화합니다.",
                cost = ASSET_COSTS["VULNERABILITY_SHIELD"] ?: 110
            ),
            AvailableAssetDto(
                id = "ci_cd_pipeline_emulator",
                name = "CI/CD 파이프라인 에뮬레이터",
                type = "CI_CD_PIPELINE_EMULATOR",
                description = "빌드 및 배포 자동화 검증이 활성화되어 실제 배포 시의 부작용을 가상 환경에서 사전 테스트하고 예방합니다.",
                cost = ASSET_COSTS["CI_CD_PIPELINE_EMULATOR"] ?: 140
            ),
            AvailableAssetDto(
                id = "deprecated_api_scanner",
                name = "사용 제안 API 분석기",
                type = "DEPRECATED_API_SCANNER",
                description = "레거시 및 Deprecated API 사용 건을 실시간 감지하여 현대적인 대체 코드 구현 유형을 권장합니다.",
                cost = ASSET_COSTS["DEPRECATED_API_SCANNER"] ?: 95
            )
        )
    }

    /**
     * 에이전트의 역할, 인지 신뢰도, 보유 성공 기여도 지표를 정량 분석하여 최적의 미배치 생산성 컴퓨팅 자산을 추천합니다.
     */
    fun recommendAssetForAgent(agentId: Long): AvailableAssetDto? {
        val agent = agentService.getAgentById(agentId)
        val assignedTypes = officeItemRepository.findAll()
            .filter { it.agentId == agentId }
            .map { it.type }
            .toSet()

        val available = getAvailableAssets().filter { it.type !in assignedTypes }
        if (available.isEmpty()) return null

        val roleLower = agent.role.lowercase()
        // 역할별 최적 자산 타입선호도 매핑
        val preferredType = when {
            roleLower.contains("coder") || roleLower.contains("dev") -> {
                if ("CODE_STABILITY_SANDBOX" in assignedTypes) "CI_CD_PIPELINE_EMULATOR" else "CODE_STABILITY_SANDBOX"
            }
            roleLower.contains("qa") || roleLower.contains("review") -> {
                if ("VULNERABILITY_SHIELD" in assignedTypes) "DEPRECATED_API_SCANNER" else "VULNERABILITY_SHIELD"
            }
            roleLower.contains("analyst") || roleLower.contains("research") -> "VECTOR_SEARCH"
            roleLower.contains("architect") || roleLower.contains("lead") -> "REASONING_CORE"
            else -> "EXTENDED_CONTEXT"
        }

        // 선호 자산이 미배치 상태이며 성공 기여도가 충분한 경우 우선 추천
        val preferredAsset = available.find { it.type == preferredType }
        if (preferredAsset != null && agent.contributionPoints >= preferredAsset.cost) {
            return preferredAsset
        }

        // 성공 기여도로 즉시 배치 가능한 자산 중 비용이 높은 순(고성능 자산)으로 추천
        val affordable = available.filter { agent.contributionPoints >= it.cost }
            .sortedByDescending { it.cost }

        return affordable.firstOrNull() ?: available.minByOrNull { it.cost }
    }

    /**
     * 비효율 컴퓨팅 자산을 일괄 회수하고, 각 에이전트의 잔여/환불 기여도 포인트를 활용하여 최적의 추천 자산을 자동 배치합니다.
     */
    @Transactional
    fun executeAutoRebalancing(): AutoRebalanceResultDto {
        val analytics = getAssetAnalytics()
        val recommendations = analytics.rebalancingRecommendations

        if (recommendations.isEmpty()) {
            return AutoRebalanceResultDto(
                rebalancedCount = 0,
                allocatedCount = 0,
                message = "재배치가 필요한 비효율 컴퓨팅 자산이 없습니다."
            )
        }

        var revokedCount = 0
        recommendations.forEach { rec ->
            try {
                deleteItem(rec.assetId)
                revokedCount++
            } catch (e: Exception) {
                println("Failed to revoke asset ${rec.assetId}: ${e.message}")
            }
        }

        var allocatedCount = 0
        val agents = agentService.getAllAgents()
        agents.forEach { agent ->
            var keepRecommending = true
            while (keepRecommending) {
                val recommended = recommendAssetForAgent(agent.id)
                if (recommended != null && agent.contributionPoints >= recommended.cost) {
                    try {
                        val randomX = (10..90).random()
                        val randomY = (10..90).random()
                        allocateAsset(
                            agentId = agent.id,
                            name = recommended.name,
                            type = recommended.type,
                            x = randomX,
                            y = randomY,
                            cost = recommended.cost
                        )
                        allocatedCount++
                    } catch (e: Exception) {
                        println("Failed to auto-allocate asset to agent ${agent.id}: ${e.message}")
                        keepRecommending = false
                    }
                } else {
                    keepRecommending = false
                }
            }
        }

        broadcastUpdates()

        val msg = "성공적으로 비효율 자산 ${revokedCount}개를 회수하고, 최적의 자산 ${allocatedCount}개를 에이전트에 자동 재배치하였습니다."
        return AutoRebalanceResultDto(
            rebalancedCount = revokedCount,
            allocatedCount = allocatedCount,
            message = msg
        )
    }
}


data class AvailableAssetDto(
    val id: String,
    val name: String,
    val type: String,
    val description: String,
    val cost: Int
)


