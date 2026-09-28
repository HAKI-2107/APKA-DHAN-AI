package com.apkadhan.ai.core.crypto

import kotlinx.coroutines.runBlocking
import org.junit.Assert.*
import org.junit.Test

/**
 * ANDROID UNIT TESTS - CRYPTO INTELLIGENCE
 */
class CryptoIntelligenceTest {

    private val provider = MockCryptoDataProvider()
    private val assetRepo = CryptoAssetRepository(provider)
    private val holdingRepo = CryptoHoldingRepository()
    private val portfolioRepo = CryptoPortfolioRepository(holdingRepo, assetRepo)

    @Test
    fun testCryptoDataProvider_FetchesAsset() = runBlocking {
        val btc = provider.getAsset("BTC")
        assertNotNull(btc)
        assertEquals("BTC", btc?.symbol)
        assertTrue((btc?.priceUsd ?: 0.0) > 10000.0)
        assertTrue(btc?.isMockFeed ?: false)
    }

    @Test
    fun testPortfolioSummary_CalculatesValues() = runBlocking {
        val summary = portfolioRepo.calculateSummary()
        assertTrue(summary.totalCurrentValueUsd > 0)
        assertTrue(summary.totalCurrentValueInr > 0)
        assertTrue(summary.holdingsCount >= 2)
    }

    @Test
    fun testTradeExecution_IsStrictlyProhibited() {
        try {
            portfolioRepo.executeTrade()
            fail("Expected exception on trade execution")
        } catch (e: IllegalStateException) {
            assertTrue(e.message?.contains("Trade execution is strictly prohibited") ?: false)
        }
    }
}
