import test, { describe } from 'node:test';
import assert from 'node:assert';
import { ParserRegistry } from '../src/engine/sms/ParserRegistry';
import { TransactionNormalizer } from '../src/engine/sms/TransactionNormalizer';
import { TransactionRepository } from '../src/engine/sms/TransactionRepository';
import { HdfcMessageParser } from '../src/engine/sms/parsers/HdfcMessageParser';
import { SbiMessageParser } from '../src/engine/sms/parsers/SbiMessageParser';
import { IciciMessageParser } from '../src/engine/sms/parsers/IciciMessageParser';
import { AxisMessageParser } from '../src/engine/sms/parsers/AxisMessageParser';
import { KotakMessageParser } from '../src/engine/sms/parsers/KotakMessageParser';
import { GenericUpiMessageParser } from '../src/engine/sms/parsers/GenericUpiMessageParser';

// All test vectors are 100% synthetic fictitious test messages (no real user data)
const SYNTHETIC_HDFC_DEBIT = {
  senderId: 'VK-HDFCBK',
  body: 'Sent Rs. 1,500.00 from HDFC Bank A/C **1234 to SWIGGY on 25-SEP-24 via UPI. Ref 426811223344. Bal Rs 45,210.00',
};

const SYNTHETIC_HDFC_CREDIT = {
  senderId: 'VK-HDFCBK',
  body: 'Rs 5,000.00 credited to HDFC Bank A/C **5678 on 24-SEP-24 by a/c linked to VPA colleague@okhdfcbank. Ref 426899887766. Bal Rs 50,210.00',
};

const SYNTHETIC_SBI_DEBIT = {
  senderId: 'AD-SBIINB',
  body: 'Your A/C XXXXX123456 debited by Rs 2,450.00 on 24Sep24 transfer to ZOMATO Ref No 426800112233. Avl Bal Rs 45,210.00 - SBI',
};

const SYNTHETIC_ICICI_DEBIT = {
  senderId: 'AX-ICICIB',
  body: 'Acct XX9012 debited for Rs 899.00 on 25-Sep-24. UPI:AMAZON.UPI:426877665544. Call 1800... if not you.',
};

const SYNTHETIC_AXIS_DEBIT = {
  senderId: 'BZ-AXISBK',
  body: 'INR 3,200.00 debited from Axis Bank A/C no. XX3456 on 25-09-2024 14:32:10 towards UPI/BLINKIT/426855443322. Avl Bal INR 12,890.00',
};

const SYNTHETIC_KOTAK_DEBIT = {
  senderId: 'DZ-KOTAKB',
  body: 'Sent Rs. 450.00 from Kotak Bank AC X1234 to UBER on 25-09-2024. UPI Ref 426866778899. Bal: Rs 8,920.00',
};

const SYNTHETIC_PHONEPE_DEBIT = {
  senderId: 'VM-PHONEPE',
  body: 'You paid ₹320.00 to Chai Point on PhonePe using Bank of Baroda **4321. UPI Ref: 426844556677.',
};

const SYNTHETIC_COLLECT_REQUEST = {
  senderId: 'AX-UPIALERT',
  body: 'Incoming collect request of Rs 49,999.00 from electricity-refund@axl on UPI. Approve only if you are paying.',
};

const SYNTHETIC_OTP_MESSAGE = {
  senderId: 'VK-HDFCBK',
  body: '123456 is your Secret OTP for NetBanking login. Valid for 10 mins. Do not share OTP with anyone.',
};

const SYNTHETIC_PROMOTIONAL_MESSAGE = {
  senderId: 'AD-LOANS',
  body: 'Congratulations! You are eligible for an instant pre-approved personal loan of Rs 5,00,000. Apply now.',
};

describe('Android Transaction Message Analysis - Bank Parsers', () => {
  test('HdfcMessageParser extracts debit type, amount, merchant, masked account, UTR, and confidence', () => {
    const parser = new HdfcMessageParser();
    const result = parser.parse(SYNTHETIC_HDFC_DEBIT);

    assert.strictEqual(result.success, true);
    assert.ok(result.record);
    assert.strictEqual(result.record.bankOrProvider, 'HDFC Bank');
    assert.strictEqual(result.record.transactionType.value, 'DEBIT');
    assert.strictEqual(result.record.amount.value, 1500.0);
    assert.strictEqual(result.record.amount.confidence, 'HIGH');
    assert.strictEqual(result.record.merchant.value, 'Swiggy');
    assert.strictEqual(result.record.maskedAccount.value, 'XX1234');
    assert.strictEqual(result.record.referenceId.value, '426811223344');
    assert.strictEqual(result.record.referenceId.confidence, 'HIGH');
    assert.strictEqual(result.record.overallConfidence, 'HIGH');
  });

  test('HdfcMessageParser extracts credit transaction with VPA', () => {
    const parser = new HdfcMessageParser();
    const result = parser.parse(SYNTHETIC_HDFC_CREDIT);

    assert.strictEqual(result.success, true);
    assert.ok(result.record);
    assert.strictEqual(result.record.transactionType.value, 'CREDIT');
    assert.strictEqual(result.record.amount.value, 5000.0);
    assert.strictEqual(result.record.maskedAccount.value, 'XX5678');
    assert.strictEqual(result.record.upiIdentifier.value, 'colleague@okhdfcbank');
    assert.strictEqual(result.record.referenceId.value, '426899887766');
  });

  test('SbiMessageParser extracts debit transaction with masked account and UTR', () => {
    const parser = new SbiMessageParser();
    const result = parser.parse(SYNTHETIC_SBI_DEBIT);

    assert.strictEqual(result.success, true);
    assert.ok(result.record);
    assert.strictEqual(result.record.bankOrProvider, 'State Bank of India');
    assert.strictEqual(result.record.transactionType.value, 'DEBIT');
    assert.strictEqual(result.record.amount.value, 2450.0);
    assert.strictEqual(result.record.merchant.value, 'Zomato');
    assert.strictEqual(result.record.maskedAccount.value, 'XX3456');
    assert.strictEqual(result.record.referenceId.value, '426800112233');
    assert.strictEqual(result.record.balanceAfterTransaction, 45210.0);
  });

  test('IciciMessageParser extracts debit transaction with ICICI UPI token format', () => {
    const parser = new IciciMessageParser();
    const result = parser.parse(SYNTHETIC_ICICI_DEBIT);

    assert.strictEqual(result.success, true);
    assert.ok(result.record);
    assert.strictEqual(result.record.bankOrProvider, 'ICICI Bank');
    assert.strictEqual(result.record.transactionType.value, 'DEBIT');
    assert.strictEqual(result.record.amount.value, 899.0);
    assert.strictEqual(result.record.merchant.value, 'Amazon');
    assert.strictEqual(result.record.maskedAccount.value, 'XX9012');
    assert.strictEqual(result.record.referenceId.value, '426877665544');
  });

  test('AxisMessageParser extracts debit transaction with BLINKIT merchant and UTR', () => {
    const parser = new AxisMessageParser();
    const result = parser.parse(SYNTHETIC_AXIS_DEBIT);

    assert.strictEqual(result.success, true);
    assert.ok(result.record);
    assert.strictEqual(result.record.bankOrProvider, 'Axis Bank');
    assert.strictEqual(result.record.transactionType.value, 'DEBIT');
    assert.strictEqual(result.record.amount.value, 3200.0);
    assert.strictEqual(result.record.merchant.value, 'Blinkit');
    assert.strictEqual(result.record.maskedAccount.value, 'XX3456');
    assert.strictEqual(result.record.referenceId.value, '426855443322');
  });

  test('KotakMessageParser extracts debit transaction with UBER merchant and UTR', () => {
    const parser = new KotakMessageParser();
    const result = parser.parse(SYNTHETIC_KOTAK_DEBIT);

    assert.strictEqual(result.success, true);
    assert.ok(result.record);
    assert.strictEqual(result.record.bankOrProvider, 'Kotak Mahindra Bank');
    assert.strictEqual(result.record.transactionType.value, 'DEBIT');
    assert.strictEqual(result.record.amount.value, 450.0);
    assert.strictEqual(result.record.merchant.value, 'Uber');
    assert.strictEqual(result.record.maskedAccount.value, 'XX1234');
    assert.strictEqual(result.record.referenceId.value, '426866778899');
  });

  test('GenericUpiMessageParser extracts PhonePe and Collect Request notifications', () => {
    const parser = new GenericUpiMessageParser();

    // PhonePe notification
    const phonepeRes = parser.parse(SYNTHETIC_PHONEPE_DEBIT);
    assert.strictEqual(phonepeRes.success, true);
    assert.ok(phonepeRes.record);
    assert.strictEqual(phonepeRes.record.transactionType.value, 'DEBIT');
    assert.strictEqual(phonepeRes.record.amount.value, 320.0);
    assert.strictEqual(phonepeRes.record.merchant.value, 'Chai Point');
    assert.strictEqual(phonepeRes.record.maskedAccount.value, 'XX4321');
    assert.strictEqual(phonepeRes.record.referenceId.value, '426844556677');

    // Collect request notification
    const collectRes = parser.parse(SYNTHETIC_COLLECT_REQUEST);
    assert.strictEqual(collectRes.success, true);
    assert.ok(collectRes.record);
    assert.strictEqual(collectRes.record.transactionType.value, 'COLLECT_REQUEST');
    assert.strictEqual(collectRes.record.amount.value, 49999.0);
    assert.strictEqual(collectRes.record.upiIdentifier.value, 'electricity-refund@axl');
  });
});

describe('Android Transaction Message Analysis - ParserRegistry & Failure Safety', () => {
  test('ParserRegistry routes to appropriate bank parser based on sender ID or body', () => {
    const registry = new ParserRegistry();

    const hdfc = registry.parseMessage(SYNTHETIC_HDFC_DEBIT);
    assert.strictEqual(hdfc.success, true);
    assert.strictEqual(hdfc.record?.bankOrProvider, 'HDFC Bank');

    const sbi = registry.parseMessage(SYNTHETIC_SBI_DEBIT);
    assert.strictEqual(sbi.success, true);
    assert.strictEqual(sbi.record?.bankOrProvider, 'State Bank of India');
  });

  test('Safe failure handling: safely rejects non-financial OTP messages without crashing', () => {
    const registry = new ParserRegistry();
    const result = registry.parseMessage(SYNTHETIC_OTP_MESSAGE);

    assert.strictEqual(result.success, false);
    assert.strictEqual(result.errorReason, 'NON_TRANSACTIONAL_MESSAGE');
    assert.strictEqual(result.record, undefined);
  });

  test('Safe failure handling: safely rejects promotional marketing spam', () => {
    const registry = new ParserRegistry();
    const result = registry.parseMessage(SYNTHETIC_PROMOTIONAL_MESSAGE);

    assert.strictEqual(result.success, false);
    assert.strictEqual(result.errorReason, 'NON_TRANSACTIONAL_MESSAGE');
  });

  test('Safe failure handling: safely rejects empty or whitespace messages', () => {
    const registry = new ParserRegistry();
    const result = registry.parseMessage({ body: '   ' });

    assert.strictEqual(result.success, false);
    assert.strictEqual(result.errorReason, 'EMPTY_MESSAGE');
  });
});

describe('Android Transaction Message Analysis - Normalizer & Field Confidences', () => {
  test('TransactionNormalizer exposes granular field confidence', () => {
    const amountConf = TransactionNormalizer.normalizeAmount('Rs. 1,299.50');
    assert.strictEqual(amountConf.value, 1299.5);
    assert.strictEqual(amountConf.confidence, 'HIGH');

    const rawNumConf = TransactionNormalizer.normalizeAmount('450');
    assert.strictEqual(rawNumConf.value, 450);
    assert.strictEqual(rawNumConf.confidence, 'LOW');

    const accountConf = TransactionNormalizer.normalizeMaskedAccount('A/C XXXXX9988');
    assert.strictEqual(accountConf.value, 'XX9988');
    assert.strictEqual(accountConf.confidence, 'HIGH');

    const upiConf = TransactionNormalizer.normalizeUpiId('payment to merchant@okhdfcbank');
    assert.strictEqual(upiConf.value, 'merchant@okhdfcbank');
    assert.strictEqual(upiConf.confidence, 'HIGH');

    const utrConf = TransactionNormalizer.normalizeReferenceId('426811223344');
    assert.strictEqual(utrConf.value, '426811223344');
    assert.strictEqual(utrConf.confidence, 'HIGH');
  });

  test('TransactionNormalizer correctly normalizes Indian bank date formats to UTC epoch and ISO string', () => {
    const { timestamp, isoDateString } = TransactionNormalizer.normalizeTimestamp('25-SEP-24');
    assert.strictEqual(timestamp.confidence, 'HIGH');
    assert.ok(isoDateString.startsWith('2024-09-25'));
  });
});

describe('Android Transaction Message Analysis - TransactionRepository & Offline Privacy', () => {
  test('TransactionRepository persists normalized records without storing raw message content', () => {
    const repo = new TransactionRepository(null); // In-memory instance

    const registry = new ParserRegistry();
    const parseResult = registry.parseMessage(SYNTHETIC_HDFC_DEBIT);
    assert.ok(parseResult.record);

    const saveResult = repo.save(parseResult.record);
    assert.strictEqual(saveResult.saved, true);
    assert.strictEqual(saveResult.isDuplicate, false);

    // Verify privacy audit metrics: 0 raw messages stored
    const audit = repo.getPrivacyAudit();
    assert.strictEqual(audit.totalRecordsCount, 1);
    assert.strictEqual(audit.rawMessageContentRetainedCount, 0);
    assert.strictEqual(audit.offlineOnlyStorage, true);
  });

  test('TransactionRepository deduplicates transactions by UTR reference ID', () => {
    const repo = new TransactionRepository(null);
    const registry = new ParserRegistry();

    const first = registry.parseMessage(SYNTHETIC_HDFC_DEBIT);
    assert.ok(first.record);
    repo.save(first.record);

    // Re-parsing the same SMS must be identified as duplicate
    const second = registry.parseMessage(SYNTHETIC_HDFC_DEBIT);
    assert.ok(second.record);
    const secondSave = repo.save(second.record);

    assert.strictEqual(secondSave.saved, false);
    assert.strictEqual(secondSave.isDuplicate, true);
    assert.strictEqual(repo.getAll().length, 1);
  });

  test('TransactionRepository calculates spending summaries and category totals', () => {
    const repo = new TransactionRepository(null);
    const registry = new ParserRegistry();

    const hdfc = registry.parseMessage(SYNTHETIC_HDFC_DEBIT);
    const sbi = registry.parseMessage(SYNTHETIC_SBI_DEBIT);
    const credit = registry.parseMessage(SYNTHETIC_HDFC_CREDIT);

    if (hdfc.record) repo.save(hdfc.record);
    if (sbi.record) repo.save(sbi.record);
    if (credit.record) repo.save(credit.record);

    const summary = repo.getSpendingSummary(0);
    assert.strictEqual(summary.debitCount, 2);
    assert.strictEqual(summary.creditCount, 1);
    assert.strictEqual(summary.totalDebits, 1500.0 + 2450.0);
    assert.strictEqual(summary.totalCredits, 5000.0);
    assert.strictEqual(summary.merchantTotals['Swiggy'], 1500.0);
    assert.strictEqual(summary.merchantTotals['Zomato'], 2450.0);
  });
});
