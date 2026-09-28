package com.apkadhan.ai.core.stock

import kotlinx.coroutines.runBlocking
import org.junit.Assert.*
import org.junit.Test

/**
 * ANDROID UNIT TESTS - STOCK INTELLIGENCE
 */
class StockIntelligenceTest {

    private val provider = MockMarketDataProvider()
    private val stockRepo = StockRepository(provider)
    private val holdingRepo = HoldingRepository()
    private val portfolioRepo = PortfolioRepository(holdingRepo, stockRepo)

    @Test
    fun testMarketDataProvider_FetchesQuote() = runBlocking {
        val quote = provider.getQuote("RELIANCE.NS")
        assertNotNull(quote)
        assertEquals("RELIANCE.NS", quote?.symbol)
        assertTrue((quote?.currentPrice ?: 0.0) > 0)
        assertTrue(quote?.isMockData ?: false)
    }

    @Test
    fun testPortfolioRepository_CalculatesGains() = runBlocking {
        val summary = portfolioRepo.calculateSummary()
        assertTrue(summary.totalCurrentValue > 0)
        assertTrue(summary.totalInvestedValue > 0)
        assertTrue(summary.holdingsCount >= 2)
    }

    @Test
    fun testConstitutionalInvariant_ZeroBuySellAdvice() {
        val disclaimer = portfolioRepo.getAnalysisDisclaimer()
        assertTrue(disclaimer.contains("NEVER produces automated buy or sell recommendations"))
    }
}
