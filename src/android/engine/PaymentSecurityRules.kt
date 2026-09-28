package com.apkadhan.ai.core.engine.payment

import java.net.URI
import java.util.Calendar

/**
 * 12 Initial Payment Security Rules for Apka Dhan AI
 *
 * 1. Suspicious Domain Rule
 * 2. Typosquatting Rule
 * 3. Unexpected Redirect Rule
 * 4. Unusual Recipient Rule
 * 5. Unusual Transaction Amount Rule
 * 6. Unusual Transaction Time Rule
 * 7. Repeated Rapid Transactions Rule
 * 8. Suspicious Wording Rule
 * 9. Impersonation Indicators Rule
 * 10. Guaranteed-Return Claims Rule
 * 11. Urgency / Manipulation Language Rule
 * 12. Known Reported Indicator Rule
 */

val AUTHORIZED_NPCI_PSP_HANDLES = setOf(
    "okhdfcbank", "okaxis", "oksbi", "okicici", "ybl", "ibl", "axl",
    "paytm", "upi", "apl", "federal", "barodampay", "kotak", "indus",
    "aubank", "pnb", "canarabank", "unionbank", "idfcbank"
)

val OFFICIAL_FINANCIAL_DOMAINS = setOf(
    "onlinesbi.sbi", "sbi.co.in", "hdfcbank.com", "icicibank.com",
    "axisbank.com", "kotak.com", "pnbindia.in", "paytm.com",
    "phonepe.com", "zerodha.com", "groww.in", "angelone.in"
)

val SUSPICIOUS_TLDS = setOf(
    ".top", ".xyz", ".cfd", ".icu", ".click", ".buzz", ".vip", ".rest", ".fit", ".sbs"
)

val URL_SHORTENERS = setOf(
    "bit.ly", "tinyurl.com", "is.gd", "t.me", "cutt.ly", "rb.gy"
)

/** 1. Suspicious Domain Rule */
object SuspiciousDomainRule : PaymentSecurityRule {
    override val id = "RULE-01-SUSPICIOUS-DOMAIN"
    override val name = "Suspicious Domain Rule"
    override val category = "suspicious_domain"

    override fun evaluate(entities: NormalizedPaymentEntities, threats: ThreatLookupService, profile: UserBehavioralProfile?): RiskSignal? {
        val domain = entities.domain ?: return null

        if (domain.matches(Regex("^(\\d{1,3}\\.){3}\\d{1,3}$"))) {
            return RiskSignal(
                code = "RAW_IP_PAYMENT_HOST",
                category = category,
                title = "Payment URL Uses Raw IP Address",
                description = "Direct numerical IP address ($domain) used instead of an authentic registered domain.",
                source = "[RULE_SIGNAL]",
                weight = 0.9,
                isCritical = true
            )
        }

        for (tld in SUSPICIOUS_TLDS) {
            if (domain.endsWith(tld)) {
                return RiskSignal(
                    code = "HIGH_ABUSE_TLD",
                    category = category,
                    title = "Domain Uses High-Abuse TLD ($tld)",
                    description = "Destination domain ends with '$tld', frequently associated with phishing campaigns.",
                    source = "[RULE_SIGNAL]",
                    weight = 0.85,
                    isCritical = true
                )
            }
        }
        return null
    }
}

/** 2. Typosquatting Rule */
object TyposquattingRule : PaymentSecurityRule {
    override val id = "RULE-02-TYPOSQUATTING"
    override val name = "Typosquatting Rule"
    override val category = "typosquatting"

    override fun evaluate(entities: NormalizedPaymentEntities, threats: ThreatLookupService, profile: UserBehavioralProfile?): RiskSignal? {
        val domain = entities.domain ?: return null
        val brands = listOf("sbi", "hdfc", "icici", "axis", "kotak", "pnb", "paytm", "phonepe", "zerodha", "groww")

        for (brand in brands) {
            if (domain.contains(brand)) {
                val isOfficial = OFFICIAL_FINANCIAL_DOMAINS.any { official ->
                    domain == official || domain.endsWith(".$official")
                }
                if (!isOfficial) {
                    return RiskSignal(
                        code = "DOMAIN_BRAND_TYPOSQUAT",
                        category = category,
                        title = "Unverified Institution Brand in Domain (${brand.uppercase()})",
                        description = "Domain incorporates '$brand' but does not resolve to the official registered financial infrastructure.",
                        source = "[RULE_SIGNAL]",
                        weight = 0.9,
                        isCritical = true
                    )
                }
            }
        }
        return null
    }
}

/** 3. Unexpected Redirect Rule */
object UnexpectedRedirectRule : PaymentSecurityRule {
    override val id = "RULE-03-UNEXPECTED-REDIRECT"
    override val name = "Unexpected Redirect Rule"
    override val category = "unexpected_redirect"

    override fun evaluate(entities: NormalizedPaymentEntities, threats: ThreatLookupService, profile: UserBehavioralProfile?): RiskSignal? {
        val domain = entities.domain
        if (domain != null) {
            for (shortener in URL_SHORTENERS) {
                if (domain == shortener || domain.endsWith(".$shortener")) {
                    return RiskSignal(
                        code = "URL_SHORTENER_OBFUSCATION",
                        category = category,
                        title = "Obfuscated URL via Redirection Service ($shortener)",
                        description = "Payment link utilizes a link shortening service that masks true target destination.",
                        source = "[RULE_SIGNAL]",
                        weight = 0.65,
                        isCritical = false
                    )
                }
            }
        }

        val url = entities.url
        if (url != null) {
            val query = url.rawQuery ?: ""
            val redirectKeywords = listOf("redirect=", "url=", "target=", "next=", "goto=")
            for (kw in redirectKeywords) {
                if (query.contains(kw, ignoreCase = true)) {
                    return RiskSignal(
                        code = "OPEN_REDIRECT_PARAMETER",
                        category = category,
                        title = "Open Redirection Parameter Detected",
                        description = "URL contains external redirect routing parameter.",
                        source = "[RULE_SIGNAL]",
                        weight = 0.6,
                        isCritical = false
                    )
                }
            }
        }
        return null
    }
}

/** 4. Unusual Recipient Rule */
object UnusualRecipientRule : PaymentSecurityRule {
    override val id = "RULE-04-UNUSUAL-RECIPIENT"
    override val name = "Unusual Recipient Rule"
    override val category = "unusual_recipient"

    override fun evaluate(entities: NormalizedPaymentEntities, threats: ThreatLookupService, profile: UserBehavioralProfile?): RiskSignal? {
        val psp = entities.vpaPspHandle ?: return null

        if (!AUTHORIZED_NPCI_PSP_HANDLES.contains(psp)) {
            return RiskSignal(
                code = "UNLISTED_PSP_HANDLE",
                category = category,
                title = "Unrecognized or Non-Standard PSP Handle (@$psp)",
                description = "The beneficiary address does not belong to authorized major consumer banking PSPs.",
                source = "[REGULATORY_REGISTRY]",
                weight = 0.5,
                isCritical = false
            )
        }
        return null
    }
}

/** 5. Unusual Transaction Amount Rule */
object UnusualTransactionAmountRule : PaymentSecurityRule {
    override val id = "RULE-05-UNUSUAL-TRANSACTION-AMOUNT"
    override val name = "Unusual Transaction Amount Rule"
    override val category = "unusual_transaction_amount"

    override fun evaluate(entities: NormalizedPaymentEntities, threats: ThreatLookupService, profile: UserBehavioralProfile?): RiskSignal? {
        val amount = entities.amount ?: return null

        if (entities.isCollectRequest && amount >= 25000.0) {
            return RiskSignal(
                code = "HIGH_VALUE_COLLECT_REQUEST",
                category = category,
                title = "High-Value Collect Request (₹$amount)",
                description = "Incoming collect request requires entering UPI PIN to debit ₹$amount.",
                source = "[RULE_SIGNAL]",
                weight = 0.95,
                isCritical = true
            )
        }

        if (profile != null && amount > (profile.maxHistoricalDebitAmount * 2.5) && amount > 10000.0) {
            return RiskSignal(
                code = "AMOUNT_EXCEEDS_USER_BASELINE",
                category = category,
                title = "Outflow Significantly Exceeds Historical Maximum",
                description = "Transaction of ₹$amount exceeds 2.5x maximum recorded user debit.",
                source = "[BEHAVIORAL_BASELINE]",
                weight = 0.7,
                isCritical = false
            )
        }
        return null
    }
}

/** 6. Unusual Transaction Time Rule */
object UnusualTransactionTimeRule : PaymentSecurityRule {
    override val id = "RULE-06-UNUSUAL-TRANSACTION-TIME"
    override val name = "Unusual Transaction Time Rule"
    override val category = "unusual_transaction_time"

    override fun evaluate(entities: NormalizedPaymentEntities, threats: ThreatLookupService, profile: UserBehavioralProfile?): RiskSignal? {
        val cal = Calendar.getInstance().apply { timeInMillis = entities.timestampEpochMs }
        val hour = cal.get(Calendar.HOUR_OF_DAY)

        // Off-hours: 1:00 AM to 5:00 AM
        if (hour in 1..4) {
            if (entities.isCollectRequest || (entities.amount ?: 0.0) >= 10000.0) {
                return RiskSignal(
                    code = "OFF_HOURS_HIGH_RISK_INTERACTION",
                    category = category,
                    title = "High-Value / Collect Interaction During Off-Hours ($hour:00)",
                    description = "Payment initiated during late night off-peak window, a known vector in unauthorized account takeover.",
                    source = "[BEHAVIORAL_BASELINE]",
                    weight = 0.6,
                    isCritical = false
                )
            }
        }
        return null
    }
}

/** 7. Repeated Rapid Transactions Rule */
object RepeatedRapidTransactionsRule : PaymentSecurityRule {
    override val id = "RULE-07-REPEATED-RAPID-TRANSACTIONS"
    override val name = "Repeated Rapid Transactions Rule"
    override val category = "repeated_rapid_transactions"

    override fun evaluate(entities: NormalizedPaymentEntities, threats: ThreatLookupService, profile: UserBehavioralProfile?): RiskSignal? {
        if (profile == null) return null
        val now = entities.timestampEpochMs
        val fiveMinutesAgo = now - 300000

        val recentDebits = profile.recentTransactions.filter {
            it.isDebit && it.timestampEpochMs >= fiveMinutesAgo
        }

        if (recentDebits.size >= 3) {
            val total = recentDebits.sumOf { it.amount }
            return RiskSignal(
                code = "HIGH_VELOCITY_TRANSACTION_BURST",
                category = category,
                title = "High-Velocity Rapid Outflow Burst",
                description = "${recentDebits.size} debit transactions totaling ₹$total authorized within 5 minutes.",
                source = "[BEHAVIORAL_BASELINE]",
                weight = 0.8,
                isCritical = true
            )
        }
        return null
    }
}

/** 8. Suspicious Wording Rule */
object SuspiciousWordingRule : PaymentSecurityRule {
    override val id = "RULE-08-SUSPICIOUS-WORDING"
    override val name = "Suspicious Wording Rule"
    override val category = "suspicious_wording"

    override fun evaluate(entities: NormalizedPaymentEntities, threats: ThreatLookupService, profile: UserBehavioralProfile?): RiskSignal? {
        val text = entities.rawCombinedText.lowercase()

        val remoteApps = listOf("anydesk", "teamviewer", "rustdesk", "quicksupport", "screen share")
        for (app in remoteApps) {
            if (text.contains(app)) {
                return RiskSignal(
                    code = "SCREEN_SHARING_APP_SOLICITATION",
                    category = category,
                    title = "Remote Screen-Sharing Software Solicitation ($app)",
                    description = "Request prompts user to install remote desktop tooling, leading to complete device takeover.",
                    source = "[RULE_SIGNAL]",
                    weight = 0.95,
                    isCritical = true
                )
            }
        }

        if (text.contains(".apk") || text.contains("download apk") || text.contains("install update")) {
            return RiskSignal(
                code = "EXTERNAL_APK_DOWNLOAD_INSTRUCTION",
                category = category,
                title = "External Android APK Download Instruction",
                description = "Instructions instruct downloading unverified Android APK packages outside official app stores.",
                source = "[RULE_SIGNAL]",
                weight = 0.9,
                isCritical = true
            )
        }
        return null
    }
}

/** 9. Impersonation Indicators Rule */
object ImpersonationIndicatorsRule : PaymentSecurityRule {
    override val id = "RULE-09-IMPERSONATION-INDICATORS"
    override val name = "Impersonation Indicators Rule"
    override val category = "impersonation_indicators"

    override fun evaluate(entities: NormalizedPaymentEntities, threats: ThreatLookupService, profile: UserBehavioralProfile?): RiskSignal? {
        val prefix = entities.vpaHandlePrefix ?: return null
        val keywords = listOf("customercare", "helpline", "support", "refund", "kyc", "electricity", "billdesk", "lottery")

        val matched = keywords.filter { prefix.contains(it) }
        if (matched.isNotEmpty()) {
            return RiskSignal(
                code = "INSTITUTIONAL_KEYWORD_IMPERSONATION",
                category = category,
                title = "Institutional Keyword in Consumer UPI Handle",
                description = "UPI ID prefix contains official support keywords: '${matched.joinToString()}'. Legitimate customer support never collects money via personal UPI handles.",
                source = "[RULE_SIGNAL]",
                weight = 0.9,
                isCritical = true
            )
        }
        return null
    }
}

/** 10. Guaranteed-Return Claims Rule */
object GuaranteedReturnClaimsRule : PaymentSecurityRule {
    override val id = "RULE-10-GUARANTEED-RETURN-CLAIMS"
    override val name = "Guaranteed-Return Claims Rule"
    override val category = "guaranteed_return_claims"

    override fun evaluate(entities: NormalizedPaymentEntities, threats: ThreatLookupService, profile: UserBehavioralProfile?): RiskSignal? {
        val text = entities.rawCombinedText.lowercase()
        val guaranteedPhrases = listOf(
            "guaranteed return", "fixed profit", "100% safe", "no risk",
            "daily return", "double your money", "2x return", "vip trading"
        )

        for (phrase in guaranteedPhrases) {
            if (text.contains(phrase)) {
                return RiskSignal(
                    code = "PROMISES_GUARANTEED_MARKET_RETURN",
                    category = category,
                    title = "Prohibited Guaranteed Profit / Zero-Risk Promise",
                    description = "Interaction contains guaranteed financial return promises, strictly prohibited under SEBI regulations.",
                    source = "[REGULATORY_REGISTRY]",
                    weight = 0.9,
                    isCritical = true
                )
            }
        }
        return null
    }
}

/** 11. Urgency / Manipulation Language Rule */
object UrgencyManipulationLanguageRule : PaymentSecurityRule {
    override val id = "RULE-11-URGENCY-MANIPULATION-LANGUAGE"
    override val name = "Urgency & Manipulation Language Rule"
    override val category = "urgency_manipulation_language"

    override fun evaluate(entities: NormalizedPaymentEntities, threats: ThreatLookupService, profile: UserBehavioralProfile?): RiskSignal? {
        val text = entities.rawCombinedText.lowercase()

        if (text.contains("digital arrest") || text.contains("cbi cyber") || text.contains("police custody") || text.contains("warrant issued")) {
            return RiskSignal(
                code = "DIGITAL_ARREST_EXTORTION",
                category = category,
                title = "High-Level Impersonation & Digital Arrest Threat",
                description = "Claiming legal detention or arrest over video call to extort urgent monetary transfers.",
                source = "[THREAT_DATABASE]",
                weight = 1.0,
                isCritical = true
            )
        }

        if (text.contains("electricity will be disconnected") || text.contains("power cut tonight") || text.contains("within 10 minutes") || text.contains("account blocked")) {
            return RiskSignal(
                code = "URGENCY_MANIPULATION_DETECTED",
                category = category,
                title = "Coercive Psychological Urgency Tactic",
                description = "Fabricates an immediate deadline (power cut, account lock) to prevent deliberation and verification.",
                source = "[RULE_SIGNAL]",
                weight = 0.75,
                isCritical = false
            )
        }
        return null
    }
}

/** 12. Known Reported Indicator Rule */
object KnownReportedIndicatorRule : PaymentSecurityRule {
    override val id = "RULE-12-KNOWN-REPORTED-INDICATOR"
    override val name = "Known Reported Indicator Rule"
    override val category = "known_reported_indicator"

    override fun evaluate(entities: NormalizedPaymentEntities, threats: ThreatLookupService, profile: UserBehavioralProfile?): RiskSignal? {
        entities.vpa?.let { vpa ->
            if (threats.isKnownMaliciousVpa(vpa)) {
                return RiskSignal(
                    code = "KNOWN_MALICIOUS_VPA_MATCH",
                    category = category,
                    title = "VPA Matched in Active Cyber Threat Database ($vpa)",
                    description = "This exact UPI identifier has been confirmed in previous cyber incident reports.",
                    source = "[THREAT_DATABASE]",
                    weight = 1.0,
                    isCritical = true
                )
            }
        }

        entities.domain?.let { domain ->
            if (threats.isKnownPhishingDomain(domain)) {
                return RiskSignal(
                    code = "KNOWN_PHISHING_DOMAIN_MATCH",
                    category = category,
                    title = "Domain Matched in Active Phishing Registry ($domain)",
                    description = "Destination domain is indexed as an active phishing / malware portal.",
                    source = "[THREAT_DATABASE]",
                    weight = 1.0,
                    isCritical = true
                )
            }
        }

        for (phone in entities.phoneNumbers) {
            if (threats.isReportedPhoneNumber(phone)) {
                return RiskSignal(
                    code = "REPORTED_PHONE_NUMBER_MATCH",
                    category = category,
                    title = "Contact Flagged in Cyber Incident Database",
                    description = "Contact number matches registered incident logs on the cyber crime reporting network.",
                    source = "[THREAT_DATABASE]",
                    weight = 0.95,
                    isCritical = true
                )
            }
        }
        return null
    }
}

val ALL_KOTLIN_INITIAL_RULES: List<PaymentSecurityRule> = listOf(
    SuspiciousDomainRule,
    TyposquattingRule,
    UnexpectedRedirectRule,
    UnusualRecipientRule,
    UnusualTransactionAmountRule,
    UnusualTransactionTimeRule,
    RepeatedRapidTransactionsRule,
    SuspiciousWordingRule,
    ImpersonationIndicatorsRule,
    GuaranteedReturnClaimsRule,
    UrgencyManipulationLanguageRule,
    KnownReportedIndicatorRule
)
