package com.kzoneworkspace.backend.tools

import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import kotlin.test.assertTrue

class BrowserServiceTest {

    private lateinit var browserService: BrowserService

    @BeforeEach
    fun setUp() {
        browserService = BrowserService()
        browserService.init()
    }

    @AfterEach
    fun tearDown() {
        browserService.cleanup()
    }

    @Test
    fun testNavigateAndGetText() {
        val url = "https://www.google.com"
        val sessionId = "test-session"
        val result = browserService.navigate(sessionId, url)
        println("Fetched content from Google: ${result.content.take(100)}...")
        assertTrue(result.content.isNotEmpty(), "Content should not be empty")
        assertTrue(result.content.lowercase().contains("google"), "Content should contain 'google'")
        assertTrue(result.url.contains("google.com"), "URL should contain 'google.com'")
    }
}
