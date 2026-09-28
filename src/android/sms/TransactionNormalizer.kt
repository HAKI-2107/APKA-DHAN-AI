package com.apkadhan.ai.core.sms

import java.text.SimpleDateFormat
import java.util.*

/**
 * APKA DHAN AI - TRANSACTION NORMALIZER (Kotlin Clean Architecture)
 *
 * Normalizes amount, transaction type, masked account, merchant, and reference tokens.
 */
object TransactionNormalizer {

    fun normalizeAmount(rawToken: String?): FieldConfidence<Double> {
        if (rawToken == null) return FieldConfidence(0.0, ConfidenceLevel.LOW)

        val hasCurrency = Regex("(?:rs\\.?|inr|₹)", RegexOption.IGNORE_CASE).containsMatchIn(rawToken)
        val withoutPrefix = rawToken.replace(Regex("(?:rs\\.?|inr|₹)", RegexOption.IGNORE_CASE), "").replace(",", "").trim()
        val num = withoutPrefix.toDoubleOrNull() ?: 0.0

        val hasDecimal = withoutPrefix.contains(".")
        val conf = when {
            hasCurrency && hasDecimal -> ConfidenceLevel.HIGH
            hasCurrency || hasDecimal -> ConfidenceLevel.MEDIUM
            else -> ConfidenceLevel.LOW
        }

        return FieldConfidence(num, conf, "CURRENCY_PREFIX_NUMERIC", rawToken)
    }

    fun normalizeTransactionType(text: String): FieldConfidence<TransactionType> {
        val lower = text.lowercase()
        return when {
            lower.contains("collect request") || lower.contains("requested from you") ->
                FieldConfidence(TransactionType.COLLECT_REQUEST, ConfidenceLevel.HIGH, "COLLECT_KEYWORD")
            lower.contains("refund") || lower.contains("reversed") ->
                FieldConfidence(TransactionType.REFUND, ConfidenceLevel.HIGH, "REFUND_KEYWORD")
            lower.contains("debited") || lower.contains("sent") || lower.contains("paid") || lower.contains("spent") ->
                FieldConfidence(TransactionType.DEBIT, ConfidenceLevel.HIGH, "DEBIT_VERB")
            lower.contains("credited") || lower.contains("received") || lower.contains("deposited") ->
                FieldConfidence(TransactionType.CREDIT, ConfidenceLevel.HIGH, "CREDIT_VERB")
            else -> FieldConfidence(TransactionType.UNKNOWN, ConfidenceLevel.LOW, "NO_CLEAR_VERB")
        }
    }

    fun normalizeMaskedAccount(rawToken: String?): FieldConfidence<String?> {
        if (rawToken == null) return FieldConfidence(null, ConfidenceLevel.LOW)
        val digitsMatch = Regex("(\\d{3,6})\\b").find(rawToken)
        return if (digitsMatch != null) {
            val last4 = digitsMatch.groupValues[1].takeLast(4)
            FieldConfidence("XX$last4", ConfidenceLevel.HIGH, "ACCOUNT_TAIL_MASK", rawToken)
        } else {
            FieldConfidence(null, ConfidenceLevel.LOW)
        }
    }

    fun normalizeMerchant(rawToken: String?): FieldConfidence<String?> {
        if (rawToken == null) return FieldConfidence(null, ConfidenceLevel.LOW)
        var cleaned = rawToken.trim()
            .replace(Regex("^(?:to|towards|at|for|paid to|sent to)\\s+", RegexOption.IGNORE_CASE), "")
            .replace(Regex("^upi/", RegexOption.IGNORE_CASE), "")
            .replace(Regex("/\\d{6,16}$"), "")
            .replace(Regex("\\s+via\\s+upi\\b", RegexOption.IGNORE_CASE), "")
            .trim()

        if (cleaned.length < 2) return FieldConfidence(null, ConfidenceLevel.LOW)

        val formatted = if (cleaned.length > 2 && cleaned.matches(Regex("^[A-Z0-9\\s._]+$"))) {
            cleaned.split(" ").joinToString(" ") { it.lowercase().replaceFirstChar { c -> c.uppercase() } }
        } else cleaned

        return FieldConfidence(formatted, ConfidenceLevel.HIGH, "MERCHANT_CLEANED", rawToken)
    }

    fun normalizeReferenceId(rawToken: String?): FieldConfidence<String?> {
        if (rawToken == null) return FieldConfidence(null, ConfidenceLevel.LOW)
        val clean = rawToken.filter { it.isDigit() }
        return if (clean.length == 12) {
            FieldConfidence(clean, ConfidenceLevel.HIGH, "12_DIGIT_UTR", rawToken)
        } else if (clean.length in 6..20) {
            FieldConfidence(clean, ConfidenceLevel.MEDIUM, "GENERIC_REF_DIGITS", rawToken)
        } else {
            FieldConfidence(null, ConfidenceLevel.LOW)
        }
    }

    fun normalizeUpiId(text: String): FieldConfidence<String?> {
        val match = Regex("\\b([a-zA-Z0-9.\\-_]{2,256}@[a-zA-Z]{2,64})\\b").find(text)
        return if (match != null) {
            FieldConfidence(match.groupValues[1].lowercase(), ConfidenceLevel.HIGH, "STANDARD_VPA", text)
        } else {
            FieldConfidence(null, ConfidenceLevel.LOW)
        }
    }

    fun normalizeTimestamp(rawDateStr: String?, fallbackMs: Long = System.currentTimeMillis()): Pair<FieldConfidence<Long>, String> {
        val sdf = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US).apply {
            timeZone = TimeZone.getTimeZone("UTC")
        }
        val iso = sdf.format(Date(fallbackMs))
        return Pair(FieldConfidence(fallbackMs, ConfidenceLevel.MEDIUM, "FALLBACK_EPOCH"), iso)
    }
}
