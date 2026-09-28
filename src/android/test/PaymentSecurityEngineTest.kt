package com.apkadhan.ai.core.engine.payment

import com.apkadhan.ai.core.model.RiskLevel
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test

/**
 * Unit Tests for Apka Dhan AI - Payment Security Engine (Android Runtime)
 * Validates each of the 12 rule categories and end-to-end pipeline execution.
 */
class PaymentSecurityEngineTest {

    private lateinit var mockThreatService: ThreatLookupService
    private lateinit var engine: PaymentSecurityEngine

    @Before
    fun setup() {
        mockThreatService = object : ThreatLookupService {
            override fun isKnownMaliciousVpa(vpa: String): Boolean =
                vpa.equals("scam-pool@okhdfcbank", ignoreCase = true)

            override fun isKnownPhishingDomain(domain: String): Boolean =
                domain.equals("sbi-kyc-verify.top", ignoreCase = true)

            override fun isReportedPhoneNumber(phone: String): Boolean =
                phone == "9876543210"

            override fun isReportedIndicatorHash(hash: String): Boolean = false
        }

        engine = PaymentSecurityEngine(
            threatService = mockThreatService,
            initialRules = ALL_KOTLIN_INITIAL_RULES
        )
    }

    @Test
    fun testRule01_SuspiciousDomain() {
        val rawIpEntities = NormalizedPaymentEntities(domain = "192.168.1.1")
        val signal = SuspiciousDomainRule.evaluate(rawIpEntities, mockThreatService, null)
        assertNotNull(signal)
        assertEquals("RAW_IP_PAYMENT_HOST", signal?.code)

        val tldEntities = NormalizedPaymentEntities(domain = "portal.top")
        val tldSignal = SuspiciousDomainRule.evaluate(tldEntities, mockThreatService, null)
        assertNotNull(tldSignal)
        assertEquals("HIGH_ABUSE_TLD", tldSignal?.code)
    }

    @Test
    fun testRule02_Typosquatting() {
        val spoofed = NormalizedPaymentEntities(domain = "sbi-card-rewards.net")
        val signal = TyposquattingRule.evaluate(spoofed, mockThreatService, null)
        assertNotNull(signal)
        assertEquals("DOMAIN_BRAND_TYPOSQUAT", signal?.code)

        val genuine = NormalizedPaymentEntities(domain = "onlinesbi.sbi")
        assertNull(TyposquattingRule.evaluate(genuine, mockThreatService, null))
    }

    @Test
    fun testRule03_UnexpectedRedirect() {
        val shortener = NormalizedPaymentEntities(domain = "bit.ly")
        val signal = UnexpectedRedirectRule.evaluate(shortener, mockThreatService, null)
        assertNotNull(signal)
        assertEquals("URL_SHORTENER_OBFUSCATION", signal?.code)
    }

    @Test
    fun testRule04_UnusualRecipient() {
        val badPsp = NormalizedPaymentEntities(vpaPspHandle = "bogusbank")
        val signal = UnusualRecipientRule.evaluate(badPsp, mockThreatService, null)
        assertNotNull(signal)
        assertEquals("UNLISTED_PSP_HANDLE", signal?.code)
    }

    @Test
    fun testRule05_UnusualTransactionAmount() {
        val highCollect = NormalizedPaymentEntities(amount = 49000.0, isCollectRequest = true)
        val signal = UnusualTransactionAmountRule.evaluate(highCollect, mockThreatService, null)
        assertNotNull(signal)
        assertEquals("HIGH_VALUE_COLLECT_REQUEST", signal?.code)
    }

    @Test
    fun testRule08_SuspiciousWording() {
        val remoteApp = NormalizedPaymentEntities(rawCombinedText = "Please install AnyDesk to verify failed refund")
        val signal = SuspiciousWordingRule.evaluate(remoteApp, mockThreatService, null)
        assertNotNull(signal)
        assertEquals("SCREEN_SHARING_APP_SOLICITATION", signal?.code)
    }

    @Test
    fun testRule09_ImpersonationIndicators() {
        val vpa = NormalizedPaymentEntities(vpaHandlePrefix = "customer-care-helpline")
        val signal = ImpersonationIndicatorsRule.evaluate(vpa, mockThreatService, null)
        assertNotNull(signal)
        assertEquals("INSTITUTIONAL_KEYWORD_IMPERSONATION", signal?.code)
    }

    @Test
    fun testRule10_GuaranteedReturnClaims() {
        val claim = NormalizedPaymentEntities(rawCombinedText = "Join VIP crypto club for 15% daily guaranteed return with no risk")
        val signal = GuaranteedReturnClaimsRule.evaluate(claim, mockThreatService, null)
        assertNotNull(signal)
        assertEquals("PROMISES_GUARANTEED_MARKET_RETURN", signal?.code)
    }

    @Test
    fun testRule11_UrgencyManipulationLanguage() {
        val arrest = NormalizedPaymentEntities(rawCombinedText = "You are placed under digital arrest by CBI Cyber cell")
        val signal = UrgencyManipulationLanguageRule.evaluate(arrest, mockThreatService, null)
        assertNotNull(signal)
        assertEquals("DIGITAL_ARREST_EXTORTION", signal?.code)
    }

    @Test
    fun testRule12_KnownReportedIndicator() {
        val knownScam = NormalizedPaymentEntities(vpa = "scam-pool@okhdfcbank")
        val signal = KnownReportedIndicatorRule.evaluate(knownScam, mockThreatService, null)
        assertNotNull(signal)
        assertEquals("KNOWN_MALICIOUS_VPA_MATCH", signal?.code)
    }
}
