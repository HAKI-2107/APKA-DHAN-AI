package com.apkadhan.ai.core.database.entity

import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.Index
import androidx.room.PrimaryKey

/**
 * 4. SECURITY EVENT ENTITY
 * Storage Domain: LOCAL-ONLY (Aggregation cache)
 * Retention: 90 days.
 * Encryption: SQLCipher AES-256-GCM.
 */
@Entity(
    tableName = "security_events",
    indices = [
        Index(value = ["target_identifier"]),
        Index(value = ["severity"]),
        Index(value = ["created_at_epoch_ms"])
    ]
)
data class SecurityEventEntity(
    @PrimaryKey
    @ColumnInfo(name = "event_id")
    val eventId: String,

    @ColumnInfo(name = "event_type")
    val eventType: String, // e.g., "MALICIOUS_COLLECT_REQUEST", "PHISHING_URL_INTERCEPT"

    @ColumnInfo(name = "target_identifier")
    val targetIdentifier: String, // e.g. VPA or URL hash

    @ColumnInfo(name = "severity")
    val severity: String, // "LOW RISK", "MEDIUM RISK", "HIGH RISK", "UNKNOWN / UNVERIFIED"

    @ColumnInfo(name = "summary")
    val summary: String,

    @ColumnInfo(name = "raw_metadata_json")
    val rawMetadataJson: String, // Redacted JSON metadata

    @ColumnInfo(name = "created_at_epoch_ms")
    val createdAtEpochMs: Long = System.currentTimeMillis()
)

/**
 * 5. TRANSACTION ENTITY
 * Storage Domain: LOCAL-ONLY (Never transmitted without explicit user export).
 * Sensitive Fields: Amount, Masked Account, Counterparty VPA.
 * Prohibited: Banking passwords, OTPs, UPI PINs, CVVs.
 * Retention: 365 days rolling window.
 * Encryption: SQLCipher AES-256-GCM.
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
    @ColumnInfo(name = "transaction_id")
    val transactionId: String,

    @ColumnInfo(name = "txn_reference_id")
    val txnReferenceId: String?, // NPCI RRN or Bank UTR

    @ColumnInfo(name = "counterparty_vpa")
    val counterpartyVpa: String,

    @ColumnInfo(name = "counterparty_name")
    val counterpartyName: String?,

    @ColumnInfo(name = "amount")
    val amount: Double,

    @ColumnInfo(name = "currency")
    val currency: String = "INR",

    @ColumnInfo(name = "transaction_type")
    val transactionType: String, // "DEBIT", "CREDIT", "COLLECT_REQUEST"

    @ColumnInfo(name = "masked_account")
    val maskedAccount: String?, // e.g. "XX1234" (Full account number forbidden)

    @ColumnInfo(name = "bank_sender_header")
    val bankSenderHeader: String?, // e.g. "VK-HDFCBK"

    @ColumnInfo(name = "is_anomaly")
    val isAnomaly: Boolean = false,

    @ColumnInfo(name = "anomaly_reason")
    val anomalyReason: String? = null,

    @ColumnInfo(name = "txn_timestamp_epoch_ms")
    val txnTimestampEpochMs: Long
)

/**
 * 6. MERCHANT ENTITY
 * Storage Domain: HYBRID (Public NPCI directory cached locally).
 * Retention: 30-day cache refresh.
 * Encryption: Standard Room indexing.
 */
@Entity(
    tableName = "merchants",
    indices = [
        Index(value = ["merchant_code"], unique = true),
        Index(value = ["merchant_vpa"])
    ]
)
data class MerchantEntity(
    @PrimaryKey
    @ColumnInfo(name = "merchant_id")
    val merchantId: String,

    @ColumnInfo(name = "merchant_code")
    val merchantCode: String, // MCC (Merchant Category Code e.g. "5411")

    @ColumnInfo(name = "merchant_name")
    val merchantName: String,

    @ColumnInfo(name = "merchant_vpa")
    val merchantVpa: String,

    @ColumnInfo(name = "is_verified_npci")
    val isVerifiedNpci: Boolean,

    @ColumnInfo(name = "category_name")
    val categoryName: String, // "Groceries", "Utilities", "Financial Services"

    @ColumnInfo(name = "last_updated_epoch_ms")
    val lastUpdatedEpochMs: Long
)

/**
 * 7. UPI IDENTIFIER ENTITY
 * Storage Domain: HYBRID (Local scan log + Server threat reputation bloom).
 * Retention: 180 days.
 * Encryption: SQLCipher AES-256-GCM.
 */
@Entity(
    tableName = "upi_identifiers",
    indices = [
        Index(value = ["vpa_address"], unique = true),
        Index(value = ["psp_handle"]),
        Index(value = ["reputation_status"])
    ]
)
data class UPIIdentifierEntity(
    @PrimaryKey
    @ColumnInfo(name = "upi_id")
    val upiId: String,

    @ColumnInfo(name = "vpa_address")
    val vpaAddress: String, // e.g., "target-vpa@okhdfcbank"

    @ColumnInfo(name = "handle_prefix")
    val handlePrefix: String, // e.g., "target-vpa"

    @ColumnInfo(name = "psp_handle")
    val pspHandle: String, // e.g., "okhdfcbank"

    @ColumnInfo(name = "is_authorized_psp")
    val isAuthorizedPsp: Boolean,

    @ColumnInfo(name = "impersonation_flag")
    val impersonationFlag: Boolean,

    @ColumnInfo(name = "reputation_status")
    val reputationStatus: String, // "CLEAN", "SUSPICIOUS", "FLAGGED_FRAUD", "UNVERIFIED"

    @ColumnInfo(name = "last_checked_epoch_ms")
    val lastCheckedEpochMs: Long
)

/**
 * 8. PHONE NUMBER ENTITY
 * Storage Domain: HYBRID (Normalized hash; raw number masked).
 * Sensitive Fields: Phone number stored as SHA-256 hash + masked display ("+91 98*** **210").
 * Retention: 180 days.
 * Encryption: SQLCipher AES-256-GCM.
 */
@Entity(
    tableName = "phone_numbers",
    indices = [
        Index(value = ["phone_hash"], unique = true),
        Index(value = ["fraud_flag_count"])
    ]
)
data class PhoneNumberEntity(
    @PrimaryKey
    @ColumnInfo(name = "phone_id")
    val phoneId: String,

    @ColumnInfo(name = "phone_hash")
    val phoneHash: String, // SHA-256(E.164 phone)

    @ColumnInfo(name = "masked_display")
    val maskedDisplay: String, // "+91 98*** **210"

    @ColumnInfo(name = "telecom_circle")
    val telecomCircle: String?, // e.g., "Delhi", "Maharashtra"

    @ColumnInfo(name = "reported_category")
    val reportedCategory: String?, // "FAKE_CUSTOMER_CARE", "DIGITAL_ARREST", "TASK_SCAM"

    @ColumnInfo(name = "fraud_flag_count")
    val fraudFlagCount: Int = 0,

    @ColumnInfo(name = "last_seen_epoch_ms")
    val lastSeenEpochMs: Long
)

/**
 * 9. LINK ENTITY
 * Storage Domain: HYBRID (Local scans + Cloud threat intelligence).
 * Retention: 90 days.
 * Encryption: SQLCipher AES-256-GCM.
 */
@Entity(
    tableName = "links",
    indices = [
        Index(value = ["normalized_url_hash"], unique = true),
        Index(value = ["domain_name"]),
        Index(value = ["risk_level"])
    ]
)
data class LinkEntity(
    @PrimaryKey
    @ColumnInfo(name = "link_id")
    val linkId: String,

    @ColumnInfo(name = "normalized_url_hash")
    val normalizedUrlHash: String,

    @ColumnInfo(name = "raw_url")
    val rawUrl: String,

    @ColumnInfo(name = "domain_name")
    val domainName: String,

    @ColumnInfo(name = "tld")
    val tld: String, // e.g. ".top", ".xyz"

    @ColumnInfo(name = "is_punycode_homoglyph")
    val isPunycodeHomoglyph: Boolean,

    @ColumnInfo(name = "is_apk_download")
    val isApkDownload: Boolean,

    @ColumnInfo(name = "risk_level")
    val riskLevel: String, // "LOW RISK", "MEDIUM RISK", "HIGH RISK", "UNKNOWN / UNVERIFIED"

    @ColumnInfo(name = "checked_at_epoch_ms")
    val checkedAtEpochMs: Long
)

/**
 * 10. QR ANALYSIS ENTITY
 * Storage Domain: LOCAL-ONLY (Quarantined payload analysis log).
 * Retention: 30 days.
 * Encryption: SQLCipher AES-256-GCM.
 */
@Entity(
    tableName = "qr_analyses",
    indices = [
        Index(value = ["payload_hash"], unique = true),
        Index(value = ["analyzed_at_epoch_ms"])
    ]
)
data class QRAnalysisEntity(
    @PrimaryKey
    @ColumnInfo(name = "qr_id")
    val qrId: String,

    @ColumnInfo(name = "payload_hash")
    val payloadHash: String,

    @ColumnInfo(name = "raw_payload")
    val rawPayload: String, // e.g., "upi://pay?pa=..."

    @ColumnInfo(name = "payload_type")
    val payloadType: String, // "UPI_INTENT", "WEB_URL", "PLAIN_TEXT", "MALFORMED"

    @ColumnInfo(name = "is_collect_request")
    val isCollectRequest: Boolean,

    @ColumnInfo(name = "payee_vpa")
    val payeeVpa: String?,

    @ColumnInfo(name = "requested_amount")
    val requestedAmount: Double?,

    @ColumnInfo(name = "risk_level")
    val riskLevel: String,

    @ColumnInfo(name = "analyzed_at_epoch_ms")
    val analyzedAtEpochMs: Long
)
