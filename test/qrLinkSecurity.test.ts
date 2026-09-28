import test, { describe } from 'node:test';
import assert from 'node:assert';
import { QRSecurityScanner } from '../src/engine/qrSecurityScanner';
import { LinkSecurityAnalyzer } from '../src/engine/linkSecurityAnalyzer';
import { ScreenshotSecurityAnalyzer } from '../src/engine/screenshotSecurityAnalyzer';
import { SafeAnalysisPipeline } from '../src/engine/safeAnalysisPipeline';
import { ThreatIntelligenceRegistry, ApkaDhanCentralThreatRegistry } from '../src/engine/threatIntelligence/defaultProvider';
import { ThreatIntelligenceProvider, ThreatIntelligenceResult } from '../src/engine/threatIntelligence/types';

describe('QR and Link Security Module - Function 1: Scan QR Codes', () => {
  test('Extracts UPI URI, UPI ID, merchant name, amount, note, and encoded parameters from QR', () => {
    const rawQr = 'upi://pay?pa=store.billing@okaxis&pn=MetroSupermarket&am=1250.50&tn=MonthlyGroceries&mc=5411&tr=TXN99881234&cu=INR&mode=00';
    const result = QRSecurityScanner.parseScannedPayload(rawQr);

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.fields.payloadType, 'UPI_PAYMENT');
    assert.strictEqual(result.fields.upiId, 'store.billing@okaxis');
    assert.strictEqual(result.fields.merchantName, 'MetroSupermarket');
    assert.strictEqual(result.fields.amount, 1250.5);
    assert.strictEqual(result.fields.transactionNote, 'MonthlyGroceries');
    assert.strictEqual(result.fields.otherEncodedInfo.merchantCategoryCode, '5411');
    assert.strictEqual(result.fields.otherEncodedInfo.transactionRef, 'TXN99881234');
    assert.strictEqual(result.fields.otherEncodedInfo.currency, 'INR');
    assert.strictEqual(result.fields.otherEncodedInfo.mode, '00');
    assert.strictEqual(result.fields.upiUri, rawQr);
  });

  test('Extracts Web URL and embedded parameters from Web QR Code', () => {
    const webQr = 'https://portal.bank.com/checkout?pa=vendor@okhdfcbank&am=399.00&pn=OnlineShop';
    const result = QRSecurityScanner.parseScannedPayload(webQr);

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.fields.payloadType, 'WEB_URL');
    assert.strictEqual(result.fields.url, webQr);
    assert.strictEqual(result.fields.upiId, 'vendor@okhdfcbank');
    assert.strictEqual(result.fields.amount, 399);
    assert.strictEqual(result.fields.merchantName, 'OnlineShop');
  });

  test('Identifies deceptive collect request QR code (mode=02)', () => {
    const collectQr = 'upi://pay?pa=customer-care-refund@axl&pn=ElectricityRefundDesk&am=49999.00&mode=02&tn=RefundProcessing';
    const result = QRSecurityScanner.parseScannedPayload(collectQr);

    assert.strictEqual(result.fields.otherEncodedInfo.mode, '02');
    assert.strictEqual(result.fields.upiId, 'customer-care-refund@axl');
    assert.strictEqual(result.fields.amount, 49999);
  });
});

describe('QR and Link Security Module - Function 2: Analyze Payment Links', () => {
  test('Extracts domain, subdomain, path, query parameters, and fragments', () => {
    const link = 'https://auth.secure.login.sbi-kyc-verify.top/v2/update/portal.apk?ref=promo&user=998811&redirect=https://evil.com#section2';
    const analysis = LinkSecurityAnalyzer.analyzeLink(link);

    assert.strictEqual(analysis.domain, 'sbi-kyc-verify.top');
    assert.strictEqual(analysis.subdomain, 'auth.secure.login');
    assert.strictEqual(analysis.path, '/v2/update/portal.apk');
    assert.strictEqual(analysis.queryParameters['ref'], 'promo');
    assert.strictEqual(analysis.queryParameters['user'], '998811');
    assert.strictEqual(analysis.queryParameters['redirect'], 'https://evil.com');
    assert.strictEqual(analysis.hashFragment, '#section2');
  });

  test('Identifies redirects: URL shorteners and open redirect parameters', () => {
    const shortUrl = 'https://bit.ly/3xSpecialOffer?target=https://external-pay.com';
    const analysis = LinkSecurityAnalyzer.analyzeLink(shortUrl);

    assert.strictEqual(analysis.redirects.isShortener, true);
    assert.strictEqual(analysis.redirects.shortenerService, 'bit.ly');
    assert.strictEqual(analysis.redirects.openRedirectParameters.length, 1);
    assert.strictEqual(analysis.redirects.openRedirectParameters[0].parameterName, 'target');
    assert.strictEqual(analysis.redirects.openRedirectParameters[0].targetUrl, 'https://external-pay.com');
  });

  test('Extracts suspicious patterns: TLD, brand spoof, APK payload, and sensitive credentials', () => {
    const link = 'https://hdfc-bank-rewards.top/app/download.apk?pin=1234&otp=9988';
    const analysis = LinkSecurityAnalyzer.analyzeLink(link);

    const codes = analysis.suspiciousPatterns.map((p) => p.code);
    assert.ok(codes.includes('HIGH_ABUSE_TLD'));
    assert.ok(codes.includes('FINANCIAL_BRAND_SPOOF'));
    assert.ok(codes.includes('DANGEROUS_PAYLOAD_EXTENSION'));
    assert.ok(codes.includes('SENSITIVE_CREDENTIAL_HARVESTING_PARAM'));
  });

  test('SSRF Guard: blocks loopback and private subnets from network redirects', () => {
    assert.strictEqual(LinkSecurityAnalyzer.isSafePublicDestination('127.0.0.1'), false);
    assert.strictEqual(LinkSecurityAnalyzer.isSafePublicDestination('localhost'), false);
    assert.strictEqual(LinkSecurityAnalyzer.isSafePublicDestination('192.168.1.1'), false);
    assert.strictEqual(LinkSecurityAnalyzer.isSafePublicDestination('10.0.0.5'), false);
    assert.strictEqual(LinkSecurityAnalyzer.isSafePublicDestination('169.254.169.254'), false);
    assert.strictEqual(LinkSecurityAnalyzer.isSafePublicDestination('hdfcbank.com'), true);
  });
});

describe('QR and Link Security Module - Function 3: Analyze Screenshots Containing Payment Information', () => {
  test('Sanitizes PII: Masks 12-digit Aadhaar, 10-char PAN, and PINs', () => {
    const textWithPii = 'Transfer from Aadhaar 4912 8812 9901 and PAN ABCDE1234F. My UPI PIN is 449911 for ₹5,000.';
    const sanitized = ScreenshotSecurityAnalyzer.sanitizeSensitivePii(textWithPii);

    assert.ok(sanitized.redactedCount >= 2);
    assert.ok(!sanitized.sanitizedText.includes('4912 8812 9901'));
    assert.ok(!sanitized.sanitizedText.includes('ABCDE1234F'));
    assert.ok(!sanitized.sanitizedText.includes('449911'));
  });

  test('Extracts payment details: counterparty name, amount, UTR, and detected app', () => {
    const receiptText = 'Paid successfully to Sharma Electronics on PhonePe. Amount: ₹4,800.00. UPI Ref No (UTR): 409812345678. Status: Completed.';
    const data = ScreenshotSecurityAnalyzer.analyzeScreenshotText(receiptText);

    assert.strictEqual(data.paymentDetails.amount, 4800);
    assert.strictEqual(data.paymentDetails.transactionReference, '409812345678');
    assert.strictEqual(data.paymentDetails.detectedApp, 'PhonePe');
    assert.strictEqual(data.paymentDetails.transactionStatus, 'SUCCESS');
  });

  test('Detects fake payment app receipt forgery markers', () => {
    const fakeReceipt = 'Payment Successful made using Paytm Spoon simulator tool. Transferred ₹10,000 to shop@okaxis.';
    const data = ScreenshotSecurityAnalyzer.analyzeScreenshotText(fakeReceipt);

    assert.ok(data.forgeryIndicators.length > 0);
    assert.ok(data.forgeryIndicators.some((i) => i.includes('Paytm Spoon')));
  });
});

describe('QR and Link Security Module - Threat Intelligence Interfaces & Safe Analysis Pipeline', () => {
  test('Do Not Invent Reputation: Unrated domain returns NOT_FOUND_OR_UNRATED with hasReputationData: false', async () => {
    const registry = new ThreatIntelligenceRegistry([new ApkaDhanCentralThreatRegistry()]);
    const res = await registry.lookupDomain('some-random-new-shop.in');
    const consolidated = registry.consolidateVerdict(res);

    assert.strictEqual(consolidated.verdict, 'NOT_FOUND_OR_UNRATED');
    assert.strictEqual(consolidated.hasReputationData, false);
    assert.ok(consolidated.evidence[0].includes('No negative records matched'));
  });

  test('Pluggable Interface: Allows custom real or mock ThreatIntelligenceProvider registration', async () => {
    const registry = new ThreatIntelligenceRegistry();

    // Mock an external Google Safe Browsing / VirusTotal provider
    const externalProvider: ThreatIntelligenceProvider = {
      name: 'Simulated National Fraud Feed',
      providerId: 'nat_feed_01',
      version: '1.0',
      isMock: true,
      isAuthoritative: false,
      lookupDomain: async (dom: string): Promise<ThreatIntelligenceResult> => ({
        providerName: 'Simulated National Fraud Feed',
        providerType: 'mock',
        query: dom,
        verdict: dom.includes('knownbad') ? 'CONFIRMED_MALICIOUS' : 'NOT_FOUND_OR_UNRATED',
        threatCategories: dom.includes('knownbad') ? ['phishing'] : [],
        details: dom.includes('knownbad') ? 'Flagged in national scam database' : 'No records found',
        hasReputationData: dom.includes('knownbad'),
        sources: ['[SIMULATED_FEED]'],
      }),
      lookupUrl: async () => ({} as any),
      lookupVpa: async () => ({} as any),
    };

    registry.registerProvider(externalProvider);
    assert.strictEqual(registry.getRegisteredProviders().length, 1);

    const check = await registry.lookupDomain('knownbad-site.org');
    const verdict = registry.consolidateVerdict(check);
    assert.strictEqual(verdict.verdict, 'CONFIRMED_MALICIOUS');
  });

  test('Result Screen contains all 5 required sections strictly: RISK LEVEL, WHAT WAS FOUND, WHY IT MATTERS, WHAT COULD NOT BE VERIFIED, WHAT THE USER SHOULD DO', async () => {
    const pipeline = new SafeAnalysisPipeline();
    const maliciousCollectQr = 'upi://pay?pa=customer-care-refund@okhdfcbank&pn=HDFCSupport&am=25000&mode=02&tn=Refund';

    const result = await pipeline.execute({ qrPayload: maliciousCollectQr });

    // Section 1: RISK LEVEL
    assert.strictEqual(result.riskLevel, 'HIGH RISK');
    assert.ok(result.riskSummary.length > 0);
    assert.ok(result.confidence.length > 0);

    // Section 2: WHAT WAS FOUND
    assert.strictEqual(result.whatWasFound.inputType, 'QR_CODE');
    assert.strictEqual(result.whatWasFound.upiDetails?.vpa, 'customer-care-refund@okhdfcbank');
    assert.strictEqual(result.whatWasFound.upiDetails?.merchantName, 'HDFCSupport');
    assert.strictEqual(result.whatWasFound.upiDetails?.amount, 25000);
    assert.strictEqual(result.whatWasFound.upiDetails?.isCollectRequest, true);
    assert.strictEqual(result.whatWasFound.threatIntelligence.verdict, 'CONFIRMED_MALICIOUS');

    // Section 3: WHY IT MATTERS
    assert.ok(result.whyItMatters.length >= 2);
    assert.ok(result.whyItMatters.some((m) => m.title.includes('Incoming Collect Request')));

    // Section 4: WHAT COULD NOT BE VERIFIED
    assert.ok(result.whatCouldNotBeVerified.length >= 1);
    assert.ok(result.whatCouldNotBeVerified.some((v) => v.includes('Legal identity')));

    // Section 5: WHAT THE USER SHOULD DO
    assert.ok(result.whatTheUserShouldDo.length >= 1);
    assert.ok(result.whatTheUserShouldDo.some((a) => a.action.includes('UPI PIN')));
  });
});
