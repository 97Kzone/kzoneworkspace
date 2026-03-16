package com.kzoneworkspace.backend.tools

import com.microsoft.playwright.Browser
import com.microsoft.playwright.BrowserType
import com.microsoft.playwright.Playwright
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import javax.annotation.PostConstruct
import javax.annotation.PreDestroy

@Service
class BrowserService {
    private val logger = LoggerFactory.getLogger(BrowserService::class.java)
    private lateinit var playwright: Playwright
    private lateinit var browser: Browser

    @PostConstruct
    fun init() {
        try {
            logger.info("Initializing Playwright and Chromium...")
            playwright = Playwright.create()
            browser = playwright.chromium().launch(BrowserType.LaunchOptions().setHeadless(true))
            logger.info("Playwright initialized successfully.")
        } catch (e: Exception) {
            logger.error("Failed to initialize Playwright: ${e.message}")
            // 에러 발생 시 런타임에 문제를 파악할 수 있도록 로깅 강화
        }
    }

    data class BrowseResult(val content: String, val base64Screenshot: String?)

    fun navigateAndGetScreenshotWithText(url: String): BrowseResult {
        return try {
            val context = browser.newContext()
            val page = context.newPage()
            page.navigate(url)
            page.waitForLoadState()
            
            // Get content
            val content = page.innerText("body")
            
            // Get screenshot and encode to Base64
            val screenshotBytes = page.screenshot()
            val base64Screenshot = java.util.Base64.getEncoder().encodeToString(screenshotBytes)
            
            context.close()
            BrowseResult(content, "data:image/png;base64,$base64Screenshot")
        } catch (e: Exception) {
            BrowseResult("Error navigating to $url: ${e.message}", null)
        }
    }

    fun navigateAndGetText(url: String): String {
        return try {
            val context = browser.newContext()
            val page = context.newPage()
            page.navigate(url)
            page.waitForLoadState()
            
            val content = page.innerText("body")
            
            context.close()
            content
        } catch (e: Exception) {
            "Error navigating to $url: ${e.message}"
        }
    }

    fun getScreenshot(url: String): ByteArray? {
        return try {
            val context = browser.newContext()
            val page = context.newPage()
            page.navigate(url)
            page.waitForLoadState()
            
            val screenshot = page.screenshot()
            
            context.close()
            screenshot
        } catch (e: Exception) {
            null
        }
    }

    @PreDestroy
    fun cleanup() {
        if (::browser.isInitialized) browser.close()
        if (::playwright.isInitialized) playwright.close()
    }
}
