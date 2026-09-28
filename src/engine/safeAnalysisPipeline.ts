import {
  QRSecurityScanner,
  QRScanResult,
  QRExtractedFields,
} from './qrSecurityScanner';
import {
  LinkSecurityAnalyzer,
  LinkExtractedFields,
} from './linkSecurityAnalyzer';
import {
  ScreenshotSecurityAnalyzer,
  ScreenshotExtractedData,
} from './screenshotSecurityAnalyzer';
import {
  globalThreatRegistry,
  ThreatIntelligenceRegistry,
} from './threatIntelligence/defaultProvider';
import { ThreatVerdict } from './threatIntelligence/types';

export type SecurityRiskLevel =
  | 'LOW RISK'
  | 'MEDIUM RISK'
  | 'HIGH RISK'
  | 'UNKNOWN / UNVERIFIED';

/**
 * Standard Result Screen Structure (Mandatory 5 Sections):
 * 1. RISK LEVEL
 * 2. WHAT WAS FOUND
 * 3. WHY IT MATTERS
 * 4. WHAT COULD NOT BE VERIFIED
 * 5. WHAT THE USER SHOULD DO
 */
export interface SafeAnalysisResultScreen {
  // 1. RISK LEVEL
  riskLevel: SecurityRiskLevel;
  riskSummary: string;
  confidence: string;

  // 2. WHAT WAS FOUND
  whatWasFound: {
    inputType: 'QR_CODE' | 'PAYMENT_LINK' | 'SCREENSHOT_OCR' | 'UPI_INTENT';
    rawIdentifier: string;
    upiDetails?: {
      vpa?: string;
      merchantName?: string;
      amount?: number;
      currency?: string;
      transactionNote?: string;
      fullUri?: string;
      mode?: string;
      isCollectRequest: boolean;
      merchantCategoryCode?: string;
      transactionRef?: string;
      signaturePresent: boolean;
      orgId?: string;
      extraEncodedParams: Record<string, string>;
    };
    linkDetails?: {
      normalizedUrl: string;
      domain: string;
      subdomain?: string;
      path: string;
      queryParameters: Record<string, string>;
      redirects: {
        isShortener: boolean;
        shortenerService?: string;
        openRedirectParameters: Array<{ parameterName: string; targetUrl: string }>;
        finalDestinationUrl?: string;
        tracedHops?: string[];
      };
      suspiciousPatterns: Array<{
        code: string;
        severity: string;
        title: string;
        detectedToken: string;
      }>;
    };
    screenshotDetails?: {
      ocrApplied: boolean;
      ocrReason?: string;
      redactedPiiCount: number;
      paymentDetails: {
        counterpartyVpa?: string;
        counterpartyName?: string;
        amount?: number;
        transactionReference?: string;
        transactionStatus?: string;
        detectedApp?: string;
      };
      forgeryIndicators: string[];
    };
    threatIntelligence: {
      verdict: ThreatVerdict;
      hasReputationData: boolean;
      sources: string[];
      details: string[];
    };
  };

  // 3. WHY IT MATTERS
  whyItMatters: Array<{
    title: string;
    explanation: string;
    severity: 'CRITICAL' | 'WARNING' | 'INFORMATIONAL';
  }>;

  // 4. WHAT COULD NOT BE VERIFIED
  whatCouldNotBeVerified: string[];

  // 5. WHAT THE USER SHOULD DO
  whatTheUserShouldDo: Array<{
    stepNumber: number;
    action: string;
    importance: 'MUST_DO' | 'RECOMMENDED' | 'ADVISORY';
  }>;

  assessedAtEpochMs: number;
}

export interface PipelineExecutionInput {
  qrPayload?: string;
  paymentLink?: string;
  screenshotText?: string;
  screenshotImageData?: {
    data: Uint8ClampedArray;
    width: number;
    height: number;
  };
  threatRegistry?: ThreatIntelligenceRegistry;
}

export class SafeAnalysisPipeline {
  private threatRegistry: ThreatIntelligenceRegistry;

  constructor(customRegistry?: ThreatIntelligenceRegistry) {
    this.threatRegistry = customRegistry || globalThreatRegistry;
  }

  /**
   * Main Safe Execution Entry Point
   */
  async execute(input: PipelineExecutionInput): Promise<SafeAnalysisResultScreen> {
    const registry = input.threatRegistry || this.threatRegistry;

    // Route 1: QR Code input (optical image data or raw payload)
    if (input.screenshotImageData) {
      // Step A: Check if an optical QR code is in the image WITHOUT needing OCR
      const opticalQr = QRSecurityScanner.decodeFromImageData(
        input.screenshotImageData.data,
        input.screenshotImageData.width,
        input.screenshotImageData.height
      );

      if (opticalQr && opticalQr.success) {
        return this.processQrScanResult(opticalQr, registry);
      }
    }

    if (input.qrPayload) {
      const qrResult = QRSecurityScanner.parseScannedPayload(input.qrPayload);
      return this.processQrScanResult(qrResult, registry);
    }

    // Route 2: Payment Link input
    if (input.paymentLink) {
      return this.processLinkInput(input.paymentLink, registry);
    }

    // Route 3: Screenshot Text / OCR input
    if (input.screenshotText) {
      return this.processScreenshotTextInput(input.screenshotText, registry);
    }

    throw new Error('SafeAnalysisPipeline: No valid QR, link, or screenshot payload provided for analysis.');
  }

  /**
   * Process QR Scan Result
   */
  private async processQrScanResult(
    scanResult: QRScanResult,
    registry: ThreatIntelligenceRegistry
  ): Promise<SafeAnalysisResultScreen> {
    const fields = scanResult.fields;
    const whyItMatters: Array<{ title: string; explanation: string; severity: 'CRITICAL' | 'WARNING' | 'INFORMATIONAL' }> = [];
    const whatCouldNotBeVerified: string[] = [];
    const whatTheUserShouldDo: Array<{ stepNumber: number; action: string; importance: 'MUST_DO' | 'RECOMMENDED' | 'ADVISORY' }> = [];
    let riskLevel: SecurityRiskLevel = 'LOW RISK';

    // 1. UPI Payload Analysis
    let isCollect = fields.otherEncodedInfo.mode === '02';
    if (fields.rawPayload.toLowerCase().includes('collect')) isCollect = true;

    if (isCollect) {
      riskLevel = 'HIGH RISK';
      whyItMatters.push({
        title: 'Incoming Collect Request Vector (Mode=02)',
        explanation: 'This QR code is configured as a UPI Collect Request. Authorizing this request in any payment app will immediately DEBIT funds from your account rather than receiving funds.',
        severity: 'CRITICAL',
      });
      whatTheUserShouldDo.push({
        stepNumber: 1,
        action: 'DO NOT enter your UPI PIN. Entering your UPI PIN always debits money from your bank.',
        importance: 'MUST_DO',
      });
    }

    if (fields.merchantName && (fields.merchantName.toLowerCase().includes('support') || fields.merchantName.toLowerCase().includes('refund'))) {
      if (riskLevel !== 'HIGH RISK') riskLevel = 'HIGH RISK';
      whyItMatters.push({
        title: 'Customer Support Keyword Impersonation',
        explanation: `Merchant name '${fields.merchantName}' uses customer-care keywords. Legitimate bank support never creates QR codes to collect money or process refunds.`,
        severity: 'CRITICAL',
      });
    }

    // Check VPA in threat registry if present
    let threatConsolidated = {
      verdict: 'NOT_FOUND_OR_UNRATED' as ThreatVerdict,
      hasReputationData: false,
      evidence: [] as string[],
      sources: [] as string[],
    };

    if (fields.upiId) {
      const threatResults = await registry.lookupVpa(fields.upiId);
      threatConsolidated = registry.consolidateVerdict(threatResults);

      if (threatConsolidated.verdict === 'CONFIRMED_MALICIOUS') {
        riskLevel = 'HIGH RISK';
        whyItMatters.push({
          title: 'Direct National Threat Registry Match',
          explanation: `The beneficiary address ${fields.upiId} has been confirmed in registered cyber crime reports.`,
          severity: 'CRITICAL',
        });
        whatTheUserShouldDo.push({
          stepNumber: 2,
          action: 'Report this QR code to the National Cyber Crime Portal (1930 / cybercrime.gov.in).',
          importance: 'MUST_DO',
        });
      }
    }

    // Check embedded URL in QR
    let linkDetails: any = undefined;
    if (fields.url || fields.payloadType === 'WEB_URL') {
      const targetUrl = fields.url || fields.rawPayload;
      const linkAnalysis = LinkSecurityAnalyzer.analyzeLink(targetUrl);
      linkDetails = {
        normalizedUrl: linkAnalysis.normalizedUrl,
        domain: linkAnalysis.domain,
        subdomain: linkAnalysis.subdomain,
        path: linkAnalysis.path,
        queryParameters: linkAnalysis.queryParameters,
        redirects: {
          isShortener: linkAnalysis.redirects.isShortener,
          shortenerService: linkAnalysis.redirects.shortenerService,
          openRedirectParameters: linkAnalysis.redirects.openRedirectParameters,
        },
        suspiciousPatterns: linkAnalysis.suspiciousPatterns.map((p) => ({
          code: p.code,
          severity: p.severity,
          title: p.title,
          detectedToken: p.detectedToken,
        })),
      };

      if (linkAnalysis.suspiciousPatterns.some((p) => p.severity === 'CRITICAL')) {
        riskLevel = 'HIGH RISK';
      }
    }

    // Baseline checks & Default steps
    if (riskLevel === 'LOW RISK') {
      whyItMatters.push({
        title: 'Standard Payment Protocol Syntax',
        explanation: 'Payload conforms to standard NPCI UPI payment format without deceptive collect flags or known malicious matches.',
        severity: 'INFORMATIONAL',
      });
      whatTheUserShouldDo.push({
        stepNumber: 1,
        action: 'Inspect the beneficiary account name shown on your banking screen before confirming payment.',
        importance: 'RECOMMENDED',
      });
    }

    whatCouldNotBeVerified.push('Legal identity of the individual account holder cannot be confirmed without NPCI bank clearing authorization.');
    whatCouldNotBeVerified.push('Physical location of the merchant counter cannot be validated via optical QR data alone.');
    if (!threatConsolidated.hasReputationData) {
      whatCouldNotBeVerified.push('Threat intelligence database has no prior reported incidents for this VPA. (Absence of reports is unrated, not guaranteed safe).');
    }

    return {
      riskLevel,
      riskSummary: riskLevel === 'HIGH RISK'
        ? 'High-risk payment QR code with strong indicators of unauthorized debit or impersonation.'
        : 'Payment QR code with standard format; exercise normal payee verification.',
      confidence: threatConsolidated.hasReputationData ? 'High (Direct Registry Corroboration)' : 'High (Structural Protocol Analysis)',
      whatWasFound: {
        inputType: 'QR_CODE',
        rawIdentifier: fields.upiId || fields.url || fields.rawPayload,
        upiDetails: fields.payloadType === 'UPI_PAYMENT' ? {
          vpa: fields.upiId,
          merchantName: fields.merchantName,
          amount: fields.amount,
          currency: fields.otherEncodedInfo.currency || 'INR',
          transactionNote: fields.transactionNote,
          fullUri: fields.upiUri,
          mode: fields.otherEncodedInfo.mode,
          isCollectRequest: isCollect,
          merchantCategoryCode: fields.otherEncodedInfo.merchantCategoryCode,
          transactionRef: fields.otherEncodedInfo.transactionRef,
          signaturePresent: Boolean(fields.otherEncodedInfo.signature),
          orgId: fields.otherEncodedInfo.orgId,
          extraEncodedParams: fields.otherEncodedInfo.extraParameters,
        } : undefined,
        linkDetails,
        threatIntelligence: {
          verdict: threatConsolidated.verdict,
          hasReputationData: threatConsolidated.hasReputationData,
          sources: threatConsolidated.sources,
          details: threatConsolidated.evidence,
        },
      },
      whyItMatters,
      whatCouldNotBeVerified,
      whatTheUserShouldDo,
      assessedAtEpochMs: Date.now(),
    };
  }

  /**
   * Process Payment Link Input
   */
  private async processLinkInput(
    url: string,
    registry: ThreatIntelligenceRegistry
  ): Promise<SafeAnalysisResultScreen> {
    const analysis = LinkSecurityAnalyzer.analyzeLink(url);
    const whyItMatters: Array<{ title: string; explanation: string; severity: 'CRITICAL' | 'WARNING' | 'INFORMATIONAL' }> = [];
    const whatCouldNotBeVerified: string[] = [];
    const whatTheUserShouldDo: Array<{ stepNumber: number; action: string; importance: 'MUST_DO' | 'RECOMMENDED' | 'ADVISORY' }> = [];
    let riskLevel: SecurityRiskLevel = 'LOW RISK';

    // 1. Evaluate Suspicious Patterns
    for (const pattern of analysis.suspiciousPatterns) {
      if (pattern.severity === 'CRITICAL') {
        riskLevel = 'HIGH RISK';
        whyItMatters.push({
          title: pattern.title,
          explanation: pattern.description,
          severity: 'CRITICAL',
        });
      } else if (pattern.severity === 'HIGH') {
        if (riskLevel !== 'HIGH RISK') riskLevel = 'HIGH RISK';
        whyItMatters.push({
          title: pattern.title,
          explanation: pattern.description,
          severity: 'CRITICAL',
        });
      } else if (pattern.severity === 'MEDIUM') {
        if (riskLevel === 'LOW RISK') riskLevel = 'MEDIUM RISK';
        whyItMatters.push({
          title: pattern.title,
          explanation: pattern.description,
          severity: 'WARNING',
        });
      }
    }

    // 2. URL Shortener / Redirect
    if (analysis.redirects.isShortener) {
      if (riskLevel === 'LOW RISK') riskLevel = 'MEDIUM RISK';
      whyItMatters.push({
        title: 'Obfuscated Destination via Link Shortener',
        explanation: `Link uses shortener service '${analysis.redirects.shortenerService}'. The ultimate target domain is concealed from initial view.`,
        severity: 'WARNING',
      });
      whatTheUserShouldDo.push({
        stepNumber: whatTheUserShouldDo.length + 1,
        action: 'Do not enter passwords or banking details if this link redirects to an unexpected webpage.',
        importance: 'MUST_DO',
      });
    }

    // 3. Open Redirect Parameters
    if (analysis.redirects.openRedirectParameters.length > 0) {
      whyItMatters.push({
        title: 'Open Redirection Query Parameter Detected',
        explanation: `Query parameter '${analysis.redirects.openRedirectParameters[0].parameterName}' contains an external URL, allowing attackers to route users to malicious sites.`,
        severity: 'WARNING',
      });
    }

    // 4. Threat Intelligence Lookup
    const domainHits = await registry.lookupDomain(analysis.domain);
    const threatConsolidated = registry.consolidateVerdict(domainHits);

    if (threatConsolidated.verdict === 'CONFIRMED_PHISHING' || threatConsolidated.verdict === 'CONFIRMED_MALICIOUS') {
      riskLevel = 'HIGH RISK';
      whyItMatters.push({
        title: 'Domain Matched in Active Cyber Threat Database',
        explanation: threatConsolidated.evidence.join('; '),
        severity: 'CRITICAL',
      });
      whatTheUserShouldDo.push({
        stepNumber: 1,
        action: 'DO NOT open this link. Close any browser tabs that were directed here.',
        importance: 'MUST_DO',
      });
    } else if (threatConsolidated.verdict === 'OFFICIALLY_VERIFIED') {
      whyItMatters.push({
        title: 'Registered Official Banking Digital Infrastructure',
        explanation: 'Destination resolves to an authorized national banking registrar with authentic financial credentials.',
        severity: 'INFORMATIONAL',
      });
    }

    // Actions & Unknowns
    if (riskLevel === 'HIGH RISK') {
      whatTheUserShouldDo.push({
        stepNumber: whatTheUserShouldDo.length + 1,
        action: 'Do NOT download any APK or profile updates suggested by this domain.',
        importance: 'MUST_DO',
      });
      whatTheUserShouldDo.push({
        stepNumber: whatTheUserShouldDo.length + 1,
        action: 'Report the URL to CERT-In (incident@cert-in.org.in) or National Cyber Crime Reporting Portal (1930).',
        importance: 'RECOMMENDED',
      });
    } else {
      whatTheUserShouldDo.push({
        stepNumber: 1,
        action: 'Verify that the browser address bar displays exact domain spelling and a valid HTTPS lock icon.',
        importance: 'RECOMMENDED',
      });
    }

    whatCouldNotBeVerified.push('Dynamic server-side redirection or cloaking executed behind the URL cannot be safely executed on device.');
    whatCouldNotBeVerified.push('Content behind authenticated login pages cannot be inspected without user credentials.');
    if (!threatConsolidated.hasReputationData) {
      whatCouldNotBeVerified.push('Domain has no incident history in threat registry. (Absence of reports does not guarantee safety for newly registered domains).');
    }

    return {
      riskLevel,
      riskSummary: riskLevel === 'HIGH RISK'
        ? 'Dangerous payment or phishing link detected. High risk of credential harvesting or malware delivery.'
        : riskLevel === 'MEDIUM RISK'
        ? 'Suspicious link characteristics (shortener / unverified routing). Proceed with caution.'
        : 'Registered or standard URL syntax with no malicious signatures detected.',
      confidence: threatConsolidated.hasReputationData ? 'High (Threat Registry Match)' : 'High (RFC Parser & Pattern Engine)',
      whatWasFound: {
        inputType: 'PAYMENT_LINK',
        rawIdentifier: analysis.rawUrl,
        linkDetails: {
          normalizedUrl: analysis.normalizedUrl,
          domain: analysis.domain,
          subdomain: analysis.subdomain,
          path: analysis.path,
          queryParameters: analysis.queryParameters,
          redirects: {
            isShortener: analysis.redirects.isShortener,
            shortenerService: analysis.redirects.shortenerService,
            openRedirectParameters: analysis.redirects.openRedirectParameters,
          },
          suspiciousPatterns: analysis.suspiciousPatterns.map((p) => ({
            code: p.code,
            severity: p.severity,
            title: p.title,
            detectedToken: p.detectedToken,
          })),
        },
        threatIntelligence: {
          verdict: threatConsolidated.verdict,
          hasReputationData: threatConsolidated.hasReputationData,
          sources: threatConsolidated.sources,
          details: threatConsolidated.evidence,
        },
      },
      whyItMatters,
      whatCouldNotBeVerified,
      whatTheUserShouldDo,
      assessedAtEpochMs: Date.now(),
    };
  }

  /**
   * Process Screenshot OCR & Payment Text Input
   */
  private async processScreenshotTextInput(
    text: string,
    registry: ThreatIntelligenceRegistry
  ): Promise<SafeAnalysisResultScreen> {
    const data: ScreenshotExtractedData = ScreenshotSecurityAnalyzer.analyzeScreenshotText(text);
    const whyItMatters: Array<{ title: string; explanation: string; severity: 'CRITICAL' | 'WARNING' | 'INFORMATIONAL' }> = [];
    const whatCouldNotBeVerified: string[] = [];
    const whatTheUserShouldDo: Array<{ stepNumber: number; action: string; importance: 'MUST_DO' | 'RECOMMENDED' | 'ADVISORY' }> = [];
    let riskLevel: SecurityRiskLevel = 'LOW RISK';

    // 1. Forgery Indicators
    if (data.forgeryIndicators.length > 0) {
      riskLevel = 'HIGH RISK';
      for (const forg of data.forgeryIndicators) {
        whyItMatters.push({
          title: 'Counterfeit Receipt / Forgery Indicator',
          explanation: forg,
          severity: 'CRITICAL',
        });
      }
      whatTheUserShouldDo.push({
        stepNumber: 1,
        action: 'Check your actual bank balance in your official banking app. Do not trust screenshots sent by counterparties.',
        importance: 'MUST_DO',
      });
    }

    // 2. Status Collect Request Warning
    if (data.paymentDetails.transactionStatus === 'COLLECT_REQUEST') {
      riskLevel = 'HIGH RISK';
      whyItMatters.push({
        title: 'Incoming Collect Request Vector',
        explanation: 'Screenshot indicates an incoming collect request requiring authorization, not an inflow of funds.',
        severity: 'CRITICAL',
      });
      whatTheUserShouldDo.push({
        stepNumber: whatTheUserShouldDo.length + 1,
        action: 'Decline the request. Receiving money on UPI never requires a PIN.',
        importance: 'MUST_DO',
      });
    }

    // 3. VPA Threat Lookup if extracted
    let threatConsolidated = {
      verdict: 'NOT_FOUND_OR_UNRATED' as ThreatVerdict,
      hasReputationData: false,
      evidence: [] as string[],
      sources: [] as string[],
    };

    if (data.paymentDetails.counterpartyVpa) {
      const vpaHits = await registry.lookupVpa(data.paymentDetails.counterpartyVpa);
      threatConsolidated = registry.consolidateVerdict(vpaHits);

      if (threatConsolidated.verdict === 'CONFIRMED_MALICIOUS') {
        riskLevel = 'HIGH RISK';
        whyItMatters.push({
          title: 'Beneficiary Flagged in Cyber Incident Database',
          explanation: threatConsolidated.evidence.join('; '),
          severity: 'CRITICAL',
        });
      }
    }

    // 4. Redacted PII Note
    if (data.redactedPiiCount > 0) {
      whyItMatters.push({
        title: 'Privacy Shield: PII Auto-Redacted',
        explanation: `${data.redactedPiiCount} sensitive credential patterns (Aadhaar, PAN, PIN, or Card details) were masked on-device to prevent credential leakage.`,
        severity: 'INFORMATIONAL',
      });
    }

    whatCouldNotBeVerified.push('Visual pixels can be altered by photo editing tools; transaction must be verified on bank statement.');
    whatCouldNotBeVerified.push('UTR reference number validity requires inter-bank clearing verification.');
    if (!threatConsolidated.hasReputationData) {
      whatCouldNotBeVerified.push('No incident reports found in threat registry. (Absence of reports does not verify payee legitimacy).');
    }

    if (riskLevel !== 'HIGH RISK') {
      whatTheUserShouldDo.push({
        stepNumber: 1,
        action: 'Log in to your official net-banking or mobile banking app to confirm actual credit in your statement.',
        importance: 'MUST_DO',
      });
    }

    return {
      riskLevel,
      riskSummary: riskLevel === 'HIGH RISK'
        ? 'High risk: Screenshot exhibits signatures of fake receipt generation or deceptive collect request.'
        : 'Payment screenshot analyzed with PII redacted; verify credit directly inside banking app.',
      confidence: 'High (Receipt Forensic Syntax & Threat Lookup)',
      whatWasFound: {
        inputType: 'SCREENSHOT_OCR',
        rawIdentifier: data.paymentDetails.counterpartyVpa || 'Screenshot Data',
        screenshotDetails: {
          ocrApplied: data.ocrApplied,
          ocrReason: data.ocrReason,
          redactedPiiCount: data.redactedPiiCount,
          paymentDetails: {
            counterpartyVpa: data.paymentDetails.counterpartyVpa,
            counterpartyName: data.paymentDetails.counterpartyName,
            amount: data.paymentDetails.amount,
            transactionReference: data.paymentDetails.transactionReference,
            transactionStatus: data.paymentDetails.transactionStatus,
            detectedApp: data.paymentDetails.detectedApp,
          },
          forgeryIndicators: data.forgeryIndicators,
        },
        threatIntelligence: {
          verdict: threatConsolidated.verdict,
          hasReputationData: threatConsolidated.hasReputationData,
          sources: threatConsolidated.sources,
          details: threatConsolidated.evidence,
        },
      },
      whyItMatters,
      whatCouldNotBeVerified,
      whatTheUserShouldDo,
      assessedAtEpochMs: Date.now(),
    };
  }
}

// Global Singleton Pipeline
export const globalSafeAnalysisPipeline = new SafeAnalysisPipeline();
