package com.apkadhan.ai.core.database.entity

import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.Index
import androidx.room.PrimaryKey

/**
 * 11. THREAT INDICATOR ENTITY
 * Storage Domain: HYBRID (Synced from Cloud Threat Intel Hub to Local Bloom/SQLite).
 * Retention: Active until revoked or decayed (180 days default TTL).
 * Encryption: Standard Room indexing.
 */
@Entity(
    tableName = "threat_indicators",
    indices = [
        Index(value = ["indicator_hash"], unique = true),
        Index(value = ["indicator_type"]),
        Index(value = ["severity"])
    ]
)
data class ThreatIndicatorEntity(
    @PrimaryKey
    @ColumnInfo(name = "indicator_id")
    val indicatorId: String,

    @ColumnInfo(name = "indicator_hash")
    val indicatorHash: String, // SHA-256 of target (VPA, domain, phone, app package)

    @ColumnInfo(name = "indicator_type")
    val indicatorType: String, // "VPA", "DOMAIN", "PHONE", "APK_PACKAGE", "IFSC"

    @ColumnInfo(name = "severity")
    val severity: String, // "LOW RISK", "MEDIUM RISK", "HIGH RISK", "UNKNOWN / UNVERIFIED"

    @ColumnInfo(name = "threat_category")
    val threatCategory: String, // "DIGITAL_ARREST", "ELECTRICITY_BILL_SCAM", "FAKE_CUSTOMER_CARE", "PONZI"

    @ColumnInfo(name = "source_authority")
    val sourceAuthority: String, // "SEBI", "RBI", "NPCI", "CERT_IN", "COMMUNITY_VERIFIED"

    @ColumnInfo(name = "is_active")
    val isActive: Boolean = true,

    @ColumnInfo(name = "first_seen_epoch_ms")
    val firstSeenEpochMs: Long,

    @ColumnInfo(name = "last_updated_epoch_ms")
    val lastUpdatedEpochMs: Long
)

/**
 * 12. USER REPORT ENTITY
 * Storage Domain: HYBRID (Local record + Sanitized payload submitted to Cloud).
 * Sensitive Fields: Sanitized on-device; all PII stripped.
 * Retention: 365 days in local audit trail.
 * Encryption: SQLCipher AES-256-GCM.
 */
@Entity(
    tableName = "user_reports",
    indices = [
        Index(value = ["report_hash"], unique = true),
        Index(value = ["status"]),
        Index(value = ["submitted_at_epoch_ms"])
    ]
)
data class UserReportEntity(
    @PrimaryKey
    @ColumnInfo(name = "report_id")
    val reportId: String, // e.g. "AD-2026-891044"

    @ColumnInfo(name = "report_hash")
    val reportHash: String,

    @ColumnInfo(name = "category")
    val category: String, // "UPI_ID", "PHONE_NUMBER", "LINK", "QR_CODE", "INVESTMENT_OFFER", "CRYPTO_SCAM"

    @ColumnInfo(name = "target_identifier_masked")
    val targetIdentifierMasked: String, // Sanitized identifier

    @ColumnInfo(name = "incident_narrative_sanitized")
    val incidentNarrativeSanitized: String,

    @ColumnInfo(name = "evidence_signals_json")
    val evidenceSignalsJson: String,

    @ColumnInfo(name = "user_consent_granted")
    val userConsentGranted: Boolean,

    @ColumnInfo(name = "status")
    val status: String = "RECORDED_FOR_TRIAGE", // "RECORDED_FOR_TRIAGE", "VERIFIED_THREAT", "RESOLVED"

    @ColumnInfo(name = "submitted_at_epoch_ms")
    val submittedAtEpochMs: Long
)

/**
 * 22. RISK ASSESSMENT ENTITY
 * Storage Domain: DERIVED (Computed by hybrid deterministic + AI evaluation engine).
 * Retention: 90 days.
 * Encryption: SQLCipher AES-256-GCM.
 */
@Entity(
    tableName = "risk_assessments",
    indices = [
        Index(value = ["target_identifier"]),
        Index(value = ["overall_level"]),
        Index(value = ["assessed_at_epoch_ms"])
    ]
)
data class RiskAssessmentEntity(
    @PrimaryKey
    @ColumnInfo(name = "assessment_id")
    val assessmentId: String,

    @ColumnInfo(name = "target_identifier")
    val targetIdentifier: String,

    @ColumnInfo(name = "target_type")
    val targetType: String, // "UPI_VPA", "URL", "TEXT_CLAIM", "PORTFOLIO", "CRYPTO_CONTRACT"

    @ColumnInfo(name = "overall_level")
    val overallLevel: String, // "LOW RISK", "MEDIUM RISK", "HIGH RISK", "UNKNOWN / UNVERIFIED"

    @ColumnInfo(name = "provenance_source")
    val provenanceSource: String, // "[RULE_SIGNAL] + [REGULATORY_REGISTRY]", etc.

    @ColumnInfo(name = "confidence_level")
    val confidenceLevel: String, // "High (Syntax / Heuristic Match)", etc.

    @ColumnInfo(name = "plain_language_explanation")
    val plainLanguageExplanation: String,

    @ColumnInfo(name = "verification_steps_json")
    val verificationStepsJson: String, // Serialized list of steps

    @ColumnInfo(name = "assessed_at_epoch_ms")
    val assessedAtEpochMs: Long
)

/**
 * 23. RISK SIGNAL ENTITY
 * Storage Domain: DERIVED (Atomic evidence signals contributing to a RiskAssessment).
 * Retention: 90 days (cascaded with RiskAssessment).
 * Encryption: SQLCipher AES-256-GCM.
 */
@Entity(
    tableName = "risk_signals",
    indices = [
        Index(value = ["assessment_id"]),
        Index(value = ["signal_code"])
    ]
)
data class RiskSignalEntity(
    @PrimaryKey
    @ColumnInfo(name = "signal_id")
    val signalId: String,

    @ColumnInfo(name = "assessment_id")
    val assessmentId: String, // FK to RiskAssessmentEntity

    @ColumnInfo(name = "signal_code")
    val signalCode: String, // e.g. "PUNYCODE_HOMOGLYPH", "NO_SEBI_REG", "PROMOTER_PLEDGE_GT_50"

    @ColumnInfo(name = "signal_title")
    val signalTitle: String,

    @ColumnInfo(name = "signal_description")
    val signalDescription: String,

    @ColumnInfo(name = "is_critical_red_flag")
    val isCriticalRedFlag: Boolean,

    @ColumnInfo(name = "weight")
    val weight: Float
)

/**
 * 24. ALERT ENTITY
 * Storage Domain: LOCAL-ONLY (User visible security advisories).
 * Retention: 60 days.
 * Encryption: SQLCipher AES-256-GCM.
 */
@Entity(
    tableName = "alerts",
    indices = [
        Index(value = ["category"]),
        Index(value = ["severity"]),
        Index(value = ["created_at_epoch_ms"])
    ]
)
data class AlertEntity(
    @PrimaryKey
    @ColumnInfo(name = "alert_id")
    val alertId: String,

    @ColumnInfo(name = "category")
    val category: String, // "Payment Risk", "Investment Scam", "Portfolio Alert", "Crypto Alert", "Security Alert"

    @ColumnInfo(name = "title")
    val title: String,

    @ColumnInfo(name = "summary")
    val summary: String,

    @ColumnInfo(name = "severity")
    val severity: String, // "LOW RISK", "MEDIUM RISK", "HIGH RISK", "UNKNOWN / UNVERIFIED"

    @ColumnInfo(name = "source_attribution")
    val sourceAttribution: String,

    @ColumnInfo(name = "evidence_list_json")
    val evidenceListJson: String,

    @ColumnInfo(name = "recommended_actions_json")
    val recommendedActionsJson: String,

    @ColumnInfo(name = "is_read")
    val isRead: Boolean = false,

    @ColumnInfo(name = "created_at_epoch_ms")
    val createdAtEpochMs: Long
)

/**
 * 25. NOTIFICATION ENTITY
 * Storage Domain: LOCAL-ONLY (Android System Notification Log).
 * Retention: 30 days.
 * Encryption: SQLCipher AES-256-GCM.
 */
@Entity(
    tableName = "notifications",
    indices = [
        Index(value = ["channel_id"]),
        Index(value = ["posted_at_epoch_ms"])
    ]
)
data class NotificationEntity(
    @PrimaryKey
    @ColumnInfo(name = "notification_id")
    val notificationId: String,

    @ColumnInfo(name = "channel_id")
    val channelId: String, // "urgency_critical", "threat_alerts", "portfolio_warnings"

    @ColumnInfo(name = "title")
    val title: String,

    @ColumnInfo(name = "body")
    val body: String,

    @ColumnInfo(name = "deep_link_action")
    val deepLinkAction: String?, // e.g. "apkadhan://protect?tool=upi_check"

    @ColumnInfo(name = "posted_at_epoch_ms")
    val postedAtEpochMs: Long
)

/**
 * 26. AI ANALYSIS ENTITY
 * Storage Domain: DERIVED / CACHE (Structured LLM semantic reasoning outputs).
 * Retention: 30 days cache.
 * Encryption: SQLCipher AES-256-GCM.
 */
@Entity(
    tableName = "ai_analyses",
    indices = [
        Index(value = ["input_hash"], unique = true),
        Index(value = ["model_name"]),
        Index(value = ["analyzed_at_epoch_ms"])
    ]
)
data class AIAnalysisEntity(
    @PrimaryKey
    @ColumnInfo(name = "analysis_id")
    val analysisId: String,

    @ColumnInfo(name = "input_hash")
    val inputHash: String, // SHA-256 of sanitized input

    @ColumnInfo(name = "model_name")
    val modelName: String, // "gemini-3.8-flash", "gemini-3.1-pro-preview"

    @ColumnInfo(name = "structured_output_json")
    val structuredOutputJson: String,

    @ColumnInfo(name = "grounding_source_cited")
    val groundingSourceCited: String?, // Official SEBI registry or search citation

    @ColumnInfo(name = "analyzed_at_epoch_ms")
    val analyzedAtEpochMs: Long
)
