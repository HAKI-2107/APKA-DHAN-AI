import { BaseMessageParser } from '../MessageParser';
import { RawMessageInput, ParseResult } from '../types';
import { TransactionNormalizer } from '../TransactionNormalizer';

/**
 * STATE BANK OF INDIA (SBI) SMS PARSER
 * Handles standard SBI consumer notifications
 */
export class SbiMessageParser extends BaseMessageParser {
  readonly name = 'State Bank of India SMS Parser';
  readonly providerId = 'sbi_bank';
  readonly supportedSenderPatterns = [/.*SBIINB.*/i, /.*SBIPSG.*/i, /.*SBISMS.*/i, /.*SBICRD.*/i];

  protected matchesBodyKeywords(body: string): boolean {
    const lower = body.toLowerCase();
    return lower.includes('sbi') || lower.includes('state bank of india') || lower.includes('sbi user');
  }

  protected internalParse(input: RawMessageInput): ParseResult {
    const body = input.body;

    // 1. Transaction Type
    const typeConfidence = TransactionNormalizer.normalizeTransactionType(body);

    // 2. Amount Extraction
    const amountMatch = body.match(/(?:rs\.?|inr)\s*([\d,]+(?:\.\d{1,2})?)/i);
    const amountConfidence = TransactionNormalizer.normalizeAmount(amountMatch ? amountMatch[0] : null);

    // 3. Masked Account
    // Patterns: "A/C XXXXX123456", "A/C 9876", "Account **1234"
    const accountMatch = body.match(/(?:a\/c|account)[\s\w.:]*[*xX]*(\d{3,6})\b/i);
    const accountConfidence = TransactionNormalizer.normalizeMaskedAccount(accountMatch ? accountMatch[0] : null);

    // 4. Merchant / Counterparty
    // Patterns: "transfer to ZOMATO Ref", "by UPI/426833445566/Employer", "to merchant@okhdfcbank"
    let rawMerchant: string | null = null;
    const toMatch = body.match(/(?:transfer to|to|at)\s+([A-Za-z0-9\s._&-]+?)(?:\s+ref|\s+on|\.|$)/i);
    if (toMatch) {
      rawMerchant = toMatch[1];
    } else {
      const byMatch = body.match(/\bby\s+(?:upi\/\d+\/)?([A-Za-z0-9\s._@&-]+?)(?:\s+ref|\s+on|\.|$)/i);
      if (byMatch) rawMerchant = byMatch[1];
    }
    const merchantConfidence = TransactionNormalizer.normalizeMerchant(rawMerchant);

    // 5. UPI ID
    const upiConfidence = TransactionNormalizer.normalizeUpiId(body);

    // 6. Reference ID (UTR / Ref No)
    // Patterns: "Ref No 426800112233", "UPI/426833445566/", "Ref 426800112233"
    const refMatch = body.match(/(?:ref(?:\s+no\.?)?|upi\/)\s*:?\s*([0-9]{8,16})/i);
    const refConfidence = TransactionNormalizer.normalizeReferenceId(refMatch ? refMatch[1] : null);

    // 7. Date & Time
    // Patterns: "on 24Sep24", "on 23-09-2024"
    const dateMatch = body.match(/on\s+(\d{1,2}[-/ ]?[A-Za-z0-9]+[-/ ]?\d{2,4}(?:\s+\d{1,2}:\d{2}(?::\d{2})?)?)/i);
    const { timestamp, isoDateString } = TransactionNormalizer.normalizeTimestamp(
      dateMatch ? dateMatch[1] : null,
      input.timestampEpochMs
    );

    // 8. Available Balance
    let balance: number | null = null;
    const balMatch = body.match(/(?:avl\s*bal|bal(?:ance)?)\s*(?:rs\.?|inr)?\s*([\d,]+(?:\.\d{1,2})?)/i);
    if (balMatch) {
      const parsed = parseFloat(balMatch[1].replace(/,/g, ''));
      if (!isNaN(parsed)) balance = parsed;
    }

    if (amountConfidence.value <= 0) {
      return {
        success: false,
        errorReason: 'PARSE_FAILED',
        details: 'Could not extract valid transaction amount from SBI message.',
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
      'SBI',
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
        bankOrProvider: 'State Bank of India',
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
