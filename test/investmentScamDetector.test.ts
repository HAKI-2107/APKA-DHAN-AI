import test, { describe } from 'node:test';
import assert from 'node:assert';
import { InvestmentScamDetector } from '../src/engine/investmentScam/investmentScamDetector';
import { DefaultRegulatoryAdapter } from '../src/engine/investmentScam/regulatoryAdapter';
import { InvestmentScamInput } from '../src/engine/investmentScam/types';

describe('Investment Scam Detector - Core Signals & Evidentiary Standard', () => {
  const detector = new InvestmentScamDetector();

  test('Signal 1: Guaranteed Returns detected and flagged as Critical', async () => {
    const input: InvestmentScamInput = {
      text: 'Invest with us for a 100% guaranteed return with zero risk capital protection!',
      sourceType: 'INVESTMENT_ADVERTISEMENT',
    };

    const res = await detector.analyze(input);
    assert.ok(res.signals.some((s) => s.code === 'GUARANTEED_RETURNS'));
    assert.ok(res.evidence.some((e) => e.includes('guaranteed/risk-free returns')));
    assert.strictEqual(res.riskLevel, 'MEDIUM RISK'); // Single critical without personal payment = Medium Risk
  });

  test('Signal 2: Unrealistic Astronomical Returns (5% daily, double money in 7 days)', async () => {
    const input: InvestmentScamInput = {
      text: 'Earn 5% daily return with our algorithmic bot. Double your money in 10 days guaranteed!',
      sourceType: 'SOCIAL_MEDIA_POST',
    };

    const res = await detector.analyze(input);
    assert.ok(res.signals.some((s) => s.code === 'UNREALISTIC_RETURNS'));
    assert.ok(res.signals.some((s) => s.code === 'GUARANTEED_RETURNS'));
    assert.strictEqual(res.riskLevel, 'HIGH RISK');
  });

  test('Signal 4 & 5: Impersonation & Fake SEBI Approval for WhatsApp/Telegram Group', async () => {
    const input: InvestmentScamInput = {
      text: 'Join our SEBI approved Telegram group managed by Goldman Sachs fund managers for VIP IPO allotment.',
      sourceType: 'TELEGRAM_CHANNEL',
    };

    const res = await detector.analyze(input);
    assert.ok(res.signals.some((s) => s.code === 'FAKE_AUTHORITY_CLAIMS'));
    assert.ok(res.signals.some((s) => s.code === 'BRAND_IMPERSONATION'));
    assert.ok(res.signals.some((s) => s.code === 'SUSPICIOUS_CONTACT_CHANNELS'));
    assert.strictEqual(res.riskLevel, 'HIGH RISK');
  });

  test('Signal 7: Requests for Personal Payment to Savings Account / USDT', async () => {
    const input: InvestmentScamInput = {
      text: 'For institutional allotment, send money to savings a/c of Ramesh Kumar or pay to UPI ID invest44@okhdfcbank.',
      sourceType: 'WHATSAPP_MESSAGE',
      paymentAccountOrVpa: 'invest44@okhdfcbank',
    };

    const res = await detector.analyze(input);
    assert.ok(res.signals.some((s) => s.code === 'REQUESTS_FOR_PERSONAL_PAYMENT'));
    assert.ok(res.evidence.some((e) => e.includes('personal/unregulated channel')));
  });

  test('Signal 10 & 13: Suspicious TLD (.top) and Request to Install APK', async () => {
    const input: InvestmentScamInput = {
      text: 'Visit groww-wealth.top and download our app from link install.apk to view your portfolio.',
      sourceType: 'WEBSITE_PORTAL',
      websiteUrl: 'https://groww-wealth.top',
    };

    const res = await detector.analyze(input);
    assert.ok(res.signals.some((s) => s.code === 'SUSPICIOUS_URL_TLD'));
    assert.ok(res.signals.some((s) => s.code === 'MALICIOUS_APP_INSTALL_REQUEST'));
    assert.strictEqual(res.riskLevel, 'HIGH RISK');
  });

  test('Signal 12: Advance Fee Demanded for Fund Release / Withdrawal Extortion', async () => {
    const input: InvestmentScamInput = {
      text: 'Your profit of ₹4,50,000 is ready. Pay 18% GST advance of ₹81,000 to release funds from frozen account.',
      sourceType: 'DIRECT_MESSAGE',
    };

    const res = await detector.analyze(input);
    assert.ok(res.signals.some((s) => s.code === 'WITHDRAWAL_EXTORTION_FEE'));
    assert.strictEqual(res.riskLevel, 'MEDIUM RISK'); // Single critical fee extortion without multi-vectors = Medium Risk
  });

  test('Constitutional Rule: Do not accuse of fraud based only on weak evidence', async () => {
    // Only a mild marketing urgency in an educational webinar invitation with no scam markers
    const input: InvestmentScamInput = {
      text: 'Only 5 slots left for our weekend stock market educational webinar series. Register today.',
      sourceType: 'INVESTMENT_ADVERTISEMENT',
    };

    const res = await detector.analyze(input);
    // MUST NOT be HIGH RISK!
    assert.notStrictEqual(res.riskLevel, 'HIGH RISK');
    assert.strictEqual(res.riskLevel, 'UNKNOWN / UNVERIFIED');
    assert.ok(res.unknowns.some((u) => u.includes('insufficient to determine')));
  });

  test('Regulatory Verification Adapter: Do not fabricate registrations or regulatory status', async () => {
    const adapter = new DefaultRegulatoryAdapter();

    // 1. Fabricated/Unlisted entity
    const unlistedResult = await adapter.verifyEntity({
      entityName: 'Apex Wealth Crypto Returns Ltd',
      registrationNumber: 'INH999999999',
      intermediaryType: 'RESEARCH_ANALYST',
      claimedAuthority: 'SEBI',
    });

    assert.strictEqual(unlistedResult.status, 'NOT_FOUND_OR_UNVERIFIED');
    assert.strictEqual(unlistedResult.hasFabricatedData, false);
    assert.ok(unlistedResult.notes.includes('No active intermediary registration found'));

    // 2. Real SEBI Registered Broker (Zerodha)
    const verifiedResult = await adapter.verifyEntity({
      entityName: 'Zerodha Broking Limited',
      registrationNumber: 'INZ000031633',
      intermediaryType: 'STOCK_BROKER',
      claimedAuthority: 'SEBI',
    });

    assert.strictEqual(verifiedResult.status, 'VERIFIED_OFFICIAL_RECORD');
    assert.strictEqual(verifiedResult.hasFabricatedData, false);
    assert.strictEqual(verifiedResult.entityName, 'Zerodha Broking Limited');

    // 3. Known Debarred / Caution List scheme
    const debarredCheck = await adapter.isDebarredOrCautionListed('Global Stock Allotment Scheme');
    assert.strictEqual(debarredCheck.isCautionListed, true);
  });

  test('Output Structure contains all 6 required fields strictly', async () => {
    const input: InvestmentScamInput = {
      text: 'Urgent: Transfer money to savings a/c of Ramesh for guaranteed 10% daily return in Tata Investment VIP group on Telegram.',
      sourceType: 'TELEGRAM_CHANNEL',
      claimedEntityName: 'Tata Investment VIP Group',
    };

    const res = await detector.analyze(input);

    // Verify all 6 mandatory top-level fields
    assert.ok(res.riskLevel, 'Must have riskLevel');
    assert.ok(Array.isArray(res.signals), 'Must have signals array');
    assert.ok(Array.isArray(res.evidence), 'Must have evidence array');
    assert.ok(Array.isArray(res.verificationSteps), 'Must have verificationSteps array');
    assert.ok(Array.isArray(res.sourceRequirements), 'Must have sourceRequirements array');
    assert.ok(Array.isArray(res.unknowns), 'Must have unknowns array');

    assert.ok(res.signals.length >= 3, 'Should detect multiple signals');
    assert.ok(res.evidence.length >= 2, 'Should extract concrete evidence quotes');
    assert.ok(res.verificationSteps.length >= 3, 'Should provide actionable checklist');
    assert.ok(res.sourceRequirements.length >= 2, 'Should provide required source documents');
    assert.ok(res.unknowns.length >= 1, 'Should declare unknowns');
  });
});
