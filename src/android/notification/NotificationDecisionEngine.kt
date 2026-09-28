package com.apkadhan.ai.notification

/**
 * APKA DHAN AI - ANDROID NOTIFICATION DECISION ENGINE
 *
 * Implements policy-based decision routing:
 * - SEND_NOW: Immediate dispatch for High/Critical alerts, security threats, or active test dispatches.
 * - DELAY: Hold non-critical alerts during quiet hours or aggregation window.
 * - GROUP: Bundle repeated market, portfolio, or crypto movements into a single coherent digest.
 * - SUPPRESS: Filter out user-disabled categories, duplicates, or sub-threshold market noise.
 */

enum class NotificationDecisionType {
    SEND_NOW,
    DELAY,
    GROUP,
    SUPPRESS
}

data class DecisionEvaluation(
    val decision: NotificationDecisionType,
    val reason: String,
    val groupedEvents: List<AlertEvent>? = null
)

class NotificationDecisionEngine {
    private val sentAlertIds = mutableSetOf<String>()
    private val recentEventsByType = mutableMapOf<String, Pair<Int, Long>>() // type -> (count, timestamp)
    private val groupingBuffer = mutableMapOf<String, MutableList<AlertEvent>>()

    fun evaluate(
        event: AlertEvent,
        preferences: NotificationPreferences = NotificationPreferences(),
        currentTimeEpochMs: Long = System.currentTimeMillis()
    ): DecisionEvaluation {
        // 1. Deduplication by alertId
        if (sentAlertIds.contains(event.id)) {
            return DecisionEvaluation(
                decision = NotificationDecisionType.SUPPRESS,
                reason = "Deduplicated: Alert ID '${event.id}' has already been delivered."
            )
        }

        // 2. User category preferences
        if (!isCategoryEnabled(event.type, preferences)) {
            return DecisionEvaluation(
                decision = NotificationDecisionType.SUPPRESS,
                reason = "User preference: Category '${event.type}' notifications are disabled."
            )
        }

        // 3. Test alerts dispatch immediately
        if (event.isTest) {
            sentAlertIds.add(event.id)
            return DecisionEvaluation(
                decision = NotificationDecisionType.SEND_NOW,
                reason = "Developer test alert: Sent immediately."
            )
        }

        // 4. CRITICAL & HIGH severity alerts always bypass quiet hours and send immediately
        if (event.severity == AlertSeverity.CRITICAL || event.severity == AlertSeverity.HIGH) {
            sentAlertIds.add(event.id)
            recordEvent(event.type.name, currentTimeEpochMs)
            return DecisionEvaluation(
                decision = NotificationDecisionType.SEND_NOW,
                reason = "Immediate financial security alert: High urgency severity (${event.severity})."
            )
        }

        // 5. Quiet hours check for non-critical alerts
        if (preferences.quietHoursEnabled && isQuietHour(preferences, currentTimeEpochMs)) {
            return DecisionEvaluation(
                decision = NotificationDecisionType.DELAY,
                reason = "Quiet hours active: Non-critical alert delayed until morning."
            )
        }

        // 6. Grouping for Stock and Crypto movements
        if (event.type == AlertType.STOCK || event.type == AlertType.CRYPTO) {
            val typeKey = event.type.name
            val history = recentEventsByType[typeKey]
            val fiveMinutesMs = 5 * 60 * 1000L

            if (history != null && (currentTimeEpochMs - history.second) < fiveMinutesMs && history.first >= 2) {
                val buffer = groupingBuffer.getOrPut(typeKey) { mutableListOf() }
                buffer.add(event)
                sentAlertIds.add(event.id)

                if (buffer.size >= 3) {
                    val grouped = buffer.toList()
                    buffer.clear()
                    recordEvent(typeKey, currentTimeEpochMs)
                    return DecisionEvaluation(
                        decision = NotificationDecisionType.GROUP,
                        reason = "Grouped ${grouped.size} ${event.type} alerts into single notification.",
                        groupedEvents = grouped
                    )
                }

                return DecisionEvaluation(
                    decision = NotificationDecisionType.DELAY,
                    reason = "Holding ${event.type} notification to group with subsequent market events."
                )
            }
        }

        // 7. Low-value noise suppression
        if (event.severity == AlertSeverity.INFO && event.type == AlertType.STOCK && !event.requiresAction) {
            val changePercent = (event.metadata?.get("changePercent") as? Number)?.toDouble() ?: 0.0
            if (kotlin.math.abs(changePercent) in 0.01..0.5) {
                return DecisionEvaluation(
                    decision = NotificationDecisionType.SUPPRESS,
                    reason = "Suppressed: Sub-threshold market movement (${changePercent}%)."
                )
            }
        }

        // 8. Standard Send
        sentAlertIds.add(event.id)
        recordEvent(event.type.name, currentTimeEpochMs)
        return DecisionEvaluation(
            decision = NotificationDecisionType.SEND_NOW,
            reason = "Standard notification: Passed rate limiting, category, and priority checks."
        )
    }

    private fun isCategoryEnabled(type: AlertType, prefs: NotificationPreferences): Boolean {
        return when (type) {
            AlertType.SECURITY -> prefs.securityEnabled
            AlertType.PAYMENT -> prefs.paymentEnabled
            AlertType.INVESTMENT -> prefs.investmentEnabled
            AlertType.PORTFOLIO -> prefs.portfolioEnabled
            AlertType.STOCK -> prefs.stockEnabled
            AlertType.CRYPTO -> prefs.cryptoEnabled
            AlertType.SYSTEM, AlertType.GENERAL -> prefs.generalEnabled
        }
    }

    private fun isQuietHour(prefs: NotificationPreferences, timeMs: Long): Boolean {
        val calendar = java.util.Calendar.getInstance().apply { timeInMillis = timeMs }
        val hour = calendar.get(java.util.Calendar.HOUR_OF_DAY)
        val minute = calendar.get(java.util.Calendar.MINUTE)
        val currentMinutes = hour * 60 + minute

        val startParts = prefs.quietHoursStart.split(":").map { it.toIntOrNull() ?: 0 }
        val endParts = prefs.quietHoursEnd.split(":").map { it.toIntOrNull() ?: 0 }
        val startMinutes = startParts[0] * 60 + (startParts.getOrNull(1) ?: 0)
        val endMinutes = endParts[0] * 60 + (endParts.getOrNull(1) ?: 0)

        return if (startMinutes > endMinutes) {
            currentMinutes >= startMinutes || currentMinutes < endMinutes
        } else {
            currentMinutes in startMinutes until endMinutes
        }
    }

    private fun recordEvent(type: String, timestamp: Long) {
        val existing = recentEventsByType[type]
        if (existing == null || (timestamp - existing.second) > 10 * 60 * 1000L) {
            recentEventsByType[type] = Pair(1, timestamp)
        } else {
            recentEventsByType[type] = Pair(existing.first + 1, timestamp)
        }
    }

    fun reset() {
        sentAlertIds.clear()
        recentEventsByType.clear()
        groupingBuffer.clear()
    }
}
