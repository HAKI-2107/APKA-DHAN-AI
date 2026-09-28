package com.apkadhan.ai.core.sms

import org.junit.Assert.*
import org.junit.Test

/**
 * ANDROID UNIT TESTS - TRANSACTION MESSAGE ANALYSIS
 * Uses strictly synthetic, fictitious sample messages (NO real user data).
 */
class TransactionMessageAnalysisTest {

    private val syntheticHdfcDebit = RawMessageInput(
        senderId = "VK-HDFCBK",
        body = "Sent Rs. 1,500.00 from HDFC Bank A/C **1234 to SWIGGY on 25-SEP-24 via UPI. Ref 426811223344. Bal Rs 45,210.00"
    )

    private val syntheticOtp = RawMessageInput(
        senderId = "VK-HDFCBK",
        body = "998811 is your OTP for NetBanking login. Valid for 10 mins. Do not share."
    )

    @Test
    fun testOfflineParser_ExtractsHdfcFields() {
        val registry = ParserRegistry()
        val result = registry.parseMessage(syntheticHdfcDebit)

        assertTrue(result.success)
        val record = result.record
        assertNotNull(record)
        assertEquals("HDFC Bank", record?.bankOrProvider)
        assertEquals(TransactionType.DEBIT, record?.transactionType?.value)
        assertEquals(1500.0, record?.amount?.value ?: 0.0, 0.01)
        assertEquals("Swiggy", record?.merchant?.value)
        assertEquals("XX1234", record?.maskedAccount?.value)
        assertEquals("426811223344", record?.referenceId?.value)
        assertEquals(ConfidenceLevel.HIGH, record?.overallConfidence)
    }

    @Test
    fun testOfflinePrivacy_RejectsOtpWithoutCrash() {
        val registry = ParserRegistry()
        val result = registry.parseMessage(syntheticOtp)

        assertFalse(result.success)
        assertEquals("NON_TRANSACTIONAL_MESSAGE", result.errorReason)
        assertNull(result.record)
    }

    @Test
    fun testTransactionRepository_ZeroRawSmsStorage() {
        val registry = ParserRegistry()
        val repo = TransactionRepository()

        val parseRes = registry.parseMessage(syntheticHdfcDebit)
        assertTrue(parseRes.success)
        parseRes.record?.let { repo.save(it) }

        val audit = repo.getPrivacyAuditMetrics()
        assertEquals(1, audit["totalRecordsStored"])
        assertEquals(0, audit["rawMessageContentRetainedCount"])
        assertEquals("ON_DEVICE_ENCRYPTED_SQLITE", audit["storageLocation"])
    }
}
