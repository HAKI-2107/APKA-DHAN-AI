package com.apkadhan.ai.core.investment

import kotlinx.coroutines.runBlocking
import org.junit.Assert.*
import org.junit.Test

/**
 * ANDROID UNIT TESTS - INVESTMENT SCAM DETECTOR
 * Uses 100% synthetic fictitious test vectors (No real user data).
 */
class InvestmentScamTest {

    private val detector = InvestmentScamDetector()

    @Test
    fun testGuaranteedReturnAndPersonalPayment_EvaluatesToHighRisk() = runBlocking {
        val input = InvestmentScamInput(
            text = "Join our VIP club for a 100% guaranteed return. Transfer funds to personal savings a/c of Ramesh.",
            sourceType = InvestmentSourceType.WHATSAPP_MESSAGE
        )

        val result = detector.analyze(input)

        assertEquals(ScamRiskLevel.HIGH_RISK, result.riskLevel)
        assertTrue(result.signals.any { it.code == "GUARANTEED_RETURNS" })
        assertTrue(result.signals.any { it.code == "REQUESTS_FOR_PERSONAL_PAYMENT" })
        assertTrue(result.evidence.isNotEmpty())
        assertTrue(result.verificationSteps.isNotEmpty())
        assertTrue(result.sourceRequirements.isNotEmpty())
    }

    @Test
    fun testWeakEvidence_DoesNotAccuseOfFraud() = runBlocking {
        val input = InvestmentScamInput(
            text = "Join our weekend stock market educational lecture series.",
            sourceType = InvestmentSourceType.INVESTMENT_ADVERTISEMENT
        )

        val result = detector.analyze(input)

        assertNotEquals(ScamRiskLevel.HIGH_RISK, result.riskLevel)
        assertEquals(ScamRiskLevel.LOW_RISK, result.riskLevel)
    }

    @Test
    fun testRegulatoryAdapter_ZeroFabrication() = runBlocking {
        val adapter = DefaultRegulatoryAdapter()

        val check = adapter.verifyEntity(
            RegulatoryEntityQuery(
                registrationNumber = "INH999999999",
                entityName = "Fake Crypto Advisory"
            )
        )

        assertEquals(RegulatoryVerificationStatus.NOT_FOUND_OR_UNVERIFIED, check.status)
        assertFalse(check.hasFabricatedData)
    }
}
