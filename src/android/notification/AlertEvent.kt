package com.apkadhan.ai.notification

/**
 * APKA DHAN AI - ANDROID CENTRAL ALERT EVENT MODEL
 *
 * Formal types and structures for alert events across all domains:
 * SECURITY, PAYMENT, INVESTMENT, PORTFOLIO, STOCK, CRYPTO, SYSTEM, GENERAL.
 */

enum class AlertType {
    SECURITY,
    PAYMENT,
    INVESTMENT,
    PORTFOLIO,
    STOCK,
    CRYPTO,
    SYSTEM,
    GENERAL
}

enum class AlertSeverity {
    INFO,
    LOW,
    MEDIUM,
    HIGH,
    CRITICAL
}

data class AlertEvent(
    val id: String,
    val type: AlertType,
    val severity: AlertSeverity,
    val title: String,
    val summary: String,
    val details: String? = null,
    val createdAt: String, // ISO-8601 timestamp
    val source: String,
    val deepLink: String = "apkaDhan://alerts",
    val requiresAction: Boolean = false,
    val isRead: Boolean = false,
    val isTest: Boolean = false,
    val metadata: Map<String, Any>? = null
)

data class NotificationPreferences(
    val securityEnabled: Boolean = true,
    val paymentEnabled: Boolean = true,
    val investmentEnabled: Boolean = true,
    val portfolioEnabled: Boolean = true,
    val stockEnabled: Boolean = true,
    val cryptoEnabled: Boolean = true,
    val generalEnabled: Boolean = true,
    val quietHoursEnabled: Boolean = false,
    val quietHoursStart: String = "22:00",
    val quietHoursEnd: String = "07:00",
    val lockScreenPrivacy: Boolean = true
)
