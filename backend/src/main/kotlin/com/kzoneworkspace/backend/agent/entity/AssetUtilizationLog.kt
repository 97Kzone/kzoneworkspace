package com.kzoneworkspace.backend.agent.entity

import jakarta.persistence.*
import java.time.LocalDateTime

@Entity
@Table(name = "asset_utilization_logs")
class AssetUtilizationLog(
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    val id: Long = 0,

    @Column(name = "agent_id", nullable = false)
    val agentId: Long,

    @Column(name = "agent_name", nullable = false)
    val agentName: String,

    @Column(name = "asset_type", nullable = false)
    val assetType: String,

    @Column(name = "asset_name", nullable = false)
    val assetName: String,

    @Column(name = "action_type", nullable = false)
    val actionType: String, // "ALLOCATION", "REVOCATION", "UTILIZATION"

    @Column(columnDefinition = "TEXT", nullable = false)
    val description: String,

    @Column(nullable = false)
    val timestamp: LocalDateTime = LocalDateTime.now()
)
