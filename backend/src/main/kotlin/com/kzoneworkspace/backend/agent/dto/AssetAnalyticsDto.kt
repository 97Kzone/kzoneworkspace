package com.kzoneworkspace.backend.agent.dto

data class SwarmAssetAnalyticsDto(
    val totalAllocatedAssetCost: Int,
    val overallRoi: Double,
    val agentAnalytics: List<AgentAssetAnalyticsDto>,
    val assetTypeAnalytics: List<AssetTypeAnalyticsDto>,
    val rebalancingRecommendations: List<AssetRebalancingRecommendationDto> = emptyList()
)

data class AgentAssetAnalyticsDto(
    val agentId: Long,
    val agentName: String,
    val allocatedAssetCount: Int,
    val totalAssetCost: Int,
    val earnedContributionPoints: Int,
    val roi: Double,
    val utilizationEfficiency: Int // 0~100 Score
)

data class AssetTypeAnalyticsDto(
    val assetType: String,
    val assetName: String,
    val allocationCount: Int,
    val totalCostAllocated: Int,
    val avgRoi: Double
)

data class AssetRebalancingRecommendationDto(
    val assetId: Long,
    val assetName: String,
    val agentName: String,
    val type: String,
    val currentEfficiency: Int,
    val cost: Int,
    val recommendationReason: String
)

data class AutoRebalanceResultDto(
    val rebalancedCount: Int,
    val allocatedCount: Int,
    val message: String
)
