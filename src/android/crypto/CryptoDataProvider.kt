package com.apkadhan.ai.core.crypto

/**
 * APKA DHAN AI - CRYPTO DATA PROVIDER CONTRACT (Android Clean Architecture)
 *
 * Interface abstraction for crypto market data feeds (CoinGecko / Binance ready).
 * INVARIANT: Never fabricates live feeds; explicit offline synthetic metadata.
 */

data class CryptoAsset(
    val id: String,
    val symbol: String,
    val name: String,
    val priceUsd: Double,
    val priceInr: Double,
    val change24hPercent: Double,
    val high24hUsd: Double,
    val low24hUsd: Double,
    val marketCapUsd: Double? = null,
    val volume24hUsd: Double? = null,
    val marketCapRank: Int = 1,
    val volatility: String = "MODERATE",
    val volatility30dPercent: Double = 40.0,
    val isMockFeed: Boolean = true
)

data class CryptoHistoricalPoint(
    val timestampEpochMs: Long,
    val dateStr: String,
    val priceUsd: Double,
    val volumeUsd: Double
)

data class CryptoSearchResult(
    val id: String,
    val symbol: String,
    val name: String,
    val marketCapRank: Int,
    val priceUsd: Double,
    val change24hPercent: Double
)

interface CryptoDataProvider {
    val providerName: String
    val isLiveFeed: Boolean

    suspend fun getAsset(symbolOrId: String): CryptoAsset?
    suspend fun getAssets(symbolsOrIds: List<String>): Map<String, CryptoAsset>
    suspend fun searchAssets(query: String): List<CryptoSearchResult>
    suspend fun getHistoricalData(symbolOrId: String, range: String): List<CryptoHistoricalPoint>
}

class MockCryptoDataProvider : CryptoDataProvider {
    override val providerName = "MockCryptoDataProvider (Synthetic Clean Architecture Feed)"
    override val isLiveFeed = false

    private val universe = mapOf(
        "BTC" to CryptoAsset("bitcoin", "BTC", "Bitcoin", 64200.0, 5489100.0, 2.45, 65100.0, 63400.0, 1265000000000.0, 28500000000.0, 1, "MODERATE", 42.5),
        "ETH" to CryptoAsset("ethereum", "ETH", "Ethereum", 3450.0, 294975.0, 1.80, 3520.0, 3380.0, 415000000000.0, 14200000000.0, 2, "MODERATE", 48.2),
        "SOL" to CryptoAsset("solana", "SOL", "Solana", 148.5, 12696.75, 5.20, 153.0, 142.0, 69200000000.0, 3800000000.0, 5, "HIGH", 68.4)
    )

    override suspend fun getAsset(symbolOrId: String): CryptoAsset? = universe[symbolOrId.uppercase()]

    override suspend fun getAssets(symbolsOrIds: List<String>): Map<String, CryptoAsset> {
        return symbolsOrIds.mapNotNull { sym -> universe[sym.uppercase()]?.let { sym.uppercase() to it } }.toMap()
    }

    override suspend fun searchAssets(query: String): List<CryptoSearchResult> {
        val q = query.lowercase()
        return universe.values
            .filter { it.symbol.lowercase().contains(q) || it.name.lowercase().contains(q) }
            .map { CryptoSearchResult(it.id, it.symbol, it.name, it.marketCapRank, it.priceUsd, it.change24hPercent) }
    }

    override suspend fun getHistoricalData(symbolOrId: String, range: String): List<CryptoHistoricalPoint> {
        val base = universe[symbolOrId.uppercase()]?.priceUsd ?: 1000.0
        val now = System.currentTimeMillis()
        return (0..20).map { i ->
            val ts = now - (20 - i) * 86400000L
            val p = base * (0.92 + (i * 0.007))
            CryptoHistoricalPoint(ts, "2026-09-${i + 1}", p, 1000000000.0)
        }
    }
}
