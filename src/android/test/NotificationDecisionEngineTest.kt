package com.apkadhan.ai.android.test

import com.apkadhan.ai.notification.*
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test

class NotificationDecisionEngineTest {

    private lateinit var decisionEngine: NotificationDecisionEngine

    @Before
    fun setup() {
        decisionEngine = NotificationDecisionEngine()
    }

    @Test
    fun testCriticalSecurityAlerts_alwaysSendNow() {
        val criticalEvent = AlertEvent(
            id = "alert_crit_1",
            type = AlertType.SECURITY,
            severity = AlertSeverity.CRITICAL,
            title = "Digital Arrest Phishing",
            summary = "Phishing threat detected",
            createdAt = "2026-09-28T09:00:00Z",
            source = "CERT-In"
        )

        val result = decisionEngine.evaluate(criticalEvent)
        assertEquals(NotificationDecisionType.SEND_NOW, result.decision)
    }

    @Test
    fun testDeduplication_suppressesDuplicateAlertId() {
        val event = AlertEvent(
            id = "alert_dup_1",
            type = AlertType.PAYMENT,
            severity = AlertSeverity.HIGH,
            title = "Suspicious Collect Request",
            summary = "Potential fraud trap",
            createdAt = "2026-09-28T09:00:00Z",
            source = "PaymentSecurityEngine"
        )

        val first = decisionEngine.evaluate(event)
        assertEquals(NotificationDecisionType.SEND_NOW, first.decision)

        // Same ID delivered again must be suppressed
        val second = decisionEngine.evaluate(event)
        assertEquals(NotificationDecisionType.SUPPRESS, second.decision)
        assertTrue(second.reason.contains("Deduplicated"))
    }

    @Test
    fun testDisabledCategory_isSuppressed() {
        val prefs = NotificationPreferences(cryptoEnabled = false)
        val cryptoEvent = AlertEvent(
            id = "alert_crypto_1",
            type = AlertType.CRYPTO,
            severity = AlertSeverity.MEDIUM,
            title = "Crypto movement",
            summary = "Solana moved 8%",
            createdAt = "2026-09-28T09:00:00Z",
            source = "LiveCryptoDataProvider"
        )

        val result = decisionEngine.evaluate(cryptoEvent, preferences = prefs)
        assertEquals(NotificationDecisionType.SUPPRESS, result.decision)
        assertTrue(result.reason.contains("disabled"))
    }

    @Test
    fun testSubThresholdStockMovement_isSuppressed() {
        val event = AlertEvent(
            id = "alert_stock_minor",
            type = AlertType.STOCK,
            severity = AlertSeverity.INFO,
            title = "Reliance moved",
            summary = "Price shifted slightly",
            createdAt = "2026-09-28T09:00:00Z",
            source = "LiveMarketDataProvider",
            metadata = mapOf("changePercent" to 0.15)
        )

        val result = decisionEngine.evaluate(event)
        assertEquals(NotificationDecisionType.SUPPRESS, result.decision)
    }

    @Test
    fun testContentEngine_masksCredentialsAndUPIPin() {
        val event = AlertEvent(
            id = "alert_sec_mask",
            type = AlertType.SECURITY,
            severity = AlertSeverity.HIGH,
            title = "Fake Payment Link",
            summary = "Request asks to enter pin: 1234 on account 987654321098 immediately",
            createdAt = "2026-09-28T09:00:00Z",
            source = "QRLinkSecurity"
        )

        val formatted = NotificationContentEngine.format(event)
        assertFalse("Full account number should be masked", formatted.body.contains("987654321098"))
        assertTrue("Masking indicator should be present", formatted.body.contains("•••masked•••") || formatted.body.contains("••••"))
        assertTrue("PIN should be masked", formatted.body.contains("PIN: ••••"))
    }
}
