package com.kzoneworkspace.backend.agent.service

import com.kzoneworkspace.backend.agent.entity.OfficeItem
import com.kzoneworkspace.backend.agent.entity.AssetUtilizationLog
import com.kzoneworkspace.backend.agent.entity.Agent
import com.kzoneworkspace.backend.agent.repository.OfficeItemRepository
import com.kzoneworkspace.backend.agent.repository.AssetUtilizationLogRepository
import com.kzoneworkspace.backend.agent.dto.*

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
            "DEPRECATED_API_SCANNER" to 95,
            "LLM_FALLBACK_ROUTER" to 160,
            "PROMPT_TEMPORAL_CACHE" to 75
        )
    }

    fun getAssetCost(type: String): Int = ASSET_COSTS[type] ?: 0

    fun getAllItems(): List<OfficeItem> = officeItemRepository.findAll()

    @Transactional
    fun allocateAsset(agentId: Long, name: String, type: String, cost: Int): OfficeItem {
        val agent = agentService.getAgentById(agentId)
        if (agent.contributionPoints < cost) {
            throw RuntimeException("생산성 컴퓨팅 자산 배치를 위한 성공 기여도가 부족합니다. (Not enough contribution points to allocate this asset)")
        }
        
        agent.contributionPoints -= cost
        agentService.save(agent)

        val item = OfficeItem(
            name = name,
            type = type,
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
            ),
            AvailableAssetDto(
                id = "llm_fallback_router",
                name = "실시간 멀티-LLM 폴백 라우터",
                type = "LLM_FALLBACK_ROUTER",
                description = "주 API 장애나 속도 제한 감지 시 대기 시간 없이 차순위 LLM으로 자율 전환하여 추론 연속성을 보장합니다.",
                cost = ASSET_COSTS["LLM_FALLBACK_ROUTER"] ?: 160
            ),
            AvailableAssetDto(
                id = "prompt_temporal_cache",
                name = "시공간 프롬프트 캐시 엔진",
                type = "PROMPT_TEMPORAL_CACHE",
                description = "에이전트 군집 내 중복 프롬프트와 컨텍스트 메모리를 캐싱하여 연산 리소스 및 API 토큰 낭비를 절감합니다.",
                cost = ASSET_COSTS["PROMPT_TEMPORAL_CACHE"] ?: 75
            )
        )
    }

    /**
     * 에이전트의 역할, 인지 성향 가중치, 신뢰도를 종합 연산하여 최적의 추천 자산 점수와 상세 사유를 계산하는 비공개 헬퍼 메소드입니다.
     */
    private fun calculateAssetRecommendationScore(
        agent: Agent,
        asset: AvailableAssetDto,
        assignedTypes: Set<String>
    ): Pair<Double, String> {
        val roleLower = agent.role.lowercase()
        val traits = agent.personalityTraits
        val reliability = agent.reliabilityIndex
        val modelLower = agent.model.lowercase()

        var score = 0.0
        val reasons = mutableListOf<String>()

        // 1. 역할 매칭 (+50점)
        val isRoleMatch = when (asset.type) {
            "REASONING_CORE" -> roleLower.contains("architect") || roleLower.contains("lead") || roleLower.contains("pm")
            "EXTENDED_CONTEXT" -> roleLower.contains("analyst") || roleLower.contains("researcher") || roleLower.contains("writer")
            "VECTOR_SEARCH" -> roleLower.contains("analyst") || roleLower.contains("researcher") || roleLower.contains("db")
            "AUXILIARY_INSTANCE" -> roleLower.contains("qa") || roleLower.contains("reviewer") || roleLower.contains("coder") || roleLower.contains("dev")
            "CODE_STABILITY_SANDBOX" -> roleLower.contains("coder") || roleLower.contains("dev")
            "SYNERGY_BRIDGE" -> roleLower.contains("architect") || roleLower.contains("lead") || roleLower.contains("coordinator")
            "COST_OPTIMIZER" -> true
            "VULNERABILITY_SHIELD" -> roleLower.contains("qa") || roleLower.contains("reviewer") || roleLower.contains("security")
            "CI_CD_PIPELINE_EMULATOR" -> roleLower.contains("coder") || roleLower.contains("dev") || roleLower.contains("ops")
            "DEPRECATED_API_SCANNER" -> roleLower.contains("coder") || roleLower.contains("dev") || roleLower.contains("qa") || roleLower.contains("reviewer")
            "LLM_FALLBACK_ROUTER" -> roleLower.contains("coder") || roleLower.contains("dev") || roleLower.contains("ops")
            "PROMPT_TEMPORAL_CACHE" -> roleLower.contains("analyst") || roleLower.contains("researcher") || roleLower.contains("coder") || roleLower.contains("dev")
            else -> false
        }
        if (isRoleMatch) {
            score += 50.0
            reasons.add("에이전트 역할군(${agent.role}) 특화 자원")
        }

        // 2. 인지 성향 반영
        val traitWeights = when (asset.type) {
            "REASONING_CORE" -> mapOf("ANALYTICAL" to 0.6, "BOLD" to 0.4)
            "EXTENDED_CONTEXT" -> mapOf("ANALYTICAL" to 0.5, "CREATIVE" to 0.5)
            "VECTOR_SEARCH" -> mapOf("ANALYTICAL" to 0.7, "CAUTIOUS" to 0.3)
            "AUXILIARY_INSTANCE" -> mapOf("CAUTIOUS" to 0.6, "EMPATHETIC" to 0.4)
            "CODE_STABILITY_SANDBOX" -> mapOf("CAUTIOUS" to 0.8, "ANALYTICAL" to 0.2)
            "SYNERGY_BRIDGE" -> mapOf("EMPATHETIC" to 0.8, "CREATIVE" to 0.2)
            "COST_OPTIMIZER" -> mapOf("ANALYTICAL" to 0.5, "CAUTIOUS" to 0.5)
            "VULNERABILITY_SHIELD" -> mapOf("CAUTIOUS" to 0.9, "ANALYTICAL" to 0.1)
            "CI_CD_PIPELINE_EMULATOR" -> mapOf("BOLD" to 0.6, "CAUTIOUS" to 0.4)
            "DEPRECATED_API_SCANNER" -> mapOf("CAUTIOUS" to 0.7, "ANALYTICAL" to 0.3)
            "LLM_FALLBACK_ROUTER" -> mapOf("CAUTIOUS" to 0.7, "BOLD" to 0.3)
            "PROMPT_TEMPORAL_CACHE" -> mapOf("ANALYTICAL" to 0.8, "CAUTIOUS" to 0.2)
            else -> emptyMap()
        }

        var traitBonus = 0.0
        val highTraits = mutableListOf<String>()
        traitWeights.forEach { (trait, weight) ->
            val value = traits[trait] ?: 50
            traitBonus += value * weight
            if (value >= 70) {
                val traitNameKo = when (trait) {
                    "ANALYTICAL" -> "분석"
                    "CREATIVE" -> "창의"
                    "CAUTIOUS" -> "신중"
                    "BOLD" -> "도전"
                    "EMPATHETIC" -> "협동"
                    else -> trait
                }
                highTraits.add("${traitNameKo} 성향(${value})")
            }
        }
        score += traitBonus
        if (highTraits.isNotEmpty()) {
            reasons.add("우수 인지 특성(${highTraits.joinToString(", ")}) 연계")
        }

        // 3. 인지 신뢰도 보정
        if (reliability < 60) {
            if (asset.type in listOf("CODE_STABILITY_SANDBOX", "VULNERABILITY_SHIELD", "AUXILIARY_INSTANCE", "LLM_FALLBACK_ROUTER")) {
                score += 40.0
                reasons.add("신뢰도 경고 점수(${reliability}%)에 따른 시스템 자가치유 보강")
            }
        } else if (reliability > 85) {
            if (asset.type in listOf("REASONING_CORE", "EXTENDED_CONTEXT")) {
                score += 25.0
                reasons.add("우수 신뢰도 등급(${reliability}%) 연산 시너지")
            }
        }

        // 4. 모델 연산 비용 보정
        val isHeavyModel = modelLower.contains("pro") || modelLower.contains("ultra") || 
                           modelLower.contains("opus") || modelLower.contains("gpt-4")
        if (isHeavyModel && (asset.type == "COST_OPTIMIZER" || asset.type == "PROMPT_TEMPORAL_CACHE")) {
            score += 40.0
            reasons.add("대형 추론 모델(${agent.model}) 가동에 따른 API 토큰 절감")
        }

        val reasonText = if (reasons.isNotEmpty()) {
            reasons.joinToString(" / ")
        } else {
            "에이전트 맞춤형 범용 연산 자산"
        }

        return score to reasonText
    }

    /**
     * 시뮬레이션 상태 및 특정 기여도 한도 내에서 최적의 컴퓨팅 자산을 자율 추천하는 내부 헬퍼 메소드입니다.
     */
    private fun recommendAssetForAgentInternal(
        agent: Agent,
        assignedTypes: Set<String>,
        simulatedPoints: Int
    ): AvailableAssetDto? {
        val available = getAvailableAssets().filter { it.type !in assignedTypes }
        if (available.isEmpty()) return null

        val scoredAssets = available.map { asset ->
            val (score, reasonText) = calculateAssetRecommendationScore(agent, asset, assignedTypes)
            val updatedAssetDto = AvailableAssetDto(
                id = asset.id,
                name = asset.name,
                type = asset.type,
                description = asset.description,
                cost = asset.cost,
                recommendationReason = reasonText
            )
            updatedAssetDto to score
        }

        val affordable = scoredAssets.filter { simulatedPoints >= it.first.cost }
            .sortedByDescending { it.second }

        return affordable.firstOrNull()?.first ?: scoredAssets.sortedByDescending { it.second }.firstOrNull()?.first
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

        return recommendAssetForAgentInternal(agent, assignedTypes, agent.contributionPoints)
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
                        allocateAsset(
                            agentId = agent.id,
                            name = recommended.name,
                            type = recommended.type,
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

    /**
     * 비효율 컴퓨팅 자산 회수 및 추천 자산 자동 배치를 실제로 데이터베이스에 반영하지 않고 시뮬레이션합니다.
     */
    fun simulateRebalancing(): SimulatedRebalanceResultDto {
        val analytics = getAssetAnalytics()
        val recommendations = analytics.rebalancingRecommendations

        // 1. 시뮬레이션용 에이전트 맵 (에이전트 ID -> 기여도 포인트 복제본)
        val agents = agentService.getAllAgents()
        val agentPointsMap = agents.associate { it.id!! to it.contributionPoints }.toMutableMap()
        
        // 2. 시뮬레이션용 배치 자산 맵 (에이전트 ID -> 보유 중인 자산 타입 Set)
        val allItems = officeItemRepository.findAll()
        val agentAssetsMap = allItems.groupBy { it.agentId }
            .mapValues { (_, items) -> items.map { it.type }.toMutableSet() }
            .toMutableMap()
            
        // 3. 시뮬레이션 회수 대상 리스트
        val simulatedRevocations = recommendations.map { rec ->
            val agent = agents.find { it.name == rec.agentName }
            val agentId = agent?.id ?: 0L
            
            // 환불 시뮬레이션
            val refund = ASSET_COSTS[rec.type] ?: 0
            if (agentId != 0L && refund > 0) {
                agentPointsMap[agentId] = (agentPointsMap[agentId] ?: 0) + refund
                agentAssetsMap[agentId]?.remove(rec.type)
            }
            
            SimulatedRevocationDto(
                assetId = rec.assetId,
                assetName = rec.assetName,
                agentName = rec.agentName,
                type = rec.type,
                cost = rec.cost,
                reason = rec.recommendationReason
            )
        }
        
        val netRefundedPoints = simulatedRevocations.sumOf { it.cost }
        
        // 4. 시뮬레이션 할당 대상 리스트
        val simulatedAllocations = mutableListOf<SimulatedAllocationDto>()
        
        // 에이전트별로 시뮬레이션 추천을 반복 적용
        agents.forEach { agent ->
            val agentId = agent.id!!
            var keepRecommending = true
            while (keepRecommending) {
                // 이 에이전트가 현재 시뮬레이션 상에서 안 가지고 있는 자산들 필터링
                val assignedTypes = agentAssetsMap[agentId] ?: emptySet<String>()
                val simulatedPoints = agentPointsMap[agentId] ?: 0
                
                val recommended = recommendAssetForAgentInternal(agent, assignedTypes, simulatedPoints)
                if (recommended != null && simulatedPoints >= recommended.cost) {
                    // 시뮬레이션에 반영
                    agentPointsMap[agentId] = simulatedPoints - recommended.cost
                    if (agentAssetsMap[agentId] == null) {
                        agentAssetsMap[agentId] = mutableSetOf()
                    }
                    agentAssetsMap[agentId]!!.add(recommended.type)
                    
                    simulatedAllocations.add(SimulatedAllocationDto(
                        agentId = agentId,
                        agentName = agent.name,
                        assetType = recommended.type,
                        assetName = recommended.name,
                        cost = recommended.cost,
                        recommendationReason = recommended.recommendationReason
                    ))
                } else {
                    keepRecommending = false
                }
            }
        }
        
        val netAllocatedPoints = simulatedAllocations.sumOf { it.cost }
        
        // 영향받은 에이전트 목록 수집
        val impactedAgentNames = (simulatedRevocations.map { it.agentName } + simulatedAllocations.map { it.agentName }).toSet()
        
        return SimulatedRebalanceResultDto(
            simulatedRevocations = simulatedRevocations,
            simulatedAllocations = simulatedAllocations,
            netRefundedPoints = netRefundedPoints,
            netAllocatedPoints = netAllocatedPoints,
            totalImpactedAgentsCount = impactedAgentNames.size
        )
    }
}


data class AvailableAssetDto(
    val id: String,
    val name: String,
    val type: String,
    val description: String,
    val cost: Int,
    val recommendationReason: String? = null
)


