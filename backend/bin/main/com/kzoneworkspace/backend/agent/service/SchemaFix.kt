package com.kzoneworkspace.backend.agent.service

import jakarta.annotation.PostConstruct
import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.stereotype.Component

@Component
class SchemaFix(private val jdbcTemplate: JdbcTemplate) {

    @PostConstruct
    fun fixSchema() {
        println("🛠️ Running SchemaFix to add missing columns...")
        try {
            // Add points column to agents
            jdbcTemplate.execute("ALTER TABLE agents ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0")
            // Add last_emotion column to agents
            jdbcTemplate.execute("ALTER TABLE agents ADD COLUMN IF NOT EXISTS last_emotion VARCHAR(255)")
            
            // Add office_items table
            jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS office_items (
                    id BIGINT NOT NULL PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    type VARCHAR(255) NOT NULL,
                    x INTEGER NOT NULL,
                    y INTEGER NOT NULL,
                    agent_id BIGINT,
                    created_at TIMESTAMP NOT NULL
                )
            """)
            
            println("✅ SchemaFix completed successfully.")
        } catch (e: Exception) {
            println("⚠️ SchemaFix encountered an error (it might be fine if columns exist): ${e.message}")
        }
    }
}
