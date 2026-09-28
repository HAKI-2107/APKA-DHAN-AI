package com.apkadhan.ai.core.sms

/**
 * APKA DHAN AI - PARSER REGISTRY (Kotlin Clean Architecture)
 *
 * Central router matching incoming SMS to bank-specific offline parsers.
 */
class ParserRegistry {
    private val parsers = mutableListOf<MessageParser>()

    init {
        registerParser(HdfcMessageParser())
        registerParser(SbiMessageParser())
        registerParser(IciciMessageParser())
        registerParser(AxisMessageParser())
        registerParser(KotakMessageParser())
        registerParser(GenericUpiMessageParser())
    }

    fun registerParser(parser: MessageParser) {
        val existing = parsers.indexOfFirst { it.providerId == parser.providerId }
        if (existing >= 0) {
            parsers[existing] = parser
        } else {
            parsers.add(parser)
        }
    }

    fun parseMessage(input: RawMessageInput): ParseResult {
        val body = input.body.trim()
        if (body.isEmpty()) {
            return ParseResult(false, null, "EMPTY_MESSAGE", "Supplied message was empty.")
        }

        // Quick non-transactional pre-filter
        val lower = body.lowercase()
        val isOtp = (lower.contains("otp") || lower.contains("verification code")) &&
                !lower.contains("debited") && !lower.contains("credited") && !lower.contains("paid") && !lower.contains("sent")
        if (isOtp) {
            return ParseResult(false, null, "NON_TRANSACTIONAL_MESSAGE", "Authentication OTP message.")
        }

        // 1. Try matching bank parser
        for (parser in parsers) {
            if (parser.providerId != "generic_upi" && parser.canParse(input)) {
                val res = parser.parse(input)
                if (res.success || res.errorReason == "NON_TRANSACTIONAL_MESSAGE") {
                    return res
                }
            }
        }

        // 2. Generic fallback
        val generic = parsers.find { it.providerId == "generic_upi" }
        if (generic != null && generic.canParse(input)) {
            val res = generic.parse(input)
            if (res.success || res.errorReason == "NON_TRANSACTIONAL_MESSAGE") {
                return res
            }
        }

        return ParseResult(false, null, "UNSUPPORTED_PROVIDER", "No registered bank pattern matched.")
    }
}

// Bank Specific Kotlin Parsers
class HdfcMessageParser : BaseMessageParser() {
    override val name = "HDFC Bank SMS Parser"
    override val providerId = "hdfc_bank"
    override val supportedSenderPatterns = listOf(Regex(".*HDFCBK.*", RegexOption.IGNORE_CASE))

    override fun matchesBodyKeywords(body: String) = body.lowercase().contains("hdfc")

    override fun internalParse(input: RawMessageInput): ParseResult {
        val body = input.body
        val type = TransactionNormalizer.normalizeTransactionType(body)
        val amtMatch = Regex("(?:rs\\.?|inr)\\s*([\\d,]+(?:\\.\\d{1,2})?)", RegexOption.IGNORE_CASE).find(body)
        val amount = TransactionNormalizer.normalizeAmount(amtMatch?.value)
        val acctMatch = Regex("(?:a/c|account)[\\s\\w.]*[*xX]*(\\d{3,6})\\b", RegexOption.IGNORE_CASE).find(body)
        val account = TransactionNormalizer.normalizeMaskedAccount(acctMatch?.value)
        val merchantMatch = Regex("\\bto\\s+([A-Za-z0-9\\s._&-]+?)(?:\\s+on|\\s+via|\\s+ref|\\.|$)", RegexOption.IGNORE_CASE).find(body)
        val merchant = TransactionNormalizer.normalizeMerchant(merchantMatch?.groupValues?.get(1))
        val refMatch = Regex("(?:ref(?:\\s+no\\.?)?|utr)\\s*:?\\s*([0-9]{8,16})", RegexOption.IGNORE_CASE).find(body)
        val ref = TransactionNormalizer.normalizeReferenceId(refMatch?.groupValues?.get(1))
        val upi = TransactionNormalizer.normalizeUpiId(body)
        val (ts, iso) = TransactionNormalizer.normalizeTimestamp(null, input.timestampEpochMs)

        return ParseResult(
            success = true,
            record = NormalizedTransactionRecord(
                id = "TXN-HDFC-${ref.value ?: System.currentTimeMillis()}",
                bankOrProvider = "HDFC Bank",
                transactionType = type,
                amount = amount,
                merchant = merchant,
                maskedAccount = account,
                upiIdentifier = upi,
                timestamp = ts,
                isoDateString = iso,
                referenceId = ref,
                overallConfidence = ConfidenceLevel.HIGH
            ),
            matchedParserName = name
        )
    }
}

class SbiMessageParser : BaseMessageParser() {
    override val name = "SBI SMS Parser"
    override val providerId = "sbi_bank"
    override val supportedSenderPatterns = listOf(Regex(".*SBIINB.*", RegexOption.IGNORE_CASE))
    override fun matchesBodyKeywords(body: String) = body.lowercase().contains("sbi")
    override fun internalParse(input: RawMessageInput): ParseResult = HdfcMessageParser().parse(input)
}

class IciciMessageParser : BaseMessageParser() {
    override val name = "ICICI Bank SMS Parser"
    override val providerId = "icici_bank"
    override val supportedSenderPatterns = listOf(Regex(".*ICICIB.*", RegexOption.IGNORE_CASE))
    override fun matchesBodyKeywords(body: String) = body.lowercase().contains("icici")
    override fun internalParse(input: RawMessageInput): ParseResult = HdfcMessageParser().parse(input)
}

class AxisMessageParser : BaseMessageParser() {
    override val name = "Axis Bank SMS Parser"
    override val providerId = "axis_bank"
    override val supportedSenderPatterns = listOf(Regex(".*AXISBK.*", RegexOption.IGNORE_CASE))
    override fun matchesBodyKeywords(body: String) = body.lowercase().contains("axis")
    override fun internalParse(input: RawMessageInput): ParseResult = HdfcMessageParser().parse(input)
}

class KotakMessageParser : BaseMessageParser() {
    override val name = "Kotak Bank SMS Parser"
    override val providerId = "kotak_bank"
    override val supportedSenderPatterns = listOf(Regex(".*KOTAKB.*", RegexOption.IGNORE_CASE))
    override fun matchesBodyKeywords(body: String) = body.lowercase().contains("kotak")
    override fun internalParse(input: RawMessageInput): ParseResult = HdfcMessageParser().parse(input)
}

class GenericUpiMessageParser : BaseMessageParser() {
    override val name = "Generic UPI Parser"
    override val providerId = "generic_upi"
    override val supportedSenderPatterns = listOf(Regex(".*UPI.*", RegexOption.IGNORE_CASE), Regex(".*PHONEPE.*", RegexOption.IGNORE_CASE))
    override fun matchesBodyKeywords(body: String) = body.lowercase().contains("upi") || body.lowercase().contains("paid")
    override fun internalParse(input: RawMessageInput): ParseResult = HdfcMessageParser().parse(input)
}
