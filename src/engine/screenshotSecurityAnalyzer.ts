import { QRSecurityScanner, QRExtractedFields } from './qrSecurityScanner';

export interface ScreenshotExtractedData {
  hasQrCode: boolean;
  qrPayload?: QRExtractedFields;
  ocrApplied: boolean;
  ocrReason?: string;
  sanitizedOcrText?: string;
  redactedPiiCount: number;
  paymentDetails: {
    counterpartyVpa?: string;
    counterpartyName?: string;
    amount?: number;
    transactionReference?: string; // UTR or RRN
    timestampString?: string;
    transactionStatus?: 'SUCCESS' | 'PENDING' | 'FAILED' | 'COLLECT_REQUEST' | 'UNKNOWN';
    detectedApp?: string; // e.g. PhonePe, Paytm, Google Pay
  };
  forgeryIndicators: string[];
}

export class ScreenshotSecurityAnalyzer {
  /**
   * Sanitizes all sensitive personal financial credentials (PII)
   */
  static sanitizeSensitivePii(rawText: string): { sanitizedText: string; redactedCount: number } {
    let count = 0;
    let sanitized = rawText;

    // 1. Aadhaar Card Pattern (12 digits, often spaced or hyphenated: 1234 5678 9012)
    // Note: Do not redact if explicitly preceded by UTR, RRN, Ref No, or Txn ID
    sanitized = sanitized.replace(/(?<!(?:utr|rrn|txn\s*id|reference|ref\s*no\.?)[^\d\n\r]{0,25})\b([2-9]\d{3})[\s-]?(\d{4})[\s-]?(\d{4})\b/gi, (_match, g1, _g2, g3) => {
      count++;
      return `${g1}-XXXX-${g3}`;
    });

    // 2. PAN Card Pattern (5 letters + 4 digits + 1 letter: ABCDE1234F)
    sanitized = sanitized.replace(/\b([A-Z]{5})(\d{4})([A-Z])\b/g, (_match, g1, _g2, g3) => {
      count++;
      return `${g1}****${g3}`;
    });

    // 3. Bank Account / Card Numbers (12-16 digits)
    sanitized = sanitized.replace(/\b(\d{4})[\s-]?(\d{4})[\s-]?(\d{4})[\s-]?(\d{4})\b/g, (_match, g1, _g2, _g3, g4) => {
      count++;
      return `${g1}-XXXX-XXXX-${g4}`;
    });

    // 4. OTP / UPI PIN mentions
    sanitized = sanitized.replace(/(?:pin|upipin|otp|mpin|cvv)\s*(?:is|:|=|-)?\s*(\d{3,6})\b/gi, () => {
      count++;
      return '[REDACTED_CONFIDENTIAL_PIN]';
    });

    return { sanitizedText: sanitized, redactedCount: count };
  }

  /**
   * Analyzes extracted text from screenshot (OCR output or metadata)
   */
  static analyzeScreenshotText(rawText: string): ScreenshotExtractedData {
    const { sanitizedText, redactedCount } = this.sanitizeSensitivePii(rawText);
    const lower = sanitizedText.toLowerCase();

    // Check if an embedded QR payload is already provided in text or detected
    let qrPayload: QRExtractedFields | undefined;
    const hasQrCode = lower.includes('upi://pay') || lower.includes('http');
    if (hasQrCode) {
      const qrMatch = sanitizedText.match(/upi:\/\/pay\?[^\s"'>]+/i) || sanitizedText.match(/https?:\/\/[^\s"'>]+/i);
      if (qrMatch) {
        qrPayload = QRSecurityScanner.parseScannedPayload(qrMatch[0]).fields;
      }
    }

    // Extract VPA
    const vpaRegex = /\b[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}\b/;
    const vpaMatch = sanitizedText.match(vpaRegex);

    // Extract Amount (e.g. ₹5,000, Rs. 500, INR 1200)
    let extractedAmount: number | undefined;
    const amountRegex = /(?:₹|rs\.?|inr)\s*([\d,]+(?:\.\d{1,2})?)/i;
    const amountMatch = sanitizedText.match(amountRegex);
    if (amountMatch) {
      const num = parseFloat(amountMatch[1].replace(/,/g, ''));
      if (!isNaN(num)) extractedAmount = num;
    }

    // Extract UTR / Transaction Reference (12 digits standard in UPI banking)
    let transactionRef: string | undefined;
    const utrRegex = /(?:utr|rrn|txn\s*id|reference|ref\s*no\.?)(?:[^\d\n\r]{0,30})([0-9]{12})/i;
    const utrMatch = sanitizedText.match(utrRegex) || rawText.match(utrRegex);
    if (utrMatch) {
      transactionRef = utrMatch[1];
    }

    // Extract Payee / Counterparty Name
    let counterpartyName: string | undefined;
    const nameMatch = sanitizedText.match(/(?:paid to|to:|sent to|transfer to)\s*([a-zA-Z0-9\s.]+?)(?:\n|,|₹|rs|on)/i);
    if (nameMatch) {
      counterpartyName = nameMatch[1].trim();
    }

    // Detect Payment Application
    let detectedApp = 'Unknown Banking App';
    if (lower.includes('phonepe')) detectedApp = 'PhonePe';
    else if (lower.includes('google pay') || lower.includes('gpay')) detectedApp = 'Google Pay';
    else if (lower.includes('paytm')) detectedApp = 'Paytm';
    else if (lower.includes('cred')) detectedApp = 'CRED';
    else if (lower.includes('bhim')) detectedApp = 'BHIM UPI';
    else if (lower.includes('sbi') || lower.includes('yono')) detectedApp = 'SBI YONO';

    // Status
    let status: 'SUCCESS' | 'PENDING' | 'FAILED' | 'COLLECT_REQUEST' | 'UNKNOWN' = 'UNKNOWN';
    if (lower.includes('successful') || lower.includes('paid successfully') || lower.includes('completed')) {
      status = 'SUCCESS';
    } else if (lower.includes('collect request') || lower.includes('requested from you') || lower.includes('mode=02')) {
      status = 'COLLECT_REQUEST';
    } else if (lower.includes('pending') || lower.includes('processing')) {
      status = 'PENDING';
    } else if (lower.includes('failed') || lower.includes('declined')) {
      status = 'FAILED';
    }

    // Forgery & Fake Receipt Indicators
    const forgeryIndicators: string[] = [];

    // Check for fake receipt generator artifacts (e.g. "Paytm Spoon", "Prank Payment Maker")
    if (lower.includes('paytm spoon') || lower.includes('prank') || lower.includes('fake receipt')) {
      forgeryIndicators.push('Matches signatures of known Android spoofing tools ("Paytm Spoon" fake screenshot maker).');
    }

    // Fake SEBI Certificate check
    if (lower.includes('sebi') && (lower.includes('guaranteed return') || lower.includes('100% safe') || lower.includes('25% monthly'))) {
      forgeryIndicators.push('Certificate claims guaranteed return under SEBI authority; SEBI strictly prohibits guaranteed profit endorsements.');
    }

    // Missing 12-digit UTR on supposed "Completed" UPI transfer
    if (status === 'SUCCESS' && !transactionRef && !lower.includes('utr') && !lower.includes('bank reference')) {
      forgeryIndicators.push('Receipt claims successful payment but lacks the mandatory 12-digit UPI Bank Reference (UTR) number.');
    }

    return {
      hasQrCode,
      qrPayload,
      ocrApplied: true,
      ocrReason: 'Visual screenshot provided; text extracted and sanitized for fraud forensics.',
      sanitizedOcrText: sanitizedText,
      redactedPiiCount: redactedCount,
      paymentDetails: {
        counterpartyVpa: vpaMatch ? vpaMatch[0] : undefined,
        counterpartyName,
        amount: extractedAmount,
        transactionReference: transactionRef,
        transactionStatus: status,
        detectedApp,
      },
      forgeryIndicators,
    };
  }
}
