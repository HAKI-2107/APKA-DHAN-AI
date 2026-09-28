import { BaseMessageParser } from '../MessageParser';
import { RawMessageInput, ParseResult } from '../types';
import { TransactionNormalizer } from '../TransactionNormalizer';

/**
 * GENERIC UPI & APP NOTIFICATION PARSER
 * Handles PhonePe, Paytm, Google Pay, CRED, BHIM, and general UPI alerts
 */
export class GenericUpiMessageParser extends BaseMessageParser {
  readonly name = 'Generic UPI & App Notification Parser';
  readonly providerId = 'generic_upi';
  readonly supportedSenderPatterns = [
    /.*PAYTM.*/i,
    /.*PHONEPE.*/i,
    /.*BHIM.*/i,
    /.*GPAY.*/i,
    /.*CRED.*/i,
    /.*UPI.*/i,
  ];

  protected matchesBodyKeywords(body: string): boolean {
    const lower = body.toLowerCase();
    return (
      lower.includes('upi') ||
      lower.includes('phonepe') ||
      lower.includes('paytm') ||
      lower.includes('gpay') ||
      lower.includes('google pay') ||
      lower.includes('collect request') ||
      lower.includes('paid rs') ||
      lower.includes('sent rs') ||
      lower.includes('received rs')
    );
  }

  protected internalParse(input: RawMessageInput): ParseResult {
    const body = input.body;

    // 1. Transaction Type
    const typeConfidence = TransactionNormalizer.normalizeTransactionType(body);

    // 2. Amount Extraction (supports ₹, Rs., INR)
    const amountMatch = body.match(/(?:₹|rs\.?|inr)\s*([\d,]+(?:\.\d{1,2})?)/i);
    const amountConfidence = TransactionNormalizer.normalizeAmount(amountMatch ? amountMatch[0] : null);

    // 3. Masked Account
    const accountMatch = body.match(/(?:a\/c|ac|bank|card|account|using)[\s\w.:]*[*xX]+(\d{3,6})\b/i);
    const accountConfidence = TransactionNormalizer.normalizeMaskedAccount(accountMatch ? accountMatch[0] : null);

    // 4. Merchant / Counterparty
    let rawMerchant: string | null = null;
    const toMatch = body.match(/(?:paid(?:\s+rs\.?\s*[\d,.]+)?\s+to|sent(?:\s+rs\.?\s*[\d,.]+)?\s+to|to)\s+([A-Za-z0-9\s._&-]+?)(?:\s+on|\s+using|\s+via|\s+upi|\.|$)/i);
    if (toMatch) {
      rawMerchant = toMatch[1];
    } else {
      const fromMatch = body.match(/(?:received(?:\s+rs\.?\s*[\d,.]+)?\s+from|request(?:\s+of\s+rs\.?\s*[\d,.]+)?\s+from|from)\s+([A-Za-z0-9\s._@&-]+?)(?:\s+on|\s+using|\s+via|\.|$)/i);
      if (fromMatch) rawMerchant = fromMatch[1];
    }
    const merchantConfidence = TransactionNormalizer.normalizeMerchant(rawMerchant);

    // 5. UPI ID
    const upiConfidence = TransactionNormalizer.normalizeUpiId(body);

    // 6. Reference ID (UPI Ref, Ref No, UTR)
    const refMatch = body.match(/(?:upi\s+ref(?:\s+no\.?)?|ref(?:\s+no\.?)?|utr|rrn)\s*:?\s*([0-9]{8,16})/i);
    const refConfidence = TransactionNormalizer.normalizeReferenceId(refMatch ? refMatch[1] : null);

    // 7. Date & Time
    const dateMatch = body.match(/on\s+(\d{1,2}[-/ ][A-Za-z0-9]+[-/ ]\d{2,4}(?:\s+\d{1,2}:\d{2}(?::\d{2})?)?)/i);
    const { timestamp, isoDateString } = TransactionNormalizer.normalizeTimestamp(
      dateMatch ? dateMatch[1] : null,
      input.timestampEpochMs
    );

    // 8. Provider name detection
    let detectedProvider = 'UPI Network';
    const lower = body.toLowerCase();
    if (lower.includes('phonepe')) detectedProvider = 'PhonePe UPI';
    else if (lower.includes('paytm')) detectedProvider = 'Paytm UPI';
    else if (lower.includes('google pay') || lower.includes('gpay')) detectedProvider = 'Google Pay';
    else if (lower.includes('cred')) detectedProvider = 'CRED UPI';
    else if (lower.includes('bhim')) detectedProvider = 'BHIM UPI';

    if (amountConfidence.value <= 0) {
      return {
        success: false,
        errorReason: 'PARSE_FAILED',
        details: 'Could not extract valid transaction amount from UPI notification.',
        matchedParserName: this.name,
      };
    }

    const overallConfidence = TransactionNormalizer.calculateOverallConfidence({
      type: typeConfidence,
      amount: amountConfidence,
      account: accountConfidence,
      merchant: merchantConfidence,
      ref: refConfidence,
    });

    const recordId = TransactionNormalizer.generateRecordId(
      detectedProvider.replace(/\s+/g, '_'),
      refConfidence.value,
      amountConfidence.value,
      timestamp.value,
      accountConfidence.value
    );

    return {
      success: true,
      matchedParserName: this.name,
      record: {
        id: recordId,
        bankOrProvider: detectedProvider,
        transactionType: typeConfidence,
        amount: amountConfidence,
        currency: 'INR',
        merchant: merchantConfidence,
        maskedAccount: accountConfidence,
        upiIdentifier: upiConfidence,
        timestamp,
        isoDateString,
        referenceId: refConfidence,
        balanceAfterTransaction: null,
        overallConfidence,
        parsedAtEpochMs: Date.now(),
      },
    };
  }
}
