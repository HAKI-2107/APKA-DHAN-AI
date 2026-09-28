package com.apkadhan.ai.core.database.entity

import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.Index
import androidx.room.PrimaryKey

/**
 * 1. USER ENTITY
 * Storage Domain: LOCAL-ONLY (Primary) with pseudonymous token on SERVER.
 * Retention: Indefinite on-device until user requests "Purge Data" or uninstalls.
 * Encryption: SQLCipher AES-256-GCM.
 */
@Entity(
    tableName = "users",
    indices = [
        Index(value = ["pseudonym_token"], unique = true)
    ]
)
data class UserEntity(
    @PrimaryKey
    @ColumnInfo(name = "user_id")
    val userId: String, // UUID v4 generated on-device

    @ColumnInfo(name = "pseudonym_token")
    val pseudonymToken: String, // Cryptographically salted token for zero-knowledge cloud requests

    @ColumnInfo(name = "biometric_enabled")
    val biometricEnabled: Boolean = true,

    @ColumnInfo(name = "strict_pii_masking")
    val strictPiiMasking: Boolean = true,

    @ColumnInfo(name = "zero_knowledge_mode")
    val zeroKnowledgeMode: Boolean = false,

    @ColumnInfo(name = "preferred_language")
    val preferredLanguage: String = "en", // "en", "hi", etc.

    @ColumnInfo(name = "created_at_epoch_ms")
    val createdAtEpochMs: Long = System.currentTimeMillis(),

    @ColumnInfo(name = "last_active_epoch_ms")
    val lastActiveEpochMs: Long = System.currentTimeMillis()
)

/**
 * 2. DEVICE ENTITY
 * Storage Domain: LOCAL-ONLY
 * Retention: Lifecycle of the installation. Purged on reinstall.
 * Encryption: SQLCipher AES-256-GCM.
 */
@Entity(
    tableName = "devices",
    indices = [
        Index(value = ["device_fingerprint_hash"], unique = true),
        Index(value = ["user_id"])
    ]
)
data class DeviceEntity(
    @PrimaryKey
    @ColumnInfo(name = "device_id")
    val deviceId: String, // UUID v4 local identifier

    @ColumnInfo(name = "user_id")
    val userId: String, // Foreign relationship to UserEntity

    @ColumnInfo(name = "device_fingerprint_hash")
    val deviceFingerprintHash: String, // One-way SHA-256 hash of device hardware keys

    @ColumnInfo(name = "android_os_version")
    val androidOsVersion: String,

    @ColumnInfo(name = "app_build_number")
    val appBuildNumber: Int,

    @ColumnInfo(name = "has_hardware_keystore")
    val hasHardwareKeystore: Boolean,

    @ColumnInfo(name = "has_strongbox")
    val hasStrongBox: Boolean,

    @ColumnInfo(name = "registered_at_epoch_ms")
    val registeredAtEpochMs: Long = System.currentTimeMillis()
)

/**
 * 3. CONSENT ENTITY
 * Storage Domain: LOCAL-ONLY + Cryptographically signed receipt on SERVER.
 * Retention: 7 years for compliance auditability (RBI/DPDP Act 2023).
 * Encryption: SQLCipher AES-256-GCM.
 */
@Entity(
    tableName = "consents",
    indices = [
        Index(value = ["user_id"]),
        Index(value = ["consent_type"])
    ]
)
data class ConsentEntity(
    @PrimaryKey
    @ColumnInfo(name = "consent_id")
    val consentId: String,

    @ColumnInfo(name = "user_id")
    val userId: String,

    @ColumnInfo(name = "consent_type")
    val consentType: String, // e.g. "SMS_NOTIFICATION_PARSING", "COMMUNITY_THREAT_SHARING"

    @ColumnInfo(name = "is_granted")
    val isGranted: Boolean,

    @ColumnInfo(name = "policy_version")
    val policyVersion: String,

    @ColumnInfo(name = "timestamp_epoch_ms")
    val timestampEpochMs: Long = System.currentTimeMillis(),

    @ColumnInfo(name = "signature_proof")
    val signatureProof: String // On-device Ed25519 or Keystore signature proving explicit opt-in
)

/**
 * 27. AUDIT EVENT ENTITY
 * Storage Domain: LOCAL-ONLY (Immutable tamper-evident append-only ledger)
 * Retention: 180 days rolling window.
 * Encryption: SQLCipher AES-256-GCM.
 */
@Entity(
    tableName = "audit_events",
    indices = [
        Index(value = ["timestamp_epoch_ms"]),
        Index(value = ["action_type"])
    ]
)
data class AuditEventEntity(
    @PrimaryKey
    @ColumnInfo(name = "event_id")
    val eventId: String,

    @ColumnInfo(name = "action_type")
    val actionType: String, // e.g. "SCAN_UPI", "ANALYZE_LINK", "PURGE_CACHE", "EXPORT_REPORT"

    @ColumnInfo(name = "component_name")
    val componentName: String,

    @ColumnInfo(name = "details_redacted_json")
    val detailsRedactedJson: String, // Sanitized metadata without any PII

    @ColumnInfo(name = "previous_event_hash")
    val previousEventHash: String, // Cryptographic blockchain-like linkage for tamper detection

    @ColumnInfo(name = "current_event_hash")
    val currentEventHash: String,

    @ColumnInfo(name = "timestamp_epoch_ms")
    val timestampEpochMs: Long = System.currentTimeMillis()
)
