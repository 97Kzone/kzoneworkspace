package com.kzoneworkspace.backend.tools

import com.microsoft.playwright.Browser
import com.microsoft.playwright.BrowserType
import com.microsoft.playwright.Page
import com.microsoft.playwright.Playwright
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import jakarta.annotation.PostConstruct
import jakarta.annotation.PreDestroy
import java.util.concurrent.ConcurrentHashMap

@Service
class BrowserService {
    private val logger = LoggerFactory.getLogger(BrowserService::class.java)
    private lateinit var playwright: Playwright
    private lateinit var browser: Browser
    
    // 세션별 페이지 관리 (RoomId -> Page)
    private val pageMap = ConcurrentHashMap<String, Page>()

    @PostConstruct
    fun init() {
        try {
            logger.info("Initializing Playwright and Chromium...")
            playwright = Playwright.create()
            browser = playwright.chromium().launch(BrowserType.LaunchOptions().setHeadless(true))
            logger.info("Playwright initialized successfully.")
        } catch (e: Exception) {
            logger.error("Failed to initialize Playwright: ${e.message}")
        }
    }

    data class BrowseResult(val url: String, val content: String, val base64Screenshot: String?)

    private fun getOrCreatePage(sessionId: String): Page {
        return pageMap.getOrPut(sessionId) {
            logger.info("Creating new browser session for: $sessionId")
            browser.newPage()
        }
    }

    fun navigateAndGetScreenshotWithText(sessionId: String, url: String): BrowseResult {
        return try {
            val page = getOrCreatePage(sessionId)
            page.navigate(url)
            page.waitForLoadState()
            
            val content = page.innerText("body")
            val screenshotBytes = page.screenshot()
            val base64Screenshot = java.util.Base64.getEncoder().encodeToString(screenshotBytes)
            
            BrowseResult(page.url(), content, "data:image/png;base64,$base64Screenshot")
        } catch (e: Exception) {
            BrowseResult(url, "Error navigating to $url: ${e.message}", null)
        }
    }

    fun navigate(sessionId: String, url: String): BrowseResult {
        return navigateAndGetScreenshotWithText(sessionId, url)
    }

    fun click(sessionId: String, selector: String): BrowseResult {
        return try {
            val page = getOrCreatePage(sessionId)
            page.click(selector)
            page.waitForLoadState()
            
            val content = page.innerText("body")
            val screenshotBytes = page.screenshot()
            val base64Screenshot = java.util.Base64.getEncoder().encodeToString(screenshotBytes)
            
            BrowseResult(page.url(), content, "data:image/png;base64,$base64Screenshot")
        } catch (e: Exception) {
            BrowseResult("", "Error clicking $selector: ${e.message}", null)
        }
    }

    fun type(sessionId: String, selector: String, text: String): BrowseResult {
        return try {
            val page = getOrCreatePage(sessionId)
            page.fill(selector, text)
            page.waitForLoadState()
            
            val content = page.innerText("body")
            val screenshotBytes = page.screenshot()
            val base64Screenshot = java.util.Base64.getEncoder().encodeToString(screenshotBytes)
            
            BrowseResult(page.url(), content, "data:image/png;base64,$base64Screenshot")
        } catch (e: Exception) {
            BrowseResult("", "Error typing into $selector: ${e.message}", null)
        }
    }

    fun pressEnter(sessionId: String, selector: String): BrowseResult {
        return try {
            val page = getOrCreatePage(sessionId)
            page.press(selector, "Enter")
            page.waitForLoadState()
            
            val content = page.innerText("body")
            val screenshotBytes = page.screenshot()
            val base64Screenshot = java.util.Base64.getEncoder().encodeToString(screenshotBytes)
            
            BrowseResult(page.url(), content, "data:image/png;base64,$base64Screenshot")
        } catch (e: Exception) {
            BrowseResult("", "Error pressing Enter on $selector: ${e.message}", null)
        }
    }

    fun closeSession(sessionId: String) {
        pageMap.remove(sessionId)?.close()
        logger.info("Closed browser session for: $sessionId")
    }

    @PreDestroy
    fun cleanup() {
        pageMap.values.forEach { it.close() }
        pageMap.clear()
        if (::browser.isInitialized) browser.close()
        if (::playwright.isInitialized) playwright.close()
    }
}
