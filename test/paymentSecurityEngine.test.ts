import { describe, it } from 'node:test';
import assert from 'node:assert';
import { PaymentSecurityEngine } from '../src/engine/paymentSecurityEngine';
import { InMemoryThreatLookupService } from '../src/engine/threatLookup';
import {
  SuspiciousDomainRule,
  TyposquattingRule,
  UnexpectedRedirectRule,
  UnusualRecipientRule,
  UnusualTransactionAmountRule,
  UnusualTransactionTimeRule,
  RepeatedRapidTransactionsRule,
  SuspiciousWordingRule,
  ImpersonationIndicatorsRule,
  GuaranteedReturnClaimsRule,
  UrgencyManipulationLanguageRule,
  KnownReportedIndicatorRule,
} from '../src/engine/rules';
import { NormalizedPaymentEntities, UserBehavioralProfile } from '../src/engine/types';

function createMockEntities(partial: Partial<NormalizedPaymentEntities> = {}): NormalizedPaymentEntities {
  return {
    vpa: undefined,
    vpaHandlePrefix: undefined,
    vpaPspHandle: undefined,
    url: undefined,
    domain: undefined,
    tld: undefined,
    rawUrl: undefined,
    amount: undefined,
    currency: 'INR',
    isCollectRequest: false,
    intentParameters: {},
    phoneNumbers: [],
    allTextTokens: [],
    rawCombinedText: '',
    timestampEpochMs: 1774688400000, // 2026-03-28 12:00:00 (midday)
    ...partial,
  };
}

describe('Payment Security Engine - 12 Rule Categories Unit Tests', () => {
  const threatService = new InMemoryThreatLookupService();

  // Rule 1: Suspicious Domain
  it('Rule 1: suspicious_domain flags high-abuse TLDs and raw IP addresses', () => {
    const rawIpEntities = createMockEntities({ domain: '192.168.1.1' });
    const ipSignal = SuspiciousDomainRule.evaluate(rawIpEntities, threatService);
    assert.ok(ipSignal);
    assert.strictEqual(ipSignal?.category, 'suspicious_domain');
    assert.strictEqual(ipSignal?.code, 'RAW_IP_PAYMENT_HOST');

    const tldEntities = createMockEntities({ domain: 'banking-portal.top' });
    const tldSignal = SuspiciousDomainRule.evaluate(tldEntities, threatService);
    assert.ok(tldSignal);
    assert.strictEqual(tldSignal?.category, 'suspicious_domain');
    assert.strictEqual(tldSignal?.code, 'HIGH_ABUSE_TLD');

    const cleanEntities = createMockEntities({ domain: 'hdfcbank.com' });
    assert.strictEqual(SuspiciousDomainRule.evaluate(cleanEntities, threatService), null);
  });

  // Rule 2: Typosquatting
  it('Rule 2: typosquatting flags unverified brand inclusions in domains', () => {
    const fakeSbiEntities = createMockEntities({ domain: 'sbi-card-rewards.net' });
    const sbiSignal = TyposquattingRule.evaluate(fakeSbiEntities, threatService);
    assert.ok(sbiSignal);
    assert.strictEqual(sbiSignal?.category, 'typosquatting');
    assert.strictEqual(sbiSignal?.code, 'DOMAIN_BRAND_TYPOSQUAT');

    const officialSbiEntities = createMockEntities({ domain: 'onlinesbi.sbi' });
    assert.strictEqual(TyposquattingRule.evaluate(officialSbiEntities, threatService), null);
  });

  // Rule 3: Unexpected Redirect
  it('Rule 3: unexpected_redirect flags URL shorteners and open redirect query parameters', () => {
    const shortenerEntities = createMockEntities({ domain: 'bit.ly' });
    const shortenerSignal = UnexpectedRedirectRule.evaluate(shortenerEntities, threatService);
    assert.ok(shortenerSignal);
    assert.strictEqual(shortenerSignal?.category, 'unexpected_redirect');
    assert.strictEqual(shortenerSignal?.code, 'URL_SHORTENER_OBFUSCATION');

    const redirectUrl = new URL('https://example.com/login?redirect=https://evil.com');
    const redirectEntities = createMockEntities({ url: redirectUrl, domain: 'example.com' });
    const redirectSignal = UnexpectedRedirectRule.evaluate(redirectEntities, threatService);
    assert.ok(redirectSignal);
    assert.strictEqual(redirectSignal?.code, 'OPEN_REDIRECT_PARAMETER');
  });

  // Rule 4: Unusual Recipient
  it('Rule 4: unusual_recipient flags unlisted or uncommon PSP handles', () => {
    const weirdPspEntities = createMockEntities({
      vpa: 'seller@unauthorizedbank',
      vpaPspHandle: 'unauthorizedbank',
    });
    const weirdSignal = UnusualRecipientRule.evaluate(weirdPspEntities, threatService);
    assert.ok(weirdSignal);
    assert.strictEqual(weirdSignal?.category, 'unusual_recipient');
    assert.strictEqual(weirdSignal?.code, 'UNLISTED_PSP_HANDLE');

    const validPspEntities = createMockEntities({
      vpa: 'seller@okaxis',
      vpaPspHandle: 'okaxis',
    });
    assert.strictEqual(UnusualRecipientRule.evaluate(validPspEntities, threatService), null);
  });

  // Rule 5: Unusual Transaction Amount
  it('Rule 5: unusual_transaction_amount flags high-value collect requests and baseline spikes', () => {
    const collectEntities = createMockEntities({
      amount: 49999,
      isCollectRequest: true,
    });
    const collectSignal = UnusualTransactionAmountRule.evaluate(collectEntities, threatService);
    assert.ok(collectSignal);
    assert.strictEqual(collectSignal?.category, 'unusual_transaction_amount');
    assert.strictEqual(collectSignal?.code, 'HIGH_VALUE_COLLECT_REQUEST');

    const profile: UserBehavioralProfile = {
      averageDebitAmount: 2000,
      maxHistoricalDebitAmount: 10000,
      knownBeneficiaryVpas: new Set(),
      recentTransactions: [],
    };
    const spikeEntities = createMockEntities({
      amount: 35000,
      isCollectRequest: false,
    });
    const spikeSignal = UnusualTransactionAmountRule.evaluate(spikeEntities, threatService, profile);
    assert.ok(spikeSignal);
    assert.strictEqual(spikeSignal?.code, 'AMOUNT_EXCEEDS_USER_BASELINE');
  });

  // Rule 6: Unusual Transaction Time
  it('Rule 6: unusual_transaction_time flags high-value/collect requests during off-hours (01:00 AM - 05:00 AM)', () => {
    // 02:30 AM local time
    const nightDate = new Date();
    nightDate.setHours(2, 30, 0, 0);

    const nightEntities = createMockEntities({
      amount: 15000,
      timestampEpochMs: nightDate.getTime(),
    });
    const nightSignal = UnusualTransactionTimeRule.evaluate(nightEntities, threatService);
    assert.ok(nightSignal);
    assert.strictEqual(nightSignal?.category, 'unusual_transaction_time');
    assert.strictEqual(nightSignal?.code, 'OFF_HOURS_HIGH_RISK_INTERACTION');

    // 02:30 PM (midday)
    const dayDate = new Date();
    dayDate.setHours(14, 30, 0, 0);
    const dayEntities = createMockEntities({
      amount: 15000,
      timestampEpochMs: dayDate.getTime(),
    });
    assert.strictEqual(UnusualTransactionTimeRule.evaluate(dayEntities, threatService), null);
  });

  // Rule 7: Repeated Rapid Transactions
  it('Rule 7: repeated_rapid_transactions flags burst velocity in short timeframes', () => {
    const now = Date.now();
    const burstProfile: UserBehavioralProfile = {
      averageDebitAmount: 1000,
      maxHistoricalDebitAmount: 5000,
      knownBeneficiaryVpas: new Set(),
      recentTransactions: [
        { id: '1', amount: 5000, timestampEpochMs: now - 60000, counterpartyVpa: 'v1@okhdfcbank', isDebit: true },
        { id: '2', amount: 5000, timestampEpochMs: now - 120000, counterpartyVpa: 'v2@okhdfcbank', isDebit: true },
        { id: '3', amount: 5000, timestampEpochMs: now - 180000, counterpartyVpa: 'v3@okhdfcbank', isDebit: true },
      ],
    };
    const currentEntities = createMockEntities({ timestampEpochMs: now });
    const burstSignal = RepeatedRapidTransactionsRule.evaluate(currentEntities, threatService, burstProfile);
    assert.ok(burstSignal);
    assert.strictEqual(burstSignal?.category, 'repeated_rapid_transactions');
    assert.strictEqual(burstSignal?.code, 'HIGH_VELOCITY_TRANSACTION_BURST');
  });

  // Rule 8: Suspicious Wording
  it('Rule 8: suspicious_wording flags screen-sharing app demands and APK installation requests', () => {
    const remoteAppEntities = createMockEntities({
      rawCombinedText: 'Please install AnyDesk app to verify your failed transaction and get refund.',
    });
    const toolSignal = SuspiciousWordingRule.evaluate(remoteAppEntities, threatService);
    assert.ok(toolSignal);
    assert.strictEqual(toolSignal?.category, 'suspicious_wording');
    assert.strictEqual(toolSignal?.code, 'SCREEN_SHARING_APP_SOLICITATION');

    const apkEntities = createMockEntities({
      rawCombinedText: 'Click here to install apk update for electricity bill payment.',
    });
    const apkSignal = SuspiciousWordingRule.evaluate(apkEntities, threatService);
    assert.ok(apkSignal);
    assert.strictEqual(apkSignal?.code, 'EXTERNAL_APK_DOWNLOAD_INSTRUCTION');
  });

  // Rule 9: Impersonation Indicators
  it('Rule 9: impersonation_indicators flags customer care keywords in personal consumer VPA handles', () => {
    const impersonationEntities = createMockEntities({
      vpa: 'customer-care-refund@okhdfcbank',
      vpaHandlePrefix: 'customer-care-refund',
      vpaPspHandle: 'okhdfcbank',
    });
    const impSignal = ImpersonationIndicatorsRule.evaluate(impersonationEntities, threatService);
    assert.ok(impSignal);
    assert.strictEqual(impSignal?.category, 'impersonation_indicators');
    assert.strictEqual(impSignal?.code, 'INSTITUTIONAL_KEYWORD_IMPERSONATION');

    const normalUserEntities = createMockEntities({
      vpa: 'rohit.sharma@okhdfcbank',
      vpaHandlePrefix: 'rohit.sharma',
      vpaPspHandle: 'okhdfcbank',
    });
    assert.strictEqual(ImpersonationIndicatorsRule.evaluate(normalUserEntities, threatService), null);
  });

  // Rule 10: Guaranteed-Return Claims
  it('Rule 10: guaranteed_return_claims flags promised profits and zero-risk investment pitches', () => {
    const claimEntities = createMockEntities({
      rawCombinedText: 'Join our VIP group for guaranteed return of 10% daily profit with zero risk.',
    });
    const returnSignal = GuaranteedReturnClaimsRule.evaluate(claimEntities, threatService);
    assert.ok(returnSignal);
    assert.strictEqual(returnSignal?.category, 'guaranteed_return_claims');
    assert.strictEqual(returnSignal?.code, 'PROMISES_GUARANTEED_MARKET_RETURN');
  });

  // Rule 11: Urgency & Manipulation Language
  it('Rule 11: urgency_manipulation_language flags digital arrest threats and power cut deadlines', () => {
    const arrestEntities = createMockEntities({
      rawCombinedText: 'You are placed under digital arrest by CBI Cyber Police. Transfer verification deposit within 15 minutes.',
    });
    const arrestSignal = UrgencyManipulationLanguageRule.evaluate(arrestEntities, threatService);
    assert.ok(arrestSignal);
    assert.strictEqual(arrestSignal?.category, 'urgency_manipulation_language');
    assert.strictEqual(arrestSignal?.code, 'DIGITAL_ARREST_EXTORTION');

    const billEntities = createMockEntities({
      rawCombinedText: 'Dear customer, electricity will be disconnected tonight at 9:30 PM due to unpaid bill.',
    });
    const billSignal = UrgencyManipulationLanguageRule.evaluate(billEntities, threatService);
    assert.ok(billSignal);
    assert.strictEqual(billSignal?.code, 'URGENCY_MANIPULATION_DETECTED');
  });

  // Rule 12: Known Reported Indicator
  it('Rule 12: known_reported_indicator matches known malicious VPAs, domains, and phone numbers', () => {
    const knownVpaEntities = createMockEntities({ vpa: 'customer-care-refund@okhdfcbank' });
    const vpaSignal = KnownReportedIndicatorRule.evaluate(knownVpaEntities, threatService);
    assert.ok(vpaSignal);
    assert.strictEqual(vpaSignal?.category, 'known_reported_indicator');
    assert.strictEqual(vpaSignal?.code, 'KNOWN_MALICIOUS_VPA_MATCH');

    const knownDomainEntities = createMockEntities({ domain: 'sbi-kyc-portal.top' });
    const domainSignal = KnownReportedIndicatorRule.evaluate(knownDomainEntities, threatService);
    assert.ok(domainSignal);
    assert.strictEqual(domainSignal?.code, 'KNOWN_PHISHING_DOMAIN_MATCH');

    const phoneEntities = createMockEntities({ phoneNumbers: ['9876543210'] });
    const phoneSignal = KnownReportedIndicatorRule.evaluate(phoneEntities, threatService);
    assert.ok(phoneSignal);
    assert.strictEqual(phoneSignal?.code, 'REPORTED_PHONE_NUMBER_MATCH');
  });
});

describe('Payment Security Engine - Full End-to-End Pipeline Tests', () => {
  const engine = new PaymentSecurityEngine();

  it('Pipeline evaluates malicious UPI collect request correctly', async () => {
    const assessment = await engine.evaluate({
      qrPayload: 'upi://pay?pa=customer-care-refund@okhdfcbank&pn=Helpdesk&am=49999&mode=02',
    });

    assert.strictEqual(assessment.riskLevel, 'HIGH RISK');
    assert.ok(assessment.riskSignals.length >= 2);
    assert.ok(assessment.evidence.length >= 2);
    assert.ok(assessment.sources.length >= 1);
    assert.ok(assessment.recommendedActions.length >= 2);
    assert.ok(assessment.unknownFactors.length >= 1);
    assert.strictEqual(assessment.normalizedEntities.isCollectRequest, true);
    assert.strictEqual(assessment.normalizedEntities.amount, 49999);
  });

  it('Pipeline evaluates benign merchant UPI payment as LOW RISK', async () => {
    const assessment = await engine.evaluate({
      upiId: 'store-checkout@okaxis',
      parsedTransaction: {
        amount: 250,
        isCollectRequest: false,
      },
    });

    assert.strictEqual(assessment.riskLevel, 'LOW RISK');
    assert.strictEqual(assessment.riskSignals.length, 0);
    assert.ok(assessment.recommendedActions.length >= 1);
    assert.ok(assessment.unknownFactors.length >= 1);
  });

  it('Pipeline evaluates suspicious phishing link as HIGH RISK', async () => {
    const assessment = await engine.evaluate({
      paymentLink: 'http://sbi-kyc-verification.top/update',
    });

    assert.strictEqual(assessment.riskLevel, 'HIGH RISK');
    const categories = assessment.riskSignals.map((s) => s.category);
    assert.ok(categories.includes('suspicious_domain'));
    assert.ok(categories.includes('typosquatting'));
  });

  it('Pipeline evaluates social engineering text message correctly', async () => {
    const assessment = await engine.evaluate({
      rawText: 'Urgent: You are placed under digital arrest by CBI Cyber Cell. Install AnyDesk to verify your account or police will raid.',
    });

    assert.strictEqual(assessment.riskLevel, 'HIGH RISK');
    const codes = assessment.riskSignals.map((s) => s.code);
    assert.ok(codes.includes('DIGITAL_ARREST_EXTORTION'));
    assert.ok(codes.includes('SCREEN_SHARING_APP_SOLICITATION'));
  });

  it('Pipeline accepts pluggable custom rules', async () => {
    const customEngine = new PaymentSecurityEngine();
    customEngine.registerRule({
      id: 'CUSTOM-TEST-RULE',
      name: 'Custom Gift Card Block Rule',
      category: 'suspicious_wording',
      evaluate(entities) {
        if (entities.rawCombinedText.includes('steam gift card')) {
          return {
            code: 'GIFT_CARD_EXTORTION',
            category: 'suspicious_wording',
            title: 'Gift Card Payment Demand',
            description: 'Demanding payment via retail gift cards is a hallmark of tech support scams.',
            source: '[CUSTOM_PLUGGABLE_RULE]',
            weight: 0.9,
            isCritical: true,
          };
        }
        return null;
      },
    });

    const res = await customEngine.evaluate({
      rawText: 'Pay the IRS fine using $500 steam gift card immediately.',
    });

    assert.strictEqual(res.riskLevel, 'HIGH RISK');
    assert.ok(res.riskSignals.some((s) => s.code === 'GIFT_CARD_EXTORTION'));
  });
});
