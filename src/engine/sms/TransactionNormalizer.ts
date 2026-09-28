import {
  TransactionType,
  ConfidenceLevel,
  FieldConfidence,
  NormalizedTransactionRecord,
} from './types';

/**
 * APKA DHAN AI - TRANSACTION NORMALIZER
 * 
 * Standardizes raw extracted entities across diverse Indian banking formats:
 * - Parses and validates amounts into floating point numbers.
 * - Categorizes transaction types (DEBIT, CREDIT, COLLECT_REQUEST, REFUND).
 * - Sanitizes masked accounts to a uniform "XX1234" structure.
 * - Extracts and normalizes merchant / counterparty identities.
 * - Converts heterogeneous Indian banking date/time strings into Unix Epoch and ISO 8601.
 * - Validates 12-digit UPI reference identifiers (UTR/RRN).
 * - Exposes granular confidence for each extracted field.
 */

export class TransactionNormalizer {
  /**
   * Normalizes Amount with confidence calculation
   */
  static normalizeAmount(rawToken: string | null | undefined): FieldConfidence<number> {
    if (!rawToken) {
      return { value: 0, confidence: 'LOW', extractionSource: 'missing' };
    }

    const hasCurrencyPrefix = /(?:rs\.?|inr|₹)/i.test(rawToken);
    // Strip currency prefix first so any abbreviation dot in "Rs." does not corrupt decimal parsing
    const withoutPrefix = rawToken.replace(/(?:rs\.?|inr|₹)/gi, '').replace(/,/g, '').trim();
    const clean = withoutPrefix.replace(/[^0-9.]/g, '');
    const num = parseFloat(clean);

    if (!isNaN(num) && num > 0) {
      const hasDecimal = withoutPrefix.includes('.');
      const confidence: ConfidenceLevel = hasCurrencyPrefix && hasDecimal ? 'HIGH' : hasCurrencyPrefix || hasDecimal ? 'MEDIUM' : 'LOW';

      return {
        value: num,
        confidence,
        patternMatched: hasCurrencyPrefix ? 'CURRENCY_PREFIX_NUMERIC' : 'RAW_NUMERIC',
        sourceToken: rawToken,
      };
    }

    return { value: 0, confidence: 'LOW', extractionSource: 'unparseable' };
  }

  /**
   * Normalizes Transaction Type (DEBIT, CREDIT, COLLECT_REQUEST, REFUND)
   */
  static normalizeTransactionType(text: string): FieldConfidence<TransactionType> {
    const lower = text.toLowerCase();

    // Collect Request
    if (
      lower.includes('collect request') ||
      lower.includes('requested from you') ||
      lower.includes('mandate request') ||
      lower.includes('approve request')
    ) {
      return {
        value: 'COLLECT_REQUEST',
        confidence: 'HIGH',
        patternMatched: 'COLLECT_KEYWORD',
      };
    }

    // Refund
    if (lower.includes('refund') || lower.includes('reversed') || lower.includes('cashback')) {
      return {
        value: 'REFUND',
        confidence: 'HIGH',
        patternMatched: 'REFUND_KEYWORD',
      };
    }

    // Debit
    if (
      lower.includes('debited') ||
      lower.includes('sent') ||
      lower.includes('paid') ||
      lower.includes('spent') ||
      lower.includes('withdrawn') ||
      lower.includes('transferred to') ||
      lower.includes('transfer to') ||
      lower.includes('dr.')
    ) {
      return {
        value: 'DEBIT',
        confidence: 'HIGH',
        patternMatched: 'DEBIT_VERB',
      };
    }

    // Credit
    if (
      lower.includes('credited') ||
      lower.includes('received') ||
      lower.includes('deposited') ||
      lower.includes('cr.')
    ) {
      return {
        value: 'CREDIT',
        confidence: 'HIGH',
        patternMatched: 'CREDIT_VERB',
      };
    }

    return {
      value: 'UNKNOWN',
      confidence: 'LOW',
      patternMatched: 'NO_CLEAR_VERB',
    };
  }

  /**
   * Normalizes Masked Account Number to uniform "XX1234" representation
   */
  static normalizeMaskedAccount(rawToken: string | null | undefined): FieldConfidence<string | null> {
    if (!rawToken) {
      return { value: null, confidence: 'LOW', extractionSource: 'missing' };
    }

    // Extract last 3-4 digits from tokens like "**1234", "XX1234", "XXXXX123456", "ending with 1234"
    const digitsMatch = rawToken.match(/(\d{3,6})\b/);
    if (digitsMatch) {
      const lastDigits = digitsMatch[1].slice(-4);
      return {
        value: `XX${lastDigits}`,
        confidence: lastDigits.length === 4 ? 'HIGH' : 'MEDIUM',
        patternMatched: 'ACCOUNT_TAIL_MASK',
        sourceToken: rawToken,
      };
    }

    return { value: null, confidence: 'LOW', extractionSource: 'unmatched' };
  }

  /**
   * Cleans and standardizes Counterparty / Merchant Names
   */
  static normalizeMerchant(rawToken: string | null | undefined): FieldConfidence<string | null> {
    if (!rawToken) {
      return { value: null, confidence: 'LOW', extractionSource: 'missing' };
    }

    let cleaned = rawToken.trim();

    // Strip leading prepositions: "to SWIGGY", "towards ZOMATO", "at STARBUCKS", "info: SWIGGY"
    cleaned = cleaned.replace(/^(?:to|towards|at|for|info:|paid to|sent to)\s+/i, '');

    // Strip UPI routing prefixes/suffixes: "UPI/SWIGGY/42681122...", "SWIGGY via UPI", "SWIGGY-UPI"
    cleaned = cleaned.replace(/^upi\//i, '');
    cleaned = cleaned.replace(/\/(?:\d{6,16}|[a-zA-Z0-9]+)$/, ''); // Strip trailing slash reference
    cleaned = cleaned.replace(/\s+via\s+upi\b/i, '');
    cleaned = cleaned.replace(/[\s\-_.]*ref(?:\s+no\.?|\s+id)?:?.*$/i, '');
    cleaned = cleaned.replace(/[\s\-_.]*on\s+\d{1,2}[-/A-Za-z0-9]+.*$/i, ''); // Strip trailing dates

    cleaned = cleaned.trim();

    // If cleaned string is too long or contains punctuation soup, lower confidence
    if (!cleaned || cleaned.length < 2) {
      return { value: null, confidence: 'LOW', extractionSource: 'empty_after_clean' };
    }

    const confidence: ConfidenceLevel = cleaned.length >= 3 && cleaned.length <= 35 && !cleaned.includes('http')
      ? 'HIGH'
      : 'MEDIUM';

    // Format Title Case if all uppercase or lowercase
    const formatted = cleaned.length > 2 && /^[A-Z0-9\s._]+$/.test(cleaned)
      ? cleaned
          .split(' ')
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
          .join(' ')
      : cleaned;

    return {
      value: formatted,
      confidence,
      patternMatched: 'MERCHANT_STRING_CLEANED',
      sourceToken: rawToken,
    };
  }

  /**
   * Normalizes UPI Virtual Payment Address (VPA)
   */
  static normalizeUpiId(rawToken: string | null | undefined): FieldConfidence<string | null> {
    if (!rawToken) {
      return { value: null, confidence: 'LOW', extractionSource: 'missing' };
    }

    const trimmed = rawToken.trim().toLowerCase();
    const vpaRegex = /\b([a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64})\b/;
    const match = trimmed.match(vpaRegex);

    if (match) {
      return {
        value: match[1],
        confidence: 'HIGH',
        patternMatched: 'STANDARD_VPA_REGEX',
        sourceToken: rawToken,
      };
    }

    return { value: null, confidence: 'LOW', extractionSource: 'invalid_format' };
  }

  /**
   * Normalizes 12-digit UPI Bank Reference Number (UTR / RRN)
   */
  static normalizeReferenceId(rawToken: string | null | undefined): FieldConfidence<string | null> {
    if (!rawToken) {
      return { value: null, confidence: 'LOW', extractionSource: 'missing' };
    }

    const clean = rawToken.replace(/[^0-9]/g, '');

    // Standard Indian inter-bank UPI UTR is exactly 12 digits
    if (clean.length === 12) {
      return {
        value: clean,
        confidence: 'HIGH',
        patternMatched: '12_DIGIT_UTR',
        sourceToken: rawToken,
      };
    }

    // Some bank internal transfer references can be 9 to 16 digits
    if (clean.length >= 6 && clean.length <= 20) {
      return {
        value: clean,
        confidence: 'MEDIUM',
        patternMatched: 'GENERIC_REF_DIGITS',
        sourceToken: rawToken,
      };
    }

    return { value: null, confidence: 'LOW', extractionSource: 'unmatched' };
  }

  /**
   * Normalizes Indian SMS Dates into Unix Epoch milliseconds and ISO string
   * Handles patterns like:
   * - "25-SEP-24", "25Sep2024", "25-09-2024", "25/09/24", "25-09-2024 14:32:10"
   */
  static normalizeTimestamp(
    rawDateStr: string | null | undefined,
    fallbackEpochMs: number = Date.now()
  ): { timestamp: FieldConfidence<number>; isoDateString: string } {
    if (!rawDateStr) {
      return {
        timestamp: {
          value: fallbackEpochMs,
          confidence: 'LOW',
          extractionSource: 'device_fallback',
        },
        isoDateString: new Date(fallbackEpochMs).toISOString(),
      };
    }

    try {
      const clean = rawDateStr.trim();
      const monthMap: Record<string, string> = {
        jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
        jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
      };

      // Format 1: 25-SEP-24 or 25-SEP-2024
      const alphaMatch = clean.match(/(\d{1,2})[-/ ]?([A-Za-z]{3})[-/ ]?(\d{2,4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/i);
      if (alphaMatch) {
        const day = alphaMatch[1].padStart(2, '0');
        const month = monthMap[alphaMatch[2].toLowerCase()] || '01';
        let year = alphaMatch[3];
        if (year.length === 2) year = `20${year}`;
        const hour = alphaMatch[4] ? alphaMatch[4].padStart(2, '0') : '12';
        const minute = alphaMatch[5] ? alphaMatch[5].padStart(2, '0') : '00';
        const second = alphaMatch[6] ? alphaMatch[6].padStart(2, '0') : '00';

        const iso = `${year}-${month}-${day}T${hour}:${minute}:${second}.000Z`;
        const parsedEpoch = Date.parse(iso);
        if (!isNaN(parsedEpoch)) {
          return {
            timestamp: {
              value: parsedEpoch,
              confidence: 'HIGH',
              patternMatched: 'DAY_ALPHA_MONTH_YEAR',
              sourceToken: rawDateStr,
            },
            isoDateString: iso,
          };
        }
      }

      // Format 2: 25-09-2024 or 25/09/2024 (DD/MM/YYYY)
      const numMatch = clean.match(/(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/);
      if (numMatch) {
        const day = numMatch[1].padStart(2, '0');
        const month = numMatch[2].padStart(2, '0');
        let year = numMatch[3];
        if (year.length === 2) year = `20${year}`;
        const hour = numMatch[4] ? numMatch[4].padStart(2, '0') : '12';
        const minute = numMatch[5] ? numMatch[5].padStart(2, '0') : '00';
        const second = numMatch[6] ? numMatch[6].padStart(2, '0') : '00';

        const iso = `${year}-${month}-${day}T${hour}:${minute}:${second}.000Z`;
        const parsedEpoch = Date.parse(iso);
        if (!isNaN(parsedEpoch)) {
          return {
            timestamp: {
              value: parsedEpoch,
              confidence: 'HIGH',
              patternMatched: 'NUMERIC_DD_MM_YYYY',
              sourceToken: rawDateStr,
            },
            isoDateString: iso,
          };
        }
      }
    } catch (e) {
      // Fallback
    }

    return {
      timestamp: {
        value: fallbackEpochMs,
        confidence: 'LOW',
        extractionSource: 'parse_failed_fallback',
      },
      isoDateString: new Date(fallbackEpochMs).toISOString(),
    };
  }

  /**
   * Derives an overall confidence score from individual field confidences
   */
  static calculateOverallConfidence(fields: {
    type: FieldConfidence<TransactionType>;
    amount: FieldConfidence<number>;
    account: FieldConfidence<string | null>;
    merchant: FieldConfidence<string | null>;
    ref: FieldConfidence<string | null>;
  }): ConfidenceLevel {
    // Both type and amount are core required fields
    if (fields.type.confidence === 'HIGH' && fields.amount.confidence === 'HIGH') {
      if (fields.ref.confidence === 'HIGH' || fields.account.confidence === 'HIGH') {
        return 'HIGH';
      }
      return 'MEDIUM';
    }

    if (fields.type.confidence === 'LOW' || fields.amount.confidence === 'LOW') {
      return 'LOW';
    }

    return 'MEDIUM';
  }

  /**
   * Generates a deterministic record identifier for deduplication
   */
  static generateRecordId(
    bank: string,
    ref: string | null,
    amount: number,
    timestamp: number,
    account: string | null
  ): string {
    if (ref && ref.length >= 6) {
      return `TXN-${bank.toUpperCase()}-${ref}`;
    }
    // Fallback composite key: Bank_Account_Amount_RoundedMinute
    const minuteBucket = Math.floor(timestamp / 60000);
    const cleanAccount = account || 'NONE';
    return `TXN-${bank.toUpperCase()}-${cleanAccount}-${amount.toFixed(2)}-${minuteBucket}`;
  }
}
