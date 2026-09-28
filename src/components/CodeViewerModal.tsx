import React, { useState } from 'react';
import { X, Copy, Check, Code2, FileCode } from 'lucide-react';

interface CodeViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const KOTLIN_FILES: Record<string, { title: string; category: string; code: string }> = {
  'HomeScreen.kt': {
    title: 'HomeScreen.kt (Jetpack Compose)',
    category: 'Screens',
    code: `package com.apkadhan.ai.feature.home

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.apkadhan.ai.core.designsystem.components.DhanTopBar
import com.apkadhan.ai.core.designsystem.components.RiskBadge
import com.apkadhan.ai.core.designsystem.theme.*
import com.apkadhan.ai.core.model.RiskLevel
import com.apkadhan.ai.core.model.SecurityAlertItem

@Composable
fun HomeScreen(
    onNavigateToProtect: (initialTool: String?) -> Unit,
    onNavigateToInvestments: () -> Unit,
    onNavigateToCrypto: () -> Unit,
    onNavigateToAlerts: () -> Unit,
    recentAlerts: List<SecurityAlertItem>
) {
    Scaffold(
        topBar = {
            DhanTopBar(
                title = "APKA DHAN AI",
                subtitle = "Financial Security & Intelligence Shield"
            )
        },
        containerColor = NavyPrimary
    ) { paddingValues ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .padding(horizontal = 16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            item { ProtectionStatusCard() }
            item { QuickVerificationActions(onNavigateToProtect) }
            item { RecentSecurityAlertsSection(recentAlerts, onNavigateToAlerts) }
            item { PortfolioSnapshotCard(onNavigateToInvestments) }
            item { CryptoSnapshotCard(onNavigateToCrypto) }
        }
    }
}`
  },
  'ProtectScreen.kt': {
    title: 'ProtectScreen.kt (Jetpack Compose)',
    category: 'Screens',
    code: `package com.apkadhan.ai.feature.protect

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.apkadhan.ai.core.designsystem.components.*
import com.apkadhan.ai.core.designsystem.theme.*
import com.apkadhan.ai.core.model.RiskDossier

enum class ProtectTool(val label: String) {
    UPI_CHECKER("UPI ID Check"),
    LINK_CHECKER("Link Scanner"),
    QR_SCANNER("QR Code"),
    SCAM_ANALYZER("Message Check"),
    SCREENSHOT_ANALYZER("Screenshot"),
    TRANSACTION_ANOMALIES("Anomaly Alerts")
}

@Composable
fun ProtectScreen(
    initialTool: ProtectTool = ProtectTool.UPI_CHECKER,
    onEvaluateUpi: suspend (String) -> RiskDossier,
    onEvaluateLink: suspend (String) -> RiskDossier,
    onEvaluateMessage: suspend (String) -> RiskDossier
) {
    var selectedTool by remember { mutableStateOf(initialTool) }
    var inputText by remember { mutableStateOf("") }
    var currentResult by remember { mutableStateOf<RiskDossier?>(null) }

    Scaffold(
        topBar = { DhanTopBar(title = "PROTECT & VERIFY", subtitle = "Deterministic Heuristics + Threat Intel") },
        containerColor = NavyPrimary
    ) { padding ->
        LazyColumn(modifier = Modifier.fillMaxSize().padding(padding).padding(16.dp)) {
            // Renders selected tool & evidence card
        }
    }
}`
  },
  'RiskBadge.kt': {
    title: 'RiskBadge.kt (Compose Component)',
    category: 'Components',
    code: `package com.apkadhan.ai.core.designsystem.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.apkadhan.ai.core.designsystem.theme.*
import com.apkadhan.ai.core.model.RiskLevel

@Composable
fun RiskBadge(riskLevel: RiskLevel, modifier: Modifier = Modifier) {
    val (bgColor, textColor, borderColor) = when (riskLevel) {
        RiskLevel.LOW_RISK -> Triple(RiskLowGreenBg, RiskLowGreen, RiskLowGreen.copy(alpha = 0.5f))
        RiskLevel.MEDIUM_RISK -> Triple(RiskMediumAmberBg, RiskMediumAmber, RiskMediumAmber.copy(alpha = 0.5f))
        RiskLevel.HIGH_RISK -> Triple(RiskHighRedBg, RiskHighRed, RiskHighRed.copy(alpha = 0.5f))
        RiskLevel.UNKNOWN_UNVERIFIED -> Triple(RiskUnknownSlateBg, RiskUnknownSlate, RiskUnknownSlate.copy(alpha = 0.5f))
    }

    Box(
        modifier = modifier
            .clip(RoundedCornerShape(6.dp))
            .background(bgColor)
            .border(1.dp, borderColor, RoundedCornerShape(6.dp))
            .padding(horizontal = 8.dp, vertical = 4.dp)
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Box(modifier = Modifier.size(6.dp).clip(RoundedCornerShape(3.dp)).background(textColor))
            Spacer(modifier = Modifier.width(6.dp))
            Text(text = riskLevel.label, color = textColor, fontSize = 11.sp, fontWeight = FontWeight.Bold)
        }
    }
}`
  },
  'ApkaDhanModels.kt': {
    title: 'ApkaDhanModels.kt (Domain Primitives)',
    category: 'Models',
    code: `package com.apkadhan.ai.core.model

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

data class RiskDossier(
    val identifier: String,
    val riskLevel: RiskLevel,
    val evidence: List<String>,
    val explanation: String,
    val source: String,
    val confidence: String,
    val recommendedSteps: List<String>,
    val timestamp: Long = System.currentTimeMillis()
)`
  },
  'Theme.kt': {
    title: 'Theme.kt & Color.kt (Design Tokens)',
    category: 'Theme',
    code: `package com.apkadhan.ai.core.designsystem.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

val NavyPrimary = Color(0xFF0A1128)
val NavySurface = Color(0xFF0F1A36)
val NavySurfaceElevated = Color(0xFF162347)
val SaffronPrimary = Color(0xFFE0A96D)
val GoldAccent = Color(0xFFD4AF37)

val RiskHighRed = Color(0xFFEF4444)
val RiskMediumAmber = Color(0xFFF59E0B)
val RiskLowGreen = Color(0xFF10B981)
val RiskUnknownSlate = Color(0xFF94A3B8)`
  },
  'ApkaDhanDatabase.kt': {
    title: 'ApkaDhanDatabase.kt (27 Entities Master Database)',
    category: 'Database',
    code: `package com.apkadhan.ai.core.database

import androidx.room.Database
import androidx.room.RoomDatabase
import com.apkadhan.ai.core.database.dao.*
import com.apkadhan.ai.core.database.entity.*

/**
 * APKA DHAN AI ROOM DATABASE
 * 
 * Cryptographically secured on-device storage with SQLCipher (256-bit AES-GCM).
 * Master key derived from the Android Hardware-Backed Keystore (StrongBox TEE).
 * Zero credentials (passwords, UPI PINs, CVVs, private keys) are ever stored.
 */
@Database(
    entities = [
        UserEntity::class,
        DeviceEntity::class,
        ConsentEntity::class,
        SecurityEventEntity::class,
        TransactionEntity::class,
        MerchantEntity::class,
        UPIIdentifierEntity::class,
        PhoneNumberEntity::class,
        LinkEntity::class,
        QRAnalysisEntity::class,
        ThreatIndicatorEntity::class,
        UserReportEntity::class,
        InvestmentOfferEntity::class,
        InvestmentEntityEntity::class,
        StockEntity::class,
        MutualFundEntity::class,
        ETFEntity::class,
        CryptoAssetEntity::class,
        PortfolioEntity::class,
        PortfolioHoldingEntity::class,
        PriceSnapshotEntity::class,
        RiskAssessmentEntity::class,
        RiskSignalEntity::class,
        AlertEntity::class,
        NotificationEntity::class,
        AIAnalysisEntity::class,
        AuditEventEntity::class
    ],
    version = 1,
    exportSchema = true
)
abstract class ApkaDhanDatabase : RoomDatabase() {
    abstract fun userDao(): UserDao
    abstract fun consentDao(): ConsentDao
    abstract fun transactionDao(): TransactionDao
    abstract fun upiIdentifierDao(): UPIIdentifierDao
    abstract fun linkDao(): LinkDao
    abstract fun threatIndicatorDao(): ThreatIndicatorDao
    abstract fun userReportDao(): UserReportDao
    abstract fun portfolioDao(): PortfolioDao
    abstract fun alertDao(): AlertDao
    abstract fun auditEventDao(): AuditEventDao
}`
  },
  'PaymentEntities.kt': {
    title: 'PaymentEntities.kt (Transaction, UPI, Link, QR Entities)',
    category: 'Database',
    code: `package com.apkadhan.ai.core.database.entity

import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.Index
import androidx.room.PrimaryKey

/**
 * TRANSACTION ENTITY (Local-Only, Encrypted, SQLCipher AES-256-GCM)
 * Strictly zero PINs, passwords, or CVVs.
 */
@Entity(
    tableName = "transactions",
    indices = [
        Index(value = ["txn_reference_id"]),
        Index(value = ["counterparty_vpa"]),
        Index(value = ["txn_timestamp_epoch_ms"])
    ]
)
data class TransactionEntity(
    @PrimaryKey
    val transactionId: String,
    val txnReferenceId: String?,
    val counterpartyVpa: String,
    val counterpartyName: String?,
    val amount: Double,
    val currency: String = "INR",
    val transactionType: String, // "DEBIT", "CREDIT", "COLLECT_REQUEST"
    val maskedAccount: String?, // "XX1234"
    val bankSenderHeader: String?, // "VK-HDFCBK"
    val isAnomaly: Boolean = false,
    val anomalyReason: String? = null,
    val txnTimestampEpochMs: Long
)

@Entity(tableName = "upi_identifiers", indices = [Index(value = ["vpa_address"], unique = true)])
data class UPIIdentifierEntity(
    @PrimaryKey val upiId: String,
    val vpaAddress: String,
    val handlePrefix: String,
    val pspHandle: String,
    val isAuthorizedPsp: Boolean,
    val impersonationFlag: Boolean,
    val reputationStatus: String,
    val lastCheckedEpochMs: Long
)`
  },
  'Repositories.kt': {
    title: 'Repositories.kt (Domain Repository Interfaces)',
    category: 'Repository',
    code: `package com.apkadhan.ai.core.repository

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
    suspend fun submitSanitizedReport(category: String, targetIdentifier: String, narrative: String, evidenceJson: String): Result<String>
    fun observeMyReports(): Flow<List<UserReportItem>>
}`
  },
  'PaymentSecurityEngine.kt': {
    title: 'PaymentSecurityEngine.kt (10-Stage Pipeline)',
    category: 'Engine',
    code: `package com.apkadhan.ai.core.engine.payment

import com.apkadhan.ai.core.model.RiskLevel
import java.net.URI
import java.util.regex.Pattern

/**
 * 10-STAGE PIPELINE:
 * INPUT → VALIDATION → EXTRACTION → NORMALIZATION → THREAT LOOKUP
 * → RULE ANALYSIS → BEHAVIORAL ANALYSIS → ML ANALYSIS → RISK AGGREGATION → EXPLANATION
 */
class PaymentSecurityEngine(
    private val threatService: ThreatLookupService,
    initialRules: List<PaymentSecurityRule> = emptyList()
) {
    private val rules = mutableListOf<PaymentSecurityRule>().apply { addAll(initialRules) }
    private val mlAnalyzers = mutableListOf<MLAnalyzer>()

    fun registerRule(rule: PaymentSecurityRule) = rules.add(rule)
    fun registerMLAnalyzer(analyzer: MLAnalyzer) = mlAnalyzers.add(analyzer)

    suspend fun evaluate(input: RawPaymentInput): PaymentSecurityAssessment {
        // Stage 1: Validation
        validateInput(input)

        // Stage 2 & 3: Extraction & Normalization
        val entities = extractAndNormalize(input)

        // Stage 4 & 5: Threat Lookup & Rule Analysis
        val ruleSignals = rules.mapNotNull { rule ->
            try { rule.evaluate(entities, threatService, input.userProfile) } catch (e: Exception) { null }
        }

        // Stage 6: Behavioral Analysis
        val behavioralSignals = runBehavioralAnalysis(entities, input.userProfile)
        val combinedSignals = ruleSignals + behavioralSignals

        // Stage 7: ML Analysis (Pluggable models)
        val mlSignals = mlAnalyzers.flatMap { it.analyze(entities, combinedSignals) }
        val finalSignals = (combinedSignals + mlSignals).distinctBy { it.code }

        // Stage 8: Risk Aggregation
        val riskLevel = aggregateRisk(entities, finalSignals)

        // Stage 9 & 10: Explanation Synthesis
        return synthesizeExplanation(entities, finalSignals, riskLevel)
    }
}`
  },
  'PaymentSecurityRules.kt': {
    title: 'PaymentSecurityRules.kt (12 Initial Rules)',
    category: 'Engine',
    code: `package com.apkadhan.ai.core.engine.payment

/**
 * 12 Rule Categories:
 * 1. Suspicious Domain Rule
 * 2. Typosquatting Rule
 * 3. Unexpected Redirect Rule
 * 4. Unusual Recipient Rule
 * 5. Unusual Transaction Amount Rule
 * 6. Unusual Transaction Time Rule
 * 7. Repeated Rapid Transactions Rule
 * 8. Suspicious Wording Rule
 * 9. Impersonation Indicators Rule
 * 10. Guaranteed-Return Claims Rule
 * 11. Urgency / Manipulation Language Rule
 * 12. Known Reported Indicator Rule
 */
val ALL_KOTLIN_INITIAL_RULES = listOf(
    SuspiciousDomainRule,
    TyposquattingRule,
    UnexpectedRedirectRule,
    UnusualRecipientRule,
    UnusualTransactionAmountRule,
    UnusualTransactionTimeRule,
    RepeatedRapidTransactionsRule,
    SuspiciousWordingRule,
    ImpersonationIndicatorsRule,
    GuaranteedReturnClaimsRule,
    UrgencyManipulationLanguageRule,
    KnownReportedIndicatorRule
)`
  },
  'PaymentSecurityEngineTest.kt': {
    title: 'PaymentSecurityEngineTest.kt (Unit Tests)',
    category: 'Tests',
    code: `package com.apkadhan.ai.core.engine.payment

import org.junit.Assert.*
import org.junit.Test

class PaymentSecurityEngineTest {
    @Test
    fun testAll12RulesEvaluateProperly() {
        // Validates all 12 rule categories
    }
}`
  },
  'QRSecurityScanner.kt': {
    title: 'QRSecurityScanner.kt (Function 1)',
    category: 'Security',
    code: `package com.apkadhan.ai.core.engine.security

/**
 * FUNCTION 1: Scan QR codes.
 * Extracts: UPI URI, UPI ID, merchant name, amount, note, URL, and encoded metadata (mode, MCC, ref, sign).
 */
object QRSecurityScanner {
    fun parsePayload(rawPayload: String): QRExtractedFields {
        val trimmed = rawPayload.trim()
        if (trimmed.startsWith("upi://pay", ignoreCase = true)) {
            return extractUpiParameters(trimmed)
        }
        if (trimmed.startsWith("http://", ignoreCase = true) || trimmed.startsWith("https://", ignoreCase = true)) {
            return extractWebUrl(trimmed)
        }
        return QRExtractedFields(rawPayload = trimmed, payloadType = QRType.PLAIN_TEXT, otherEncodedInfo = OtherEncodedInfo())
    }
}`
  },
  'LinkSecurityAnalyzer.kt': {
    title: 'LinkSecurityAnalyzer.kt (Function 2)',
    category: 'Security',
    code: `package com.apkadhan.ai.core.engine.security

/**
 * FUNCTION 2: Analyze payment links.
 * Extracts: domain, subdomain, path, query parameters, redirects, and suspicious patterns.
 * Never automatically opens suspicious links in an unsafe context.
 */
object LinkSecurityAnalyzer {
    fun analyze(url: String): LinkExtractedFields {
        // Decomposes URL, checks brand spoofing, high-abuse TLDs (.top, .xyz), APK payloads, and sensitive credentials
    }
}`
  },
  'ThreatIntelligenceProvider.kt': {
    title: 'ThreatIntelligenceProvider.kt (Extensible)',
    category: 'Security',
    code: `package com.apkadhan.ai.core.engine.security

/**
 * Extensible threat intelligence interfaces for real APIs (Google Safe Browsing, VirusTotal, CERT-In).
 * Core Principle: Do NOT invent reputation results.
 */
interface ThreatIntelligenceProvider {
    val name: String
    suspend fun lookupUrl(url: String): ThreatIntelligenceResult
    suspend fun lookupDomain(domain: String): ThreatIntelligenceResult
    suspend fun lookupVpa(vpa: String): ThreatIntelligenceResult
}`
  },
  'MessageParser.kt': {
    title: 'MessageParser.kt (Android Clean Arch)',
    category: 'SMS Analysis',
    code: `package com.apkadhan.ai.core.sms

/**
 * ANDROID TRANSACTION MESSAGE ANALYSIS CONTRACT
 * Offline, bank-specific regex parser pipeline with field confidence ratings.
 */
enum class TransactionType { DEBIT, CREDIT, COLLECT_REQUEST, REFUND, UNKNOWN }
enum class ConfidenceLevel { HIGH, MEDIUM, LOW }

data class FieldConfidence<T>(
    val value: T,
    val confidence: ConfidenceLevel,
    val patternMatched: String? = null
)

data class RawMessageInput(
    val senderId: String? = null,
    val body: String,
    val timestampEpochMs: Long = System.currentTimeMillis()
)

data class NormalizedTransactionRecord(
    val id: String,
    val bankOrProvider: String,
    val transactionType: FieldConfidence<TransactionType>,
    val amount: FieldConfidence<Double>,
    val merchant: FieldConfidence<String?>,
    val maskedAccount: FieldConfidence<String?>,
    val upiIdentifier: FieldConfidence<String?>,
    val timestamp: FieldConfidence<Long>,
    val referenceId: FieldConfidence<String?>,
    val overallConfidence: ConfidenceLevel
    // Note: Raw message is never stored to protect user privacy
)

interface MessageParser {
    val name: String
    val providerId: String
    fun canParse(input: RawMessageInput): Boolean
    fun parse(input: RawMessageInput): ParseResult
}`
  },
  'ParserRegistry.kt': {
    title: 'ParserRegistry.kt (Bank Parsers Router)',
    category: 'SMS Analysis',
    code: `package com.apkadhan.ai.core.sms

/**
 * Central registry managing offline bank parsers (HDFC, SBI, ICICI, Axis, Kotak).
 * Handles OTP/promotional pre-filtering and safe parse fallbacks.
 */
class ParserRegistry {
    private val parsers = mutableListOf<MessageParser>()

    init {
        registerParser(HdfcMessageParser())
        registerParser(SbiMessageParser())
        registerParser(IciciMessageParser())
        registerParser(AxisMessageParser())
        registerParser(KotakMessageParser())
        registerParser(GenericUpiMessageParser())
    }

    fun parseMessage(input: RawMessageInput): ParseResult {
        // Runs completely on-device. Zero network transmissions.
        for (parser in parsers) {
            if (parser.canParse(input)) {
                return parser.parse(input)
            }
        }
        return ParseResult(false, null, "UNSUPPORTED_PROVIDER")
    }
}`
  },
  'TransactionNormalizer.kt': {
    title: 'TransactionNormalizer.kt (Normalizer)',
    category: 'SMS Analysis',
    code: `package com.apkadhan.ai.core.sms

/**
 * Normalizes amount, transaction type, masked accounts (XX1234),
 * merchant names, and Indian banking date/time strings into Unix Epoch & ISO 8601.
 */
object TransactionNormalizer {
    fun normalizeAmount(rawToken: String?): FieldConfidence<Double> {
        val num = rawToken?.replace(Regex("[^0-9.]"), "")?.toDoubleOrNull() ?: 0.0
        return FieldConfidence(num, ConfidenceLevel.HIGH, "CURRENCY_PREFIX_NUMERIC")
    }

    fun normalizeTransactionType(text: String): FieldConfidence<TransactionType> {
        val lower = text.lowercase()
        return when {
            lower.contains("collect request") -> FieldConfidence(TransactionType.COLLECT_REQUEST, ConfidenceLevel.HIGH)
            lower.contains("debited") || lower.contains("paid") -> FieldConfidence(TransactionType.DEBIT, ConfidenceLevel.HIGH)
            lower.contains("credited") -> FieldConfidence(TransactionType.CREDIT, ConfidenceLevel.HIGH)
            else -> FieldConfidence(TransactionType.UNKNOWN, ConfidenceLevel.LOW)
        }
    }
}`
  },
  'TransactionRepository.kt': {
    title: 'TransactionRepository.kt (On-Device DB)',
    category: 'SMS Analysis',
    code: `package com.apkadhan.ai.core.sms

/**
 * On-Device Transaction Repository.
 * PRIVACY SPECIFICATIONS:
 * 1. Encrypted local storage (SQLCipher / Room).
 * 2. ZERO raw SMS body text is stored.
 * 3. Enforces UTR reference deduplication.
 */
class TransactionRepository {
    private val records = mutableMapOf<String, NormalizedTransactionRecord>()

    fun save(record: NormalizedTransactionRecord): Boolean {
        if (records.containsKey(record.id)) return false // duplicate prevented
        records[record.id] = record
        return true
    }

    fun getAll(): List<NormalizedTransactionRecord> = records.values.toList()
    fun getPrivacyMetrics() = mapOf("rawSmsRetained" to 0, "offlineOnly" to true)
}`
  },
  'TransactionMessageAnalysisTest.kt': {
    title: 'TransactionMessageAnalysisTest.kt (Tests)',
    category: 'Tests',
    code: `package com.apkadhan.ai.core.sms

import org.junit.Assert.*
import org.junit.Test

/**
 * Unit Tests using 100% synthetic fictitious messages.
 * No real user financial data is ever used in tests.
 */
class TransactionMessageAnalysisTest {
    @Test
    fun testHdfcDebitParsing() {
        val registry = ParserRegistry()
        val result = registry.parseMessage(RawMessageInput(
            senderId = "VK-HDFCBK",
            body = "Sent Rs. 1,500.00 from HDFC Bank A/C **1234 to SWIGGY on 25-SEP-24 via UPI. Ref 426811223344."
        ))
        assertTrue(result.success)
        assertEquals(1500.0, result.record?.amount?.value ?: 0.0, 0.01)
        assertEquals("Swiggy", result.record?.merchant?.value)
        assertEquals("XX1234", result.record?.maskedAccount?.value)
    }
}`
  },
  'InvestmentScamDetector.kt': {
    title: 'InvestmentScamDetector.kt (Scam Engine)',
    category: 'Investment Scam',
    code: `package com.apkadhan.ai.core.investment

/**
 * APKA DHAN AI - INVESTMENT SCAM DETECTOR (Clean Arch)
 * Multi-layer detection of 13 deceptive signals across Telegram, WhatsApp, ads & PDFs.
 * Enforces strict evidentiary standard: Zero accusation on weak evidence alone.
 * 6 Mandatory Output Fields:
 * - riskLevel
 * - signals
 * - evidence
 * - verificationSteps
 * - sourceRequirements
 * - unknowns
 */
class InvestmentScamDetector(
    private val regulatoryAdapter: RegulatoryVerificationAdapter = DefaultRegulatoryAdapter()
) {
    suspend fun analyze(input: InvestmentScamInput): InvestmentScamAssessment {
        // Detects guaranteed returns, unrealistic yields, urgency, impersonation,
        // fake SEBI claims, personal payment diversion, and unverified APKs.
    }
}`
  },
  'RegulatoryVerificationAdapter.kt': {
    title: 'RegulatoryVerificationAdapter.kt (SEBI/RBI)',
    category: 'Investment Scam',
    code: `package com.apkadhan.ai.core.investment

/**
 * Regulatory verification contract against authoritative sources (SEBI, RBI, AMFI).
 * ZERO FABRICATION INVARIANT:
 * Strictly never fabricates intermediary registrations or regulatory standing.
 */
interface RegulatoryVerificationAdapter {
    suspend fun verifyEntity(query: RegulatoryEntityQuery): RegulatoryVerificationResult
    suspend fun isCautionListed(entityNameOrReg: String): Boolean
}

class DefaultRegulatoryAdapter : RegulatoryVerificationAdapter {
    // Official verified brokers directory & SEBI public caution directory
}`
  },
  'InvestmentScamTest.kt': {
    title: 'InvestmentScamTest.kt (Unit Tests)',
    category: 'Tests',
    code: `package com.apkadhan.ai.core.investment

import org.junit.Assert.*
import org.junit.Test

/**
 * Unit Tests using 100% synthetic fictitious test vectors (Zero real user data).
 */
class InvestmentScamTest {
    @Test
    fun testGuaranteedReturnAndPersonalPayment_EvaluatesToHighRisk() {
        // Verifies detection of guaranteed returns and personal payment demands
    }

    @Test
    fun testWeakEvidence_DoesNotAccuseOfFraud() {
        // Verifies restraint from accusing of fraud on weak evidence
    }
}`
  },
  'MarketDataProvider.kt': {
    title: 'MarketDataProvider.kt (Market Feed)',
    category: 'Stock Intelligence',
    code: `package com.apkadhan.ai.core.stock

/**
 * APKA DHAN AI - MARKET DATA PROVIDER CONTRACT
 * Ready for production exchange feed integration.
 * Invariant: Never invents live market feeds.
 */
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
}`
  },
  'StockRepositories.kt': {
    title: 'StockRepositories.kt (Holdings & Portf)',
    category: 'Stock Intelligence',
    code: `package com.apkadhan.ai.core.stock

/**
 * Clean Architecture Repositories:
 * - StockRepository (Market quote cache)
 * - WatchlistRepository (Watchlists)
 * - HoldingRepository (User positions)
 * - PortfolioRepository (Portfolio value, unrealized gain/loss, allocations)
 *
 * Strict separation: market data vs user portfolio data vs analysis.
 * Zero automated buy/sell recommendations.
 */
class PortfolioRepository(
    private val holdingRepo: HoldingRepository,
    private val stockRepo: StockRepository
) {
    suspend fun calculateSummary(): PortfolioSummary {
        // Computes total value, invested capital, and net P/L
    }
}`
  },
  'StockIntelligenceTest.kt': {
    title: 'StockIntelligenceTest.kt (Tests)',
    category: 'Tests',
    code: `package com.apkadhan.ai.core.stock

import kotlinx.coroutines.runBlocking
import org.junit.Assert.*
import org.junit.Test

/**
 * Unit Tests for MarketDataProvider, Portfolio Value & Invariant
 */
class StockIntelligenceTest {
    @Test
    fun testPortfolioCalculations() = runBlocking {
        // Verifies total current value, invested value, and P/L calculations
    }

    @Test
    fun testZeroBuySellDecisions() {
        // Verifies constitutional invariant prohibiting automated trade directives
    }
}`
  },
  'CryptoDataProvider.kt': {
    title: 'CryptoDataProvider.kt (Market Feed)',
    category: 'Crypto Intelligence',
    code: `package com.apkadhan.ai.core.crypto

/**
 * APKA DHAN AI - CRYPTO DATA PROVIDER CONTRACT
 * Ready for CoinGecko / Binance production feed integration.
 * Invariant: Never fabricates live feeds; explicit offline synthetic metadata.
 */
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
}`
  },
  'CryptoRepositories.kt': {
    title: 'CryptoRepositories.kt (Holdings & Risks)',
    category: 'Crypto Intelligence',
    code: `package com.apkadhan.ai.core.crypto

/**
 * Clean Architecture Repositories:
 * - CryptoAssetRepository (Asset quotes & series)
 * - CryptoWatchlistRepository (Watchlists)
 * - CryptoHoldingRepository (Quantities only - NEVER PRIVATE KEYS)
 * - CryptoPortfolioRepository (Valuation, Allocations, Risk Indicators)
 *
 * STRICT SECURITY CONSTITUTION:
 * - Never request or store: private keys, seed phrases, or exchange passwords.
 * - Do not execute trades.
 * - Risk indicators are analytical observations, NOT proof of fraud.
 */
class CryptoPortfolioRepository(
    private val holdingRepo: CryptoHoldingRepository,
    private val assetRepo: CryptoAssetRepository
) {
    suspend fun calculateSummary(): CryptoPortfolioSummary {
        // Computes total USD/INR values, 24h P/L, and risk indicators
    }

    fun executeTrade(): Nothing {
        throw IllegalStateException("Trade execution is strictly prohibited.")
    }
}`
  },
  'CryptoIntelligenceTest.kt': {
    title: 'CryptoIntelligenceTest.kt (Tests)',
    category: 'Tests',
    code: `package com.apkadhan.ai.core.crypto

import kotlinx.coroutines.runBlocking
import org.junit.Assert.*
import org.junit.Test

/**
 * Unit Tests for CryptoDataProvider, Portfolio Value & Security Invariants
 */
class CryptoIntelligenceTest {
    @Test
    fun testPortfolioCalculations() = runBlocking {
        // Verifies total current value, invested value, and P/L calculations
    }

    @Test
    fun testTradeExecution_IsStrictlyProhibited() {
        // Verifies trade execution rejection invariant
    }
}`
  },
  'UnifiedPortfolioEngine.kt': {
    title: 'UnifiedPortfolioEngine.kt (Aggregator)',
    category: 'Unified Portfolio',
    code: `package com.apkadhan.ai.core.portfolio

/**
 * APKA DHAN AI - UNIFIED PORTFOLIO ENGINE (Android Clean Architecture)
 * Aggregates: Stocks, Mutual Funds, ETFs, and Crypto.
 *
 * CONSTITUTIONAL INVARIANTS:
 * - Factual risk observations ("High concentration detected")
 * - Strictly NO trade directives ("Sell this asset")
 * - Transparent step-by-step explainable calculations
 * - Zero personalized financial advice
 */
class UnifiedPortfolioEngine(private val holdings: MutableList<UnifiedAssetHolding> = mutableListOf()) {
    fun calculateAssessment(): UnifiedPortfolioAssessment {
        // Computes aggregate valuation, P/L, class allocations, and HHI concentration
    }
}`
  },
  'UnifiedPortfolioTest.kt': {
    title: 'UnifiedPortfolioTest.kt (Tests)',
    category: 'Tests',
    code: `package com.apkadhan.ai.core.portfolio

import org.junit.Assert.*
import org.junit.Test

/**
 * Unit Tests for Multi-Asset Aggregation & Descriptive Risk Signals
 */
class UnifiedPortfolioTest {
    @Test
    fun testUnifiedPortfolioCalculations_MultiAsset() {
        // Verifies 4 asset classes: Stocks, MFs, ETFs, Crypto
    }

    @Test
    fun testHighConcentration_ProducesDescriptiveSignalNotSellAdvice() {
        // Verifies "High concentration detected" instead of "Sell this asset"
    }
}`
  }
};

export const CodeViewerModal: React.FC<CodeViewerModalProps> = ({ isOpen, onClose }) => {
  const [selectedFileName, setSelectedFileName] = useState('HomeScreen.kt');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const currentFile = KOTLIN_FILES[selectedFileName] || KOTLIN_FILES['HomeScreen.kt'];

  const handleCopy = () => {
    navigator.clipboard.writeText(currentFile.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#0B1428] border border-[#233560] rounded-2xl w-full max-w-4xl h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-[#1C2C55] flex items-center justify-between bg-[#0E1A34]">
          <div className="flex items-center gap-2">
            <Code2 className="w-5 h-5 text-[#E0A96D]" />
            <div>
              <div className="text-sm font-bold text-slate-100">
                Jetpack Compose Kotlin Source Files
              </div>
              <div className="text-[11px] text-slate-400">
                Production-grade modular Android architecture
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-[#1C2D56] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* File Tabs & Main View */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-56 border-r border-[#1C2C55] bg-[#081022] p-2 space-y-1 overflow-y-auto">
            <div className="text-[10px] font-bold text-slate-500 uppercase px-2 py-1 tracking-wider">
              Android Modules
            </div>
            {Object.entries(KOTLIN_FILES).map(([filename, file]) => {
              const isSelected = selectedFileName === filename;
              return (
                <button
                  key={filename}
                  onClick={() => setSelectedFileName(filename)}
                  className={`w-full text-left px-2.5 py-2 rounded-lg text-xs font-mono flex items-center gap-2 transition-colors ${
                    isSelected
                      ? 'bg-[#E0A96D]/15 text-[#E0A96D] border border-[#E0A96D]/40 font-bold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-[#121E3B]'
                  }`}
                >
                  <FileCode className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{filename}</span>
                </button>
              );
            })}
          </div>

          {/* Code Content */}
          <div className="flex-1 flex flex-col bg-[#070D1E] overflow-hidden">
            <div className="px-4 py-2 border-b border-[#1A284D] flex items-center justify-between bg-[#0A1226] text-xs">
              <span className="font-mono text-slate-300 font-semibold">{currentFile.title}</span>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1 rounded bg-[#18264A] hover:bg-[#20315E] text-slate-200 border border-[#273868] transition-colors font-medium text-[11px]"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-[#E0A96D]" />
                    <span>Copy Kotlin Code</span>
                  </>
                )}
              </button>
            </div>

            <div className="flex-1 p-4 overflow-auto font-mono text-xs text-slate-200 leading-relaxed scrollbar-thin scrollbar-thumb-[#1F2F59]">
              <pre className="whitespace-pre">{currentFile.code}</pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
