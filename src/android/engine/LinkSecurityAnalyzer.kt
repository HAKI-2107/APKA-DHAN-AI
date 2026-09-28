package com.apkadhan.ai.core.engine.security

import java.net.URI

/**
 * APKA DHAN AI - PAYMENT LINK SECURITY ANALYZER (Android Clean Architecture Runtime)
 *
 * FUNCTION 2:
 * Analyzes payment links.
 * Extracts:
 * - Domain
 * - Subdomain
 * - Path
 * - Query Parameters
 * - Redirects (where legally and technically appropriate)
 * - Suspicious Patterns
 *
 * Safe Analysis Pipeline: NEVER automatically open suspicious links in an unsafe context.
 */

data class LinkExtractedFields(
    val rawUrl: String,
    val normalizedUrl: String,
    val domain: String,
    val subdomain: String,
    val path: String,
    val queryParameters: Map<String, String>,
    val isShortener: Boolean,
    val openRedirectTarget: String?,
    val suspiciousPatterns: List<SuspiciousPattern>
)

data class SuspiciousPattern(
    val code: String,
    val severity: String,
    val title: String,
    val description: String,
    val detectedToken: String
)

object LinkSecurityAnalyzer {

    private val HIGH_ABUSE_TLDS = setOf(".top", ".xyz", ".cfd", ".icu", ".click", ".buzz", ".vip", ".rest", ".fit", ".sbs")
    private val URL_SHORTENERS = setOf("bit.ly", "tinyurl.com", "is.gd", "t.me", "cutt.ly", "rb.gy")
    private val FINANCIAL_BRANDS = listOf("sbi", "hdfc", "icici", "axis", "kotak", "pnb", "paytm", "phonepe", "zerodha", "groww")
    private val REDIRECT_KEYS = setOf("redirect", "url", "target", "goto", "dest", "next", "link")

    fun analyze(url: string): LinkExtractedFields {
        val trimmed = url.trim()
        val withProto = if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) "https://$trimmed" else trimmed

        val uri = try { URI(withProto) } catch (_: Exception) { URI("https://invalid-host") }
        val host = (uri.host ?: "").lowercase()
        val path = uri.path ?: "/"

        val queryParams = mutableMapOf<String, String>()
        uri.rawQuery?.split('&')?.forEach { pair ->
            val kv = pair.split('=')
            if (kv.size == 2) queryParams[kv[0]] = kv[1]
        }

        // Subdomain & Domain decomposition
        val hostParts = host.split('.')
        val domain = if (hostParts.size >= 2) "${hostParts[hostParts.size - 2]}.${hostParts[hostParts.size - 1]}" else host
        val subdomain = if (hostParts.size > 2) hostParts.subList(0, hostParts.size - 2).joinToString(".") else ""

        val isShortener = URL_SHORTENERS.contains(domain) || URL_SHORTENERS.contains(host)
        val openRedirect = queryParams.entries.find { REDIRECT_KEYS.contains(it.key.lowercase()) }?.value

        val patterns = mutableListOf<SuspiciousPattern>()

        // 1. Raw IP
        if (host.matches(Regex("^(\\d{1,3}\\.){3}\\d{1,3}$"))) {
            patterns.add(SuspiciousPattern("RAW_IP_ADDRESS_HOST", "CRITICAL", "Raw IP Address Host", "Payment host uses raw IP instead of registered domain.", host))
        }

        // 2. High abuse TLD
        HIGH_ABUSE_TLDS.forEach { tld ->
            if (host.endsWith(tld)) {
                patterns.add(SuspiciousPattern("HIGH_ABUSE_TLD", "HIGH", "Disposable TLD ($tld)", "Domain uses high-abuse disposable TLD.", tld))
            }
        }

        // 3. Brand Typosquatting
        FINANCIAL_BRANDS.forEach { brand ->
            if (host.contains(brand)) {
                val isOfficial = host == "$brand.com" || host.endsWith(".$brand.com") || host == "$brand.co.in" || host == "onlinesbi.sbi"
                if (!isOfficial) {
                    patterns.add(SuspiciousPattern("FINANCIAL_BRAND_SPOOF", "CRITICAL", "Unverified Financial Brand ($brand)", "Domain embeds financial brand name without official ownership.", host))
                }
            }
        }

        // 4. Dangerous APK extension
        if (path.lowercase().endsWith(".apk") || path.lowercase().contains(".apk/")) {
            patterns.add(SuspiciousPattern("DANGEROUS_PAYLOAD_EXTENSION", "CRITICAL", "Direct Android APK Path", "URL directly targets an APK package file.", path))
        }

        return LinkExtractedFields(
            rawUrl = trimmed,
            normalizedUrl = uri.toString(),
            domain = domain,
            subdomain = subdomain,
            path = path,
            queryParameters = queryParams,
            isShortener = isShortener,
            openRedirectTarget = openRedirect,
            suspiciousPatterns = patterns
        )
    }

    fun isSafePublicDestination(hostname: String): Boolean {
        val h = hostname.lowercase().trim()
        if (h == "localhost" || h == "127.0.0.1" || h.startsWith("192.168.") || h.startsWith("10.")) return false
        return true
    }
}
