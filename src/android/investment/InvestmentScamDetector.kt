package com.apkadhan.ai.core.investment

/**
 * APKA DHAN AI - INVESTMENT SCAM DETECTOR (Android Clean Architecture)
 *
 * Analyzes investment offers, WhatsApp/Telegram pitches, PDFs, and screenshots.
 *
 * OUTPUT SPECIFICATION:
 * - riskLevel: LOW RISK | MEDIUM RISK | HIGH RISK | UNKNOWN / UNVERIFIED
 * - signals: List of detected risk signals
 * - evidence: Factual quotes demonstrating risk
 * - verificationSteps: Actionable checklist for user
 * - sourceRequirements: Required regulatory proofs
 * - unknowns: Undisclosed facts
 */

enum class InvestmentSourceType {
    WHATSAPP_MESSAGE,
    TELEGRAM_CHANNEL,
    INVESTMENT_ADVERTISEMENT,
    SOCIAL_MEDIA_POST,
    PDF_PROSPECTUS,
    SCREENSHOT_OCR,
    WEBSITE_PORTAL,
    BROKER_OFFER,
    PAYMENT_INSTRUCTION
}

enum class ScamRiskLevel {
    LOW_RISK,
    MEDIUM_RISK,
    HIGH_RISK,
    UNKNOWN_UNVERIFIED
}

data class DetectedSignal(
    val code: String,
    val name: String,
    val category: String,
    val severity: String,
    val description: String,
    val matchedText: String? = null,
    val weight: Int
)

data class InvestmentScamInput(
    val text: String,
    val sourceType: InvestmentSourceType,
    val claimedEntityName: String? = null,
    val claimedRegistrationNo: String? = null,
    val websiteUrl: String? = null,
    val paymentAccountOrVpa: String? = null,
    val ocrExtractedText: String? = null
)

data class InvestmentScamAssessment(
    val riskLevel: ScamRiskLevel,
    val signals: List<DetectedSignal>,
    val evidence: List<String>,
    val verificationSteps: List<String>,
    val sourceRequirements: List<String>,
    val unknowns: List<String>,
    val regulatoryVerification: List<RegulatoryVerificationResult>,
    val summaryRationale: String
)

class InvestmentScamDetector(
    private val regulatoryAdapter: RegulatoryVerificationAdapter = DefaultRegulatoryAdapter()
) {

    suspend fun analyze(input: InvestmentScamInput): InvestmentScamAssessment {
        val combined = "${input.text} ${input.ocrExtractedText ?: ""}".trim()
        val lower = combined.lowercase()

        val signals = mutableListOf<DetectedSignal>()
        val evidence = mutableListOf<String>()
        val verificationSteps = mutableListOf<String>()
        val sourceRequirements = mutableListOf<String>()
        val unknowns = mutableListOf<String>()
        val regulatoryResults = mutableListOf<RegulatoryVerificationResult>()

        // 1. Guaranteed returns check
        if (lower.contains("guaranteed return") || lower.contains("fixed profit") || lower.contains("zero risk") || lower.contains("100% safe")) {
            signals.add(
                DetectedSignal(
                    code = "GUARANTEED_RETURNS",
                    name = "Illegal Guaranteed Return Claim",
                    category = "FINANCIAL_PROMISE",
                    severity = "CRITICAL",
                    description = "Promising guaranteed return on securities is strictly prohibited by SEBI.",
                    weight = 35
                )
            )
            evidence.add("Explicit promise of guaranteed or zero-risk returns detected.")
            verificationSteps.add("SEBI circular: Capital market investments carry risk; no registered broker can guarantee returns.")
            sourceRequirements.add("Official Scheme Information Document (SID) approved by SEBI.")
        }

        // 2. Unrealistic daily returns
        if (lower.contains("daily return") || lower.contains("double your money") || lower.contains("5% daily") || lower.contains("10x profit")) {
            signals.add(
                DetectedSignal(
                    code = "UNREALISTIC_RETURNS",
                    name = "Astronomical Return Claim",
                    category = "FINANCIAL_PROMISE",
                    severity = "CRITICAL",
                    description = "Astronomical daily yields characteristic of Ponzi / HYIP fraud.",
                    weight = 30
                )
            )
            evidence.add("Claim of daily multiplication or doubling of capital.")
        }

        // 3. Fake Authority claims
        if (lower.contains("sebi approved whatsapp") || lower.contains("sebi approved telegram") || lower.contains("government approved group")) {
            signals.add(
                DetectedSignal(
                    code = "FAKE_AUTHORITY_CLAIMS",
                    name = "Fabricated SEBI Endorsement",
                    category = "REGULATORY_AUTHORITY",
                    severity = "CRITICAL",
                    description = "SEBI never approves social media groups or channels.",
                    weight = 35
                )
            )
            evidence.add("Fabricated claim that SEBI or Government approves social media trading group.")
        }

        // 4. Suspicious Contact Channels (Telegram / WhatsApp secret group)
        if (input.sourceType == InvestmentSourceType.TELEGRAM_CHANNEL || input.sourceType == InvestmentSourceType.WHATSAPP_MESSAGE || lower.contains("t.me/")) {
            signals.add(
                DetectedSignal(
                    code = "SUSPICIOUS_CONTACT_CHANNELS",
                    name = "Informal Social Media Channel",
                    category = "COMMUNICATION_CHANNEL",
                    severity = "HIGH",
                    description = "Financial advice solicited over anonymous messaging groups prevents legal recourse.",
                    weight = 20
                )
            )
            evidence.add("Investment offer operated through Telegram / WhatsApp.")
            verificationSteps.add("Verify broker physical office and landline phone number on SEBI records.")
        }

        // 5. Personal Payment Demands
        if (lower.contains("savings a/c") || lower.contains("personal account") || lower.contains("usdt") || lower.contains("trc20")) {
            signals.add(
                DetectedSignal(
                    code = "REQUESTS_FOR_PERSONAL_PAYMENT",
                    name = "Payment to Personal Account / Crypto",
                    category = "PAYMENT_ROUTING",
                    severity = "CRITICAL",
                    description = "Directing investment funds to personal bank accounts bypasses SEBI Clearing Corporations.",
                    weight = 35
                )
            )
            evidence.add("Request to transfer money to personal savings account or crypto address.")
            verificationSteps.add("SEBI rule: Investment funds must only be deposited to designated broker client accounts via UPI ASBA.")
            sourceRequirements.add("Proof of designated SEBI Client Bank Account title.")
        }

        // 6. Regulatory verification check
        if (!input.claimedRegistrationNo.isNullOrEmpty() || !input.claimedEntityName.isNullOrEmpty()) {
            val query = RegulatoryEntityQuery(
                registrationNumber = input.claimedRegistrationNo,
                entityName = input.claimedEntityName
            )
            val regRes = regulatoryAdapter.verifyEntity(query)
            regulatoryResults.add(regRes)

            if (regRes.status == RegulatoryVerificationStatus.NOT_FOUND_OR_UNVERIFIED) {
                unknowns.add("Claimed registration is not found in verified local directory. Independent check on scores.sebi.gov.in required.")
                sourceRequirements.add("SEBI Registration Certificate (INH/INA/INZ format).")
            }
        } else {
            unknowns.add("No SEBI registration number was disclosed in the investment communication.")
        }

        // Synthesize Risk Level (Enforcing weak evidence protection)
        val criticalCount = signals.count { it.severity == "CRITICAL" }
        val highCount = signals.count { it.severity == "HIGH" }
        val totalWeight = signals.sumOf { it.weight }

        val riskLevel = when {
            criticalCount >= 2 || (criticalCount >= 1 && highCount >= 1) || totalWeight >= 55 -> ScamRiskLevel.HIGH_RISK
            criticalCount == 1 || highCount >= 2 || totalWeight >= 30 -> ScamRiskLevel.MEDIUM_RISK
            signals.size == 1 -> {
                unknowns.add("Evidence is insufficient to conclude fraud based on a single weak indicator.")
                ScamRiskLevel.UNKNOWN_UNVERIFIED
            }
            signals.isEmpty() -> ScamRiskLevel.LOW_RISK
            else -> ScamRiskLevel.UNKNOWN_UNVERIFIED
        }

        val rationale = when (riskLevel) {
            ScamRiskLevel.HIGH_RISK -> "Multiple high-severity deceptive signals detected indicating investment fraud."
            ScamRiskLevel.MEDIUM_RISK -> "Suspicious investment solicitation signals identified. Independent regulatory check required."
            ScamRiskLevel.UNKNOWN_UNVERIFIED -> "Weak or unverified evidence. Cannot conclude fraud without authoritative verification."
            ScamRiskLevel.LOW_RISK -> "No overt investment fraud signals identified."
        }

        return InvestmentScamAssessment(
            riskLevel = riskLevel,
            signals = signals,
            evidence = evidence,
            verificationSteps = verificationSteps,
            sourceRequirements = sourceRequirements,
            unknowns = unknowns,
            regulatoryVerification = regulatoryResults,
            summaryRationale = rationale
        )
    }
}
