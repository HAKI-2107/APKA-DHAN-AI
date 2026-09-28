package com.apkadhan.ai.notification

/**
 * APKA DHAN AI - ANDROID NOTIFICATION CONTENT ENGINE
 *
 * Formats notification content to feel human, contextual, memorable, useful, concise, and intelligent.
 *
 * CONSTITUTIONAL RULES:
 * - HIGH and CRITICAL alerts: NO jokes, NO sarcasm, NO clickbait, NO playful wording, NO unnecessary fear.
 * - Structure: HOOK + WHAT HAPPENED + OPTIONAL ACTION
 * - Target lengths: Title 20-45 chars, Body 40-110 chars.
 * - Privacy: Sanitizes account numbers, UPI PINs, and credentials.
 */

data class FormattedNotification(
    val title: String,
    val body: String,
    val channelId: String,
    val severity: AlertSeverity,
    val deepLink: String,
    val actionLabel: String,
    val isPrivacyMasked: Boolean,
    val isTest: Boolean
)

object NotificationContentEngine {

    fun getChannelForType(type: AlertType): String {
        return when (type) {
            AlertType.SECURITY -> ApkaDhanNotificationChannels.CHANNEL_SECURITY
            AlertType.PAYMENT -> ApkaDhanNotificationChannels.CHANNEL_PAYMENT
            AlertType.INVESTMENT -> ApkaDhanNotificationChannels.CHANNEL_INVESTMENT
            AlertType.PORTFOLIO -> ApkaDhanNotificationChannels.CHANNEL_PORTFOLIO
            AlertType.STOCK -> ApkaDhanNotificationChannels.CHANNEL_STOCK
            AlertType.CRYPTO -> ApkaDhanNotificationChannels.CHANNEL_CRYPTO
            AlertType.SYSTEM, AlertType.GENERAL -> ApkaDhanNotificationChannels.CHANNEL_GENERAL
        }
    }

    fun format(event: AlertEvent, preferences: NotificationPreferences = NotificationPreferences()): FormattedNotification {
        val channelId = getChannelForType(event.type)
        var title = event.title
        var body = event.summary
        var actionLabel = "Tap to review"

        when (event.severity) {
            AlertSeverity.CRITICAL -> {
                actionLabel = "Stop & Verify"
                when (event.type) {
                    AlertType.SECURITY, AlertType.PAYMENT -> {
                        title = if (event.isTest) "[TEST] ⚠️ Stop & verify" else "⚠️ Stop & verify before paying"
                        body = sanitizeBody(
                            if (event.summary.isNotBlank()) event.summary
                            else "Multiple critical fraud risk indicators detected. Do not proceed."
                        )
                    }
                    AlertType.INVESTMENT -> {
                        title = if (event.isTest) "[TEST] ⚠️ Investment warning" else "⚠️ Investment offer alert"
                        body = sanitizeBody("Unverified entity with high risk coercive or Ponzi claims detected.")
                    }
                    else -> {
                        title = if (event.isTest) "[TEST] ⚠️ Critical: ${event.title}" else "⚠️ ${event.title}"
                        body = sanitizeBody(event.summary)
                    }
                }
            }
            AlertSeverity.HIGH -> {
                actionLabel = "Verify before paying"
                when (event.type) {
                    AlertType.SECURITY -> {
                        title = if (event.isTest) "[TEST] ⚠️ Security notice" else "⚠️ That link deserves a second look"
                        body = sanitizeBody(
                            if (event.summary.isNotBlank()) event.summary
                            else "We found warning signs before you open it. Tap to inspect safely."
                        )
                    }
                    AlertType.PAYMENT -> {
                        title = if (event.isTest) "[TEST] ⚠️ Payment notice" else "⚠️ Before you confirm payment..."
                        body = sanitizeBody(
                            if (event.summary.isNotBlank()) event.summary
                            else "Unusual payment request or collect-request detected for this recipient."
                        )
                    }
                    AlertType.INVESTMENT -> {
                        title = if (event.isTest) "[TEST] ⚠️ Investment check" else "⚠️ Investment claim needs review"
                        body = sanitizeBody("Guaranteed return scheme or unregistered advisory detected.")
                    }
                    else -> {
                        title = if (event.isTest) "[TEST] ${event.title}" else event.title
                        body = sanitizeBody(event.summary)
                    }
                }
            }
            AlertSeverity.MEDIUM -> {
                actionLabel = "Check details"
                when (event.type) {
                    AlertType.PAYMENT -> {
                        title = if (event.isTest) "[TEST] Payment notice" else "Payment notice to consider"
                        body = sanitizeBody("This payment pattern differs from your usual spending baseline.")
                    }
                    AlertType.INVESTMENT -> {
                        title = if (event.isTest) "[TEST] Quick check" else "Quick check on investment offer"
                        body = sanitizeBody("Unverified claims in this offer. Let’s verify before sending funds.")
                    }
                    AlertType.STOCK -> {
                        title = if (event.isTest) "[TEST] 📈 Stock is moving" else "📈 Tracked stock is moving today"
                        body = sanitizeBody(event.summary)
                    }
                    AlertType.CRYPTO -> {
                        title = if (event.isTest) "[TEST] 🪙 Crypto is active" else "🪙 Crypto moved sharply today"
                        body = sanitizeBody(event.summary)
                    }
                    AlertType.PORTFOLIO -> {
                        title = if (event.isTest) "[TEST] 📊 Portfolio note" else "📊 Portfolio balance notice"
                        body = sanitizeBody("One holding now drives a higher portion of your total portfolio risk.")
                    }
                    else -> {
                        title = if (event.isTest) "[TEST] ${event.title}" else event.title
                        body = sanitizeBody(event.summary)
                    }
                }
            }
            AlertSeverity.LOW, AlertSeverity.INFO -> {
                actionLabel = "See what changed"
                when (event.type) {
                    AlertType.STOCK -> {
                        title = if (event.isTest) "[TEST] 📈 Watchlist update" else "📈 Your watchlist is active today"
                        body = sanitizeBody(event.summary)
                    }
                    AlertType.PORTFOLIO -> {
                        title = if (event.isTest) "[TEST] 📊 Portfolio snapshot" else "📊 Your portfolio changed today"
                        body = sanitizeBody(event.summary)
                    }
                    else -> {
                        title = if (event.isTest) "[TEST] ${event.title}" else event.title
                        body = sanitizeBody(event.summary)
                    }
                }
            }
        }

        // Clamp character bounds
        title = clampLength(title, 45)
        body = clampLength(body, 110)

        return FormattedNotification(
            title = title,
            body = body,
            channelId = channelId,
            severity = event.severity,
            deepLink = event.deepLink,
            actionLabel = actionLabel,
            isPrivacyMasked = preferences.lockScreenPrivacy,
            isTest = event.isTest
        )
    }

    fun formatGrouped(events: List<AlertEvent>, type: AlertType): FormattedNotification {
        val channelId = getChannelForType(type)
        val count = events.size
        val title = when (type) {
            AlertType.STOCK -> "📈 Your watchlist is lively today"
            AlertType.CRYPTO -> "🪙 Crypto markets are active"
            AlertType.PORTFOLIO -> "📊 Portfolio updates today"
            else -> "⚠️ Security updates to review"
        }
        val body = when (type) {
            AlertType.STOCK -> "$count tracked stocks moved more than usual. Review watchlist."
            AlertType.CRYPTO -> "$count tracked crypto assets shifted sharply. Check radar."
            AlertType.PORTFOLIO -> "Multiple holdings updated. One asset is driving movement."
            else -> "$count items require verification before proceeding."
        }

        return FormattedNotification(
            title = clampLength(title, 45),
            body = clampLength(body, 110),
            channelId = channelId,
            severity = AlertSeverity.MEDIUM,
            deepLink = "apkaDhan://alerts",
            actionLabel = "Review updates",
            isPrivacyMasked = true,
            isTest = events.any { it.isTest }
        )
    }

    private fun sanitizeBody(text: String): String {
        var s = text.replace(Regex("\\b\\d{6,16}\\b"), "•••masked•••")
        s = s.replace(Regex("(?i)pin[:\\s=]+(\\d+)"), "PIN: ••••")
        return s.trim()
    }

    private fun clampLength(str: String, maxLen: Int): String {
        if (str.length <= maxLen) return str
        return str.substring(0, maxLen - 1).trim() + "…"
    }
}
