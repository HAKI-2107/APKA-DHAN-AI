package com.apkadhan.ai.core.stock

/**
 * APKA DHAN AI - MARKET DATA PROVIDER CONTRACT (Android Clean Architecture)
 *
 * Interface abstraction for market data feeds. Ready for production exchange integrations.
 * INVARIANT: Never invents live market feeds.
 */

data class StockQuote(
    val symbol: String,
    val name: String,
    val exchange: String = "NSE",
    val currentPrice: Double,
    val previousClose: Double,
    val dayChange: Double,
    val dayChangePercent: Double,
    val dayHigh: Double,
    val dayLow: Double,
    val fiftyTwoWeekHigh: Double,
    val fiftyTwoWeekLow: Double,
    val volume: Long,
    val currency: String = "INR",
    val isMockData: Boolean = true
)

data class HistoricalPricePoint(
    val timestampEpochMs: Long,
    val dateStr: String,
    val open: Double,
    val high: Double,
    val low: Double,
    val close: Double,
    val volume: Long
)

data class StockSearchResult(
    val symbol: String,
    val name: String,
    val exchange: String = "NSE",
    val sector: String,
    val currentPrice: Double
)

interface MarketDataProvider {
    val providerName: String
    val isLiveFeed: Boolean

    suspend fun getQuote(symbol: String): StockQuote?
    suspend fun getQuotes(symbols: List<String>): Map<String, StockQuote>
    suspend fun getHistoricalData(symbol: String, range: String): List<HistoricalPricePoint>
    suspend fun searchStocks(query: String): List<StockSearchResult>
}

class MockMarketDataProvider : MarketDataProvider {
    override val providerName = "MockMarketDataProvider (Synthetic Clean Architecture Feed)"
    override val isLiveFeed = false

    private val universe = mapOf(
        "RELIANCE.NS" to StockQuote("RELIANCE.NS", "Reliance Industries Limited", "NSE", 2980.50, 2940.00, 40.50, 1.38, 2995.00, 2930.00, 3217.90, 2220.30, 4500000L),
        "TCS.NS" to StockQuote("TCS.NS", "Tata Consultancy Services Limited", "NSE", 4210.00, 4180.00, 30.00, 0.72, 4230.00, 4165.00, 4585.00, 3313.00, 1800000L),
        "HDFCBANK.NS" to StockQuote("HDFCBANK.NS", "HDFC Bank Limited", "NSE", 1680.00, 1695.00, -15.00, -0.88, 1705.00, 1675.00, 1794.00, 1363.55, 8900000L),
        "VEDL.NS" to StockQuote("VEDL.NS", "Vedanta Limited", "NSE", 465.00, 458.00, 7.00, 1.53, 470.00, 455.00, 506.85, 207.85, 12000000L)
    )

    override suspend fun getQuote(symbol: String): StockQuote? {
        return universe[symbol.uppercase()]
    }

    override suspend fun getQuotes(symbols: List<String>): Map<String, StockQuote> {
        return symbols.mapNotNull { sym -> universe[sym.uppercase()]?.let { sym.uppercase() to it } }.toMap()
    }

    override suspend fun getHistoricalData(symbol: String, range: String): List<HistoricalPricePoint> {
        val base = universe[symbol.uppercase()]?.currentPrice ?: 1000.0
        val now = System.currentTimeMillis()
        return (0..20).map { i ->
            val ts = now - (20 - i) * 86400000L
            val close = base * (0.95 + (i * 0.005))
            HistoricalPricePoint(ts, "2026-09-${i + 1}", close * 0.99, close * 1.01, close * 0.98, close, 2000000L)
        }
    }

    override suspend fun searchStocks(query: String): List<StockSearchResult> {
        val q = query.lowercase()
        return universe.values
            .filter { it.symbol.lowercase().contains(q) || it.name.lowercase().contains(q) }
            .map { StockSearchResult(it.symbol, it.name, it.exchange, "Equity", it.currentPrice) }
    }
}
