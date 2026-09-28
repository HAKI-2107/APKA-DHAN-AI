import {
  InvestmentScamInput,
  InvestmentScamAssessment,
  DetectedSignal,
  ScamSignalCategory,
  SignalSeverity,
  RegulatoryVerificationResult,
} from './types';
import {
  RegulatoryVerificationAdapter,
  globalRegulatoryAdapter,
} from './regulatoryAdapter';
import { globalAlertEngine } from '../notifications/AlertEngine';

/**
 * APKA DHAN AI - INVESTMENT SCAM DETECTOR
 * 
 * Multi-layer deterministic heuristics, regulatory registry checks,
 * and evidence-backed risk evaluation for investment offers across:
 * - Advertisements, WhatsApp/Telegram groups, PDFs, Screenshots, Websites
 * 
 * CORE CONSTITUTION:
 * - Do not accuse a person or company of fraud based only on weak evidence.
 * - Do not fabricate registrations or regulatory status.
 * - Always separate concrete evidence from unknowns.
 */
export class InvestmentScamDetector {
  private regulatoryAdapter: RegulatoryVerificationAdapter;

  constructor(regulatoryAdapter: RegulatoryVerificationAdapter = globalRegulatoryAdapter) {
    this.regulatoryAdapter = regulatoryAdapter;
  }

  /**
   * Primary analysis pipeline
   */
  async analyze(input: InvestmentScamInput): Promise<InvestmentScamAssessment> {
    const rawText = input.text || '';
    const ocrText = input.ocrExtractedText || '';
    const combinedText = `${rawText} ${ocrText}`.trim();
    const lower = combinedText.toLowerCase();

    const signals: DetectedSignal[] = [];
    const evidence: string[] = [];
    const unknowns: string[] = [];
    const verificationSteps: string[] = [];
    const sourceRequirements: string[] = [];
    const regulatoryResults: RegulatoryVerificationResult[] = [];

    // ----------------------------------------------------
    // SIGNAL 1: GUARANTEED RETURNS
    // Under SEBI regulations, guaranteed/fixed returns on market securities are strictly illegal
    // ----------------------------------------------------
    const guaranteedPatterns = [
      /\b(?:guaranteed|assured|fixed|100%\s*safe|zero\s*risk|no\s*risk|risk[\s-]free)\s*(?:return|profit|income|gain|yield)/i,
      /\b(?:return|profit|gain|money|payout|income)\s*[\w\s]{0,20}\s*(?:guarantee|guaranteed|assured|fixed|100%\s*safe)/i,
      /\b(?:capital\s*guarantee|principal\s*protected\s*100%)\b/i,
      /\b(?:guaranteed\s*payout|guaranteed\s*daily\s*income)\b/i,
      /\b(?:double|multiply|grow)\s*[\w\s]{0,25}\b(?:guaranteed|assured)\b/i,
    ];

    for (const pat of guaranteedPatterns) {
      const match = combinedText.match(pat);
      if (match) {
        signals.push({
          code: 'GUARANTEED_RETURNS',
          name: 'Illegal Guaranteed Return Claim',
          category: 'FINANCIAL_PROMISE',
          severity: 'CRITICAL',
          description: 'Promising assured, fixed, or risk-free returns on securities/crypto investments is prohibited under SEBI regulations.',
          matchedText: match[0],
          weight: 35,
          confidence: 'HIGH',
        });
        evidence.push(`Explicit claim of guaranteed/risk-free returns: "${match[0]}"`);
        verificationSteps.push('SEBI mandate: Legitimate capital market investments always carry market risk; no registered intermediary can guarantee returns.');
        sourceRequirements.push('Official SEBI Scheme Information Document (SID) and Key Information Memorandum (KIM) disclosing full statutory risk factors.');
        break;
      }
    }

    // ----------------------------------------------------
    // SIGNAL 2: UNREALISTIC RETURNS
    // Astronomical or unsustainable yield (e.g. 5% daily, double money in 7 days)
    // ----------------------------------------------------
    const unrealisticPatterns = [
      /\b(?:daily|per\s*day)\s*(?:return|profit|income)\s*(?:of\s*)?(?:[2-9]|\d{2,})%/i,
      /\b(?:[2-9]|\d{2,})%\s*(?:daily|every\s*day|per\s*day)/i,
      /\b(?:double|2x|3x|5x|10x|50x|100x)\s*(?:your\s*)?(?:money|investment|capital|funds|returns?)\b/i,
      /\b(?:turn\s*₹?\d+\s*into\s*₹?\d+)\b/i,
      /\b(?:monthly\s*return\s*of\s*(?:[2-9]\d|\d{3,})%)/i,
    ];

    for (const pat of unrealisticPatterns) {
      const match = combinedText.match(pat);
      if (match) {
        signals.push({
          code: 'UNREALISTIC_RETURNS',
          name: 'Unrealistic Astronomical Yield',
          category: 'FINANCIAL_PROMISE',
          severity: 'CRITICAL',
          description: 'Offers daily compounding profits or fund multiplication characteristic of Ponzi / HYIP fraud.',
          matchedText: match[0],
          weight: 30,
          confidence: 'HIGH',
        });
        evidence.push(`Astronomical return claim: "${match[0]}"`);
        verificationSteps.push('Calculate annualized rate: 2% daily exceeds 700% annual compounded return, which is mathematically unsustainable in formal banking.');
        sourceRequirements.push('Audited annual financial statements and statutory balance sheet filed with the Ministry of Corporate Affairs (MCA).');
        break;
      }
    }

    // ----------------------------------------------------
    // SIGNAL 3: URGENCY & PRESSURE TACTICS
    // Artificial scarcity to bypass user rational scrutiny
    // ----------------------------------------------------
    const urgencyPatterns = [
      /\b(?:only|hurry)\s*(?:[1-9]\s*slots?|[1-9]\s*seats?|limited\s*slots?)\s*(?:left|remaining)\b/i,
      /\b(?:expires|closes|ending)\s*(?:in\s*(?:\d{1,2}\s*(?:minutes?|hours?|mins?))|today\s*midnight)\b/i,
      /\b(?:instant\s*allotment\s*within|transfer\s*immediately\s*or\s*forfeit)\b/i,
      /\b(?:golden\s*opportunity|act\s*now\s*before\s*it\s*is\s*too\s*late)\b/i,
    ];

    for (const pat of urgencyPatterns) {
      const match = combinedText.match(pat);
      if (match) {
        signals.push({
          code: 'URGENCY_PRESSURE',
          name: 'Artificial Urgency & Coercion',
          category: 'PRESSURE_TACTIC',
          severity: 'MEDIUM',
          description: 'Pressures user with false scarcity or tight countdowns to prevent independent due diligence.',
          matchedText: match[0],
          weight: 15,
          confidence: 'MEDIUM',
        });
        evidence.push(`Urgency coercion phrasing detected: "${match[0]}"`);
        verificationSteps.push('Resist time-pressure. Genuine institutional fund allotments follow standardized regulatory cut-off schedules.');
        break;
      }
    }

    // ----------------------------------------------------
    // SIGNAL 4: IMPERSONATION OF REPUTED ENTITIES
    // Misusing names of trusted corporate brands or fund managers
    // ----------------------------------------------------
    const brandNames = [
      'blackrock', 'goldman sachs', 'tata investment', 'hdfc mutual',
      'reliance wealth', 'zerodha vip', 'groww institutional', 'rakesh jhunjhunwala',
      'motilal oswal', 'icici prudential', 'morgan stanley', 'sebi approved group'
    ];

    for (const brand of brandNames) {
      if (lower.includes(brand)) {
        // Check if communication channel or domain matches official domain
        const isOfficialDomain = (input.websiteUrl || '').includes(brand.replace(/\s+/g, ''));
        if (!isOfficialDomain) {
          signals.push({
            code: 'BRAND_IMPERSONATION',
            name: `Potential Brand Impersonation (${brand.toUpperCase()})`,
            category: 'IDENTITY_IMPERSONATION',
            severity: 'HIGH',
            description: `Invokes the name of "${brand.toUpperCase()}" without verifiable corporate communication credentials.`,
            matchedText: brand,
            weight: 25,
            confidence: 'MEDIUM',
          });
          evidence.push(`Mention of major institutional brand: "${brand}" in non-official communication channel.`);
          verificationSteps.push(`Cross-verify directly with ${brand.toUpperCase()}'s official public website and verified customer service.`);
          sourceRequirements.push(`Official engagement letter signed from official corporate domain (@${brand.split(' ')[0]}.com).`);
          break;
        }
      }
    }

    // ----------------------------------------------------
    // SIGNAL 5: FAKE AUTHORITY & REGULATORY CLAIMS
    // Misleading claims of SEBI approval for WhatsApp/Telegram groups
    // ----------------------------------------------------
    const fakeAuthorityPatterns = [
      /\b(?:sebi|rbi|gov\.?t)\s*(?:approved|certified|authorized|licensed)\s*(?:whatsapp|telegram|group|channel|club|scheme)\b/i,
      /\b(?:100%\s*government\s*approved|ministry\s*of\s*finance\s*certified)\b/i,
      /\b(?:sebi\s*registered\s*vip\s*trading)\b/i,
      /\b(?:certified\s*by\s*sebi\s*for\s*guaranteed\s*profit)\b/i,
    ];

    for (const pat of fakeAuthorityPatterns) {
      const match = combinedText.match(pat);
      if (match) {
        signals.push({
          code: 'FAKE_AUTHORITY_CLAIMS',
          name: 'Fabricated Regulatory Authority Endorsement',
          category: 'REGULATORY_AUTHORITY',
          severity: 'CRITICAL',
          description: 'SEBI and RBI do not endorse, license, or approve social media groups, channels, or guaranteed schemes.',
          matchedText: match[0],
          weight: 35,
          confidence: 'HIGH',
        });
        evidence.push(`Fabricated regulatory endorsement: "${match[0]}"`);
        verificationSteps.push('Official Advisory: SEBI explicitly cautions investors that it never certifies or endorses social media trading groups.');
        sourceRequirements.push('Direct registration verification certificate downloaded directly from the official SEBI website (www.sebi.gov.in).');
        break;
      }
    }

    // ----------------------------------------------------
    // SIGNAL 6: SUSPICIOUS CONTACT CHANNELS
    // Exclusive operations via Telegram VIP, WhatsApp group, or Signal
    // ----------------------------------------------------
    if (
      input.sourceType === 'TELEGRAM_CHANNEL' ||
      input.sourceType === 'WHATSAPP_MESSAGE' ||
      lower.includes('join telegram') ||
      lower.includes('vip channel') ||
      lower.includes('t.me/') ||
      lower.includes('whatsapp group') ||
      lower.includes('chat.whatsapp.com')
    ) {
      signals.push({
        code: 'SUSPICIOUS_CONTACT_CHANNELS',
        name: 'Informal / Anonymous Social Media Channel',
        category: 'COMMUNICATION_CHANNEL',
        severity: 'HIGH',
        description: 'Soliciting investments exclusively over anonymous messaging platforms prevents accountability and legal recourse.',
        matchedText: input.sourceType,
        weight: 20,
        confidence: 'HIGH',
      });
      evidence.push(`Investment solicited via informal channel: ${input.sourceType} / Telegram / WhatsApp.`);
      verificationSteps.push('Registered brokers communicate via verified official corporate email domains and registered trading terminals.');
      sourceRequirements.push('Corporate physical office address and landline phone listed on SEBI public records.');
    }

    // ----------------------------------------------------
    // SIGNAL 7: REQUESTS FOR PERSONAL PAYMENT
    // Directing funds to personal individual savings accounts, UPI, or Crypto
    // ----------------------------------------------------
    const personalPaymentPatterns = [
      /\b(?:transfer\s*to|pay\s*to|send\s*money\s*to)\s*(?:savings?\s*a\/c|personal\s*account|current\s*account\s*of)\b/i,
      /\b(?:usdt|trc20|erc20|binance\s*pay|crypto\s*wallet)\b/i,
      /\b(?:pay\s*to\s*upi\s*id|gpay\s*to|phonepe\s*to)\s*[a-zA-Z0-9.\-_]+@[a-zA-Z]+/i,
      /\b(?:individual\s*name\s*bank\s*account)\b/i,
    ];

    let hasPersonalPayment = false;
    for (const pat of personalPaymentPatterns) {
      const match = combinedText.match(pat);
      if (match) {
        hasPersonalPayment = true;
        signals.push({
          code: 'REQUESTS_FOR_PERSONAL_PAYMENT',
          name: 'Payment to Personal Account / Crypto',
          category: 'PAYMENT_ROUTING',
          severity: 'CRITICAL',
          description: 'Demanding funds into individual savings accounts, personal UPI handles, or crypto wallets bypasses SEBI Clearing Corporations.',
          matchedText: match[0],
          weight: 35,
          confidence: 'HIGH',
        });
        evidence.push(`Routing of funds to personal/unregulated channel: "${match[0]}"`);
        verificationSteps.push('SEBI Rule: Legitimate stock broker payments must only go to the broker’s designated "USCNB" (Upstream Client Non-Broker) client bank account or UPI ASBA.');
        sourceRequirements.push('Bank account confirmation letter proving the recipient account is a designated SEBI Client Bank Account.');
        break;
      }
    }

    if (!hasPersonalPayment && (input.paymentAccountOrVpa || input.upiId)) {
      const vpaOrAcct = input.paymentAccountOrVpa || input.upiId || '';
      if (!vpaOrAcct.toLowerCase().includes('broker') && !vpaOrAcct.toLowerCase().includes('clearing')) {
        unknowns.push(`Recipient payment identifier "${vpaOrAcct}" cannot be verified as an authorized client funds escrow account without clearing proof.`);
      }
    }

    // ----------------------------------------------------
    // SIGNAL 8: UNVERIFIABLE BROKER / ADVISORY CLAIMS
    // Claiming SEBI registration without verifiable credentials
    // ----------------------------------------------------
    const claimedReg = input.claimedRegistrationNo || this.extractRegistrationNumber(combinedText);
    const claimedEntity = input.claimedEntityName || this.extractEntityName(combinedText);

    if (claimedReg || claimedEntity || lower.includes('sebi registered') || lower.includes('research analyst')) {
      const regQuery = {
        registrationNumber: claimedReg || undefined,
        entityName: claimedEntity || undefined,
        intermediaryType: 'STOCK_BROKER' as const,
        claimedAuthority: 'SEBI' as const,
      };

      const regResult = await this.regulatoryAdapter.verifyEntity(regQuery);
      regulatoryResults.push(regResult);

      if (regResult.status === 'VERIFIED_OFFICIAL_RECORD') {
        evidence.push(`Regulatory Match: ${regResult.notes}`);
      } else if (regResult.status === 'DISCIPLINARY_ACTION_OR_DEBARRED') {
        signals.push({
          code: 'REGULATORY_CAUTION_LISTED',
          name: 'Entity on SEBI / RBI Debarred Caution List',
          category: 'REGULATORY_AUTHORITY',
          severity: 'CRITICAL',
          description: regResult.notes,
          weight: 40,
          confidence: 'HIGH',
        });
        evidence.push(`Regulatory Warning: ${regResult.notes}`);
      } else if (regResult.status === 'SUSPICIOUS_FORMAT_OR_EXPIRED') {
        signals.push({
          code: 'SUSPICIOUS_REGISTRATION_NUMBER',
          name: 'Non-Conforming SEBI Registration Format',
          category: 'REGULATORY_AUTHORITY',
          severity: 'HIGH',
          description: regResult.notes,
          weight: 25,
          confidence: 'HIGH',
        });
        evidence.push(`Invalid registration format: "${claimedReg}"`);
      } else {
        // NOT_FOUND_OR_UNVERIFIED
        signals.push({
          code: 'UNVERIFIABLE_BROKER_CLAIMS',
          name: 'Unverified Regulatory Standing in Authoritative Registry',
          category: 'REGULATORY_AUTHORITY',
          severity: 'HIGH',
          description: regResult.notes,
          weight: 20,
          confidence: 'MEDIUM',
        });
        unknowns.push(`Claimed registration "${claimedReg || claimedEntity || 'unspecified'}" has no verified local record. Query on SEBI SCORES portal is required.`);
        sourceRequirements.push('Valid SEBI Registration Certificate with matching entity name and registered office address.');
      }
    } else {
      unknowns.push('No SEBI registration number (INH/INA/INZ) was disclosed in the offer communication.');
      sourceRequirements.push('Mandatory statutory disclosure of SEBI Registration Number, BASL Membership ID, and Compliance Officer contact details.');
    }

    // ----------------------------------------------------
    // SIGNAL 9: FAKE INVESTMENT DASHBOARDS & VIRTUAL SIMULATORS
    // Fake app UI showing huge paper profits
    // ----------------------------------------------------
    const fakeDashboardPatterns = [
      /\b(?:virtual\s*trading\s*account|vip\s*allotment\s*pool|institutional\s*sub-account)\b/i,
      /\b(?:view\s*your\s*balance\s*in\s*app|custom\s*trading\s*terminal)\b/i,
      /\b(?:vip\s*institutional\s*account\s*login)\b/i,
    ];

    for (const pat of fakeDashboardPatterns) {
      const match = combinedText.match(pat);
      if (match) {
        signals.push({
          code: 'FAKE_INVESTMENT_DASHBOARD',
          name: 'Simulated / Unregulated Trading Interface',
          category: 'INFRASTRUCTURE_MALWARE',
          severity: 'HIGH',
          description: 'Directs users to unverified private trading dashboards displaying simulated profits to encourage additional capital deposits.',
          matchedText: match[0],
          weight: 25,
          confidence: 'MEDIUM',
        });
        evidence.push(`Reference to private/unregulated trading interface: "${match[0]}"`);
        verificationSteps.push('Confirm that trades execute on recognized stock exchanges (NSE/BSE) and verify trade confirmations via Exchange SMS/Email.');
        sourceRequirements.push('Direct Exchange Trade Confirmation (Trade ID) verifiable on NSE/BSE investor verification portal.');
        break;
      }
    }

    // ----------------------------------------------------
    // SIGNAL 10: SUSPICIOUS URLS & DISPOSABLE TLDS
    // ----------------------------------------------------
    const suspiciousTlds = ['.top', '.xyz', '.cfd', '.icu', '.click', '.buzz', '.vip', '.rest', '.fit', '.sbs', '.link', '.work'];
    const detectedUrls = input.websiteUrl ? [input.websiteUrl] : this.extractUrls(combinedText);

    for (const url of detectedUrls) {
      const lowerUrl = url.toLowerCase();
      const matchedTld = suspiciousTlds.find((t) => lowerUrl.includes(t));
      if (matchedTld) {
        signals.push({
          code: 'SUSPICIOUS_URL_TLD',
          name: 'Disposable High-Abuse TLD Domain',
          category: 'INFRASTRUCTURE_MALWARE',
          severity: 'HIGH',
          description: `Uses disposable TLD "${matchedTld}" frequently deployed for fast-flux phishing and investment scams.`,
          matchedText: url,
          weight: 25,
          confidence: 'HIGH',
        });
        evidence.push(`Domain contains high-risk TLD: "${url}"`);
      }

      if (lowerUrl.includes('bit.ly') || lowerUrl.includes('tinyurl') || lowerUrl.includes('t.me/')) {
        signals.push({
          code: 'OBFUSCATED_URL',
          name: 'Shortened / Obfuscated Link',
          category: 'INFRASTRUCTURE_MALWARE',
          severity: 'MEDIUM',
          description: 'Hides actual destination portal behind redirector service.',
          matchedText: url,
          weight: 15,
          confidence: 'HIGH',
        });
        evidence.push(`Obfuscated link: "${url}"`);
      }
    }

    // ----------------------------------------------------
    // SIGNAL 11: FAKE CUSTOMER SUPPORT / MOBILE NUMBERS
    // ----------------------------------------------------
    const fakeSupportPatterns = [
      /\b(?:customer\s*care|helpline|support\s*desk)\s*:\s*(?:\+?91[\s-]?)?[6-9]\d{9}\b/i,
      /\b(?:contact\s*admin\s*on\s*whatsapp)\b/i,
      /\b(?:official\s*support\s*on\s*telegram)\b/i,
    ];

    for (const pat of fakeSupportPatterns) {
      const match = combinedText.match(pat);
      if (match) {
        signals.push({
          code: 'FAKE_CUSTOMER_SUPPORT',
          name: 'Unofficial Support Channel / Mobile Contact',
          category: 'COMMUNICATION_CHANNEL',
          severity: 'MEDIUM',
          description: 'Financial institutions operate registered toll-free numbers and corporate web desks, not personal mobile/Telegram admin handles.',
          matchedText: match[0],
          weight: 15,
          confidence: 'HIGH',
        });
        evidence.push(`Non-institutional support channel: "${match[0]}"`);
        break;
      }
    }

    // ----------------------------------------------------
    // SIGNAL 12: PRESSURE TO TRANSFER FUNDS / WITHDRAWAL CHARGES
    // Demanding advance fees before releasing supposed profits
    // ----------------------------------------------------
    const withdrawalFeePatterns = [
      /\b(?:pay\s*(?:tax|gst|processing\s*fee|release\s*charge|commission|margin))\s*(?:to\s*withdraw|before\s*withdrawal|to\s*release\s*funds)\b/i,
      /\b(?:account\s*frozen|deposit\s*more\s*to\s*unfreeze|unfreeze\s*fee)\b/i,
      /\b(?:18%\s*gst\s*advance|tds\s*deposit\s*required)\b/i,
    ];

    for (const pat of withdrawalFeePatterns) {
      const match = combinedText.match(pat);
      if (match) {
        signals.push({
          code: 'WITHDRAWAL_EXTORTION_FEE',
          name: 'Advance Fee Demanded for Fund Release',
          category: 'PAYMENT_ROUTING',
          severity: 'CRITICAL',
          description: 'Demanding upfront payments to "clear taxes", "release frozen funds", or "pay GST" is classic recovery / advance-fee fraud.',
          matchedText: match[0],
          weight: 40,
          confidence: 'HIGH',
        });
        evidence.push(`Advance withdrawal fee demand: "${match[0]}"`);
        verificationSteps.push('Under Indian Tax Law, TDS is deducted at source from profits; legitimate brokers never ask you to pay advance tax separately to an individual account.');
        sourceRequirements.push('Official Form 16A or Form 26AS reflection of TDS deducted.');
        break;
      }
    }

    // ----------------------------------------------------
    // SIGNAL 13: REQUESTS TO INSTALL UNKNOWN APPLICATIONS
    // APK downloads or remote desktop tools (AnyDesk, TeamViewer)
    // ----------------------------------------------------
    const malwarePatterns = [
      /\b(?:download\s*our\s*app\s*from\s*link|\.apk\b|install\s*apk|direct\s*download\s*app)\b/i,
      /\b(?:anydesk|teamviewer|quicksupport|rustdesk|screen\s*share)\b/i,
    ];

    for (const pat of malwarePatterns) {
      const match = combinedText.match(pat);
      if (match) {
        signals.push({
          code: 'MALICIOUS_APP_INSTALL_REQUEST',
          name: 'Unverified APK / Remote Desktop Tool Request',
          category: 'INFRASTRUCTURE_MALWARE',
          severity: 'CRITICAL',
          description: 'Instructing users to install unverified APK files or remote desktop screen-sharing tools enables device takeover.',
          matchedText: match[0],
          weight: 35,
          confidence: 'HIGH',
        });
        evidence.push(`Prompt to install unverified application / remote tool: "${match[0]}"`);
        verificationSteps.push('Never install banking or investment applications outside the official Google Play Store or Apple App Store.');
        sourceRequirements.push('Official Play Store listing with verified developer name matching the regulated entity.');
        break;
      }
    }

    // ----------------------------------------------------
    // SYNTHESIZE RISK LEVEL & EVIDENTIARY THRESHOLD
    // Constitutional rule: "Do not accuse a person or company of fraud based only on weak evidence."
    // ----------------------------------------------------
    const criticalCount = signals.filter((s) => s.severity === 'CRITICAL').length;
    const highCount = signals.filter((s) => s.severity === 'HIGH').length;
    const totalScore = signals.reduce((acc, s) => acc + s.weight, 0);

    let riskLevel: 'LOW RISK' | 'MEDIUM RISK' | 'HIGH RISK' | 'UNKNOWN / UNVERIFIED' = 'LOW RISK';
    let confidence: 'HIGH' | 'MEDIUM' | 'LOW' = 'MEDIUM';
    let summaryRationale = '';

    // If verified by official registry with no critical red flags
    const hasOfficialVerifiedBroker = regulatoryResults.some(
      (r) => r.status === 'VERIFIED_OFFICIAL_RECORD'
    );

    if (criticalCount >= 2 || (criticalCount >= 1 && highCount >= 1) || totalScore >= 55) {
      riskLevel = 'HIGH RISK';
      confidence = 'HIGH';
      summaryRationale = `High probability of investment deception detected: triggered ${signals.length} distinct warning signals including ${criticalCount} critical violations (e.g. ${signals
        .filter((s) => s.severity === 'CRITICAL')
        .map((s) => s.name)
        .join(', ')}).`;
    } else if (criticalCount === 1 || highCount >= 2 || totalScore >= 30) {
      riskLevel = 'MEDIUM RISK';
      confidence = 'HIGH';
      summaryRationale = `Suspicious financial solicitation indicators identified: triggered ${signals.length} risk signals. Requires independent third-party regulatory verification before committing any funds.`;
    } else if (signals.length === 1 && signals[0].severity !== 'CRITICAL') {
      // WEAK EVIDENCE: Do NOT accuse of fraud!
      riskLevel = 'UNKNOWN / UNVERIFIED';
      confidence = 'LOW';
      summaryRationale = `Isolated non-critical observation (${signals[0].name}). In accordance with strict evidentiary standards, fraud cannot be concluded on weak or isolated signals alone. Complete independent regulatory check before proceeding.`;
      unknowns.push('Evidence is currently insufficient to determine whether this communication is fraudulent or legitimate marketing.');
    } else if (hasOfficialVerifiedBroker && criticalCount === 0) {
      riskLevel = 'LOW RISK';
      confidence = 'HIGH';
      summaryRationale = 'Intermediary corresponds with an officially registered SEBI market entity and communication does not exhibit prohibited guarantees or personal fund diversion.';
    } else {
      riskLevel = signals.length === 0 ? 'LOW RISK' : 'UNKNOWN / UNVERIFIED';
      confidence = signals.length === 0 ? 'HIGH' : 'LOW';
      summaryRationale =
        signals.length === 0
          ? 'No overt deceptive signals, illegal return promises, or payment diversion patterns identified in this input.'
          : 'Offer lacks sufficient disclosures for definitive verification.';
    }

    // Default universal verification steps if list is short
    if (verificationSteps.length < 3) {
      verificationSteps.push('Verify entity SEBI registration directly on the official SEBI Intermediaries Directory (sebi.gov.in).');
      verificationSteps.push('Ensure fund transfers occur strictly via UPI ASBA or registered broker client accounts, never personal accounts.');
      verificationSteps.push('Check the National Cyber Crime Reporting Portal (cybercrime.gov.in) for active complaints.');
    }

    // Default universal source requirements if list is short
    if (sourceRequirements.length < 3) {
      sourceRequirements.push('Official SEBI Registration Certificate Number (INH / INA / INZ format).');
      sourceRequirements.push('Audited bank account proof showing account title as a designated SEBI Client Bank Account.');
      sourceRequirements.push('Official SEBI SCORES portal dispute resolution details.');
    }

    const assessmentResult: InvestmentScamAssessment = {
      riskLevel,
      signals,
      evidence,
      verificationSteps,
      sourceRequirements,
      unknowns,
      regulatoryVerification: regulatoryResults,
      confidence,
      assessedAtEpochMs: Date.now(),
      summaryRationale,
    };

    if (riskLevel === 'HIGH RISK') {
      try {
        globalAlertEngine.processEvent({
          id: `inv_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
          type: 'INVESTMENT',
          severity: 'HIGH',
          title: 'Suspicious Investment Scheme Detected',
          summary: summaryRationale || 'Investment offer with high-risk coercive or unverified return claims detected.',
          details: evidence.join('; '),
          source: 'Investment Scam Detector (SEBI / SCORES Heuristics)',
          deepLink: 'apkaDhan://alerts',
          requiresAction: true,
          isRead: false,
          isTest: false,
        });
      } catch (e) {}
    }

    return assessmentResult;
  }

  private extractRegistrationNumber(text: string): string | null {
    const sebiMatch = text.match(/\b(?:INZ|INA|INH|INM|INF|INP)\d{9}\b/i);
    if (sebiMatch) return sebiMatch[0].toUpperCase();
    const amfiMatch = text.match(/\bARN-\d{4,8}\b/i);
    if (amfiMatch) return amfiMatch[0].toUpperCase();
    return null;
  }

  private extractEntityName(text: string): string | null {
    const patterns = [
      /(?:broker|advisor|analyst|company|firm|ltd|limited|services|managed by|offered by)\s*:\s*([a-zA-Z0-9\s&.,]{3,35})/i,
      /\b([A-Z][a-zA-Z0-9&.\s]{2,25}\s+(?:Securities|Broking|Investments|Capital\s+(?:Limited|Ltd|LLP|Services)|Advisory\s+Services|Wealth\s+Management))\b/,
    ];
    for (const pat of patterns) {
      const match = text.match(pat);
      if (match && match[1]) {
        const cleaned = match[1].trim();
        // Discard common phrases that aren't company names
        if (!/^(?:protection|gain|return|growth|loss|appreciation|guarantee)$/i.test(cleaned)) {
          return cleaned;
        }
      }
    }
    return null;
  }

  private extractUrls(text: string): string[] {
    const urlMatches = text.match(/https?:\/\/[^\s/$.?#].[^\s]*/gi) || [];
    const domainMatches = text.match(/\b[a-zA-Z0-9-]+\.(?:top|xyz|cfd|icu|vip|buzz|club|me|in|com)\b/gi) || [];
    return Array.from(new Set([...urlMatches, ...domainMatches]));
  }
}

export const globalInvestmentScamDetector = new InvestmentScamDetector();
