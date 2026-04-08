package com.kzoneworkspace.backend.config

import jakarta.annotation.PostConstruct
import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.stereotype.Component

@Component
class DatabaseInitializer(private val jdbcTemplate: JdbcTemplate) {

    @PostConstruct
    fun init() {
        try {
            jdbcTemplate.execute("CREATE EXTENSION IF NOT EXISTS vector")
            println("✅ pgvector extension initialized successfully.")
        } catch (e: Exception) {
            println("⚠️ Failed to initialize pgvector extension: ${e.message}")
            println("Please ensure you are using a PostgreSQL image that supports pgvector (e.g., pgvector/pgvector:16-pg11).")
        }
    }
}
