/**
 * APKA DHAN AI - INVESTMENT SCAM DETECTOR TYPES
 * 
 * Formal schemas and contracts for analyzing investment advertisements,
 * WhatsApp/Telegram messages, social media pitches, PDFs, screenshots,
 * websites, broker offers, and suspicious payment instructions.
 * 
 * EVIDENTIARY CONSTITUTION:
 * - Do not accuse a person or company of fraud based only on weak evidence.
 * - Do not fabricate registrations or regulatory status.
 * - Transparently delineate what is verified, what is suspicious, and what remains unknown.
 */

export type InvestmentSourceType =
  | 'WHATSAPP_MESSAGE'
  | 'TELEGRAM_CHANNEL'
  | 'INVESTMENT_ADVERTISEMENT'
  | 'SOCIAL_MEDIA_POST'
  | 'PDF_PROSPECTUS'
  | 'SCREENSHOT_OCR'
  | 'WEBSITE_PORTAL'
  | 'BROKER_OFFER'
  | 'PAYMENT_INSTRUCTION'
  | 'DIRECT_MESSAGE';

export type ScamSignalCategory =
  | 'FINANCIAL_PROMISE'
  | 'PRESSURE_TACTIC'
  | 'IDENTITY_IMPERSONATION'
  | 'REGULATORY_AUTHORITY'
  | 'COMMUNICATION_CHANNEL'
  | 'PAYMENT_ROUTING'
  | 'INFRASTRUCTURE_MALWARE';

export type SignalSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFORMATIONAL';

export interface DetectedSignal {
  code: string;
  name: string;
  category: ScamSignalCategory;
  severity: SignalSeverity;
  description: string;
  matchedText?: string;
  weight: number;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface RegulatoryEntityQuery {
  registrationNumber?: string; // e.g. "INA000012345", "INH000006789", "INZ000123456"
  entityName?: string;         // e.g. "HDFC Securities Limited", "ABC Global Trades"
  intermediaryType: 'STOCK_BROKER' | 'RESEARCH_ANALYST' | 'INVESTMENT_ADVISER' | 'PORTFOLIO_MANAGER' | 'MUTUAL_FUND' | 'OTHER';
  claimedAuthority: 'SEBI' | 'RBI' | 'AMFI' | 'IRDAI' | 'UNKNOWN';
}

export type RegulatoryVerificationStatus =
  | 'VERIFIED_OFFICIAL_RECORD'
  | 'CONFIRMED_UNREGISTERED'
  | 'SUSPICIOUS_FORMAT_OR_EXPIRED'
  | 'DISCIPLINARY_ACTION_OR_DEBARRED'
  | 'NOT_FOUND_OR_UNVERIFIED';

export interface RegulatoryVerificationResult {
  claimedAuthority: string;
  claimedRegistrationNo?: string;
  entityName?: string;
  status: RegulatoryVerificationStatus;
  officialRegistryName: string;
  notes: string;
  verifiedAtEpochMs: number;
  hasFabricatedData: false; // Invariant: We NEVER fabricate registrations
}

export interface InvestmentScamInput {
  text: string;
  sourceType: InvestmentSourceType;
  senderOrChannel?: string;
  claimedEntityName?: string;
  claimedRegistrationNo?: string;
  contactNumber?: string;
  websiteUrl?: string;
  paymentAccountOrVpa?: string;
  upiId?: string;
  attachedFileNames?: string[];
  ocrExtractedText?: string;
}

export interface InvestmentScamAssessment {
  riskLevel: 'LOW RISK' | 'MEDIUM RISK' | 'HIGH RISK' | 'UNKNOWN / UNVERIFIED';
  signals: DetectedSignal[];
  evidence: string[];
  verificationSteps: string[];
  sourceRequirements: string[];
  unknowns: string[];
  regulatoryVerification: RegulatoryVerificationResult[];
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  assessedAtEpochMs: number;
  summaryRationale: string;
}
