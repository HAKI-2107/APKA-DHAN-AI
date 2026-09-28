package com.apkadhan.ai.core.repository

import com.apkadhan.ai.core.model.*
import kotlinx.coroutines.flow.Flow

interface PaymentSecurityRepository {
    suspend fun evaluateUpiRisk(rawInputOrUri: String): Result<RiskDossier>
    suspend fun evaluateLinkRisk(url: String): Result<RiskDossier>
    suspend fun evaluateQrPayload(payload: String): Result<RiskDossier>
    fun observeTransactionAnomalies(): Flow<List<TransactionAnomaly>>
}

interface ThreatIntelligenceRepository {
    fun observeActiveAlerts(): Flow<List<SecurityAlertItem>>
    suspend fun syncDeltaThreatBloomFilter(): Result<Boolean>
    suspend fun checkKnownThreat(identifierHash: String): ThreatIndicatorResult?
}

interface InvestmentIntelligenceRepository {
    suspend fun deconstructOffer(messageText: String): Result<RiskDossier>
    suspend fun verifySebiRegistration(registrationNo: String): Result<SebiVerificationResult>
    fun observePortfolioHealth(): Flow<PortfolioHealthOverview>
    fun observeStockUniverse(): Flow<List<StockHolding>>
    fun observeCryptoIntegrity(): Flow<List<CryptoHolding>>
}

interface UserReportRepository {
    suspend fun submitSanitizedReport(
        category: String,
        targetIdentifier: String,
        narrative: String,
        evidenceJson: String
    ): Result<String> // Returns incident receipt ID
    fun observeMyReports(): Flow<List<UserReportItem>>
}

interface SecurityVaultRepository {
    suspend fun getKeystoreStatus(): KeystoreSecurityStatus
    suspend fun purgeLocalData(): Result<Boolean>
    suspend fun setStrictPiiMasking(enabled: Boolean)
    suspend fun setBiometricLock(enabled: Boolean)
}

// Result Domain Primitives
data class ThreatIndicatorResult(
    val indicatorHash: String,
    val severity: RiskLevel,
    val category: String,
    val authority: String
)

data class SebiVerificationResult(
    val registrationNo: String,
    val entityName: String,
    val isValid: Boolean,
    val status: String,
    val knownClones: List<String>
)

data class PortfolioHealthOverview(
    val totalNetWorthInr: Double,
    val investedCapitalInr: Double,
    val unrealizedPnlInr: Double,
    val concentrationAlerts: List<String>
)

data class UserReportItem(
    val reportId: String,
    val category: String,
    val maskedTarget: String,
    val status: String,
    val timestampMs: Long
)

data class KeystoreSecurityStatus(
    val hasHardwareBackedKeystore: Boolean,
    val hasStrongBox: Boolean,
    val isSqlCipherActive: Boolean,
    val zeroKnowledgeMode: Boolean
)

data class TransactionAnomaly(
    val id: String,
    val payeeVpa: String,
    val payeeName: String?,
    val amount: Double,
    val anomalyReason: String,
    val timestampMs: Long
)
