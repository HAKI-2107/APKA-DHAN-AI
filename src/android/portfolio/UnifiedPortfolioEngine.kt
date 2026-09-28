package com.apkadhan.ai.core.portfolio

/**
 * APKA DHAN AI - UNIFIED PORTFOLIO ENGINE (Android Clean Architecture)
 *
 * Multi-asset portfolio aggregation across:
 * - Stocks
 * - Mutual Funds
 * - ETFs
 * - Crypto
 *
 * CONSTITUTIONAL DIRECTIVE:
 * - Descriptive risk signals: "High concentration detected" rather than "Sell this asset."
 * - Explainable calculations with transparent formulas.
 * - Zero personalized financial advice or trade directives.
 */

enum class AssetClass {
    STOCKS,
    MUTUAL_FUNDS,
    ETFS,
    CRYPTO
}

data class UnifiedAssetHolding(
    val id: String,
    val symbolOrIdentifier: String,
    val name: String,
    val assetClass: AssetClass,
    val subCategory: String,
    val quantity: Double,
    val averageBuyPrice: Double,
    val currentPrice: Double,
    val currency: String = "INR"
)

data class EnrichedAssetPosition(
    val holding: UnifiedAssetHolding,
    val investedAmount: Double,
    val currentValue: Double,
    val unrealizedPnL: Double,
    val percentageReturn: Double,
    val portfolioWeightPercent: Double
)

data class AssetClassExposure(
    val assetClass: AssetClass,
    val currentValue: Double,
    val investedAmount: Double,
    val percentage: Double,
    val unrealizedPnL: Double,
    val percentageReturn: Double
)

data class ConcentrationMetrics(
    val topAssetSymbol: String,
    val topAssetPercentage: Double,
    val top3AssetsPercentage: Double,
    val herfindahlIndex: Int,
    val concentrationLevel: String
)

data class PortfolioRiskSignal(
    val code: String,
    val name: String,
    val severity: String,
    val descriptiveObservation: String,
    val explanationMath: String,
    val statutoryDisclaimer: String = "Analytical risk observation only. Does NOT constitute personalized financial advice."
)

data class ExplainableCalculation(
    val metricName: String,
    val formula: String,
    val stepByStep: List<String>,
    val finalFormattedValue: String
)

data class UnifiedPortfolioAssessment(
    val totalInvestedAmount: Double,
    val totalCurrentValue: Double,
    val totalUnrealizedPnL: Double,
    val totalPercentageReturn: Double,
    val positions: List<EnrichedAssetPosition>,
    val assetClassExposures: List<AssetClassExposure>,
    val concentration: ConcentrationMetrics,
    val riskSignals: List<PortfolioRiskSignal>,
    val explainableCalculations: List<ExplainableCalculation>,
    val statutoryNotice: String = "Apka Dhan AI strictly NEVER produces personalized financial advice or buy/sell instructions."
)

class UnifiedPortfolioEngine(private val holdings: MutableList<UnifiedAssetHolding> = mutableListOf()) {

    fun calculateAssessment(): UnifiedPortfolioAssessment {
        var totalInvested = 0.0
        var totalCurrent = 0.0

        val rawPositions = holdings.map { h ->
            val invested = h.quantity * h.averageBuyPrice
            val current = h.quantity * h.currentPrice
            val pnl = current - invested
            val ret = if (invested > 0) (pnl / invested) * 100.0 else 0.0

            totalInvested += invested
            totalCurrent += current

            Pair(h, Triple(invested, current, Pair(pnl, ret)))
        }

        val totalPnL = totalCurrent - totalInvested
        val totalPctReturn = if (totalInvested > 0) (totalPnL / totalInvested) * 100.0 else 0.0

        val positions = rawPositions.map { (h, data) ->
            val weight = if (totalCurrent > 0) (data.second / totalCurrent) * 100.0 else 0.0
            EnrichedAssetPosition(
                holding = h,
                investedAmount = data.first,
                currentValue = data.second,
                unrealizedPnL = data.third.first,
                percentageReturn = data.third.second,
                portfolioWeightPercent = weight
            )
        }.sortedByDescending { it.currentValue }

        // Asset Class Breakdown
        val classMap = mutableMapOf<AssetClass, Pair<Double, Double>>()
        for (p in positions) {
            val cur = classMap.getOrDefault(p.holding.assetClass, Pair(0.0, 0.0))
            classMap[p.holding.assetClass] = Pair(cur.first + p.currentValue, cur.second + p.investedAmount)
        }

        val exposures = classMap.map { (ac, vals) ->
            val pct = if (totalCurrent > 0) (vals.first / totalCurrent) * 100.0 else 0.0
            val pnl = vals.first - vals.second
            val ret = if (vals.second > 0) (pnl / vals.second) * 100.0 else 0.0
            AssetClassExposure(ac, vals.first, vals.second, pct, pnl, ret)
        }

        // Concentration calculation
        val topPos = positions.firstOrNull()
        val top3Pct = positions.take(3).sumOf { it.portfolioWeightPercent }
        val hhi = positions.sumOf { Math.pow(it.portfolioWeightPercent, 2.0) }.toInt()

        val concentrationLevel = when {
            hhi > 2500 || (topPos?.portfolioWeightPercent ?: 0.0) > 35.0 -> "HIGH"
            hhi > 1800 || (topPos?.portfolioWeightPercent ?: 0.0) > 25.0 -> "MODERATE"
            else -> "LOW"
        }

        val concentration = ConcentrationMetrics(
            topAssetSymbol = topPos?.holding?.symbolOrIdentifier ?: "",
            topAssetPercentage = topPos?.portfolioWeightPercent ?: 0.0,
            top3AssetsPercentage = top3Pct,
            herfindahlIndex = hhi,
            concentrationLevel = concentrationLevel
        )

        // Risk signals (Descriptive only - zero buy/sell directives)
        val riskSignals = mutableListOf<PortfolioRiskSignal>()
        if (topPos != null && topPos.portfolioWeightPercent >= 25.0) {
            riskSignals.add(
                PortfolioRiskSignal(
                    code = "HIGH_SINGLE_ASSET_CONCENTRATION",
                    name = "Single Asset Concentration Detected",
                    severity = "HIGH",
                    descriptiveObservation = "High concentration detected: ${topPos.holding.name} represents ${String.format("%.1f", topPos.portfolioWeightPercent)}% of total portfolio value.",
                    explanationMath = "Formula: (Current Value / Total Value) * 100 = ${topPos.portfolioWeightPercent}%, exceeding the 25% single-asset boundary."
                )
            )
        }

        val explainables = listOf(
            ExplainableCalculation(
                metricName = "Total Current Value",
                formula = "Sum(Quantity * Price)",
                stepByStep = positions.map { "${it.holding.symbolOrIdentifier}: ₹${it.currentValue}" },
                finalFormattedValue = "₹$totalCurrent"
            ),
            ExplainableCalculation(
                metricName = "Total Unrealized PnL",
                formula = "Current Value - Invested Value",
                stepByStep = listOf("₹$totalCurrent - ₹$totalInvested = ₹$totalPnL"),
                finalFormattedValue = "₹$totalPnL"
            )
        )

        return UnifiedPortfolioAssessment(
            totalInvestedAmount = totalInvested,
            totalCurrentValue = totalCurrent,
            totalUnrealizedPnL = totalPnL,
            totalPercentageReturn = totalPctReturn,
            positions = positions,
            assetClassExposures = exposures,
            concentration = concentration,
            riskSignals = riskSignals,
            explainableCalculations = explainables
        )
    }
}
