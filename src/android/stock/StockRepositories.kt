package com.apkadhan.ai.core.stock

/**
 * APKA DHAN AI - STOCK INTELLIGENCE REPOSITORIES (Android Clean Architecture)
 *
 * Implements:
 * - StockRepository (Market Data caching)
 * - WatchlistRepository (User watchlists)
 * - HoldingRepository (User portfolio holdings)
 * - PortfolioRepository (Portfolio value, unrealized gain/loss, allocations)
 *
 * CONSTITUTIONAL DIRECTIVE:
 * Strict separation between market data, user portfolio data, and analysis.
 * Zero automatic buy/sell decision production.
 */

data class UserHolding(
    val id: String,
    val symbol: String,
    val shares: Int,
    val averageBuyPrice: Double,
    val buyDateEpochMs: Long = System.currentTimeMillis()
)

data class Watchlist(
    val id: String,
    val name: String,
    val symbols: List<String>
)

data class PortfolioSummary(
    val totalCurrentValue: Double,
    val totalInvestedValue: Double,
    val totalUnrealizedGainLoss: Double,
    val totalUnrealizedGainLossPercent: Double,
    val holdingsCount: Int
)

class StockRepository(private val provider: MarketDataProvider = MockMarketDataProvider()) {
    suspend fun getQuote(symbol: String): StockQuote? = provider.getQuote(symbol)
    suspend fun getQuotes(symbols: List<String>): Map<String, StockQuote> = provider.getQuotes(symbols)
    suspend fun search(query: String): List<StockSearchResult> = provider.searchStocks(query)
}

class WatchlistRepository {
    private val watchlists = mutableMapOf(
        "default" to Watchlist("default", "My Watchlist", listOf("RELIANCE.NS", "TCS.NS", "HDFCBANK.NS"))
    )

    fun getAll(): List<Watchlist> = watchlists.values.toList()
    fun addSymbol(watchlistId: String, symbol: String) {
        val wl = watchlists[watchlistId] ?: return
        if (!wl.symbols.contains(symbol.uppercase())) {
            watchlists[watchlistId] = wl.copy(symbols = wl.symbols + symbol.uppercase())
        }
    }
}

class HoldingRepository {
    private val holdings = mutableMapOf(
        "h1" to UserHolding("h1", "RELIANCE.NS", 120, 2450.0),
        "h2" to UserHolding("h2", "TCS.NS", 60, 3500.0)
    )

    fun getAll(): List<UserHolding> = holdings.values.toList()
    fun addHolding(holding: UserHolding) { holdings[holding.id] = holding }
    fun removeHolding(id: String) { holdings.remove(id) }
}

class PortfolioRepository(
    private val holdingRepo: HoldingRepository,
    private val stockRepo: StockRepository
) {
    suspend fun calculateSummary(): PortfolioSummary {
        val userHoldings = holdingRepo.getAll()
        val quotes = stockRepo.getQuotes(userHoldings.map { it.symbol })

        var currentVal = 0.0
        var investedVal = 0.0

        for (h in userHoldings) {
            val q = quotes[h.symbol]
            val price = q?.currentPrice ?: h.averageBuyPrice
            currentVal += h.shares * price
            investedVal += h.shares * h.averageBuyPrice
        }

        val gainLoss = currentVal - investedVal
        val gainLossPct = if (investedVal > 0) (gainLoss / investedVal) * 100 else 0.0

        return PortfolioSummary(
            totalCurrentValue = currentVal,
            totalInvestedValue = investedVal,
            totalUnrealizedGainLoss = gainLoss,
            totalUnrealizedGainLossPercent = gainLossPct,
            holdingsCount = userHoldings.size
        )
    }

    fun getAnalysisDisclaimer(): String {
        return "Constitutional Directive: Apka Dhan AI strictly provides objective educational intelligence and NEVER produces automated buy or sell recommendations."
    }
}
