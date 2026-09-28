/**
 * APKA DHAN AI - THREAT INTELLIGENCE INTERFACES
 * 
 * Defines standard interfaces for threat intelligence lookups.
 * Designed so real threat-intelligence APIs (e.g. Google Safe Browsing, VirusTotal,
 * Central Fraud Registry, CERT-In, PhishTank, Spamhaus) can seamlessly replace
 * or augment default/mock providers without altering core analysis logic.
 *
 * CRITICAL PRINCIPLE:
 * Do NOT invent reputation results.
 * If a domain or VPA has no recorded incident history in the threat intelligence feed,
 * verdict MUST be NOT_FOUND_OR_UNRATED with hasReputationData: false.
 * Absence of evidence is not evidence of safety.
 */

export type ThreatVerdict = 
  | 'CONFIRMED_MALICIOUS'    // Direct positive match in active cyber incident database
  | 'CONFIRMED_PHISHING'     // Direct match in verified phishing feed
  | 'REPORTED_SUSPICIOUS'    // Reported by multiple users or under triage
  | 'OFFICIALLY_VERIFIED'    // Registered domain/VPA of authorized banking institution
  | 'NOT_FOUND_OR_UNRATED';  // No recorded entries found. NEVER fabricate a safety score!

export interface ThreatIntelligenceResult {
  providerName: string;
  providerType: 'authoritative_registry' | 'commercial_api' | 'community_feed' | 'mock';
  query: string;
  verdict: ThreatVerdict;
  threatCategories: string[]; // e.g. ['phishing', 'fake_kyc', 'collect_fraud', 'malware_apk']
  details: string;
  hasReputationData: boolean;
  reputationScore?: number; // 0 to 100, ONLY provided if reported by a genuine threat API
  lastReportedEpochMs?: number;
  incidentReference?: string;
  sources: string[];
}

export interface ThreatIntelligenceProvider {
  readonly name: string;
  readonly providerId: string;
  readonly version: string;
  readonly isMock: boolean;
  readonly isAuthoritative: boolean;

  lookupUrl(url: string): Promise<ThreatIntelligenceResult>;
  lookupDomain(domain: string): Promise<ThreatIntelligenceResult>;
  lookupVpa(vpa: string): Promise<ThreatIntelligenceResult>;
}
