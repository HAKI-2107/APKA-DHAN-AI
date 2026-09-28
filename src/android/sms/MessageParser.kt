package com.apkadhan.ai.core.sms

/**
 * APKA DHAN AI - ANDROID TRANSACTION MESSAGE ANALYSIS CONTRACT
 *
 * Defines contracts and data classes for on-device financial message parsing.
 *
 * PRIVACY SPECIFICATIONS:
 * 1. Operates offline without network permissions.
 * 2. Never sends raw SMS to any remote server.
 * 3. Does not retain raw SMS body text in database storage.
 * 4. Exposes granular field-level confidence ratings.
 */

enum class TransactionType {
    DEBIT,
    CREDIT,
    COLLECT_REQUEST,
    REFUND,
    UNKNOWN
}

enum class ConfidenceLevel {
    HIGH,
    MEDIUM,
    LOW
}

data class FieldConfidence<T>(
    val value: T,
    val confidence: ConfidenceLevel,
    val patternMatched: String? = null,
    val sourceToken: String? = null
)

data class RawMessageInput(
    val senderId: String? = null,
    val body: String,
    val timestampEpochMs: Long = System.currentTimeMillis()
)

data class NormalizedTransactionRecord(
    val id: String,
    val bankOrProvider: String,
    val transactionType: FieldConfidence<TransactionType>,
    val amount: FieldConfidence<Double>,
    val currency: String = "INR",
    val merchant: FieldConfidence<String?>,
    val maskedAccount: FieldConfidence<String?>,
    val upiIdentifier: FieldConfidence<String?>,
    val timestamp: FieldConfidence<Long>,
    val isoDateString: String,
    val referenceId: FieldConfidence<String?>,
    val balanceAfterTransaction: Double? = null,
    val overallConfidence: ConfidenceLevel,
    val parsedAtEpochMs: Long = System.currentTimeMillis()
)

data class ParseResult(
    val success: Boolean,
    val record: NormalizedTransactionRecord? = null,
    val errorReason: String? = null,
    val details: String? = null,
    val matchedParserName: String? = null
)

interface MessageParser {
    val name: String
    val providerId: String
    val supportedSenderPatterns: List<Regex>

    fun canParse(input: RawMessageInput): Boolean
    fun parse(input: RawMessageInput): ParseResult
}

abstract class BaseMessageParser : MessageParser {

    override fun canParse(input: RawMessageInput): Boolean {
        val sender = (input.senderId ?: "").uppercase()
        if (sender.isNotEmpty() && supportedSenderPatterns.any { it.containsMatchIn(sender) }) {
            return true
        }
        return matchesBodyKeywords(input.body)
    }

    protected abstract fun matchesBodyKeywords(body: String): Boolean
    protected abstract fun internalParse(input: RawMessageInput): ParseResult

    override fun parse(input: RawMessageInput): ParseResult {
        val body = input.body.trim()
        if (body.isEmpty()) {
            return ParseResult(
                success = false,
                errorReason = "EMPTY_MESSAGE",
                details = "Message body was blank.",
                matchedParserName = name
            )
        }

        if (isNonTransactionalMessage(body)) {
            return ParseResult(
                success = false,
                errorReason = "NON_TRANSACTIONAL_MESSAGE",
                details = "Message contains an authentication OTP or promotional notice, not a financial transaction.",
                matchedParserName = name
            )
        }

        return try {
            internalParse(input)
        } catch (e: Exception) {
            ParseResult(
                success = false,
                errorReason = "PARSE_FAILED",
                details = "Parser '$name' error: ${e.message}",
                matchedParserName = name
            )
        }
    }

    protected fun isNonTransactionalMessage(body: String): Boolean {
        val lower = body.lowercase()
        val isOtp = (lower.contains("otp") || lower.contains("verification code")) &&
                !lower.contains("debited") && !lower.contains("credited") && !lower.contains("paid") && !lower.contains("sent")
        if (isOtp) return true

        val isPromo = (lower.contains("pre-approved loan") || lower.contains("apply now")) &&
                !lower.contains("debited") && !lower.contains("credited")
        return isPromo
    }
}
