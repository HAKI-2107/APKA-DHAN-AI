import { BaseMessageParser } from '../MessageParser';
import { RawMessageInput, ParseResult } from '../types';
import { TransactionNormalizer } from '../TransactionNormalizer';

/**
 * KOTAK MAHINDRA BANK SMS PARSER
 * Handles standard Kotak consumer notifications
 */
export class KotakMessageParser extends BaseMessageParser {
  readonly name = 'Kotak Mahindra Bank SMS Parser';
  readonly providerId = 'kotak_bank';
  readonly supportedSenderPatterns = [/.*KOTAKB.*/i, /.*KOTAKN.*/i];

  protected matchesBodyKeywords(body: string): boolean {
    const lower = body.toLowerCase();
    return lower.includes('kotak bank') || lower.includes('kotak');
  }

  protected internalParse(input: RawMessageInput): ParseResult {
    const body = input.body;

    // 1. Transaction Type
    const typeConfidence = TransactionNormalizer.normalizeTransactionType(body);

    // 2. Amount Extraction
    const amountMatch = body.match(/(?:rs\.?|inr)\s*([\d,]+(?:\.\d{1,2})?)/i);
    const amountConfidence = TransactionNormalizer.normalizeAmount(amountMatch ? amountMatch[0] : null);

    // 3. Masked Account
    // Pattern: "Kotak Bank AC X1234", "AC **1234"
    const accountMatch = body.match(/(?:ac|account)[\s\w.:]*[*xX]*(\d{3,6})\b/i);
    const accountConfidence = TransactionNormalizer.normalizeMaskedAccount(accountMatch ? accountMatch[0] : null);

    // 4. Merchant / Counterparty
    let rawMerchant: string | null = null;
    const toMatch = body.match(/\bto\s+([A-Za-z0-9\s._&-]+?)(?:\s+on|\s+via|\s+ref|\.|$)/i);
    if (toMatch) {
      rawMerchant = toMatch[1];
    } else {
      const byMatch = body.match(/\bby\s+(?:vpa\s+)?([A-Za-z0-9\s._@&-]+?)(?:\s+on|\s+ref|\.|$)/i);
      if (byMatch) rawMerchant = byMatch[1];
    }
    const merchantConfidence = TransactionNormalizer.normalizeMerchant(rawMerchant);

    // 5. UPI ID
    const upiConfidence = TransactionNormalizer.normalizeUpiId(body);

    // 6. Reference ID (UPI Ref)
    const refMatch = body.match(/(?:upi\s+ref|ref(?:\s+no\.?)?|utr)\s*:?\s*([0-9]{8,16})/i);
    const refConfidence = TransactionNormalizer.normalizeReferenceId(refMatch ? refMatch[1] : null);

    // 7. Date & Time
    const dateMatch = body.match(/on\s+(\d{1,2}[-/ ]\d{1,2}[-/ ]\d{2,4}(?:\s+\d{1,2}:\d{2}(?::\d{2})?)?)/i);
    const { timestamp, isoDateString } = TransactionNormalizer.normalizeTimestamp(
      dateMatch ? dateMatch[1] : null,
      input.timestampEpochMs
    );

    // 8. Available Balance
    let balance: number | null = null;
    const balMatch = body.match(/(?:bal(?:ance)?)\s*:?\s*(?:rs\.?|inr)?\s*([\d,]+(?:\.\d{1,2})?)/i);
    if (balMatch) {
      const parsed = parseFloat(balMatch[1].replace(/,/g, ''));
      if (!isNaN(parsed)) balance = parsed;
    }

    if (amountConfidence.value <= 0) {
      return {
        success: false,
        errorReason: 'PARSE_FAILED',
        details: 'Could not extract valid transaction amount from Kotak Bank message.',
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
      'KOTAK',
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
        bankOrProvider: 'Kotak Mahindra Bank',
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
