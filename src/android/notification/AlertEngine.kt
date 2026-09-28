package com.apkadhan.ai.notification

/**
 * APKA DHAN AI - ANDROID CENTRAL ALERT ENGINE
 *
 * Single authoritative orchestrator for all application events:
 * EVENT -> ALERT ENGINE -> ALERT EVENT -> NOTIFICATION DECISION -> NOTIFICATION CONTENT -> NOTIFICATION DELIVERY
 *
 * Ensures no individual screen calls Android notification APIs directly.
 */

data class AlertProcessResult(
    val event: AlertEvent,
    val decision: NotificationDecisionType,
    val delivered: Boolean,
    val notification: FormattedNotification? = null
)

class AlertEngine(
    private val localNotificationManager: LocalNotificationManager? = null,
    private val decisionEngine: NotificationDecisionEngine = NotificationDecisionEngine(),
    private var preferences: NotificationPreferences = NotificationPreferences()
) {
    private val events = mutableListOf<AlertEvent>()

    init {
        seedDefaultAlerts()
    }

    private fun seedDefaultAlerts() {
        events.add(
            AlertEvent(
                id = "alt_001",
                type = AlertType.PAYMENT,
                severity = AlertSeverity.HIGH,
                title = "UPI Collect-Request Fraud Campaign",
                summary = "Deceptive Electricity Bill Disconnection collect requests targeting users.",
                details = "Attackers send collect requests claiming disconnection unless payment is authorized.",
                createdAt = "2026-09-28T08:00:00Z",
                source = "Reserve Bank of India (RBI Advisory)",
                deepLink = "apkaDhan://alerts/alt_001",
                requiresAction = true,
                isRead = false,
                isTest = false
            )
        )
        events.add(
            AlertEvent(
                id = "alt_002",
                type = AlertType.INVESTMENT,
                severity = AlertSeverity.CRITICAL,
                title = "Digital Arrest & Forged SEBI Certificates",
                summary = "Impersonators posing as CBI / SEBI officers demanding instant deposits.",
                details = "Scammers utilize forged letterheads demanding security bail deposits.",
                createdAt = "2026-09-28T07:00:00Z",
                source = "CERT-In Vulnerability Advisory",
                deepLink = "apkaDhan://alerts/alt_002",
                requiresAction = true,
                isRead = false,
                isTest = false
            )
        )
    }

    fun getAllAlerts(): List<AlertEvent> = events.toList()

    fun getAlertById(id: String): AlertEvent? = events.find { it.id == id }

    fun markAsRead(id: String): Boolean {
        val index = events.indexOfFirst { it.id == id }
        if (index != -1) {
            events[index] = events[index].copy(isRead = true)
            return true
        }
        return false
    }

    fun updatePreferences(newPrefs: NotificationPreferences) {
        preferences = newPrefs
    }

    fun getPreferences(): NotificationPreferences = preferences

    /**
     * Central ingestion point for all events
     */
    fun processEvent(event: AlertEvent): AlertProcessResult {
        // 1. Evaluate via Decision Engine
        val eval = decisionEngine.evaluate(event, preferences)

        // 2. Persist in alert repository
        if (events.none { it.id == event.id }) {
            events.add(0, event)
        }

        // 3. Handle Suppress
        if (eval.decision == NotificationDecisionType.SUPPRESS) {
            return AlertProcessResult(event, eval.decision, delivered = false)
        }

        // 4. Handle Group
        if (eval.decision == NotificationDecisionType.GROUP && eval.groupedEvents != null) {
            val content = NotificationContentEngine.formatGrouped(eval.groupedEvents, event.type)
            val delivered = dispatchToSystem(content, event.id.hashCode())
            return AlertProcessResult(event, eval.decision, delivered, content)
        }

        // 5. Handle Send Now
        if (eval.decision == NotificationDecisionType.SEND_NOW) {
            val content = NotificationContentEngine.format(event, preferences)
            val delivered = dispatchToSystem(content, event.id.hashCode(), isCritical = event.severity == AlertSeverity.CRITICAL)
            return AlertProcessResult(event, eval.decision, delivered, content)
        }

        // 6. Handle Delay
        return AlertProcessResult(event, eval.decision, delivered = false)
    }

    private fun dispatchToSystem(content: FormattedNotification, notificationId: Int, isCritical: Boolean = false): Boolean {
        return localNotificationManager?.showNotification(
            id = notificationId,
            channelId = content.channelId,
            title = content.title,
            body = content.body,
            alertId = content.deepLink.substringAfterLast("/"),
            isCritical = isCritical,
            isTest = content.isTest
        ) ?: false
    }

    fun reset() {
        decisionEngine.reset()
    }
}
