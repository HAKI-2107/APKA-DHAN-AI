package com.apkadhan.ai.core.engine.security

import org.junit.Assert.*
import org.junit.Test

/**
 * Unit Tests for QR and Link Security Module (Android Runtime)
 * Tests Function 1 (QR Scanner), Function 2 (Link Analyzer), and Threat Intelligence interfaces.
 */
class QRLinkSecurityTest {

    @Test
    fun testFunction1_QrExtraction() {
        val upiQr = "upi://pay?pa=store.billing@okaxis&pn=MetroSupermarket&am=1250.50&tn=Groceries&mode=02&mc=5411"
        val extracted = QRSecurityScanner.parsePayload(upiQr)

        assertEquals(QRType.UPI_PAYMENT, extracted.payloadType)
        assertEquals("store.billing@okaxis", extracted.upiId)
        assertEquals("MetroSupermarket", extracted.merchantName)
        assertEquals(1250.50, extracted.amount)
        assertEquals("Groceries", extracted.transactionNote)
        assertEquals("02", extracted.otherEncodedInfo.mode)
        assertEquals("5411", extracted.otherEncodedInfo.merchantCategoryCode)
    }

    @Test
    fun testFunction2_LinkExtraction() {
        val url = "https://auth.secure.sbi-kyc-verify.top/download/portal.apk?user=88&redirect=https://evil.com"
        val analysis = LinkSecurityAnalyzer.analyze(url)

        assertEquals("sbi-kyc-verify.top", analysis.domain)
        assertEquals("auth.secure", analysis.subdomain)
        assertEquals("/download/portal.apk", analysis.path)
        assertEquals("https://evil.com", analysis.openRedirectTarget)

        val codes = analysis.suspiciousPatterns.map { it.code }
        assertTrue(codes.contains("HIGH_ABUSE_TLD"))
        assertTrue(codes.contains("FINANCIAL_BRAND_SPOOF"))
        assertTrue(codes.contains("DANGEROUS_PAYLOAD_EXTENSION"))
    }

    @Test
    fun testDoNotInventReputation() {
        val provider = ApkaDhanCentralThreatRegistry()
        kotlinx.coroutines.runBlocking {
            val res = provider.lookupDomain("unknown-clean-store.in")
            assertEquals(ThreatVerdict.NOT_FOUND_OR_UNRATED, res.verdict)
            assertFalse(res.hasReputationData)
        }
    }
}
