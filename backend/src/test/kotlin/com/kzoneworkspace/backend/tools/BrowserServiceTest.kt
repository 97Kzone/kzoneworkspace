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
        val content = browserService.navigateAndGetText(url)
        println("Fetched content from Google: ${content.take(100)}...")
        assertTrue(content.isNotEmpty(), "Content should not be empty")
        assertTrue(content.lowercase().contains("google"), "Content should contain 'google'")
    }
}
