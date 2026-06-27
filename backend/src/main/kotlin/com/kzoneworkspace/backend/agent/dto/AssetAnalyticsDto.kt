package com.kzoneworkspace.backend.agent.dto

data class SwarmAssetAnalyticsDto(
    val totalAllocatedAssetCost: Int,
    val overallRoi: Double,
    val agentAnalytics: List<AgentAssetAnalyticsDto>,
    val assetTypeAnalytics: List<AssetTypeAnalyticsDto>
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
