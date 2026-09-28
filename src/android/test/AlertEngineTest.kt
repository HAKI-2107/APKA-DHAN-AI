package com.apkadhan.ai.android.test

import com.apkadhan.ai.notification.*
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test

class AlertEngineTest {

    private lateinit var engine: AlertEngine

    @Before
    fun setup() {
        engine = AlertEngine()
    }

    @Test
    fun testAlertEngine_initializesWithDefaultSeedAlerts() {
        val alerts = engine.getAllAlerts()
        assertTrue("Should have default seeded alerts", alerts.isNotEmpty())
        assertTrue("Should have RBI advisory", alerts.any { it.source.contains("RBI") })
    }

    @Test
    fun testAlertEngine_marksAlertAsRead() {
        val firstId = engine.getAllAlerts().first().id
        val success = engine.markAsRead(firstId)
        assertTrue(success)

        val updated = engine.getAlertById(firstId)
        assertNotNull(updated)
        assertTrue(updated!!.isRead)
    }

    @Test
    fun testAlertEngine_processesNewEventSuccessfully() {
        val newEvent = AlertEvent(
            id = "alert_test_999",
            type = AlertType.INVESTMENT,
            severity = AlertSeverity.HIGH,
            title = "Unverified Guaranteed Yield Offer",
            summary = "Entity promises 150% monthly returns without SEBI license",
            createdAt = "2026-09-28T09:15:00Z",
            source = "InvestmentScamDetector",
            requiresAction = true
        )

        val res = engine.processEvent(newEvent)
        assertEquals(NotificationDecisionType.SEND_NOW, res.decision)
        assertEquals(newEvent.id, res.event.id)

        // Must now be present in the alert engine registry
        val retrieved = engine.getAlertById("alert_test_999")
        assertNotNull(retrieved)
        assertEquals("Unverified Guaranteed Yield Offer", retrieved!!.title)
    }
}
