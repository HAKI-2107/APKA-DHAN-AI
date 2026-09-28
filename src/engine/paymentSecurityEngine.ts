import {
  NormalizedPaymentEntities,
  PaymentSecurityAssessment,
  PaymentSecurityRule,
  RawPaymentInput,
  RiskLevel,
  RiskSignal,
  ThreatLookupService,
  MLAnalyzer,
  UserBehavioralProfile,
} from './types';
import { InMemoryThreatLookupService } from './threatLookup';
import { ALL_INITIAL_RULES } from './rules';
import { globalAlertEngine } from './notifications/AlertEngine';

export class PaymentSecurityEngine {
  private rules: PaymentSecurityRule[] = [];
  private threatService: ThreatLookupService;
  private mlAnalyzers: MLAnalyzer[] = [];

  constructor(
    customThreatService?: ThreatLookupService,
    initialRules: PaymentSecurityRule[] = ALL_INITIAL_RULES
  ) {
    this.threatService = customThreatService || new InMemoryThreatLookupService();
    this.rules = [...initialRules];
  }

  /**
   * Pluggable registration for additional rules
   */
  public registerRule(rule: PaymentSecurityRule): void {
    this.rules.push(rule);
  }

  /**
   * Pluggable registration for ML / AI models
   */
  public registerMLAnalyzer(analyzer: MLAnalyzer): void {
    this.mlAnalyzers.push(analyzer);
  }

  /**
   * FULL PIPELINE EXECUTION:
   * INPUT → VALIDATION → EXTRACTION → NORMALIZATION → THREAT LOOKUP
   * → RULE ANALYSIS → BEHAVIORAL ANALYSIS → ML ANALYSIS → RISK AGGREGATION → EXPLANATION
   */
  public async evaluate(input: RawPaymentInput): Promise<PaymentSecurityAssessment> {
    // 1. VALIDATION
    this.validateInput(input);

    // 2. EXTRACTION & 3. NORMALIZATION
    const entities = this.extractAndNormalize(input);

    // 4. THREAT LOOKUP & 5. RULE ANALYSIS
    const ruleSignals: RiskSignal[] = [];
    for (const rule of this.rules) {
      try {
        const signal = await rule.evaluate(entities, this.threatService, input.userProfile);
        if (signal) {
          ruleSignals.push(signal);
        }
      } catch (err) {
        console.error(`Error in rule [${rule.id}]:`, err);
      }
    }

    // 6. BEHAVIORAL ANALYSIS (Integrated via behavioral rules & profile checks)
    const behavioralSignals = this.runBehavioralAnalysis(entities, input.userProfile);
    const combinedSignals = [...ruleSignals, ...behavioralSignals];

    // 7. ML ANALYSIS (Pluggable AI & semantic models)
    let mlSignals: RiskSignal[] = [];
    for (const ml of this.mlAnalyzers) {
      try {
        const signals = await ml.analyze(entities, combinedSignals);
        mlSignals.push(...signals);
      } catch (err) {
        console.warn(`ML analyzer [${ml.name}] error:`, err);
      }
    }

    const allSignals = [...combinedSignals, ...mlSignals];

    // Deduplicate signals by code
    const uniqueSignalsMap = new Map<string, RiskSignal>();
    for (const s of allSignals) {
      if (!uniqueSignalsMap.has(s.code)) {
        uniqueSignalsMap.set(s.code, s);
      }
    }
    const finalSignals = Array.from(uniqueSignalsMap.values());

    // 8. RISK AGGREGATION
    const riskLevel = this.aggregateRisk(entities, finalSignals);

    // Notify Alert Engine if high risk or critical signal detected
    if (riskLevel === 'HIGH RISK') {
      try {
        globalAlertEngine.processEvent({
          id: `pay_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
          type: 'PAYMENT',
          severity: 'HIGH',
          title: entities.vpa ? `Suspicious UPI Payment: ${entities.vpa}` : 'Suspicious Payment Request',
          summary: finalSignals[0]?.description || 'High risk transaction or collect-request detected.',
          details: finalSignals.map((s) => `${s.title}: ${s.description}`).join('; '),
          source: 'PaymentSecurityEngine',
          deepLink: 'apkaDhan://alerts',
          requiresAction: true,
          isRead: false,
          isTest: false,
          metadata: { payeeVpa: entities.vpa, amount: entities.amount },
        });
      } catch (err) {
        // Safe failover
      }
    }

    // 9. EXPLANATION SYNTHESIS
    return this.synthesizeExplanation(entities, finalSignals, riskLevel);
  }

  // --- STAGE 1: VALIDATION ---
  private validateInput(input: RawPaymentInput): void {
    if (!input || typeof input !== 'object') {
      throw new Error('PaymentSecurityEngine: Input must be a valid object');
    }

    const hasAnyField =
      input.rawText ||
      input.upiId ||
      input.paymentLink ||
      input.qrPayload ||
      input.transactionScreenshotOcr ||
      input.merchantId ||
      input.parsedTransaction;

    if (!hasAnyField) {
      throw new Error('PaymentSecurityEngine: Input must contain at least one payment or interaction field');
    }
  }

  // --- STAGE 2 & 3: EXTRACTION & NORMALIZATION ---
  private extractAndNormalize(input: RawPaymentInput): NormalizedPaymentEntities {
    const textPieces: string[] = [];
    if (input.rawText) textPieces.push(input.rawText);
    if (input.upiId) textPieces.push(input.upiId);
    if (input.paymentLink) textPieces.push(input.paymentLink);
    if (input.qrPayload) textPieces.push(input.qrPayload);
    if (input.transactionScreenshotOcr) textPieces.push(input.transactionScreenshotOcr);
    if (input.parsedTransaction?.counterpartyVpa) textPieces.push(input.parsedTransaction.counterpartyVpa);
    if (input.parsedTransaction?.counterpartyName) textPieces.push(input.parsedTransaction.counterpartyName);

    const rawCombinedText = textPieces.join(' \n ');

    // Normalize invisible characters and zero-width spaces
    const sanitizedText = rawCombinedText
      .replace(/[\u200B-\u200D\uFEFF]/g, '') // remove zero-width spaces
      .trim();

    let extractedVpa: string | undefined = input.upiId?.trim();
    let extractedUrlString: string | undefined = input.paymentLink?.trim();
    let amount: number | undefined = input.parsedTransaction?.amount;
    let isCollectRequest = input.parsedTransaction?.isCollectRequest || false;
    const intentParameters: Record<string, string> = {};

    // QR Payload & Intent URI extraction
    const candidateUri = input.qrPayload?.trim() || (input.rawText?.startsWith('upi://') ? input.rawText.trim() : undefined);
    if (candidateUri && candidateUri.toLowerCase().startsWith('upi://pay')) {
      try {
        const parsedUrl = new URL(candidateUri);
        parsedUrl.searchParams.forEach((val, key) => {
          intentParameters[key.toLowerCase()] = val;
        });

        if (intentParameters['pa']) {
          extractedVpa = intentParameters['pa'];
        }
        if (intentParameters['am']) {
          const parsedAm = parseFloat(intentParameters['am']);
          if (!isNaN(parsedAm)) amount = parsedAm;
        }
        if (candidateUri.toLowerCase().includes('collect') || intentParameters['mode'] === '02') {
          isCollectRequest = true;
        }
      } catch (e) {
        // Malformed URI string
      }
    }

    // Extract VPA from text if not yet isolated
    if (!extractedVpa) {
      const vpaRegex = /\b([a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64})\b/g;
      const vpaMatch = vpaRegex.exec(sanitizedText);
      if (vpaMatch) {
        extractedVpa = vpaMatch[1];
      }
    }

    // Extract URL from text if not yet isolated
    if (!extractedUrlString) {
      const urlRegex = /(https?:\/\/[^\s]+)/gi;
      const urlMatch = urlRegex.exec(sanitizedText);
      if (urlMatch) {
        extractedUrlString = urlMatch[1];
      }
    }

    // Extract Amount from text if not yet isolated
    if (amount === undefined || amount === null) {
      const amountRegex = /(?:rs\.?|inr|₹)\s*([\d,]+(?:\.\d{1,2})?)/i;
      const amountMatch = amountRegex.exec(sanitizedText);
      if (amountMatch) {
        const cleanNumber = amountMatch[1].replace(/,/g, '');
        const val = parseFloat(cleanNumber);
        if (!isNaN(val)) amount = val;
      }
    }

    // Extract Phone Numbers
    const phoneNumbers: string[] = [];
    const phoneRegex = /(?:\+?91[\-\s]?)?[6789]\d{9}\b/g;
    let pMatch;
    while ((pMatch = phoneRegex.exec(sanitizedText)) !== null) {
      phoneNumbers.push(pMatch[0].replace(/[\-\s]/g, ''));
    }

    // Normalize VPA
    let vpaHandlePrefix: string | undefined;
    let vpaPspHandle: string | undefined;
    if (extractedVpa) {
      extractedVpa = extractedVpa.toLowerCase().trim();
      const parts = extractedVpa.split('@');
      if (parts.length === 2) {
        vpaHandlePrefix = parts[0];
        vpaPspHandle = parts[1];
      }
    }

    // Normalize URL
    let parsedUrlObject: URL | undefined;
    let domain: string | undefined;
    let tld: string | undefined;

    if (extractedUrlString) {
      try {
        const normalized = extractedUrlString.startsWith('http')
          ? extractedUrlString
          : `https://${extractedUrlString}`;
        parsedUrlObject = new URL(normalized);
        domain = parsedUrlObject.hostname.toLowerCase();
        const parts = domain.split('.');
        if (parts.length > 1) {
          tld = '.' + parts[parts.length - 1];
        }
      } catch (e) {
        // Not a standard URL
      }
    }

    // Word tokens for text heuristics
    const allTextTokens = sanitizedText.toLowerCase().split(/\s+/);

    return {
      vpa: extractedVpa,
      vpaHandlePrefix,
      vpaPspHandle,
      url: parsedUrlObject,
      domain,
      tld,
      rawUrl: extractedUrlString,
      amount,
      currency: 'INR',
      isCollectRequest,
      intentParameters,
      phoneNumbers,
      allTextTokens,
      rawCombinedText: sanitizedText,
      timestampEpochMs: input.parsedTransaction?.timestampEpochMs || Date.now(),
    };
  }

  // --- STAGE 6: BEHAVIORAL ANALYSIS ---
  private runBehavioralAnalysis(
    entities: NormalizedPaymentEntities,
    profile?: UserBehavioralProfile
  ): RiskSignal[] {
    const signals: RiskSignal[] = [];
    if (!profile) return signals;

    // Check unknown beneficiary
    if (entities.vpa && profile.knownBeneficiaryVpas && profile.knownBeneficiaryVpas.size > 0) {
      const isKnown = profile.knownBeneficiaryVpas.has(entities.vpa.toLowerCase());
      if (!isKnown && entities.isCollectRequest) {
        signals.push({
          code: 'UNFAMILIAR_RECIPIENT_COLLECT',
          category: 'unusual_recipient',
          title: 'Incoming Collect Request from Unfamiliar Beneficiary',
          description: `You have never transacted with "${entities.vpa}" previously. Incoming collect requests from unknown accounts represent high social engineering risk.`,
          source: '[BEHAVIORAL_BASELINE]',
          weight: 0.75,
          isCritical: false,
        });
      }
    }

    return signals;
  }

  // --- STAGE 8: RISK AGGREGATION ---
  private aggregateRisk(
    entities: NormalizedPaymentEntities,
    signals: RiskSignal[]
  ): RiskLevel {
    if (signals.length === 0) {
      // If there are no signals and we have no identifiable payment data
      if (!entities.vpa && !entities.domain && !entities.amount && !entities.rawCombinedText) {
        return 'UNKNOWN / UNVERIFIED';
      }
      return 'LOW RISK';
    }

    // Critical Red Flag Rule: If any critical signal exists, risk is at least HIGH
    const hasCritical = signals.some((s) => s.isCritical);
    if (hasCritical) {
      return 'HIGH RISK';
    }

    // Compute cumulative weighted score
    const totalScore = signals.reduce((sum, s) => sum + s.weight, 0);

    if (totalScore >= 1.5) {
      return 'HIGH RISK';
    }
    if (totalScore >= 0.5) {
      return 'MEDIUM RISK';
    }
    return 'LOW RISK';
  }

  // --- STAGE 9: EXPLANATION SYNTHESIS ---
  private synthesizeExplanation(
    entities: NormalizedPaymentEntities,
    signals: RiskSignal[],
    riskLevel: RiskLevel
  ): PaymentSecurityAssessment {
    const evidence: string[] = [];
    const recommendedActions: string[] = [];
    const unknownFactors: string[] = [];
    const sourcesSet = new Set<string>();

    for (const signal of signals) {
      evidence.push(`${signal.title}: ${signal.description}`);
      sourcesSet.add(signal.source);
    }

    if (signals.length === 0) {
      evidence.push('No recognized malicious patterns, impersonation keywords, or unauthorized PSP handles detected.');
      sourcesSet.add('[RULE_SIGNAL]');
    }

    // Actionable Recommendations based on risk
    if (riskLevel === 'HIGH RISK') {
      recommendedActions.push('Do NOT authorize any payment, scan any QR code, or share an OTP.');
      recommendedActions.push('If this is an incoming collect request claiming to be a refund, DECLINE it immediately. Receiving money never requires entering your UPI PIN.');
      recommendedActions.push('Report the suspicious UPI ID, phone number, or URL on the National Cyber Crime Portal (1930 / cybercrime.gov.in).');
    } else if (riskLevel === 'MEDIUM RISK') {
      recommendedActions.push('Verify the beneficiary name with your contact through an independent voice call before completing the transaction.');
      recommendedActions.push('Check that the official banking application shows the verified merchant badge.');
    } else {
      recommendedActions.push('Confirm that the account holder name displayed in your banking app matches your intended recipient.');
      recommendedActions.push('Verify the transaction amount on your device screen before submitting your UPI PIN.');
    }

    // Explicit Unknown Factors (Epistemic Transparency)
    if (!entities.vpa) {
      unknownFactors.push('Beneficiary UPI VPA could not be extracted from the provided input.');
    } else {
      unknownFactors.push('The true underlying bank account holder name cannot be confirmed until queried live on the NPCI UPI switch.');
    }

    if (!entities.domain && entities.rawUrl) {
      unknownFactors.push('The target domain could not be resolved or parsed.');
    }

    let confidence = 'High';
    if (signals.some((s) => s.category === 'known_reported_indicator')) {
      confidence = 'High (Corroborated by verified threat intelligence database)';
    } else if (signals.length > 0) {
      confidence = 'High (Deterministic heuristic & syntactic rule match)';
    } else {
      confidence = 'Medium (Absence of detected threat signals; user caution still advised)';
    }

    return {
      riskLevel,
      riskSignals: signals,
      evidence,
      confidence,
      sources: Array.from(sourcesSet),
      recommendedActions,
      unknownFactors,
      assessedAtEpochMs: Date.now(),
      normalizedEntities: {
        vpa: entities.vpa,
        domain: entities.domain,
        amount: entities.amount,
        isCollectRequest: entities.isCollectRequest,
      },
    };
  }
}
