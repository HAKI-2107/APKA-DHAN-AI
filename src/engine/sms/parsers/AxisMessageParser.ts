import { BaseMessageParser } from '../MessageParser';
import { RawMessageInput, ParseResult } from '../types';
import { TransactionNormalizer } from '../TransactionNormalizer';

/**
 * AXIS BANK SMS PARSER
 * Handles standard Axis Bank consumer notifications
 */
export class AxisMessageParser extends BaseMessageParser {
  readonly name = 'Axis Bank SMS Parser';
  readonly providerId = 'axis_bank';
  readonly supportedSenderPatterns = [/.*AXISBK.*/i, /.*AXISBN.*/i];

  protected matchesBodyKeywords(body: string): boolean {
    const lower = body.toLowerCase();
    return lower.includes('axis bank') || lower.includes('axisbank') || lower.includes('axis');
  }

  protected internalParse(input: RawMessageInput): ParseResult {
    const body = input.body;

    // 1. Transaction Type
    const typeConfidence = TransactionNormalizer.normalizeTransactionType(body);

    // 2. Amount Extraction
    const amountMatch = body.match(/(?:inr|rs\.?)\s*([\d,]+(?:\.\d{1,2})?)/i);
    const amountConfidence = TransactionNormalizer.normalizeAmount(amountMatch ? amountMatch[0] : null);

    // 3. Masked Account
    // Pattern: "A/C no. XX3456", "A/C XX3456"
    const accountMatch = body.match(/(?:a\/c(?:\s+no\.?)?|account)[\s\w.:]*[*xX]*(\d{3,6})\b/i);
    const accountConfidence = TransactionNormalizer.normalizeMaskedAccount(accountMatch ? accountMatch[0] : null);

    // 4. Merchant & Reference from "towards UPI/BLINKIT/426855443322" or "by UPI/426888771122/Refund"
    let rawMerchant: string | null = null;
    let rawRef: string | null = null;

    const axisUpiMatch = body.match(/(?:towards|by)\s+upi\/([A-Za-z0-9._@-]+?)\/([0-9]{8,16})/i);
    if (axisUpiMatch) {
      rawMerchant = axisUpiMatch[1];
      rawRef = axisUpiMatch[2];
    } else {
      const altAxisMatch = body.match(/upi\/([0-9]{8,16})\/([A-Za-z0-9._@-]+)/i);
      if (altAxisMatch) {
        rawRef = altAxisMatch[1];
        rawMerchant = altAxisMatch[2];
      } else {
        const toMatch = body.match(/(?:towards|to)\s+([A-Za-z0-9\s._&-]+?)(?:\s+on|\.|$)/i);
        if (toMatch) rawMerchant = toMatch[1];
        const refMatch = body.match(/(?:ref(?:\s+no\.?)?|utr)\s*:?\s*([0-9]{8,16})/i);
        if (refMatch) rawRef = refMatch[1];
      }
    }

    const merchantConfidence = TransactionNormalizer.normalizeMerchant(rawMerchant);
    const refConfidence = TransactionNormalizer.normalizeReferenceId(rawRef);
    const upiConfidence = TransactionNormalizer.normalizeUpiId(body);

    // 5. Date & Time
    // Pattern: "on 25-09-2024 14:32:10" or "on 24-09-2024"
    const dateMatch = body.match(/on\s+(\d{1,2}[-/ ]\d{1,2}[-/ ]\d{2,4}(?:\s+\d{1,2}:\d{2}(?::\d{2})?)?)/i);
    const { timestamp, isoDateString } = TransactionNormalizer.normalizeTimestamp(
      dateMatch ? dateMatch[1] : null,
      input.timestampEpochMs
    );

    // 6. Available Balance
    let balance: number | null = null;
    const balMatch = body.match(/(?:avl\s*bal|bal(?:ance)?)\s*(?:inr|rs\.?)?\s*([\d,]+(?:\.\d{1,2})?)/i);
    if (balMatch) {
      const parsed = parseFloat(balMatch[1].replace(/,/g, ''));
      if (!isNaN(parsed)) balance = parsed;
    }

    if (amountConfidence.value <= 0) {
      return {
        success: false,
        errorReason: 'PARSE_FAILED',
        details: 'Could not extract valid transaction amount from Axis Bank message.',
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
      'AXIS',
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
        bankOrProvider: 'Axis Bank',
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
