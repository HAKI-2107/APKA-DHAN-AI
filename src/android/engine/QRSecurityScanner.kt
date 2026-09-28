package com.apkadhan.ai.core.engine.security

import java.net.URI
import java.net.URLDecoder

/**
 * APKA DHAN AI - QR SECURITY SCANNER (Android Clean Architecture Runtime)
 *
 * FUNCTION 1:
 * Scans optical QR codes and raw scanned strings.
 * Extracts:
 * - UPI URI
 * - UPI ID
 * - Merchant Name
 * - Amount
 * - Transaction Note
 * - URL
 * - Other encoded information (mode, MCC, ref, sign, orgid)
 */

data class QRExtractedFields(
    val rawPayload: String,
    val payloadType: QRType,
    val upiUri: String? = null,
    val upiId: String? = null,
    val merchantName: String? = null,
    val amount: Double? = null,
    val transactionNote: String? = null,
    val url: String? = null,
    val otherEncodedInfo: OtherEncodedInfo
)

enum class QRType {
    UPI_PAYMENT,
    WEB_URL,
    APP_SCHEME,
    PLAIN_TEXT,
    MALFORMED
}

data class OtherEncodedInfo(
    val mode: String? = null,
    val merchantCategoryCode: String? = null,
    val transactionRef: String? = null,
    val referenceUrl: String? = null,
    val currency: String = "INR",
    val signature: String? = null,
    val orgId: String? = null,
    val minAmount: Double? = null,
    val extraParameters: Map<String, String> = emptyMap()
)

object QRSecurityScanner {

    fun parsePayload(rawPayload: String): QRExtractedFields {
        val trimmed = rawPayload.trim()

        // 1. UPI Payment URI
        if (trimmed.startsWith("upi://pay", ignoreCase = true)) {
            return extractUpiParameters(trimmed)
        }

        // 2. Web URL
        if (trimmed.startsWith("http://", ignoreCase = true) || trimmed.startsWith("https://", ignoreCase = true)) {
            return extractWebUrl(trimmed)
        }

        // 3. Plain Text / Standalone VPA
        val vpaPattern = Regex("\\b[a-zA-Z0-9.\\-_]{2,256}@[a-zA-Z]{2,64}\\b")
        val match = vpaPattern.find(trimmed)

        return QRExtractedFields(
            rawPayload = trimmed,
            payloadType = QRType.PLAIN_TEXT,
            upiId = match?.value,
            otherEncodedInfo = OtherEncodedInfo()
        )
    }

    private fun extractUpiParameters(rawUri: String): QRExtractedFields {
        val extra = mutableMapOf<String, String>()
        var pa: String? = null
        var pn: String? = null
        var am: Double? = null
        var tn: String? = null
        var mode: String? = null
        var mc: String? = null
        var tr: String? = null
        var refUrl: String? = null
        var cu: String = "INR"
        var sign: String? = null
        var orgid: String? = null

        try {
            val qIdx = rawUri.indexOf('?')
            if (qIdx != -1) {
                val query = rawUri.substring(qIdx + 1)
                for (pair in query.split('&')) {
                    val kv = pair.split('=')
                    if (kv.size == 2) {
                        val k = URLDecoder.decode(kv[0], "UTF-8")
                        val v = URLDecoder.decode(kv[1], "UTF-8")
                        when (k.lowercase()) {
                            "pa" -> pa = v
                            "pn" -> pn = v
                            "am" -> am = v.toDoubleOrNull()
                            "tn" -> tn = v
                            "mode" -> mode = v
                            "mc" -> mc = v
                            "tr" -> tr = v
                            "refurl" -> refUrl = v
                            "cu" -> cu = v
                            "sign" -> sign = v
                            "orgid" -> orgid = v
                            else -> extra[k] = v
                        }
                    }
                }
            }
        } catch (_: Exception) {}

        return QRExtractedFields(
            rawPayload = rawUri,
            payloadType = QRType.UPI_PAYMENT,
            upiUri = rawUri,
            upiId = pa,
            merchantName = pn,
            amount = am,
            transactionNote = tn,
            url = refUrl,
            otherEncodedInfo = OtherEncodedInfo(
                mode = mode,
                merchantCategoryCode = mc,
                transactionRef = tr,
                referenceUrl = refUrl,
                currency = cu,
                signature = sign,
                orgId = orgid,
                extraParameters = extra
            )
        )
    }

    private fun extractWebUrl(rawUrl: String): QRExtractedFields {
        var embeddedPa: String? = null
        var embeddedAm: Double? = null
        val extra = mutableMapOf<String, String>()

        try {
            val uri = URI(rawUrl)
            uri.rawQuery?.split('&')?.forEach { pair ->
                val kv = pair.split('=')
                if (kv.size == 2) {
                    extra[kv[0]] = kv[1]
                    if (kv[0].equals("pa", ignoreCase = true)) embeddedPa = kv[1]
                    if (kv[0].equals("am", ignoreCase = true)) embeddedAm = kv[1].toDoubleOrNull()
                }
            }
        } catch (_: Exception) {}

        return QRExtractedFields(
            rawPayload = rawUrl,
            payloadType = QRType.WEB_URL,
            url = rawUrl,
            upiId = embeddedPa,
            amount = embeddedAm,
            otherEncodedInfo = OtherEncodedInfo(extraParameters = extra)
        )
    }
}
