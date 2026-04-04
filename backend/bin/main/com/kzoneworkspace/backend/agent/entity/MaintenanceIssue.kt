package com.kzoneworkspace.backend.agent.entity

import jakarta.persistence.*
import java.time.LocalDateTime

enum class IssueCategory {
    UNUSED_CODE, LINT_ERROR, LOGIC_SMELL, SECURITY, PERFORMANCE
}

enum class IssueSeverity {
    CRITICAL, MAJOR, MINOR
}

enum class MaintenanceStatus {
    PENDING, APPLIED, IGNORED
}

@Entity
@Table(name = "maintenance_issues")
class MaintenanceIssue(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,

    @Column(nullable = false)
    val filePath: String,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    val category: IssueCategory,

    @Column(columnDefinition = "TEXT", nullable = false)
    val description: String,

    @Column(columnDefinition = "TEXT")
    val originalCode: String? = null,

    @Column(columnDefinition = "TEXT")
    val suggestedCode: String? = null,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    val severity: IssueSeverity = IssueSeverity.MINOR,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    var status: MaintenanceStatus = MaintenanceStatus.PENDING,

    @Column(nullable = false)
    val createdAt: LocalDateTime = LocalDateTime.now()
)
