package com.apkadhan.ai.core.engine.payment

import com.apkadhan.ai.core.model.RiskLevel
import java.net.URI
import java.util.regex.Pattern

/**
 * APKA DHAN AI - PAYMENT SECURITY ENGINE (Android Clean Architecture Runtime)
 *
 * Modular 10-Stage Pipeline:
 * INPUT → VALIDATION → EXTRACTION → NORMALIZATION → THREAT LOOKUP
 * → RULE ANALYSIS → BEHAVIORAL ANALYSIS → ML ANALYSIS → RISK AGGREGATION → EXPLANATION
 *
 * Core Principle:
 * Never claim an AI or heuristic rule proves fraud or guarantees safety.
 * Distinguishes rule signals, threat database indicators, behavioral anomalies, and ML predictions.
 */

data class RawPaymentInput(
    val rawText: String? = null,
    val upiId: String? = null,
    val paymentLink: String? = null,
    val qrPayload: String? = null,
    val transactionScreenshotOcr: String? = null,
    val merchantId: String? = null,
    val parsedTransaction: ParsedTransactionPayload? = null,
    val userProfile: UserBehavioralProfile? = null
)

data class ParsedTransactionPayload(
    val amount: Double? = null,
    val timestampEpochMs: Long? = null,
    val counterpartyVpa: String? = null,
    val counterpartyName: String? = null,
    val isCollectRequest: Boolean = false,
    val referenceId: String? = null
)

data class UserBehavioralProfile(
    val averageDebitAmount: Double,
    val maxHistoricalDebitAmount: Double,
    val knownBeneficiaryVpas: Set<String>,
    val recentTransactions: List<HistoricalTransactionItem>
)

data class HistoricalTransactionItem(
    val id: String,
    val amount: Double,
    val timestampEpochMs: Long,
    val counterpartyVpa: String,
    val isDebit: Boolean
)

data class NormalizedPaymentEntities(
    val vpa: String? = null,
    val vpaHandlePrefix: String? = null,
    val vpaPspHandle: String? = null,
    val url: URI? = null,
    val domain: String? = null,
    val tld: String? = null,
    val rawUrl: String? = null,
    val amount: Double? = null,
    val currency: String = "INR",
    val isCollectRequest: Boolean = false,
    val intentParameters: Map<String, String> = emptyMap(),
    val phoneNumbers: List<String> = emptyList(),
    val allTextTokens: List<String> = emptyList(),
    val rawCombinedText: String = "",
    val timestampEpochMs: Long = System.currentTimeMillis()
)

data class RiskSignal(
    val code: String,
    val category: String,
    val title: String,
    val description: String,
    val source: String,
    val weight: Double, // 0.0 to 1.0
    val isCritical: Boolean
)

data class PaymentSecurityAssessment(
    val riskLevel: RiskLevel,
    val riskSignals: List<RiskSignal>,
    val evidence: List<String>,
    val confidence: String,
    val sources: List<String>,
    val recommendedActions: List<String>,
    val unknownFactors: List<String>,
    val assessedAtEpochMs: Long = System.currentTimeMillis(),
    val normalizedEntities: NormalizedEntitiesSummary
)

data class NormalizedEntitiesSummary(
    val vpa: String?,
    val domain: String?,
    val amount: Double?,
    val isCollectRequest: Boolean
)

interface ThreatLookupService {
    fun isKnownMaliciousVpa(vpa: String): Boolean
    fun isKnownPhishingDomain(domain: String): Boolean
    fun isReportedPhoneNumber(phone: String): Boolean
    fun isReportedIndicatorHash(hash: String): Boolean
}

interface PaymentSecurityRule {
    val id: String
    val name: String
    val category: String
    fun evaluate(
        entities: NormalizedPaymentEntities,
        threats: ThreatLookupService,
        profile: UserBehavioralProfile?
    ): RiskSignal?
}

interface MLAnalyzer {
    val name: String
    suspend fun analyze(
        entities: NormalizedPaymentEntities,
        ruleSignals: List<RiskSignal>
    ): List<RiskSignal>
}

class PaymentSecurityEngine(
    private val threatService: ThreatLookupService,
    initialRules: List<PaymentSecurityRule> = emptyList()
) {
    private val rules = mutableListOf<PaymentSecurityRule>()
    private val mlAnalyzers = mutableListOf<MLAnalyzer>()

    init {
        rules.addAll(initialRules)
    }

    fun registerRule(rule: PaymentSecurityRule) {
        rules.add(rule)
    }

    fun registerMLAnalyzer(analyzer: MLAnalyzer) {
        mlAnalyzers.add(analyzer)
    }

    /**
     * Executes the complete 10-Stage Pipeline:
     */
    suspend fun evaluate(input: RawPaymentInput): PaymentSecurityAssessment {
        // Stage 1: Validation
        validateInput(input)

        // Stage 2 & 3: Extraction & Normalization
        val entities = extractAndNormalize(input)

        // Stage 4 & 5: Threat Lookup & Rule Analysis
        val ruleSignals = mutableListOf<RiskSignal>()
        for (rule in rules) {
            try {
                val signal = rule.evaluate(entities, threatService, input.userProfile)
                if (signal != null) {
                    ruleSignals.add(signal)
                }
            } catch (e: Exception) {
                // Keep engine resilient; log audit failure
            }
        }

        // Stage 6: Behavioral Analysis
        val behavioralSignals = runBehavioralAnalysis(entities, input.userProfile)
        val combinedSignals = ruleSignals + behavioralSignals

        // Stage 7: ML Analysis (Pluggable semantic / neural models)
        val mlSignals = mutableListOf<RiskSignal>()
        for (analyzer in mlAnalyzers) {
            try {
                val signals = analyzer.analyze(entities, combinedSignals)
                mlSignals.addAll(signals)
            } catch (e: Exception) {
                // Fallback gracefully
            }
        }

        // Deduplicate signals by code
        val finalSignals = (combinedSignals + mlSignals)
            .distinctBy { it.code }

        // Stage 8: Risk Aggregation
        val riskLevel = aggregateRisk(entities, finalSignals)

        // Stage 9 & 10: Explanation Synthesis
        return synthesizeExplanation(entities, finalSignals, riskLevel)
    }

    private fun validateInput(input: RawPaymentInput) {
        val hasAnyField = !input.rawText.isNullOrBlank() ||
                !input.upiId.isNullOrBlank() ||
                !input.paymentLink.isNullOrBlank() ||
                !input.qrPayload.isNullOrBlank() ||
                !input.transactionScreenshotOcr.isNullOrBlank() ||
                !input.merchantId.isNullOrBlank() ||
                input.parsedTransaction != null

        if (!hasAnyField) {
            throw IllegalArgumentException("Payment security input must contain at least one verifiable identifier or payload.")
        }
    }

    private fun extractAndNormalize(input: RawPaymentInput): NormalizedPaymentEntities {
        val textCorpus = buildString {
            input.rawText?.let { append("$it\n") }
            input.upiId?.let { append("$it\n") }
            input.paymentLink?.let { append("$it\n") }
            input.qrPayload?.let { append("$it\n") }
            input.transactionScreenshotOcr?.let { append("$it\n") }
            input.merchantId?.let { append("$it\n") }
            input.parsedTransaction?.counterpartyName?.let { append("$it\n") }
        }

        // Extract UPI URI if present
        val intentParams = mutableMapOf<String, String>()
        var isCollect = input.parsedTransaction?.isCollectRequest ?: false
        var vpaExtracted = input.upiId?.trim()
        var amountExtracted = input.parsedTransaction?.amount

        val upiMatch = Pattern.compile("upi://pay\\?[^\\s\"'>]+", Pattern.CASE_INSENSITIVE).matcher(textCorpus)
        if (upiMatch.find()) {
            val uriStr = upiMatch.group()
            try {
                val uri = URI(uriStr)
                uri.rawQuery?.split("&")?.forEach { pair ->
                    val kv = pair.split("=")
                    if (kv.size == 2) {
                        intentParams[kv[0]] = kv[1]
                    }
                }
                intentParams["pa"]?.let { vpaExtracted = it }
                intentParams["am"]?.toDoubleOrNull()?.let { amountExtracted = it }
                if (intentParams["mode"] == "02" || uriStr.contains("collect", ignoreCase = true)) {
                    isCollect = true
                }
            } catch (_: Exception) {}
        }

        // Extract standalone VPA if not already found
        if (vpaExtracted == null) {
            val vpaPattern = Pattern.compile("\\b[a-zA-Z0-9.\\-_]{2,256}@[a-zA-Z]{2,64}\\b")
            val m = vpaPattern.matcher(textCorpus)
            if (m.find()) {
                vpaExtracted = m.group()
            }
        }

        // Extract Web URL
        var parsedUri: URI? = null
        var domainExtracted: String? = null
        var tldExtracted: String? = null
        val urlPattern = Pattern.compile("https?://[^\\s\"'>]+", Pattern.CASE_INSENSITIVE)
        val urlMatch = urlPattern.matcher(textCorpus)
        if (urlMatch.find()) {
            val raw = urlMatch.group()
            try {
                parsedUri = URI(raw)
                domainExtracted = parsedUri.host?.lowercase()
                domainExtracted?.split(".")?.lastOrNull()?.let { tldExtracted = ".$it" }
            } catch (_: Exception) {}
        }

        val phones = mutableListOf<String>()
        val phonePattern = Pattern.compile("(?:\\+91|91)?[6-9]\\d{9}")
        val phoneMatcher = phonePattern.matcher(textCorpus)
        while (phoneMatcher.find()) {
            phones.add(phoneMatcher.group())
        }

        var prefix: String? = null
        var psp: String? = null
        if (vpaExtracted != null && vpaExtracted!!.contains("@")) {
            val split = vpaExtracted!!.split("@")
            prefix = split.getOrNull(0)?.lowercase()
            psp = split.getOrNull(1)?.lowercase()
        }

        return NormalizedPaymentEntities(
            vpa = vpaExtracted,
            vpaHandlePrefix = prefix,
            vpaPspHandle = psp,
            url = parsedUri,
            domain = domainExtracted,
            tld = tldExtracted,
            rawUrl = parsedUri?.toString(),
            amount = amountExtracted,
            isCollectRequest = isCollect,
            intentParameters = intentParams,
            phoneNumbers = phones.distinct(),
            allTextTokens = textCorpus.lowercase().split(Regex("[^a-z0-9]")).filter { it.isNotBlank() },
            rawCombinedText = textCorpus,
            timestampEpochMs = input.parsedTransaction?.timestampEpochMs ?: System.currentTimeMillis()
        )
    }

    private fun runBehavioralAnalysis(
        entities: NormalizedPaymentEntities,
        profile: UserBehavioralProfile?
    ): List<RiskSignal> {
        if (profile == null) return emptyList()
        val signals = mutableListOf<RiskSignal>()

        // Check if beneficiary is previously unencountered for high-value transfer
        if (entities.vpa != null && entities.amount != null && entities.amount > 5000.0) {
            val isKnown = profile.knownBeneficiaryVpas.contains(entities.vpa.lowercase())
            if (!isKnown && entities.amount > (profile.averageDebitAmount * 3.0)) {
                signals.add(
                    RiskSignal(
                        code = "NEW_BENEFICIARY_SPIKE",
                        category = "unusual_recipient",
                        title = "Substantial Outflow to Unencountered Beneficiary",
                        description = "Amount of ₹${entities.amount} sent to new recipient ${entities.vpa}, exceeding 3x typical user average.",
                        source = "[BEHAVIORAL_BASELINE]",
                        weight = 0.75,
                        isCritical = false
                    )
                )
            }
        }

        return signals
    }

    private fun aggregateRisk(
        entities: NormalizedPaymentEntities,
        signals: List<RiskSignal>
    ): RiskLevel {
        if (signals.isEmpty()) {
            return if (entities.vpa != null || entities.domain != null) {
                RiskLevel.LOW_RISK
            } else {
                RiskLevel.UNKNOWN
            }
        }

        val hasCritical = signals.any { it.isCritical }
        val cumulativeScore = signals.sumOf { it.weight }

        return when {
            hasCritical || cumulativeScore >= 1.4 -> RiskLevel.HIGH_RISK
            cumulativeScore >= 0.6 -> RiskLevel.MEDIUM_RISK
            cumulativeScore > 0.0 -> RiskLevel.LOW_RISK
            else -> RiskLevel.UNKNOWN
        }
    }

    private fun synthesizeExplanation(
        entities: NormalizedPaymentEntities,
        signals: List<RiskSignal>,
        riskLevel: RiskLevel
    ): PaymentSecurityAssessment {
        val evidenceList = signals.map { "${it.title}: ${it.description}" }
        val sourcesList = signals.map { it.source }.distinct()

        val actions = mutableListOf<String>()
        val unknowns = mutableListOf<String>()

        when (riskLevel) {
            RiskLevel.HIGH_RISK -> {
                actions.add("DO NOT proceed with this payment or authorize collect requests.")
                actions.add("Verify the payee identity via independent verified channels.")
                actions.add("Report this interaction to the National Cyber Crime Portal (1930 / cybercrime.gov.in).")
            }
            RiskLevel.MEDIUM_RISK -> {
                actions.add("Inspect recipient banking name inside your official banking application.")
                actions.add("Confirm that no remote screen-sharing tools are active on your device.")
            }
            RiskLevel.LOW_RISK -> {
                actions.add("Confirm destination name before authorizing.")
                actions.add("Never disclose your UPI PIN or banking passwords to any caller.")
            }
            RiskLevel.UNKNOWN -> {
                actions.add("Provide a complete UPI ID or official merchant invoice for verification.")
            }
        }

        if (entities.amount == null) {
            unknowns.add("Transaction amount was not declared in the provided payload.")
        }
        if (entities.vpa == null && entities.domain == null) {
            unknowns.add("No specific payment address or domain could be extracted from input text.")
        }

        val confidence = when {
            signals.any { it.source.contains("THREAT_DATABASE") } -> "High (Direct threat registry match)"
            signals.size >= 2 -> "High (Multiple corroborating risk rules triggered)"
            signals.size == 1 -> "Medium (Single heuristic rule triggered)"
            else -> "High (No threat signals found in standard checks)"
        }

        return PaymentSecurityAssessment(
            riskLevel = riskLevel,
            riskSignals = signals,
            evidence = evidenceList,
            confidence = confidence,
            sources = sourcesList.ifEmpty { listOf("[RULE_SIGNAL]") },
            recommendedActions = actions,
            unknownFactors = unknowns,
            normalizedEntities = NormalizedEntitiesSummary(
                vpa = entities.vpa,
                domain = entities.domain,
                amount = entities.amount,
                isCollectRequest = entities.isCollectRequest
            )
        )
    }
}
