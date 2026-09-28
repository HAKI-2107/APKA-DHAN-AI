package com.apkadhan.ai.core.crypto

/**
 * APKA DHAN AI - CRYPTO INTELLIGENCE REPOSITORIES (Android Clean Architecture)
 *
 * Implements:
 * - CryptoAssetRepository (Asset quotes & historical series)
 * - CryptoWatchlistRepository (User crypto watchlists)
 * - CryptoHoldingRepository (User crypto quantities - NEVER PRIVATE KEYS)
 * - CryptoPortfolioRepository (Portfolio valuation, allocations, risk indicators)
 *
 * STRICT SECURITY CONSTITUTION:
 * - Never request or store: private keys, seed phrases, or exchange passwords.
 * - Do not execute trades.
 * - Risk indicators are analytical observations, NOT proof of fraud.
 */

data class UserCryptoHolding(
    val id: String,
    val symbol: String,
    val amount: Double,
    val averageBuyPriceUsd: Double,
    val storageType: String = "NON_CUSTODIAL"
)

data class CryptoRiskIndicator(
    val code: String,
    val name: String,
    val description: String,
    val disclaimer: String = "Risk observation only — NOT proof of fraud or illicit activity."
)

data class CryptoPortfolioSummary(
    val totalCurrentValueUsd: Double,
    val totalCurrentValueInr: Double,
    val totalInvestedValueUsd: Double,
    val totalUnrealizedGainLossUsd: Double,
    val holdingsCount: Int,
    val riskIndicators: List<CryptoRiskIndicator>
)

class CryptoAssetRepository(private val provider: CryptoDataProvider = MockCryptoDataProvider()) {
    suspend fun getAsset(symbolOrId: String): CryptoAsset? = provider.getAsset(symbolOrId)
    suspend fun getAssets(symbols: List<String>): Map<String, CryptoAsset> = provider.getAssets(symbols)
    suspend fun search(query: String): List<CryptoSearchResult> = provider.searchAssets(query)
}

class CryptoHoldingRepository {
    private val holdings = mutableMapOf(
        "ch1" to UserCryptoHolding("ch1", "BTC", 0.018, 58000.0, "HARDWARE"),
        "ch2" to UserCryptoHolding("ch2", "ETH", 0.25, 3100.0, "NON_CUSTODIAL")
    )

    fun getAll(): List<UserCryptoHolding> = holdings.values.toList()

    fun addHolding(holding: UserCryptoHolding) {
        holdings[holding.id] = holding
    }

    fun removeHolding(id: String) {
        holdings.remove(id)
    }
}

class CryptoPortfolioRepository(
    private val holdingRepo: CryptoHoldingRepository,
    private val assetRepo: CryptoAssetRepository
) {
    suspend fun calculateSummary(): CryptoPortfolioSummary {
        val userHoldings = holdingRepo.getAll()
        val quotes = assetRepo.getAssets(userHoldings.map { it.symbol })

        var totalUsd = 0.0
        var totalInvUsd = 0.0

        for (h in userHoldings) {
            val q = quotes[h.symbol]
            val price = q?.priceUsd ?: h.averageBuyPriceUsd
            totalUsd += h.amount * price
            totalInvUsd += h.amount * h.averageBuyPriceUsd
        }

        val riskIndicators = mutableListOf<CryptoRiskIndicator>()
        if (userHoldings.isNotEmpty()) {
            riskIndicators.add(
                CryptoRiskIndicator(
                    code = "HIGH_VOLATILITY",
                    name = "Asset Volatility Observation",
                    description = "Cryptocurrency markets exhibit elevated price fluctuations compared to traditional equity indexes."
                )
            )
        }

        return CryptoPortfolioSummary(
            totalCurrentValueUsd = totalUsd,
            totalCurrentValueInr = totalUsd * 85.5,
            totalInvestedValueUsd = totalInvUsd,
            totalUnrealizedGainLossUsd = totalUsd - totalInvUsd,
            holdingsCount = userHoldings.size,
            riskIndicators = riskIndicators
        )
    }

    fun executeTrade(): Nothing {
        throw IllegalStateException("Trade execution is strictly prohibited. Apka Dhan AI is a non-custodial intelligence monitor.")
    }
}
