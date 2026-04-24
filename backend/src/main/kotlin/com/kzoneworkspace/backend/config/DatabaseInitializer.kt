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
            
            // Schema Migrations for memories table
            try {
                jdbcTemplate.execute("ALTER TABLE memories ADD COLUMN IF NOT EXISTS importance INTEGER DEFAULT 3")
                jdbcTemplate.execute("ALTER TABLE memories ADD COLUMN IF NOT EXISTS tags TEXT")
                println("✅ memories table schema updated successfully.")
            } catch (e: Exception) {
                println("⚠️ Failed to update memories table schema: ${e.message}")
            }

            // Create neural_resonances table if not exists
            try {
                jdbcTemplate.execute("""
                    CREATE TABLE IF NOT EXISTS neural_resonances (
                        id BIGINT PRIMARY KEY,
                        source_id BIGINT NOT NULL,
                        target_id BIGINT NOT NULL,
                        source_type VARCHAR(20) NOT NULL,
                        target_type VARCHAR(20) NOT NULL,
                        resonance_strength DOUBLE PRECISION NOT NULL,
                        source_agent_name VARCHAR(255) NOT NULL,
                        target_agent_name VARCHAR(255) NOT NULL,
                        resonance_theme TEXT,
                        synthesized_insight TEXT,
                        created_at TIMESTAMP NOT NULL
                    )
                """.trimIndent())
                println("✅ neural_resonances table initialized.")
            } catch (e: Exception) {
                println("⚠️ Failed to create neural_resonances table: ${e.message}")
            }
        } catch (e: Exception) {
            println("⚠️ Failed to initialize pgvector extension: ${e.message}")
            println("Please ensure you are using a PostgreSQL image that supports pgvector (e.g., pgvector/pgvector:16-pg11).")
        }
    }
}
