package com.apkadhan.ai.core.model

enum class RiskLevel(val label: String) {
    LOW_RISK("LOW RISK"),
    MEDIUM_RISK("MEDIUM RISK"),
    HIGH_RISK("HIGH RISK"),
    UNKNOWN_UNVERIFIED("UNKNOWN / UNVERIFIED")
}

enum class ProvenanceSource(val tag: String, val description: String) {
    CONFIRMED("[CONFIRMED]", "Confirmed by user or cryptographic verification"),
    EXTERNAL_DATA("[EXTERNAL_DATA]", "Official regulatory registry (RBI/SEBI/NPCI)"),
    MODEL_PREDICTION("[MODEL_PREDICTION]", "Evaluated via AI semantic reasoning"),
    RULE_SIGNAL("[RULE_SIGNAL]", "Triggered by deterministic syntax or security rule"),
    USER_REPORT("[USER_REPORT]", "Reported by community users (unverified)"),
    UNKNOWN("[UNKNOWN]", "Information unverified or absent")
}

data class EvidenceSignal(
    val id: String,
    val title: String,
    val description: String,
    val source: ProvenanceSource,
    val isRedFlag: Boolean
)

data class RiskDossier(
    val identifier: String,
    val riskLevel: RiskLevel,
    val evidence: List<String>,
    val explanation: String,
    val source: String,
    val confidence: String,
    val recommendedSteps: List<String>,
    val timestamp: Long = System.currentTimeMillis()
)

data class SecurityAlertItem(
    val id: String,
    val category: AlertCategory,
    val title: String,
    val severity: RiskLevel,
    val timeAgo: String,
    val source: String,
    val summary: String,
    val evidence: List<String>,
    val recommendedSteps: List<String>
)

enum class AlertCategory(val displayName: String) {
    PAYMENT_RISK("Payment Risk"),
    INVESTMENT_SCAM("Investment Scam"),
    PORTFOLIO_ALERT("Portfolio Alert"),
    CRYPTO_ALERT("Crypto Alert"),
    SECURITY_ALERT("Security Alert")
}

data class StockHolding(
    val symbol: String,
    val name: String,
    val shares: Double,
    val avgPrice: Double,
    val currentPrice: Double,
    val peRatio: Double,
    val debtToEquity: Double,
    val promoterPledgePercentage: Double,
    val isAsmGsmSurveillance: Boolean,
    val riskAlert: String?
)

data class CryptoHolding(
    val symbol: String,
    val name: String,
    val balance: Double,
    val currentPriceUsd: Double,
    val change24h: Double,
    val volatility: String,
    val marketCapRank: Int,
    val honeypotRisk: Boolean,
    val unverifiedCreator: Boolean,
    val riskSignals: List<String>
)
