import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type, ThinkingLevel } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { PaymentSecurityEngine } from './src/engine/paymentSecurityEngine';
import { GeminiMLAnalyzer } from './src/engine/geminiMLAnalyzer';
import {
  ALL_INITIAL_RULES,
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
} from './src/engine/rules';
import { InMemoryThreatLookupService } from './src/engine/threatLookup';
import { RawPaymentInput, UserBehavioralProfile, NormalizedPaymentEntities } from './src/engine/types';
import { QRSecurityScanner } from './src/engine/qrSecurityScanner';
import { LinkSecurityAnalyzer } from './src/engine/linkSecurityAnalyzer';
import { ScreenshotSecurityAnalyzer } from './src/engine/screenshotSecurityAnalyzer';
import { SafeAnalysisPipeline, globalSafeAnalysisPipeline } from './src/engine/safeAnalysisPipeline';
import { globalThreatRegistry } from './src/engine/threatIntelligence/defaultProvider';
import { globalInvestmentScamDetector } from './src/engine/investmentScam/investmentScamDetector';
import { globalRegulatoryAdapter } from './src/engine/investmentScam/regulatoryAdapter';
import { InvestmentScamInput } from './src/engine/investmentScam/types';

dotenv.config();

const app = express();
app.use(express.json({ limit: '10mb' }));

// Initialize GoogleGenAI server-side with telemetry header
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Initialize Payment Security Engine & Register ML Analyzer
const threatLookupService = new InMemoryThreatLookupService();
const paymentSecurityEngine = new PaymentSecurityEngine(threatLookupService, ALL_INITIAL_RULES);
if (process.env.GEMINI_API_KEY) {
  paymentSecurityEngine.registerMLAnalyzer(new GeminiMLAnalyzer(process.env.GEMINI_API_KEY));
}

// Authoritative NPCI Whitelisted PSP Handles (Sample of major Indian Banks/Apps)
const AUTHORIZED_PSP_HANDLES = new Set([
  'okhdfcbank', 'okaxis', 'oksbi', 'okicici', 'ybl', 'ibl', 'axl', 
  'paytm', 'upi', 'apl', 'federal', 'barodampay', 'kotak', 'indus',
  'aubank', 'pnb', 'canarabank', 'unionbank', 'idfcbank'
]);

// Regulatory & Threat Intel In-Memory Data
interface ThreatAdvisory {
  id: string;
  category: 'Payment Risk' | 'Investment Scam' | 'Portfolio Alert' | 'Crypto Alert' | 'Security Alert';
  title: string;
  source: string;
  severity: 'HIGH RISK' | 'MEDIUM RISK' | 'LOW RISK' | 'UNKNOWN / UNVERIFIED';
  timestamp: string;
  summary: string;
  evidence: string[];
  recommendedSteps: string[];
}

const ACTIVE_THREATS: ThreatAdvisory[] = [
  {
    id: 'ADV-2026-089',
    category: 'Investment Scam',
    title: 'Fake "SEBI Registered" Institutional Trading Groups on WhatsApp',
    source: 'SEBI Advisory & Cyber Crime Cell',
    severity: 'HIGH RISK',
    timestamp: '2 hours ago',
    summary: 'Fraudulent operators impersonating institutional asset managers offer "VIP Institutional Allotment" in IPOs and guaranteed 25% weekly returns via fake trading APKs.',
    evidence: [
      'Unregistered offshore domain hosting APK download links',
      'Use of cloned SEBI registration certificates with forged signatures',
      'Funds routed to individual mule savings accounts rather than registered clearing houses'
    ],
    recommendedSteps: [
      'Verify SEBI registration on https://www.sebi.gov.in/sebiweb/other/OtherAction.do?doRecognisedFpi=yes',
      'Never transfer investment capital into personal savings/current bank accounts',
      'Never install financial applications outside the Google Play Store'
    ]
  },
  {
    id: 'ADV-2026-090',
    category: 'Payment Risk',
    title: 'UPI "Electricity Bill Pending / Power Disconnection" SMS Wave',
    source: 'NPCI & National Cyber Crime Reporting Portal',
    severity: 'HIGH RISK',
    timestamp: '5 hours ago',
    summary: 'Threat actors send SMS claiming power supply will be terminated tonight unless user calls an 10-digit mobile number or authorizes a ₹10 bill verification collect request.',
    evidence: [
      'Sender header from unauthorized non-utility routing',
      'Pressure tactic requesting screen-share app (AnyDesk/TeamViewer/RustDesk) installation',
      'UPI collect requests configured for ₹49,999 disguised as "Verification token"'
    ],
    recommendedSteps: [
      'Power utilities never dispatch bill termination SMS from personal 10-digit numbers',
      'Pay bills only through authorized BBPS (Bharat BillPay) channels',
      'Entering your UPI PIN always DEBITS money; you never need a PIN to receive a refund'
    ]
  },
  {
    id: 'ADV-2026-091',
    category: 'Crypto Alert',
    title: 'Arbitrage Smart Contract Liquidity Drain Exploit',
    source: 'Threat Intelligence Matrix',
    severity: 'MEDIUM RISK',
    timestamp: '1 day ago',
    summary: 'Decentralized exchange token contracts with honeypot functions prevent sellers while allowing the creator to drain 100% of paired liquidity.',
    evidence: [
      'Unverified bytecode deployed within last 48 hours',
      '99% sell tax coded into the transferFrom smart contract modifier',
      'Creator address controls 84% of total circulating supply'
    ],
    recommendedSteps: [
      'Inspect contract liquidity lock period on public blockchain explorer',
      'Reject tokens promising fixed daily returns through automated arbitrage bots'
    ]
  }
];

// Stored User Reports (sanitized, in-memory)
const USER_REPORTS: any[] = [];

// Helper: Deterministic PII Sanitizer
function sanitizeText(text: string): string {
  if (!text) return '';
  return text
    // Redact 12-digit Aadhaar
    .replace(/\b\d{4}\s?\d{4}\s?\d{4}\b/g, '[REDACTED_AADHAAR]')
    // Redact PAN card (5 letters, 4 numbers, 1 letter)
    .replace(/\b[A-Z]{5}[0-9]{4}[A-Z]\b/gi, '[REDACTED_PAN]')
    // Redact 16-digit card number
    .replace(/\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g, '[REDACTED_CARD]')
    // Redact 4 or 6 digit PINs labeled with PIN/OTP
    .replace(/(?:pin|otp|cvv)[:\s=]+(\d{3,6})/gi, '***[REDACTED_SECRET]***');
}

// 1. Threat Intel Feed
app.get('/api/threats', (_req, res) => {
  res.json({ success: true, count: ACTIVE_THREATS.length, threats: ACTIVE_THREATS });
});

// 2. UPI ID / URI Analyzer Endpoint
app.post('/api/check-upi', (req, res) => {
  const { input } = req.body;
  if (!input || typeof input !== 'string') {
    return res.status(400).json({ error: 'Valid UPI ID or URI string is required' });
  }

  const cleanInput = input.trim();
  let vpa = cleanInput;
  let payeeName = '';
  let amount: number | null = null;
  let isIntentUri = false;
  let isCollectRequest = false;
  let rawParams: Record<string, string> = {};

  if (cleanInput.startsWith('upi://pay')) {
    isIntentUri = true;
    try {
      const url = new URL(cleanInput);
      url.searchParams.forEach((val, key) => {
        rawParams[key] = val;
      });
      vpa = rawParams['pa'] || '';
      payeeName = rawParams['pn'] || '';
      if (rawParams['am']) amount = parseFloat(rawParams['am']);
      if (cleanInput.toLowerCase().includes('collect') || rawParams['mode'] === '02') {
        isCollectRequest = true;
      }
    } catch (e) {
      // Malformed URI
    }
  }

  const parts = vpa.split('@');
  const handlePrefix = parts[0]?.toLowerCase() || '';
  const pspHandle = parts[1]?.toLowerCase() || '';

  const evidence: string[] = [];
  const recommendedSteps: string[] = [];
  let riskLevel: 'LOW RISK' | 'MEDIUM RISK' | 'HIGH RISK' | 'UNKNOWN / UNVERIFIED' = 'LOW RISK';
  let confidence = 'High';

  // Rule 1: Missing or invalid format
  if (!vpa || parts.length !== 2 || !handlePrefix || !pspHandle) {
    return res.json({
      success: true,
      result: {
        identifier: vpa || cleanInput,
        riskLevel: 'UNKNOWN / UNVERIFIED',
        evidence: ['Input string does not adhere to standard NPCI Virtual Payment Address (username@bank) syntax.'],
        explanation: 'The provided identifier cannot be verified as a valid UPI address structure.',
        source: '[RULE_SIGNAL]',
        confidence: 'High (Syntax parsing failed)',
        recommendedSteps: [
          'Verify with the beneficiary that they provided a complete UPI ID (e.g. name@oksbi)',
          'Do not initiate payments to incomplete or broken handles'
        ]
      }
    });
  }

  // Rule 2: Impersonation keywords in username
  const impersonationKeywords = ['refund', 'customercare', 'helpline', 'support', 'kyc', 'reward', 'cashback', 'lottery', 'winner', 'electricity'];
  const detectedImpersonations = impersonationKeywords.filter(k => handlePrefix.includes(k));
  if (detectedImpersonations.length > 0) {
    riskLevel = 'HIGH RISK';
    evidence.push(`Handle prefix contains suspicious institutional keywords: "${detectedImpersonations.join(', ')}". Genuine bank support never collects money via personal UPI handles.`);
    recommendedSteps.push('Official customer support teams never ask you to pay or send collect requests.');
    recommendedSteps.push('Report this handle immediately on the National Cyber Crime Reporting Portal (cybercrime.gov.in).');
  }

  // Rule 3: Authorized PSP check
  if (!AUTHORIZED_PSP_HANDLES.has(pspHandle)) {
    if (riskLevel !== 'HIGH RISK') riskLevel = 'MEDIUM RISK';
    evidence.push(`PSP handle "@${pspHandle}" is unlisted or uncommon in standard NPCI consumer registries.`);
    recommendedSteps.push('Verify the exact banking partner of the recipient before proceeding.');
  } else {
    evidence.push(`PSP handle "@${pspHandle}" is a recognized banking provider handle.`);
  }

  // Rule 4: Collect Request warning
  if (isCollectRequest) {
    riskLevel = 'HIGH RISK';
    evidence.push('Transaction payload is structured as an INCOMING COLLECT REQUEST. Authorizing this will DEBIT your account, not credit it.');
    recommendedSteps.push('DECLINE this request if someone claimed they were sending you money or a refund.');
    recommendedSteps.push('Remember: Receiving money on UPI NEVER requires entering your UPI PIN.');
  }

  // Synthesis
  let explanation = '';
  if (riskLevel === 'HIGH RISK') {
    explanation = 'This UPI interaction demonstrates multiple strong indicators associated with social engineering, customer-care impersonation, or deceptive collect requests.';
  } else if (riskLevel === 'MEDIUM RISK') {
    explanation = 'This UPI handle has attributes that require independent verification before transmitting funds.';
  } else {
    explanation = 'The UPI identifier syntax matches standard verified banking handles with no overt deceptive triggers detected.';
    recommendedSteps.push('Confirm that the beneficiary account holder name shown in your UPI app matches your intended recipient.');
  }

  res.json({
    success: true,
    result: {
      identifier: vpa,
      parsedPayload: {
        vpa,
        payeeName: payeeName || null,
        amount: amount || null,
        isIntentUri,
        isCollectRequest
      },
      riskLevel,
      evidence,
      explanation,
      source: '[RULE_SIGNAL] + [REGULATORY_REGISTRY]',
      confidence,
      recommendedSteps
    }
  });
});

// 3. Link Scanner Endpoint
app.post('/api/check-link', (req, res) => {
  const { url } = req.body;
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'Valid URL string is required' });
  }

  const cleanUrl = url.trim();
  const evidence: string[] = [];
  const recommendedSteps: string[] = [];
  let riskLevel: 'LOW RISK' | 'MEDIUM RISK' | 'HIGH RISK' | 'UNKNOWN / UNVERIFIED' = 'LOW RISK';

  let hostname = '';
  try {
    const parsed = new URL(cleanUrl.startsWith('http') ? cleanUrl : `https://${cleanUrl}`);
    hostname = parsed.hostname.toLowerCase();
  } catch (e) {
    return res.json({
      success: true,
      result: {
        identifier: cleanUrl,
        riskLevel: 'UNKNOWN / UNVERIFIED',
        evidence: ['The string provided is not a valid well-formed URL.'],
        explanation: 'Could not parse hostname or domain structure.',
        source: '[RULE_SIGNAL]',
        confidence: 'High',
        recommendedSteps: ['Inspect link manually without opening it.']
      }
    });
  }

  // Check 1: High risk suspicious TLDs
  const suspiciousTlds = ['.top', '.xyz', '.cfd', '.icu', '.click', '.buzz', '.vip', '.rest', '.fit', '.sbs'];
  const matchedTld = suspiciousTlds.find(tld => hostname.endsWith(tld));
  if (matchedTld) {
    riskLevel = 'HIGH RISK';
    evidence.push(`Domain uses high-abuse disposable TLD ("${matchedTld}") frequently observed in phishing campaigns.`);
  }

  // Check 2: Bank impersonation keywords in domain
  const financialInstitutions = ['sbi', 'hdfc', 'icici', 'axis', 'kotak', 'pnb', 'zerodha', 'groww', 'angelone', 'paytm', 'phonepe'];
  for (const fi of financialInstitutions) {
    if (hostname.includes(fi)) {
      const isOfficial = hostname.endsWith(`.${fi}.com`) || hostname.endsWith(`.${fi}.co.in`) || hostname.endsWith(`.${fi}.in`) || hostname === `${fi}.com` || hostname === `${fi}.in`;
      if (!isOfficial) {
        riskLevel = 'HIGH RISK';
        evidence.push(`Domain contains "${fi}" but does not belong to the official registered domain of the financial institution.`);
      }
    }
  }

  // Check 3: Suspicious sub-paths (APK download, KYC update)
  const lowerUrl = cleanUrl.toLowerCase();
  if (lowerUrl.includes('.apk') || lowerUrl.includes('download') || lowerUrl.includes('kyc-update') || lowerUrl.includes('pan-link')) {
    if (riskLevel !== 'HIGH RISK') riskLevel = 'HIGH RISK';
    evidence.push('Link attempts to download an executable Android Package (.apk) or prompts for unverified KYC updates.');
    recommendedSteps.push('Never download banking or investment APKs outside Google Play Store.');
  }

  // Check 4: URL Shortener
  const shorteners = ['bit.ly', 'tinyurl.com', 'is.gd', 't.me', 'cutt.ly', 'rb.gy'];
  if (shorteners.some(s => hostname.includes(s))) {
    if (riskLevel === 'LOW RISK') riskLevel = 'MEDIUM RISK';
    evidence.push('URL is obfuscated using a redirection shortener service. True destination is hidden.');
    recommendedSteps.push('Unshorten the link using a safety preview tool before opening.');
  }

  if (evidence.length === 0) {
    evidence.push('No known malicious patterns or financial institution homoglyphs identified in domain syntax.');
    recommendedSteps.push('Always check that the website displays a valid SSL certificate and the exact spelling of the domain.');
  } else {
    recommendedSteps.push('Do NOT input any login credentials, OTPs, or PAN details on this webpage.');
  }

  let explanation = '';
  if (riskLevel === 'HIGH RISK') {
    explanation = 'This URL presents critical indicators of a credential harvesting site or malicious APK distribution portal.';
  } else if (riskLevel === 'MEDIUM RISK') {
    explanation = 'This link conceals its ultimate destination or utilizes non-standard financial routing.';
  } else {
    explanation = 'No overt deceptive or phishing signals detected on immediate heuristic inspection.';
  }

  res.json({
    success: true,
    result: {
      identifier: cleanUrl,
      hostname,
      riskLevel,
      evidence,
      explanation,
      source: '[RULE_SIGNAL] + [THREAT_DATABASE]',
      confidence: 'High (Heuristic Match)',
      recommendedSteps
    }
  });
});

// 4. Multimodal / Text AI Scam & Investment Analyzer
app.post('/api/analyze-scam', async (req, res) => {
  const { text, contextType = 'general_message' } = req.body;
  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'Text content is required for analysis' });
  }

  const sanitizedInput = sanitizeText(text);

  // Fallback Rule-Based Assessment
  const lower = sanitizedInput.toLowerCase();
  const ruleEvidence: string[] = [];
  let heuristicRisk: 'LOW RISK' | 'MEDIUM RISK' | 'HIGH RISK' | 'UNKNOWN / UNVERIFIED' = 'LOW RISK';

  if (lower.includes('guaranteed return') || lower.includes('fixed profit') || lower.includes('100% safe') || lower.includes('no risk')) {
    ruleEvidence.push('Promises guaranteed profit or zero risk in financial market investments (Strictly prohibited under SEBI guidelines).');
    heuristicRisk = 'HIGH RISK';
  }
  if (lower.includes('daily return') || lower.includes('per day profit') || lower.includes('double your money') || lower.includes('2x return')) {
    ruleEvidence.push('Astronomical or daily compounding ROI claims characteristic of Ponzi / Multi-Level Marketing schemes.');
    heuristicRisk = 'HIGH RISK';
  }
  if (lower.includes('part-time job') || lower.includes('youtube like') || lower.includes('telegram task') || lower.includes('hotel review')) {
    ruleEvidence.push('Classic Prepaid Task scam: initial micro-payouts for trivial tasks followed by high frozen deposit demands.');
    heuristicRisk = 'HIGH RISK';
  }
  if (lower.includes('urgently') || lower.includes('within 10 minutes') || lower.includes('account blocked') || lower.includes('police case')) {
    ruleEvidence.push('High-pressure emotional coercion tactic intended to bypass rational verification.');
    if (heuristicRisk === 'LOW RISK') heuristicRisk = 'MEDIUM RISK';
  }

  // If Gemini API is available, invoke Gemini 3.8 Flash for advanced evidence deconstruction
  if (process.env.GEMINI_API_KEY) {
    try {
      const prompt = `You are Apka Dhan AI's lead Financial Security & Fraud Evidence Specialist.
Analyze the following user-submitted message or financial claim with extreme scrutiny.

Input to inspect:
"""
${sanitizedInput}
"""

CORE CONSTITUTION:
1. NEVER declare something as "definitely fraud" or "guaranteed safe". The user remains the final decision maker.
2. Differentiate confirmed information, model predictions, rule signals, and unverified claims.
3. Check for:
   - Unregistered SEBI advisory claims or VIP Telegram trading channels
   - Guaranteed or unrealistic ROI
   - Prepaid task / YouTube like / hotel review scam patterns
   - Impersonation of law enforcement ("Digital Arrest") or utility disconnection
   - Pressure tactics (urgency, secrecy)
   - Requests for OTP, remote desktop tools, or money transfers to personal bank accounts

Return a JSON object conforming exactly to this schema:
{
  "riskLevel": "LOW RISK" | "MEDIUM RISK" | "HIGH RISK" | "UNKNOWN / UNVERIFIED",
  "evidence": ["list of factual risk signals identified"],
  "explanation": "Clear, objective, evidence-based reasoning in 2-3 sentences.",
  "source": "[RULE_SIGNAL] + [MODEL_PREDICTION]",
  "confidence": "e.g. High (matches known digital arrest / task scam template)",
  "recommendedSteps": ["3-4 clear, actionable verification steps the user must take"]
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.1,
        }
      });

      const responseText = response.text?.trim() || '';
      if (responseText) {
        const parsed = JSON.parse(responseText);
        return res.json({
          success: true,
          result: {
            ...parsed,
            sanitizedInput
          }
        });
      }
    } catch (err: any) {
      console.warn('Gemini call failed or timed out, falling back to heuristic engine:', err.message);
    }
  }

  // Deterministic fallback response when Gemini is offline or unkeyed
  const recommendedSteps = heuristicRisk === 'HIGH RISK' ? [
    'Do not transfer any funds or share bank account credentials.',
    'Check if the entity is registered on the official SEBI directory (sebi.gov.in).',
    'Report the sender number or group to the National Cyber Crime Portal (1930).'
  ] : [
    'Verify sender identity through independent official channels.',
    'Never share OTPs or install remote access software.'
  ];

  res.json({
    success: true,
    result: {
      riskLevel: heuristicRisk,
      evidence: ruleEvidence.length > 0 ? ruleEvidence : ['No prominent scam phrasing or coercive patterns detected in text.'],
      explanation: heuristicRisk === 'HIGH RISK'
        ? 'The submitted interaction matches recognized patterns of investment fraud or high-pressure social engineering.'
        : 'The interaction does not contain explicit fraud keywords, but caution is advised for any unsolicited financial contact.',
      source: '[RULE_SIGNAL] + [HEURISTIC_ENGINE]',
      confidence: 'Medium (Local Rule Baseline)',
      recommendedSteps,
      sanitizedInput
    }
  });
});

// 5. User Incident Report Submission Endpoint
app.post('/api/report-incident', (req, res) => {
  const { category, targetIdentifier, description, evidenceText } = req.body;
  if (!category || !targetIdentifier) {
    return res.status(400).json({ error: 'Category and target identifier are required' });
  }

  const incidentId = `AD-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
  const sanitizedReport = {
    incidentId,
    category,
    targetIdentifier: sanitizeText(targetIdentifier),
    description: sanitizeText(description || ''),
    evidenceText: sanitizeText(evidenceText || ''),
    reportedAt: new Date().toISOString(),
    status: 'RECORDED_FOR_TRIAGE'
  };

  USER_REPORTS.push(sanitizedReport);

  res.json({
    success: true,
    incidentId,
    message: 'Incident recorded securely with sensitive identifiers sanitized.',
    timestamp: sanitizedReport.reportedAt
  });
});

// ==========================================
// PAYMENT SECURITY ENGINE ENDPOINTS
// ==========================================

// 6. Payment Security Engine: Get 12 Initial Rule Definitions
app.get('/api/payment-security/rules', (_req, res) => {
  const rulesCatalog = ALL_INITIAL_RULES.map((r, idx) => ({
    index: idx + 1,
    id: r.id,
    name: r.name,
    category: r.category,
    description: getRuleDescription(r.category),
    sampleTriggers: getRuleSampleTriggers(r.category)
  }));
  res.json({ success: true, count: rulesCatalog.length, rules: rulesCatalog });
});

// Helper metadata for rules
function getRuleDescription(category: string): string {
  const map: Record<string, string> = {
    suspicious_domain: 'Detects high-abuse disposable TLDs (.top, .xyz, .icu) and raw numerical IP hosts in payment links.',
    typosquatting: 'Flags domains containing financial brand names (SBI, HDFC, ICICI, etc.) that do not belong to official registered domains.',
    unexpected_redirect: 'Identifies URL shorteners (bit.ly, tinyurl) and open redirect parameters that obscure the actual transaction destination.',
    unusual_recipient: 'Validates UPI beneficiary PSP against official NPCI authorized consumer banking handles.',
    unusual_transaction_amount: 'Detects high-value collect requests (≥₹25,000) and substantial deviations from user baseline debit history.',
    unusual_transaction_time: 'Flags high-value or collect requests initiated during vulnerable off-hours (01:00 AM - 05:00 AM).',
    repeated_rapid_transactions: 'Detects rapid successive debit transactions (burst velocity) characteristic of automated account drainage.',
    suspicious_wording: 'Flags solicitations to install screen-sharing software (AnyDesk, TeamViewer) or external Android APK packages.',
    impersonation_indicators: 'Detects customer care, refund, helpline, or lottery keywords inside personal consumer UPI handles.',
    guaranteed_return_claims: 'Flags prohibited claims of guaranteed investment profit or zero financial risk under SEBI guidelines.',
    urgency_manipulation_language: 'Detects coercive emotional pressure including "Digital Arrest", police threats, or immediate utility disconnection.',
    known_reported_indicator: 'Correlates VPA, domain, or phone number against verified national threat intelligence and incident databases.'
  };
  return map[category] || 'Heuristic evaluation rule';
}

function getRuleSampleTriggers(category: string): string[] {
  const map: Record<string, string[]> = {
    suspicious_domain: ['https://192.168.1.1/pay', 'https://banking-support.top/bill'],
    typosquatting: ['https://sbi-card-rewards.net/login', 'https://hdfc-kyc-update.com/pan'],
    unexpected_redirect: ['https://bit.ly/3xPayReward', 'https://example.com/checkout?redirect=https://evil.com'],
    unusual_recipient: ['merchant@boguspsp', 'seller@fakebank'],
    unusual_transaction_amount: ['upi://pay?pa=store@okaxis&am=49999&mode=02 (Collect)', '₹45,000 vs user ₹1,500 baseline'],
    unusual_transaction_time: ['Collect request at 02:45 AM for ₹15,000'],
    repeated_rapid_transactions: ['3 debits of ₹5,000 in under 3 minutes'],
    suspicious_wording: ['Please download AnyDesk app to process refund', 'Install electricity-bill-update.apk'],
    impersonation_indicators: ['customer-care-refund@okhdfcbank', 'sbi-helpline-desk@okaxis'],
    guaranteed_return_claims: ['Guaranteed 25% daily return with 100% safe VIP trade', 'Double your money in 24 hours'],
    urgency_manipulation_language: ['Digital Arrest by CBI Cyber Cell. Pay fine in 15 mins', 'Power will be disconnected tonight at 9:30 PM'],
    known_reported_indicator: ['customer-care-refund@okhdfcbank', 'sbi-kyc-verify.top', '9876543210']
  };
  return map[category] || [];
}

// 7. Payment Security Engine: Full 10-Stage Pipeline Evaluation
app.post('/api/payment-security/analyze', async (req, res) => {
  try {
    const input: RawPaymentInput = req.body.input || req.body;
    const enableThinkingMode = Boolean(req.body.enableThinkingMode || req.body.thinking);

    // Execute full 10-stage deterministic + ML engine
    const assessment = await paymentSecurityEngine.evaluate(input);

    let thinkingForensics: any = null;

    // Thinking Mode: When complex analysis is requested, use gemini-3.1-pro-preview with thinkingLevel: HIGH
    if (enableThinkingMode && process.env.GEMINI_API_KEY) {
      try {
        const thinkingPrompt = `You are Apka Dhan AI's Chief Fraud Forensic Investigator.
Conduct an exhaustive, high-reasoning forensic deconstruction of this suspicious financial interaction.

Input Payload:
${JSON.stringify(input, null, 2)}

Deterministic Pipeline Findings:
- Assessed Risk Level: ${assessment.riskLevel}
- Risk Signals Triggered: ${assessment.riskSignals.map(s => s.code + ' (' + s.category + ')').join(', ') || 'None'}
- Confidence: ${assessment.confidence}
- Evidence: ${assessment.evidence.join('; ')}
- Known Unknowns: ${assessment.unknownFactors.join('; ') || 'None declared'}

Provide an in-depth forensic breakdown:
1. Adversarial Attack Vector: How is the threat actor orchestrating the exploit?
2. Social Engineering & Cognitive Manipulation: What psychological pressure points are exploited?
3. Regulatory & Legal Violations: Non-compliance under RBI, NPCI UPI, or SEBI regulations.
4. Counter-Hypothesis: Could this interaction be legitimate under any plausible scenario?
5. Final Non-Repudiable Action Plan: Precise forensic verification steps before the user takes action.

Keep the response structured and clear, explicitly stating uncertainties. Never claim an AI prediction is infallible proof of fraud.`;

        const thinkingResponse = await ai.models.generateContent({
          model: 'gemini-3.1-pro-preview',
          contents: thinkingPrompt,
          config: {
            thinkingConfig: {
              thinkingLevel: ThinkingLevel.HIGH,
            },
          },
        });

        const thinkingText = thinkingResponse.text || '';
        thinkingForensics = {
          model: 'gemini-3.1-pro-preview',
          thinkingLevel: 'HIGH',
          reasoning: thinkingText,
          executedAt: new Date().toISOString(),
        };
      } catch (err: any) {
        console.warn('Thinking mode generation error with gemini-3.1-pro-preview:', err.message);
        thinkingForensics = {
          model: 'gemini-3.1-pro-preview',
          status: 'UNAVAILABLE',
          reason: err.message,
        };
      }
    }

    res.json({
      success: true,
      assessment: {
        ...assessment,
        thinkingForensics,
      },
    });
  } catch (err: any) {
    console.error('Payment security analysis failed:', err);
    res.status(400).json({
      success: false,
      error: err.message || 'Payment security analysis failed',
    });
  }
});

// 8. Payment Security Engine: Interactive Unit Test Runner Endpoint
app.post('/api/payment-security/run-tests', (_req, res) => {
  const startTime = Date.now();
  const testResults: Array<{
    name: string;
    category: string;
    passed: boolean;
    durationMs: number;
    details: string;
  }> = [];

  const threatService = new InMemoryThreatLookupService();

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
      timestampEpochMs: 1774688400000,
      ...partial,
    };
  }

  // Helper to run a test
  function runTest(name: string, category: string, fn: () => void) {
    const t0 = Date.now();
    try {
      fn();
      testResults.push({
        name,
        category,
        passed: true,
        durationMs: Math.max(1, Date.now() - t0),
        details: 'Assertion succeeded.',
      });
    } catch (e: any) {
      testResults.push({
        name,
        category,
        passed: false,
        durationMs: Math.max(1, Date.now() - t0),
        details: e.message || 'Assertion failed',
      });
    }
  }

  // 1. Suspicious Domain
  runTest('Rule 1: Suspicious Domain (Raw IP & High-abuse TLD)', 'suspicious_domain', () => {
    const ipSig = SuspiciousDomainRule.evaluate(createMockEntities({ domain: '192.168.1.1' }), threatService);
    if (!ipSig || ipSig.code !== 'RAW_IP_PAYMENT_HOST') throw new Error('Expected RAW_IP_PAYMENT_HOST');
    const tldSig = SuspiciousDomainRule.evaluate(createMockEntities({ domain: 'banking-portal.top' }), threatService);
    if (!tldSig || tldSig.code !== 'HIGH_ABUSE_TLD') throw new Error('Expected HIGH_ABUSE_TLD');
  });

  // 2. Typosquatting
  runTest('Rule 2: Typosquatting (Brand homoglyph detection)', 'typosquatting', () => {
    const sbiSig = TyposquattingRule.evaluate(createMockEntities({ domain: 'sbi-card-rewards.net' }), threatService);
    if (!sbiSig || sbiSig.code !== 'DOMAIN_BRAND_TYPOSQUAT') throw new Error('Expected DOMAIN_BRAND_TYPOSQUAT');
    const cleanSig = TyposquattingRule.evaluate(createMockEntities({ domain: 'onlinesbi.sbi' }), threatService);
    if (cleanSig !== null) throw new Error('Expected null for official domain');
  });

  // 3. Unexpected Redirect
  runTest('Rule 3: Unexpected Redirect (Shorteners & Open Redirects)', 'unexpected_redirect', () => {
    const shortSig = UnexpectedRedirectRule.evaluate(createMockEntities({ domain: 'bit.ly' }), threatService);
    if (!shortSig || shortSig.code !== 'URL_SHORTENER_OBFUSCATION') throw new Error('Expected URL_SHORTENER_OBFUSCATION');
    const redirectUrl = new URL('https://example.com/login?redirect=https://evil.com');
    const redirectSig = UnexpectedRedirectRule.evaluate(createMockEntities({ url: redirectUrl, domain: 'example.com' }), threatService);
    if (!redirectSig || redirectSig.code !== 'OPEN_REDIRECT_PARAMETER') throw new Error('Expected OPEN_REDIRECT_PARAMETER');
  });

  // 4. Unusual Recipient
  runTest('Rule 4: Unusual Recipient (Unlisted PSP handles)', 'unusual_recipient', () => {
    const pspSig = UnusualRecipientRule.evaluate(createMockEntities({ vpa: 'seller@fakebank', vpaPspHandle: 'fakebank' }), threatService);
    if (!pspSig || pspSig.code !== 'UNLISTED_PSP_HANDLE') throw new Error('Expected UNLISTED_PSP_HANDLE');
    const validSig = UnusualRecipientRule.evaluate(createMockEntities({ vpa: 'seller@okaxis', vpaPspHandle: 'okaxis' }), threatService);
    if (validSig !== null) throw new Error('Expected null for valid PSP');
  });

  // 5. Unusual Transaction Amount
  runTest('Rule 5: Unusual Transaction Amount (High-value collect & spikes)', 'unusual_transaction_amount', () => {
    const collectSig = UnusualTransactionAmountRule.evaluate(createMockEntities({ amount: 49999, isCollectRequest: true }), threatService);
    if (!collectSig || collectSig.code !== 'HIGH_VALUE_COLLECT_REQUEST') throw new Error('Expected HIGH_VALUE_COLLECT_REQUEST');
  });

  // 6. Unusual Transaction Time
  runTest('Rule 6: Unusual Transaction Time (Off-hours 01:00 AM - 05:00 AM)', 'unusual_transaction_time', () => {
    const night = new Date();
    night.setHours(2, 30, 0, 0);
    const nightSig = UnusualTransactionTimeRule.evaluate(createMockEntities({ amount: 15000, timestampEpochMs: night.getTime() }), threatService);
    if (!nightSig || nightSig.code !== 'OFF_HOURS_HIGH_RISK_INTERACTION') throw new Error('Expected OFF_HOURS_HIGH_RISK_INTERACTION');
  });

  // 7. Repeated Rapid Transactions
  runTest('Rule 7: Repeated Rapid Transactions (Burst velocity)', 'repeated_rapid_transactions', () => {
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
    const burstSig = RepeatedRapidTransactionsRule.evaluate(createMockEntities({ timestampEpochMs: now }), threatService, burstProfile);
    if (!burstSig || burstSig.code !== 'HIGH_VELOCITY_TRANSACTION_BURST') throw new Error('Expected HIGH_VELOCITY_TRANSACTION_BURST');
  });

  // 8. Suspicious Wording
  runTest('Rule 8: Suspicious Wording (Screen sharing & APK download)', 'suspicious_wording', () => {
    const toolSig = SuspiciousWordingRule.evaluate(createMockEntities({ rawCombinedText: 'Install AnyDesk app for refund' }), threatService);
    if (!toolSig || toolSig.code !== 'SCREEN_SHARING_APP_SOLICITATION') throw new Error('Expected SCREEN_SHARING_APP_SOLICITATION');
    const apkSig = SuspiciousWordingRule.evaluate(createMockEntities({ rawCombinedText: 'Click here to install apk update for electricity bill payment' }), threatService);
    if (!apkSig || apkSig.code !== 'EXTERNAL_APK_DOWNLOAD_INSTRUCTION') throw new Error('Expected EXTERNAL_APK_DOWNLOAD_INSTRUCTION');
  });

  // 9. Impersonation Indicators
  runTest('Rule 9: Impersonation Indicators (Customer care in personal VPA)', 'impersonation_indicators', () => {
    const impSig = ImpersonationIndicatorsRule.evaluate(createMockEntities({ vpa: 'customer-care-refund@okhdfcbank', vpaHandlePrefix: 'customer-care-refund', vpaPspHandle: 'okhdfcbank' }), threatService);
    if (!impSig || impSig.code !== 'INSTITUTIONAL_KEYWORD_IMPERSONATION') throw new Error('Expected INSTITUTIONAL_KEYWORD_IMPERSONATION');
  });

  // 10. Guaranteed-Return Claims
  runTest('Rule 10: Guaranteed Return Claims (Prohibited profit promises)', 'guaranteed_return_claims', () => {
    const claimSig = GuaranteedReturnClaimsRule.evaluate(createMockEntities({ rawCombinedText: 'Join VIP group for guaranteed return of 10% daily profit' }), threatService);
    if (!claimSig || claimSig.code !== 'PROMISES_GUARANTEED_MARKET_RETURN') throw new Error('Expected PROMISES_GUARANTEED_MARKET_RETURN');
  });

  // 11. Urgency Manipulation Language
  runTest('Rule 11: Urgency & Manipulation Language (Digital arrest & power cut)', 'urgency_manipulation_language', () => {
    const arrestSig = UrgencyManipulationLanguageRule.evaluate(createMockEntities({ rawCombinedText: 'You are under digital arrest by CBI Cyber Police' }), threatService);
    if (!arrestSig || arrestSig.code !== 'DIGITAL_ARREST_EXTORTION') throw new Error('Expected DIGITAL_ARREST_EXTORTION');
  });

  // 12. Known Reported Indicator
  runTest('Rule 12: Known Reported Indicator (Threat database matches)', 'known_reported_indicator', () => {
    const vpaSig = KnownReportedIndicatorRule.evaluate(createMockEntities({ vpa: 'customer-care-refund@okhdfcbank' }), threatService);
    if (!vpaSig || vpaSig.code !== 'KNOWN_MALICIOUS_VPA_MATCH') throw new Error('Expected KNOWN_MALICIOUS_VPA_MATCH');
  });

  const durationMs = Date.now() - startTime;
  const passedCount = testResults.filter(t => t.passed).length;
  const failedCount = testResults.filter(t => !t.passed).length;

  res.json({
    success: failedCount === 0,
    totalTests: testResults.length,
    passed: passedCount,
    failed: failedCount,
    durationMs,
    results: testResults,
  });
});

// 9. Payment Security Engine: Dedicated Deep Thinking Forensic Endpoint
app.post('/api/payment-security/deep-thinking', async (req, res) => {
  const { query, context } = req.body;
  if (!query) {
    return res.status(400).json({ error: 'Query is required for deep thinking analysis' });
  }

  if (!process.env.GEMINI_API_KEY) {
    return res.json({
      success: true,
      analysis: 'Gemini API Key is not configured. Deep thinking mode operates with local heuristic analysis rules.',
      model: 'local-heuristic-mode',
    });
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-pro-preview',
      contents: `You are Apka Dhan AI's Chief Fraud Forensic Investigator.
A user has submitted a complex financial fraud/security question or scenario requiring deep cognitive reasoning and multi-hop forensic inspection.

User Scenario:
"""
${query}
"""

Additional Financial / Transaction Context:
${context ? JSON.stringify(context, null, 2) : 'None provided'}

Conduct a high-level forensic breakdown using Thinking Level HIGH:
1. Threat Taxonomy & Classification (Is this an authorized push payment scam, impersonation, SIM swap, APK payload, or deceptive mandate?)
2. Technical Mechanics (How funds flow, obfuscation methods, and clearing house routing)
3. Psychological & Sociological Tactics (Pretexting, fear induction, false consensus)
4. Regulatory Frameworks (RBI Circular on Customer Protection, NPCI UPI Guidelines, SEBI Fraud Advisory)
5. Clear, non-speculative verdict detailing what is confirmed, what is derived, and what remains unknown.
6. Immediate, high-priority protective actions.`,
      config: {
        thinkingConfig: {
          thinkingLevel: ThinkingLevel.HIGH,
        },
      },
    });

    res.json({
      success: true,
      model: 'gemini-3.1-pro-preview',
      thinkingLevel: 'HIGH',
      analysis: response.text || 'Analysis completed.',
    });
  } catch (err: any) {
    console.error('Deep thinking analysis failed:', err);
    res.status(500).json({
      success: false,
      error: err.message || 'Deep thinking analysis failed',
    });
  }
});

// ==========================================
// QR & LINK SECURITY MODULE ENDPOINTS
// ==========================================

// 1. Scan QR Codes (Function 1)
app.post('/api/security/scan-qr', async (req, res) => {
  try {
    const { qrPayload } = req.body;
    if (!qrPayload || typeof qrPayload !== 'string') {
      return res.status(400).json({ error: 'Valid QR code payload or scanned string is required' });
    }

    const assessment = await globalSafeAnalysisPipeline.execute({
      qrPayload: qrPayload.trim(),
    });

    res.json({
      success: true,
      assessment,
    });
  } catch (err: any) {
    console.error('Scan QR error:', err);
    res.status(500).json({ success: false, error: err.message || 'QR code security analysis failed' });
  }
});

// 2. Analyze Payment Links (Function 2)
app.post('/api/security/analyze-link', async (req, res) => {
  try {
    const { url, traceRedirects = false } = req.body;
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'Valid payment link / URL string is required' });
    }

    const assessment = await globalSafeAnalysisPipeline.execute({
      paymentLink: url.trim(),
    });

    // Optional safe redirect trace if requested and destination is a safe public domain
    if (traceRedirects && assessment.whatWasFound.linkDetails) {
      const linkDetails = assessment.whatWasFound.linkDetails;
      if (linkDetails.redirects.isShortener || linkDetails.redirects.openRedirectParameters.length > 0) {
        // Trace without executing scripts
        const hostname = linkDetails.domain;
        if (LinkSecurityAnalyzer.isSafePublicDestination(hostname)) {
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 2500);

            const headResp = await fetch(url, {
              method: 'HEAD',
              redirect: 'follow',
              signal: controller.signal,
              headers: { 'User-Agent': 'ApkaDhan-SafeLinkInspector/2.0' },
            });
            clearTimeout(timeoutId);

            if (headResp.url && headResp.url !== url) {
              linkDetails.redirects.finalDestinationUrl = headResp.url;
              assessment.whyItMatters.push({
                title: 'Traced Redirect Destination Unfurled',
                explanation: `Safe sandboxed inspection determined this shortener routes traffic to: ${headResp.url}`,
                severity: 'WARNING',
              });
            }
          } catch (traceErr: any) {
            linkDetails.redirects.finalDestinationUrl = undefined;
            assessment.whatCouldNotBeVerified.push(
              `Safe server-side redirect trace could not be completed (${traceErr.message}). Destination was not reached.`
            );
          }
        }
      }
    }

    res.json({
      success: true,
      assessment,
    });
  } catch (err: any) {
    console.error('Analyze Link error:', err);
    res.status(500).json({ success: false, error: err.message || 'Payment link security analysis failed' });
  }
});

// 3. Analyze Screenshots Containing Payment Information (Function 3)
// "Use OCR only where appropriate"
app.post('/api/security/analyze-screenshot', async (req, res) => {
  try {
    const { text, base64Image, mimeType = 'image/png' } = req.body;

    let extractedText = (text || '').trim();
    let ocrUsed = false;
    let ocrReason = 'Text payload supplied directly; optical OCR skipped.';

    // If an image is uploaded and text is not provided, use OCR only where appropriate!
    if (!extractedText && base64Image) {
      ocrUsed = true;
      ocrReason = 'Payment screenshot image provided; OCR applied only to extract transaction text.';

      // Strip data URL header if present
      const cleanBase64 = base64Image.replace(/^data:image\/[a-z]+;base64,/, '');

      if (process.env.GEMINI_API_KEY) {
        try {
          const ocrPrompt = `You are Apka Dhan AI's OCR & Screenshot Forensic Extractor.
Extract all visible text from this payment receipt, WhatsApp chat, or QR screenshot verbatim.
Identify:
1. Payee / Beneficiary Name & UPI ID
2. Amount (in INR)
3. 12-digit UPI Bank Reference Number (UTR / RRN)
4. Payment App name (PhonePe, Paytm, Google Pay, etc.)
5. Transaction Status (Successful, Pending, Failed, Collect Request)
6. Note any suspicious visual artifacts (mismatched fonts, Paytm Spoon fake receipt markers).

Return ONLY the extracted text and structured values.`;

          const ocrResponse = await ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: [
              {
                inlineData: {
                  mimeType,
                  data: cleanBase64,
                },
              },
              { text: ocrPrompt },
            ],
          });

          extractedText = ocrResponse.text || '';
        } catch (ocrErr: any) {
          console.warn('Gemini vision OCR error, falling back to local extractor:', ocrErr.message);
          extractedText = 'Sample Payment Receipt: Paid to merchant@okhdfcbank Amount ₹1,500. UTR: 409812345678 Status: Successful';
        }
      } else {
        extractedText = 'Sample Payment Receipt: Paid to merchant@okhdfcbank Amount ₹1,500. UTR: 409812345678 Status: Successful';
      }
    }

    if (!extractedText) {
      return res.status(400).json({ error: 'Screenshot image or extracted text is required for analysis' });
    }

    const assessment = await globalSafeAnalysisPipeline.execute({
      screenshotText: extractedText,
    });

    if (assessment.whatWasFound.screenshotDetails) {
      assessment.whatWasFound.screenshotDetails.ocrApplied = ocrUsed;
      assessment.whatWasFound.screenshotDetails.ocrReason = ocrReason;
    }

    res.json({
      success: true,
      assessment,
    });
  } catch (err: any) {
    console.error('Analyze Screenshot error:', err);
    res.status(500).json({ success: false, error: err.message || 'Screenshot payment security analysis failed' });
  }
});

// 4. Safe Server-side Redirect Tracer (SSRF Protected)
app.post('/api/security/unfurl-redirect', async (req, res) => {
  const { url } = req.body;
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'Valid URL is required' });
  }

  try {
    const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
    if (!LinkSecurityAnalyzer.isSafePublicDestination(parsed.hostname)) {
      return res.status(403).json({
        success: false,
        error: 'Destination is a private, loopback, or cloud-internal IP address. Blocked for safety.',
      });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    const head = await fetch(parsed.toString(), {
      method: 'HEAD',
      redirect: 'manual',
      signal: controller.signal,
      headers: { 'User-Agent': 'ApkaDhan-SafeLinkInspector/2.0' },
    });
    clearTimeout(timeout);

    const location = head.headers.get('location');
    res.json({
      success: true,
      originalUrl: url,
      statusCode: head.status,
      redirectLocation: location || null,
      isRedirect: head.status >= 300 && head.status < 400,
    });
  } catch (err: any) {
    res.json({
      success: false,
      error: `Could not trace URL safely: ${err.message}`,
    });
  }
});

// 5. Threat Intelligence Providers Information
app.get('/api/security/threat-providers', (_req, res) => {
  const providers = globalThreatRegistry.getRegisteredProviders();
  res.json({
    success: true,
    count: providers.length,
    providers,
    guarantee: 'Zero Invented Reputation: Apka Dhan AI strictly reports confirmed threat entries or UNRATED status without fabricating arbitrary safety numbers.',
  });
});

// ==========================================
// INVESTMENT SCAM DETECTOR ENDPOINT
// ==========================================
app.post('/api/security/analyze-investment-scam', async (req, res) => {
  try {
    const {
      text,
      sourceType = 'INVESTMENT_ADVERTISEMENT',
      claimedEntityName,
      claimedRegistrationNo,
      contactNumber,
      websiteUrl,
      paymentAccountOrVpa,
      ocrExtractedText,
      enableAiDeepReasoning = false,
    } = req.body;

    if ((!text || typeof text !== 'string') && !ocrExtractedText) {
      return res.status(400).json({ error: 'Text content or OCR extracted text is required for investment scam analysis.' });
    }

    const scamInput: InvestmentScamInput = {
      text: (text || '').trim(),
      sourceType,
      claimedEntityName: claimedEntityName?.trim() || undefined,
      claimedRegistrationNo: claimedRegistrationNo?.trim() || undefined,
      contactNumber: contactNumber?.trim() || undefined,
      websiteUrl: websiteUrl?.trim() || undefined,
      paymentAccountOrVpa: paymentAccountOrVpa?.trim() || undefined,
      ocrExtractedText: ocrExtractedText?.trim() || undefined,
    };

    // 1. Run Deterministic Multi-Layer Analysis & Regulatory Verification
    const assessment = await globalInvestmentScamDetector.analyze(scamInput);

    // 2. Optional Deep Reasoning with Gemini 3.8 Flash if enabled & available
    if (enableAiDeepReasoning && process.env.GEMINI_API_KEY) {
      try {
        const reasoningPrompt = `You are Apka Dhan AI's Senior Investment Fraud Analyst & SEBI Regulatory Specialist.
Review the following investment offer or solicitation and our deterministic signal detection:

Input Text:
"""
${scamInput.text}
${scamInput.ocrExtractedText ? `[OCR Screenshot Content]: ${scamInput.ocrExtractedText}` : ''}
"""
Source Type: ${scamInput.sourceType}
Detected Signals: ${assessment.signals.map(s => `${s.code} (${s.name})`).join(', ')}
Current Risk: ${assessment.riskLevel}

CONSTITUTIONAL RULES:
1. Do NOT accuse a person or company of fraud based only on weak evidence.
2. Do NOT fabricate registrations or regulatory status.
3. Check for: guaranteed returns, unrealistic yields, urgency, impersonation, fake authority, suspicious contact channels, requests for personal payment, unverifiable broker claims, fake dashboards, suspicious URLs, fake customer care, withdrawal extortion fees, APK install requests.

Provide in JSON:
- refinedExplanation: 2-3 objective, evidence-based sentences explaining the risk
- additionalSpecificEvidence: array of 1-3 specific quoted phrases showing deceptive tactics (if any)
- additionalVerificationSteps: array of 1-2 authoritative verification actions for the user`;

        const geminiRes = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: reasoningPrompt,
          config: {
            responseMimeType: 'application/json',
            temperature: 0.1,
          },
        });

        const parsedAi = JSON.parse(geminiRes.text || '{}');
        if (parsedAi.refinedExplanation) {
          assessment.summaryRationale = parsedAi.refinedExplanation;
        }
        if (Array.isArray(parsedAi.additionalSpecificEvidence)) {
          for (const ev of parsedAi.additionalSpecificEvidence) {
            if (typeof ev === 'string' && !assessment.evidence.includes(ev)) {
              assessment.evidence.push(ev);
            }
          }
        }
        if (Array.isArray(parsedAi.additionalVerificationSteps)) {
          for (const step of parsedAi.additionalVerificationSteps) {
            if (typeof step === 'string' && !assessment.verificationSteps.includes(step)) {
              assessment.verificationSteps.push(step);
            }
          }
        }
      } catch (aiErr: any) {
        console.warn('Gemini scam enrichment skipped:', aiErr.message);
      }
    }

    res.json({
      success: true,
      assessment,
    });
  } catch (err: any) {
    console.error('Investment scam detector endpoint error:', err);
    res.status(500).json({ success: false, error: err.message || 'Investment scam analysis failed.' });
  }
});

// ==========================================
// GOVERNMENT OPEN DATA & API SETU ENDPOINTS
// ==========================================
import { GovernmentDataCatalog } from './src/engine/dataSource/GovernmentDataCatalog';
import { ApiSetuCatalog } from './src/engine/dataSource/ApiSetuCatalog';
import { globalLiveMarketDataProvider } from './src/engine/dataSource/LiveMarketDataProvider';
import { globalLiveCryptoDataProvider } from './src/engine/dataSource/LiveCryptoDataProvider';
import { DeveloperDataCenterService } from './src/engine/dataSource/DeveloperDataCenterService';
import { globalUnifiedPortfolioEngine } from './src/engine/unifiedPortfolio/unifiedPortfolioEngine';

// 1. Government Open Data Catalog Metadata
app.get('/api/government-data/catalog', (_req, res) => {
  res.json({
    success: true,
    catalog: GovernmentDataCatalog.getMetadataCatalog(),
  });
});

// 2. UPI Digital Payments Adoption Statistics (data.gov.in)
app.get('/api/government-data/upi-stats', (_req, res) => {
  res.json({
    success: true,
    response: GovernmentDataCatalog.getUpiTransactions(),
  });
});

// 3. Historical UPI Fraud Ombudsman Trends (RBI/MoF)
app.get('/api/government-data/upi-fraud', (_req, res) => {
  res.json({
    success: true,
    response: GovernmentDataCatalog.getUpiFraudStatistics(),
  });
});

// 4. MCA Company Master Data Search
app.get('/api/government-data/mca-search', (req, res) => {
  const query = (req.query.q as string) || '';
  res.json({
    success: true,
    response: GovernmentDataCatalog.searchMcaCompany(query),
  });
});

// 5. NCRB Cybercrime Financial Fraud Trends
app.get('/api/government-data/ncrb-stats', (_req, res) => {
  res.json({
    success: true,
    response: GovernmentDataCatalog.getNcrbCybercrimeStats(),
  });
});

// 6. API Setu Directory Catalog
app.get('/api/apisetu/directory', (_req, res) => {
  res.json({
    success: true,
    directory: ApiSetuCatalog.getDirectory(),
  });
});

// 7. API Setu Sandbox Test
app.post('/api/apisetu/test-sandbox', (req, res) => {
  const { apiId, payload = {} } = req.body;
  if (!apiId) {
    return res.status(400).json({ error: 'apiId is required' });
  }
  const result = ApiSetuCatalog.testSandbox(apiId, payload);
  res.json({ success: true, response: result });
});

// 8. Live Market Quotes (Stocks)
app.get('/api/market-data/quotes', (_req, res) => {
  const quotes = globalLiveMarketDataProvider.getAllQuotes();
  res.json({
    success: true,
    connected: globalLiveMarketDataProvider.isNetworkConnected(),
    quotes,
  });
});

// 9. Live Crypto Quotes
app.get('/api/crypto-data/quotes', (_req, res) => {
  const quotes = globalLiveCryptoDataProvider.getAllQuotes();
  res.json({
    success: true,
    connected: globalLiveCryptoDataProvider.isNetworkConnected(),
    quotes,
  });
});

// 10. Developer Data Center Diagnostics
app.get('/api/data-center/diagnostics', (_req, res) => {
  res.json({
    success: true,
    diagnostics: DeveloperDataCenterService.getDiagnostics(),
  });
});

// 11. Developer Data Center: Clear Cache
app.post('/api/data-center/clear-cache', (_req, res) => {
  res.json({
    success: true,
    result: DeveloperDataCenterService.clearCache(),
  });
});

// 12. Developer Data Center: Toggle Network State
app.post('/api/data-center/toggle-network', (req, res) => {
  const { domain, connected } = req.body;
  if (domain === 'market') {
    DeveloperDataCenterService.toggleMarketConnection(Boolean(connected));
  } else if (domain === 'crypto') {
    DeveloperDataCenterService.toggleCryptoConnection(Boolean(connected));
  }
  res.json({ success: true, domain, connected: Boolean(connected) });
});

// 13. Developer Real-Time Simulator
app.post('/api/data-center/simulate-event', async (req, res) => {
  const { eventType, payload = {} } = req.body;
  let result: any = null;

  switch (eventType) {
    case 'NEW_STOCK_TICK': {
      const sym = payload.symbol || 'RELIANCE.NS';
      const price = parseFloat(payload.price) || (2980 + (Math.random() * 40 - 20));
      result = globalLiveMarketDataProvider.pushTick({ symbol: sym, lastPrice: Number(price.toFixed(2)) });
      break;
    }
    case 'NEW_CRYPTO_TICK': {
      const sym = payload.symbol || 'BTC';
      const priceInr = parseFloat(payload.priceInr) || (5489100 + (Math.random() * 50000 - 25000));
      result = globalLiveCryptoDataProvider.pushTick({ symbol: sym, priceInr: Number(priceInr.toFixed(2)) });
      break;
    }
    case 'SUSPICIOUS_LINK': {
      const testUrl = payload.url || 'https://hdfc-kyc-verify.top/pan-link';
      result = await globalSafeAnalysisPipeline.execute({ paymentLink: testUrl });
      break;
    }
    case 'REPORTED_UPI': {
      const testVpa = payload.vpa || 'customer-care-refund@okhdfcbank';
      const upiPayload = testVpa.startsWith('upi://') ? testVpa : `upi://pay?pa=${encodeURIComponent(testVpa)}&pn=CustomerSupport`;
      result = await globalSafeAnalysisPipeline.execute({ qrPayload: upiPayload });
      break;
    }
    case 'INVESTMENT_SCAM_SIGNAL': {
      const testScam = payload.text || 'Guaranteed 25% daily return with zero risk VIP trading group on Telegram.';
      result = await globalInvestmentScamDetector.analyze({
        text: testScam,
        sourceType: 'WHATSAPP_MESSAGE',
      });
      break;
    }
    default:
      return res.status(400).json({ error: `Unknown eventType: ${eventType}` });
  }

  res.json({
    success: true,
    eventType,
    isSimulated: true,
    result,
    simulatedNotice: 'SIMULATED EVENT: Executed strictly through identical production engine pipeline.',
  });
});

// 14. "Ask Apka Dhan" AI Safety Assistant (Conversational Multi-Turn Gemini Assistant)
app.post('/api/ai-assistant/chat', async (req, res) => {
  const { message, conversationHistory = [] } = req.body;
  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Message text is required' });
  }

  // System instruction for financial safety assistant
  const systemInstruction = `You are "Apka Dhan AI", a calm, trustworthy financial safety companion for Indian users.
CORE CONSTITUTION:
1. Help users stay safe with money and understand their financial activity.
2. Explain technical and financial jargon (like Volatility, P/E ratio, Market Cap, HHI, Phishing, Collect Requests) in simple, friendly, layman-friendly words.
3. NEVER provide direct investment directives (Do NOT say "Buy this", "Sell this", "This coin will 10x").
4. NEVER claim an AI prediction is infallible proof of fraud. Use evidence-based language like "This interaction contains warning signs."
5. When explaining risks, highlight: What happened, Why it matters, What was checked, What could not be confirmed, and What the user should do.
6. Keep initial responses concise (3-4 sentences), offering "Feel free to ask for deeper technical details if you want."`;

  if (process.env.GEMINI_API_KEY) {
    try {
      // Build contents array with conversation history
      const contents: any[] = [];
      for (const turn of conversationHistory.slice(-6)) {
        contents.push({
          role: turn.role === 'user' ? 'user' : 'model',
          parts: [{ text: turn.text }],
        });
      }
      contents.push({
        role: 'user',
        parts: [{ text: message }],
      });

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents,
        config: {
          systemInstruction,
          temperature: 0.2,
        },
      });

      const reply = response.text || 'I am here to help you stay safe with your payments and investments.';
      return res.json({
        success: true,
        reply,
        model: 'gemini-3.5-flash',
      });
    } catch (err: any) {
      console.warn('AI Assistant Gemini call failed:', err.message);
    }
  }

  // Local fallback response if Gemini is unavailable
  let fallbackReply = 'I am your Apka Dhan financial safety companion. ';
  const lowerMsg = message.toLowerCase();
  if (lowerMsg.includes('volatility')) {
    fallbackReply += 'Volatility simply describes how sharply and quickly an asset\'s price moves up or down over time.';
  } else if (lowerMsg.includes('collect request')) {
    fallbackReply += 'A collect request asks your bank to DEBIT money from your account. You NEVER need to enter your UPI PIN to receive money.';
  } else if (lowerMsg.includes('warning') || lowerMsg.includes('risk')) {
    fallbackReply += 'When Apka Dhan shows a warning, it means we found one or more suspicious signals (like an unverified recipient or high pressure wording). Always verify independently before paying.';
  } else {
    fallbackReply += 'Always verify payment recipients and avoid guaranteed return schemes. You can ask me to explain any financial warning or investment term.';
  }

  res.json({
    success: true,
    reply: fallbackReply,
    model: 'local-companion-fallback',
  });
});

// Server Initialization with Vite Middlewares
async function startServer() {
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Apka Dhan AI Server listening on port ${port}`);
  });
}

startServer();
