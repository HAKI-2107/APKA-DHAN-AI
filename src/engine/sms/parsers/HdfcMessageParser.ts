import { BaseMessageParser } from '../MessageParser';
import { RawMessageInput, ParseResult } from '../types';
import { TransactionNormalizer } from '../TransactionNormalizer';

/**
 * HDFC BANK SMS PARSER
 * Handles standard HDFC consumer notifications
 */
export class HdfcMessageParser extends BaseMessageParser {
  readonly name = 'HDFC Bank SMS Parser';
  readonly providerId = 'hdfc_bank';
  readonly supportedSenderPatterns = [/.*HDFCBK.*/i, /.*HDFCBN.*/i, /.*HDFCAL.*/i];

  protected matchesBodyKeywords(body: string): boolean {
    const lower = body.toLowerCase();
    return lower.includes('hdfc bank') || lower.includes('hdfcbank') || lower.includes('hdfc');
  }

  protected internalParse(input: RawMessageInput): ParseResult {
    const body = input.body;

    // 1. Transaction Type
    const typeConfidence = TransactionNormalizer.normalizeTransactionType(body);

    // 2. Amount Extraction
    // Patterns: "Rs. 1,500.00", "Rs 1500.00", "INR 1,500.00"
    const amountMatch = body.match(/(?:rs\.?|inr)\s*([\d,]+(?:\.\d{1,2})?)/i);
    const amountConfidence = TransactionNormalizer.normalizeAmount(amountMatch ? amountMatch[0] : null);

    // 3. Masked Account
    // Patterns: "A/C **1234", "a/c linked to", "A/C no. **5678"
    const accountMatch = body.match(/(?:a\/c|account)[\s\w.]*[*xX]*(\d{3,6})\b/i);
    const accountConfidence = TransactionNormalizer.normalizeMaskedAccount(accountMatch ? accountMatch[0] : null);

    // 4. Merchant / Counterparty
    // Patterns: "to SWIGGY on", "to ZOMATO via UPI", "by a/c linked to VPA user@bank"
    let rawMerchant: string | null = null;
    const toMatch = body.match(/\bto\s+([A-Za-z0-9\s._&-]+?)(?:\s+on|\s+via|\s+ref|\.|$)/i);
    if (toMatch) {
      rawMerchant = toMatch[1];
    } else {
      const byMatch = body.match(/\bby\s+(?:a\/c\s+linked\s+to\s+)?([A-Za-z0-9\s._@&-]+?)(?:\s+on|\s+ref|\.|$)/i);
      if (byMatch) rawMerchant = byMatch[1];
    }
    const merchantConfidence = TransactionNormalizer.normalizeMerchant(rawMerchant);

    // 5. UPI ID
    const upiConfidence = TransactionNormalizer.normalizeUpiId(body);

    // 6. Reference ID (12-digit UTR)
    // Patterns: "Ref 426811223344", "Ref No 426811223344", "UPI Ref 426811223344"
    const refMatch = body.match(/(?:ref(?:\s+no\.?)?|rrn|utr)\s*:?\s*([0-9]{8,16})/i);
    const refConfidence = TransactionNormalizer.normalizeReferenceId(refMatch ? refMatch[1] : null);

    // 7. Date & Time
    // Pattern: "on 25-SEP-24", "on 25-09-24", "on 25-09-2024"
    const dateMatch = body.match(/on\s+(\d{1,2}[-/ ][A-Za-z0-9]+[-/ ]\d{2,4}(?:\s+\d{1,2}:\d{2}(?::\d{2})?)?)/i);
    const { timestamp, isoDateString } = TransactionNormalizer.normalizeTimestamp(
      dateMatch ? dateMatch[1] : null,
      input.timestampEpochMs
    );

    // 8. Balance after transaction (if present)
    let balance: number | null = null;
    const balMatch = body.match(/(?:bal(?:ance)?|avl\s*bal)\s*(?:rs\.?|inr)?\s*([\d,]+(?:\.\d{1,2})?)/i);
    if (balMatch) {
      const parsedBal = parseFloat(balMatch[1].replace(/,/g, ''));
      if (!isNaN(parsedBal)) balance = parsedBal;
    }

    // Validation requirement: Amount must be valid (> 0)
    if (amountConfidence.value <= 0) {
      return {
        success: false,
        errorReason: 'PARSE_FAILED',
        details: 'Could not extract valid transaction amount from HDFC message.',
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
      'HDFC',
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
        bankOrProvider: 'HDFC Bank',
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
