package com.apkadhan.ai.core.portfolio

import org.junit.Assert.*
import org.junit.Test

/**
 * ANDROID UNIT TESTS - UNIFIED PORTFOLIO ENGINE
 */
class UnifiedPortfolioTest {

    @Test
    fun testUnifiedPortfolioCalculations_MultiAsset() {
        val holdings = mutableListOf(
            UnifiedAssetHolding("s1", "RELIANCE.NS", "Reliance", AssetClass.STOCKS, "Energy", 10.0, 2000.0, 3000.0),
            UnifiedAssetHolding("m1", "PPFC", "Parag Parikh", AssetClass.MUTUAL_FUNDS, "Equity MF", 100.0, 50.0, 70.0),
            UnifiedAssetHolding("e1", "GOLDBEES", "Gold BeES", AssetClass.ETFS, "Gold", 50.0, 50.0, 60.0),
            UnifiedAssetHolding("c1", "BTC", "Bitcoin", AssetClass.CRYPTO, "Crypto", 0.01, 4000000.0, 5000000.0)
        )

        val engine = UnifiedPortfolioEngine(holdings)
        val result = engine.calculateAssessment()

        assertTrue(result.totalInvestedAmount > 0)
        assertTrue(result.totalCurrentValue > result.totalInvestedAmount)
        assertTrue(result.totalUnrealizedPnL > 0)
        assertEquals(4, result.assetClassExposures.size)
    }

    @Test
    fun testHighConcentration_ProducesDescriptiveSignalNotSellAdvice() {
        val holdings = mutableListOf(
            UnifiedAssetHolding("s1", "HEAVY_STOCK", "Heavy Corp", AssetClass.STOCKS, "Energy", 100.0, 1000.0, 1000.0), // 100,000 (80%)
            UnifiedAssetHolding("e1", "GOLD", "Gold", AssetClass.ETFS, "Commodity", 25.0, 1000.0, 1000.0) // 25,000 (20%)
        )

        val engine = UnifiedPortfolioEngine(holdings)
        val result = engine.calculateAssessment()

        assertEquals("HIGH", result.concentration.concentrationLevel)
        val signal = result.riskSignals.find { it.code == "HIGH_SINGLE_ASSET_CONCENTRATION" }
        assertNotNull(signal)
        assertTrue(signal?.descriptiveObservation?.contains("High concentration detected") ?: false)
        assertFalse(signal?.descriptiveObservation?.contains("Sell this asset") ?: false)
    }
}
