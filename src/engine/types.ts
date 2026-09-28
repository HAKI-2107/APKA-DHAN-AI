export type RiskLevel = 'LOW RISK' | 'MEDIUM RISK' | 'HIGH RISK' | 'UNKNOWN / UNVERIFIED';

export type RuleCategory =
  | 'suspicious_domain'
  | 'typosquatting'
  | 'unexpected_redirect'
  | 'unusual_recipient'
  | 'unusual_transaction_amount'
  | 'unusual_transaction_time'
  | 'repeated_rapid_transactions'
  | 'suspicious_wording'
  | 'impersonation_indicators'
  | 'guaranteed_return_claims'
  | 'urgency_manipulation_language'
  | 'known_reported_indicator';

export interface UserTransactionHistoryItem {
  id: string;
  amount: number;
  timestampEpochMs: number;
  counterpartyVpa: string;
  isDebit: boolean;
}

export interface UserBehavioralProfile {
  averageDebitAmount: number;
  maxHistoricalDebitAmount: number;
  knownBeneficiaryVpas: Set<string>;
  recentTransactions: UserTransactionHistoryItem[];
}

export interface RawPaymentInput {
  rawText?: string;
  upiId?: string;
  paymentLink?: string;
  qrPayload?: string;
  transactionScreenshotOcr?: string;
  merchantId?: string;
  parsedTransaction?: {
    amount?: number;
    timestampEpochMs?: number;
    counterpartyVpa?: string;
    counterpartyName?: string;
    isCollectRequest?: boolean;
    referenceId?: string;
  };
  userProfile?: UserBehavioralProfile;
}

export interface NormalizedPaymentEntities {
  vpa?: string;
  vpaHandlePrefix?: string;
  vpaPspHandle?: string;
  url?: URL;
  domain?: string;
  tld?: string;
  rawUrl?: string;
  amount?: number;
  currency?: string;
  isCollectRequest: boolean;
  intentParameters: Record<string, string>;
  phoneNumbers: string[];
  allTextTokens: string[];
  rawCombinedText: string;
  timestampEpochMs: number;
}

export interface RiskSignal {
  code: string;
  category: RuleCategory;
  title: string;
  description: string;
  source: string;
  weight: number; // 0.0 to 1.0
  isCritical: boolean;
}

export interface PaymentSecurityAssessment {
  riskLevel: RiskLevel;
  riskSignals: RiskSignal[];
  evidence: string[];
  confidence: string;
  sources: string[];
  recommendedActions: string[];
  unknownFactors: string[];
  assessedAtEpochMs: number;
  normalizedEntities: {
    vpa?: string;
    domain?: string;
    amount?: number;
    isCollectRequest: boolean;
  };
}

export interface PaymentSecurityRule {
  id: string;
  name: string;
  category: RuleCategory;
  evaluate(
    entities: NormalizedPaymentEntities,
    threats: ThreatLookupService,
    profile?: UserBehavioralProfile
  ): RiskSignal | null;
}

export interface ThreatLookupService {
  isKnownMaliciousVpa(vpa: string): boolean;
  isKnownPhishingDomain(domain: string): boolean;
  isReportedPhoneNumber(phone: string): boolean;
  isReportedIndicatorHash(hash: string): boolean;
}

export interface MLAnalyzer {
  name: string;
  analyze(
    entities: NormalizedPaymentEntities,
    ruleSignals: RiskSignal[]
  ): Promise<RiskSignal[]>;
}
