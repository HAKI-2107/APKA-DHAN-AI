import { BaseMessageParser } from '../MessageParser';
import { RawMessageInput, ParseResult } from '../types';
import { TransactionNormalizer } from '../TransactionNormalizer';

/**
 * ICICI BANK SMS PARSER
 * Handles standard ICICI consumer notifications
 */
export class IciciMessageParser extends BaseMessageParser {
  readonly name = 'ICICI Bank SMS Parser';
  readonly providerId = 'icici_bank';
  readonly supportedSenderPatterns = [/.*ICICIB.*/i, /.*ICICIT.*/i, /.*ICICIS.*/i];

  protected matchesBodyKeywords(body: string): boolean {
    const lower = body.toLowerCase();
    return lower.includes('icici bank') || lower.includes('icicibank') || lower.includes('icici');
  }

  protected internalParse(input: RawMessageInput): ParseResult {
    const body = input.body;

    // 1. Transaction Type
    const typeConfidence = TransactionNormalizer.normalizeTransactionType(body);

    // 2. Amount Extraction
    const amountMatch = body.match(/(?:rs\.?|inr)\s*([\d,]+(?:\.\d{1,2})?)/i);
    const amountConfidence = TransactionNormalizer.normalizeAmount(amountMatch ? amountMatch[0] : null);

    // 3. Masked Account
    // Pattern: "Acct XX9012", "Account **9012"
    const accountMatch = body.match(/(?:acct|account)[\s\w.:]*[*xX]*(\d{3,6})\b/i);
    const accountConfidence = TransactionNormalizer.normalizeMaskedAccount(accountMatch ? accountMatch[0] : null);

    // 4. Merchant & Reference Extraction from ICICI format: "UPI:AMAZON.UPI:426877665544" or "UPI:user@okaxis:426811992233"
    let rawMerchant: string | null = null;
    let rawRef: string | null = null;

    const iciciUpiTokenMatch = body.match(/UPI:([A-Za-z0-9._@-]+?)(?::|\/|\.UPI:)([0-9]{8,16})/i);
    if (iciciUpiTokenMatch) {
      rawMerchant = iciciUpiTokenMatch[1];
      rawRef = iciciUpiTokenMatch[2];
    } else {
      // General fallbacks
      const toMatch = body.match(/(?:to|info:|towards)\s+([A-Za-z0-9\s._&-]+?)(?:\s+on|\.|$)/i);
      if (toMatch) rawMerchant = toMatch[1];
      const generalRefMatch = body.match(/(?:ref(?:\s+no\.?)?|utr)\s*:?\s*([0-9]{8,16})/i);
      if (generalRefMatch) rawRef = generalRefMatch[1];
    }

    const merchantConfidence = TransactionNormalizer.normalizeMerchant(rawMerchant);
    const refConfidence = TransactionNormalizer.normalizeReferenceId(rawRef);
    const upiConfidence = TransactionNormalizer.normalizeUpiId(body);

    // 5. Date & Time
    // Pattern: "on 25-Sep-24"
    const dateMatch = body.match(/on\s+(\d{1,2}[-/ ][A-Za-z0-9]+[-/ ]\d{2,4}(?:\s+\d{1,2}:\d{2}(?::\d{2})?)?)/i);
    const { timestamp, isoDateString } = TransactionNormalizer.normalizeTimestamp(
      dateMatch ? dateMatch[1] : null,
      input.timestampEpochMs
    );

    // 6. Available Balance
    let balance: number | null = null;
    const balMatch = body.match(/(?:avail\s*bal|bal(?:ance)?)\s*:?\s*(?:rs\.?|inr)?\s*([\d,]+(?:\.\d{1,2})?)/i);
    if (balMatch) {
      const parsed = parseFloat(balMatch[1].replace(/,/g, ''));
      if (!isNaN(parsed)) balance = parsed;
    }

    if (amountConfidence.value <= 0) {
      return {
        success: false,
        errorReason: 'PARSE_FAILED',
        details: 'Could not extract valid transaction amount from ICICI message.',
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
      'ICICI',
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
        bankOrProvider: 'ICICI Bank',
        transactionType: typeConfidence,
        amount: amountConfidence,
        currency: 'INR',
        merchant: merchantConfidence,
        maskedAccount: accountConfidence,
        upiIdentifier: upiConfidence,
        timestamp,
        isoDateString,
        referenceId: refConfidence,
        balanceAfterTransaction: balance,
        overallConfidence,
        parsedAtEpochMs: Date.now(),
      },
    };
  }
}
