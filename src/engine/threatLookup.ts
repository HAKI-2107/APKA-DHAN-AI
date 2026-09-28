import { ThreatLookupService } from './types';

export const AUTHORIZED_NPCI_PSP_HANDLES = new Set([
  'okhdfcbank', 'okaxis', 'oksbi', 'okicici', 'ybl', 'ibl', 'axl',
  'paytm', 'upi', 'apl', 'federal', 'barodampay', 'kotak', 'indus',
  'aubank', 'pnb', 'canarabank', 'unionbank', 'idfcbank', 'postbank',
  'jupiteraxis', 'fi', 'slice', 'cred', 'freecharge'
]);

export const OFFICIAL_FINANCIAL_DOMAINS = [
  'sbi.co.in',
  'onlinesbi.sbi',
  'hdfcbank.com',
  'icicibank.com',
  'axisbank.com',
  'kotak.com',
  'pnbindia.in',
  'bankofbaroda.in',
  'canarabank.com',
  'paytm.com',
  'phonepe.com',
  'zerodha.com',
  'groww.in',
  'angelone.in',
  'upstox.com'
];

export const SUSPICIOUS_TLDS = new Set([
  '.top', '.xyz', '.cfd', '.icu', '.click', '.buzz', '.vip', '.rest', '.fit', '.sbs', '.link', '.work'
]);

export const URL_SHORTENERS = new Set([
  'bit.ly', 'tinyurl.com', 'is.gd', 't.me', 'cutt.ly', 'rb.gy', 'wa.me', 'shorturl.at'
]);

export class InMemoryThreatLookupService implements ThreatLookupService {
  private knownMaliciousVpas = new Set<string>([
    'cyber-refund-cell@axl',
    'power-disconnection-bill@paytm',
    'sbi-kyc-officer@ybl',
    'cbi-investigation-desk@okhdfcbank',
    'vip-trading-allotment@ibl',
    'customer-care-refund@okhdfcbank'
  ]);

  private knownPhishingDomains = new Set<string>([
    'sbi-kyc-portal.top',
    'hdfc-rewards-point.xyz',
    'icici-instant-loan.cfd',
    'power-bill-disconnection.icu',
    'paytm-refund-help.click',
    'zerodha-vip-trading.top'
  ]);

  private reportedPhoneNumbers = new Set<string>([
    '9876543210',
    '919876543210',
    '+919876543210',
    '9999988888',
    '9123456780'
  ]);

  private reportedHashes = new Set<string>();

  isKnownMaliciousVpa(vpa: string): boolean {
    return this.knownMaliciousVpas.has(vpa.toLowerCase().trim());
  }

  isKnownPhishingDomain(domain: string): boolean {
    return this.knownPhishingDomains.has(domain.toLowerCase().trim());
  }

  isReportedPhoneNumber(phone: string): boolean {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    return this.reportedPhoneNumbers.has(cleanPhone) || this.reportedPhoneNumbers.has(cleanPhone.slice(-10));
  }

  isReportedIndicatorHash(hash: string): boolean {
    return this.reportedHashes.has(hash.toLowerCase().trim());
  }

  addReportedIndicator(hash: string): void {
    this.reportedHashes.add(hash.toLowerCase().trim());
  }

  addMaliciousVpa(vpa: string): void {
    this.knownMaliciousVpas.add(vpa.toLowerCase().trim());
  }

  addPhishingDomain(domain: string): void {
    this.knownPhishingDomains.add(domain.toLowerCase().trim());
  }
}
