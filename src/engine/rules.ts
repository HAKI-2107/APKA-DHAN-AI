import {
  NormalizedPaymentEntities,
  PaymentSecurityRule,
  RiskSignal,
  ThreatLookupService,
  UserBehavioralProfile,
} from './types';
import {
  AUTHORIZED_NPCI_PSP_HANDLES,
  OFFICIAL_FINANCIAL_DOMAINS,
  SUSPICIOUS_TLDS,
  URL_SHORTENERS,
} from './threatLookup';

/**
 * 1. Suspicious Domain Rule
 * Evaluates high-abuse TLDs (.top, .xyz, .icu) and raw IP hostnames.
 */
export const SuspiciousDomainRule: PaymentSecurityRule = {
  id: 'RULE-01-SUSPICIOUS-DOMAIN',
  name: 'Suspicious Domain Rule',
  category: 'suspicious_domain',
  evaluate(entities: NormalizedPaymentEntities): RiskSignal | null {
    if (!entities.domain) return null;

    const domain = entities.domain.toLowerCase();
    const isIpHost = /^(\d{1,3}\.){3}\d{1,3}$/.test(domain);

    if (isIpHost) {
      return {
        code: 'RAW_IP_PAYMENT_HOST',
        category: 'suspicious_domain',
        title: 'Payment URL Uses Raw IP Address',
        description: `Payment link points directly to a raw numerical IP address (${domain}) instead of a verified, authenticated domain name.`,
        source: '[RULE_SIGNAL]',
        weight: 0.9,
        isCritical: true,
      };
    }

    for (const tld of SUSPICIOUS_TLDS) {
      if (domain.endsWith(tld)) {
        return {
          code: 'HIGH_ABUSE_TLD',
          category: 'suspicious_domain',
          title: `Domain Uses High-Abuse TLD (${tld})`,
          description: `The destination domain ends with "${tld}", a top-level domain frequently associated with disposable phishing campaigns and APK distribution.`,
          source: '[RULE_SIGNAL]',
          weight: 0.85,
          isCritical: true,
        };
      }
    }

    return null;
  },
};

/**
 * 2. Typosquatting Rule
 * Detects financial institution impersonation in domain names or VPA handles.
 */
export const TyposquattingRule: PaymentSecurityRule = {
  id: 'RULE-02-TYPOSQUATTING',
  name: 'Typosquatting & Homoglyph Rule',
  category: 'typosquatting',
  evaluate(entities: NormalizedPaymentEntities): RiskSignal | null {
    const financialBrands = [
      'sbi', 'hdfc', 'icici', 'axis', 'kotak', 'pnb',
      'paytm', 'phonepe', 'zerodha', 'groww', 'angelone'
    ];

    if (entities.domain) {
      const domain = entities.domain.toLowerCase();

      for (const brand of financialBrands) {
        if (domain.includes(brand)) {
          const isOfficial = OFFICIAL_FINANCIAL_DOMAINS.some(
            (official) => domain === official || domain.endsWith(`.${official}`)
          );

          if (!isOfficial) {
            return {
              code: 'DOMAIN_BRAND_TYPOSQUAT',
              category: 'typosquatting',
              title: `Unverified Institution Brand in Domain (${brand.toUpperCase()})`,
              description: `Domain contains the name "${brand}" but does not belong to the institution's official verified web infrastructure.`,
              source: '[RULE_SIGNAL]',
              weight: 0.9,
              isCritical: true,
            };
          }
        }
      }
    }

    return null;
  },
};

/**
 * 3. Unexpected Redirect Rule
 * Flags URL shorteners, obfuscated redirect services, and open redirect parameters.
 */
export const UnexpectedRedirectRule: PaymentSecurityRule = {
  id: 'RULE-03-UNEXPECTED-REDIRECT',
  name: 'Unexpected Redirect & Obfuscation Rule',
  category: 'unexpected_redirect',
  evaluate(entities: NormalizedPaymentEntities): RiskSignal | null {
    if (!entities.domain) return null;

    const domain = entities.domain.toLowerCase();
    for (const shortener of URL_SHORTENERS) {
      if (domain === shortener || domain.endsWith(`.${shortener}`)) {
        return {
          code: 'URL_SHORTENER_OBFUSCATION',
          category: 'unexpected_redirect',
          title: `Obfuscated URL via Redirection Service (${shortener})`,
          description: `The payment link utilizes a URL shortener (${shortener}) that conceals the true target endpoint, commonly employed in phishing vectors.`,
          source: '[RULE_SIGNAL]',
          weight: 0.65,
          isCritical: false,
        };
      }
    }

    if (entities.url) {
      const redirectParams = ['redirect', 'url', 'target', 'dest', 'next', 'goto', 'link'];
      for (const param of redirectParams) {
        if (entities.url.searchParams.has(param)) {
          return {
            code: 'OPEN_REDIRECT_PARAMETER',
            category: 'unexpected_redirect',
            title: 'Open Redirection Parameter Detected',
            description: `URL contains a redirect parameter ("${param}"), which may route authentication or payment requests to an external unverified third-party site.`,
            source: '[RULE_SIGNAL]',
            weight: 0.6,
            isCritical: false,
          };
        }
      }
    }

    return null;
  },
};

/**
 * 4. Unusual Recipient Rule
 * Checks whether the UPI PSP handle is listed in official NPCI consumer registries.
 */
export const UnusualRecipientRule: PaymentSecurityRule = {
  id: 'RULE-04-UNUSUAL-RECIPIENT',
  name: 'Unusual Recipient & Unverified PSP Handle Rule',
  category: 'unusual_recipient',
  evaluate(entities: NormalizedPaymentEntities): RiskSignal | null {
    if (!entities.vpa || !entities.vpaPspHandle) return null;

    const psp = entities.vpaPspHandle.toLowerCase();
    if (!AUTHORIZED_NPCI_PSP_HANDLES.has(psp)) {
      return {
        code: 'UNLISTED_PSP_HANDLE',
        category: 'unusual_recipient',
        title: `Uncommon or Unlisted UPI PSP Handle (@${psp})`,
        description: `The handle prefix "@${psp}" is not present in standard major consumer bank routing directories. Verify recipient bank details independently.`,
        source: '[RULE_SIGNAL] + [NPCI_REGISTRY]',
        weight: 0.55,
        isCritical: false,
      };
    }

    return null;
  },
};

/**
 * 5. Unusual Transaction Amount Rule
 * Evaluates high value surges and typical collect request limits.
 */
export const UnusualTransactionAmountRule: PaymentSecurityRule = {
  id: 'RULE-05-UNUSUAL-AMOUNT',
  name: 'Unusual Transaction Amount Rule',
  category: 'unusual_transaction_amount',
  evaluate(
    entities: NormalizedPaymentEntities,
    _threats: ThreatLookupService,
    profile?: UserBehavioralProfile
  ): RiskSignal | null {
    const amount = entities.amount;
    if (amount === undefined || amount === null || amount <= 0) return null;

    // Collect request round limits often used in social engineering
    if (entities.isCollectRequest && (amount === 49999 || amount === 99999 || amount >= 50000)) {
      return {
        code: 'HIGH_VALUE_COLLECT_REQUEST',
        category: 'unusual_transaction_amount',
        title: `High-Value Collect Request (₹${amount.toLocaleString('en-IN')})`,
        description: `Incoming collect request for ₹${amount.toLocaleString('en-IN')}. Authorizing this will DEBIT your account by this amount. Receiving money never requires payment.`,
        source: '[RULE_SIGNAL]',
        weight: 0.95,
        isCritical: true,
      };
    }

    if (profile && profile.averageDebitAmount > 0) {
      if (amount > profile.averageDebitAmount * 5 && amount > 25000) {
        return {
          code: 'AMOUNT_EXCEEDS_USER_BASELINE',
          category: 'unusual_transaction_amount',
          title: `Amount Deviates from Baseline (5x Historical Average)`,
          description: `The requested amount of ₹${amount.toLocaleString('en-IN')} significantly exceeds your typical average transaction size of ₹${profile.averageDebitAmount.toLocaleString('en-IN')}.`,
          source: '[BEHAVIORAL_BASELINE]',
          weight: 0.7,
          isCritical: false,
        };
      }
    }

    return null;
  },
};

/**
 * 6. Unusual Transaction Time Rule
 * Flags high-risk or collect requests during vulnerable off-hours (01:00 AM - 05:00 AM).
 */
export const UnusualTransactionTimeRule: PaymentSecurityRule = {
  id: 'RULE-06-UNUSUAL-TIME',
  name: 'Unusual Transaction Time Rule',
  category: 'unusual_transaction_time',
  evaluate(entities: NormalizedPaymentEntities): RiskSignal | null {
    const date = new Date(entities.timestampEpochMs);
    const hour = date.getHours();

    // Sensitive off-hours window: 01:00 to 04:59
    if (hour >= 1 && hour < 5) {
      if (entities.isCollectRequest || (entities.amount && entities.amount > 10000)) {
        return {
          code: 'OFF_HOURS_HIGH_RISK_INTERACTION',
          category: 'unusual_transaction_time',
          title: `Off-Hours Financial Interaction (${hour.toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')})`,
          description: `Transaction request was initiated during late-night vulnerable hours (01:00 - 05:00), a common pattern in automated or unauthorized credential exploitation.`,
          source: '[BEHAVIORAL_BASELINE]',
          weight: 0.5,
          isCritical: false,
        };
      }
    }

    return null;
  },
};

/**
 * 7. Repeated Rapid Transactions Rule
 * Detects velocity bursts in user recent transactions.
 */
export const RepeatedRapidTransactionsRule: PaymentSecurityRule = {
  id: 'RULE-07-RAPID-TRANSACTIONS',
  name: 'Repeated Rapid Transactions Velocity Rule',
  category: 'repeated_rapid_transactions',
  evaluate(
    entities: NormalizedPaymentEntities,
    _threats: ThreatLookupService,
    profile?: UserBehavioralProfile
  ): RiskSignal | null {
    if (!profile || !profile.recentTransactions || profile.recentTransactions.length < 3) {
      return null;
    }

    const now = entities.timestampEpochMs;
    const tenMinutesAgo = now - 10 * 60 * 1000;
    const recentBurst = profile.recentTransactions.filter(
      (t) => t.timestampEpochMs >= tenMinutesAgo && t.isDebit
    );

    if (recentBurst.length >= 3) {
      return {
        code: 'HIGH_VELOCITY_TRANSACTION_BURST',
        category: 'repeated_rapid_transactions',
        title: `High Velocity Transaction Surge (${recentBurst.length} debits in 10 mins)`,
        description: `Rapid succession of outgoing payments detected within a 10-minute window, which may indicate automated malware drainage or emotional coercion.`,
        source: '[BEHAVIORAL_BASELINE]',
        weight: 0.8,
        isCritical: true,
      };
    }

    return null;
  },
};

/**
 * 8. Suspicious Wording Rule
 * Detects keywords instructing users to download screen sharing apps or fake KYC APKs.
 */
export const SuspiciousWordingRule: PaymentSecurityRule = {
  id: 'RULE-08-SUSPICIOUS-WORDING',
  name: 'Suspicious Screen-Sharing & APK Wording Rule',
  category: 'suspicious_wording',
  evaluate(entities: NormalizedPaymentEntities): RiskSignal | null {
    const text = entities.rawCombinedText.toLowerCase();

    const remoteTools = ['anydesk', 'teamviewer', 'rustdesk', 'quicksupport', 'screen share', 'screenshare', 'airdroid'];
    const matchedTool = remoteTools.find((tool) => text.includes(tool));
    if (matchedTool) {
      return {
        code: 'SCREEN_SHARING_APP_SOLICITATION',
        category: 'suspicious_wording',
        title: `Solicitation of Remote Desktop Software ("${matchedTool}")`,
        description: `The communication instructs installing remote access software ("${matchedTool}"). Legitimate banks and payment providers NEVER request remote screen-sharing for customer support or KYC.`,
        source: '[RULE_SIGNAL]',
        weight: 0.95,
        isCritical: true,
      };
    }

    if (text.includes('.apk') || text.includes('download our app from link') || text.includes('install apk') || text.includes('download apk')) {
      return {
        code: 'EXTERNAL_APK_DOWNLOAD_INSTRUCTION',
        category: 'suspicious_wording',
        title: 'Instruction to Install Unverified Android Package (.apk)',
        description: 'Communication advises installing an application file (.apk) directly from a link rather than the official Google Play Store, creating high banking trojan risk.',
        source: '[RULE_SIGNAL]',
        weight: 0.9,
        isCritical: true,
      };
    }

    return null;
  },
};

/**
 * 9. Impersonation Indicators Rule
 * Detects institutional keywords in consumer personal handles.
 */
export const ImpersonationIndicatorsRule: PaymentSecurityRule = {
  id: 'RULE-09-IMPERSONATION-INDICATORS',
  name: 'Impersonation Keywords in Handle Rule',
  category: 'impersonation_indicators',
  evaluate(entities: NormalizedPaymentEntities): RiskSignal | null {
    if (!entities.vpaHandlePrefix) return null;

    const prefix = entities.vpaHandlePrefix.toLowerCase();
    const institutionalKeywords = [
      'customercare', 'customer-care', 'helpline', 'refund', 'support-care',
      'nodal', 'cbi', 'police', 'cybercell', 'rbi-verification', 'kyc-desk'
    ];

    const matched = institutionalKeywords.find((kw) => prefix.includes(kw));
    if (matched) {
      return {
        code: 'INSTITUTIONAL_KEYWORD_IMPERSONATION',
        category: 'impersonation_indicators',
        title: `Customer-Care or Authority Impersonation ("${matched}")`,
        description: `UPI handle username contains official support terminology ("${matched}"). Genuine bank helpdesks do not operate on personal consumer UPI handles.`,
        source: '[RULE_SIGNAL]',
        weight: 0.95,
        isCritical: true,
      };
    }

    return null;
  },
};

/**
 * 10. Guaranteed-Return Claims Rule
 * Identifies promises of guaranteed profit, 100% safe, or fixed daily returns.
 */
export const GuaranteedReturnClaimsRule: PaymentSecurityRule = {
  id: 'RULE-10-GUARANTEED-RETURNS',
  name: 'Guaranteed Return & Ponzi Claims Rule',
  category: 'guaranteed_return_claims',
  evaluate(entities: NormalizedPaymentEntities): RiskSignal | null {
    const text = entities.rawCombinedText.toLowerCase();

    const returnPhrases = [
      'guaranteed return', 'guaranteed profit', '100% safe return',
      'zero risk investment', 'double your money', 'daily profit',
      'fixed daily return', 'per day profit', '10% daily', '20% weekly'
    ];

    const matched = returnPhrases.find((p) => text.includes(p));
    if (matched) {
      return {
        code: 'PROMISES_GUARANTEED_MARKET_RETURN',
        category: 'guaranteed_return_claims',
        title: `Guaranteed Profit Claim Detected ("${matched}")`,
        description: `Offering guaranteed returns in equity or financial market transactions is strictly prohibited under SEBI regulations and strongly indicates an unregistered scheme or Ponzi structure.`,
        source: '[RULE_SIGNAL]',
        weight: 0.9,
        isCritical: true,
      };
    }

    return null;
  },
};

/**
 * 11. Urgency & Manipulation Language Rule
 * Detects emotional pressure, disconnection notices, and digital arrest threats.
 */
export const UrgencyManipulationLanguageRule: PaymentSecurityRule = {
  id: 'RULE-11-URGENCY-MANIPULATION',
  name: 'Urgency & Psychological Coercion Rule',
  category: 'urgency_manipulation_language',
  evaluate(entities: NormalizedPaymentEntities): RiskSignal | null {
    const text = entities.rawCombinedText.toLowerCase();

    if (text.includes('digital arrest') || text.includes('placed under arrest') || text.includes('cbi cyber crime arrest')) {
      return {
        code: 'DIGITAL_ARREST_EXTORTION',
        category: 'urgency_manipulation_language',
        title: 'Digital Arrest Coercion Tactic Identified',
        description: 'Impersonates law enforcement threatening "Digital Arrest". No law enforcement agency or court issues arrest warrants or conducts interrogation over WhatsApp/Skype video.',
        source: '[RULE_SIGNAL]',
        weight: 1.0,
        isCritical: true,
      };
    }

    const urgencyPatterns = [
      'within 10 minutes', 'within 15 minutes', 'within 20 minutes',
      'electricity will be disconnected tonight', 'power supply will be disconnected',
      'account will be blocked within', 'immediate legal action'
    ];

    const matched = urgencyPatterns.find((pattern) => text.includes(pattern));
    if (matched) {
      return {
        code: 'URGENCY_MANIPULATION_DETECTED',
        category: 'urgency_manipulation_language',
        title: `Artificial Urgency Coercion ("${matched}")`,
        description: `Contains high-pressure time constraints intended to induce panic and prevent independent verification with your utility or banking provider.`,
        source: '[RULE_SIGNAL]',
        weight: 0.8,
        isCritical: false,
      };
    }

    return null;
  },
};

/**
 * 12. Known Reported Indicator Rule
 * Matches VPA, domain, or phone against verified threat databases.
 */
export const KnownReportedIndicatorRule: PaymentSecurityRule = {
  id: 'RULE-12-KNOWN-REPORTED-INDICATOR',
  name: 'Known Reported Threat Indicator Rule',
  category: 'known_reported_indicator',
  evaluate(entities: NormalizedPaymentEntities, threats: ThreatLookupService): RiskSignal | null {
    if (entities.vpa && threats.isKnownMaliciousVpa(entities.vpa)) {
      return {
        code: 'KNOWN_MALICIOUS_VPA_MATCH',
        category: 'known_reported_indicator',
        title: `VPA Matched in Active Cyber Threat Database (${entities.vpa})`,
        description: `This exact UPI identifier has been verified and cataloged in the threat database in connection with previous financial scam reports.`,
        source: '[THREAT_DATABASE]',
        weight: 1.0,
        isCritical: true,
      };
    }

    if (entities.domain && threats.isKnownPhishingDomain(entities.domain)) {
      return {
        code: 'KNOWN_PHISHING_DOMAIN_MATCH',
        category: 'known_reported_indicator',
        title: `Domain Matched in Active Phishing Registry (${entities.domain})`,
        description: `This web domain is indexed in the threat intelligence registry as a deceptive credential-harvesting or malicious APK endpoint.`,
        source: '[THREAT_DATABASE]',
        weight: 1.0,
        isCritical: true,
      };
    }

    for (const phone of entities.phoneNumbers) {
      if (threats.isReportedPhoneNumber(phone)) {
        return {
          code: 'REPORTED_PHONE_NUMBER_MATCH',
          category: 'known_reported_indicator',
          title: `Contact Number Flagged in Cyber Incident Database`,
          description: `The contact number referenced in this interaction has multiple verified complaints recorded on the cyber crime reporting network.`,
          source: '[THREAT_DATABASE]',
          weight: 0.95,
          isCritical: true,
        };
      }
    }

    return null;
  },
};

export const ALL_INITIAL_RULES: PaymentSecurityRule[] = [
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
];
