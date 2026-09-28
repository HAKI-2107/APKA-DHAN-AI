/**
 * APKA DHAN AI - DATA SOURCE & PROVENANCE ABSTRACTION
 * 
 * Formal data models for:
 * - data.gov.in Government Open Data
 * - API Setu Government & Public APIs
 * - Live Market Data (NSE/BSE)
 * - Live Crypto Intelligence
 * - Threat Intelligence & Fraud Repositories
 * 
 * STRICT STATUTORY INVARIANTS:
 * 1. Never fabricate live responses or market prices.
 * 2. Explicitly distinguish HISTORICAL datasets from LIVE feeds.
 * 3. Never claim an unverified or sandbox API is PRODUCTION_CONNECTED without verified credentials.
 */

export type DataFreshnessState =
  | 'LIVE'
  | 'FRESH'
  | 'CURRENT'
  | 'RECENT'
  | 'CACHED'
  | 'DELAYED'
  | 'STALE'
  | 'HISTORICAL'
  | 'SANDBOX'
  | 'AVAILABLE_SANDBOX'
  | 'UNKNOWN'
  | 'UNAVAILABLE'
  | 'ERROR'
  | 'REQUIRES_AUTH'
  | 'REQUIRES_APPROVAL';

export type ApiSetuStatus =
  | 'DISCOVERED'
  | 'AVAILABLE_SANDBOX'
  | 'REQUIRES_APPROVAL'
  | 'PRODUCTION_CONNECTED'
  | 'UNAVAILABLE';

export interface DataProvenance {
  sourceOrganization: string; // e.g. "Ministry of Corporate Affairs", "National Payments Corporation of India"
  datasetTitle: string;
  sourceUrl: string;
  retrievedAt: string;        // ISO 8601 string of when Apka Dhan fetched it
  underlyingDataDate?: string;// Specific date the data was recorded at source (e.g. "2023-11-03" for MCA)
  license?: string;          // e.g. "Government Open Data License - India (GODL)"
  version?: string;
  isHistorical: boolean;
}

export interface DataResponse<T> {
  data: T;
  source: string;
  sourceUrl: string;
  retrievedAt: string;
  providerTimestamp?: string;
  freshness: DataFreshnessState;
  isLive: boolean;
  isCached: boolean;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW' | 'UNVERIFIED';
  status: DataFreshnessState;
  provenance: DataProvenance;
  latencyMs?: number;
  dataAgeSeconds?: number;
  error?: string;
  recordCount?: number;
}

// -------------------------------------------------------------
// Government Data Models
// -------------------------------------------------------------

export interface GovernmentDatasetMetadata {
  datasetId: string;
  resourceId: string;
  datasetTitle: string;
  department: string;
  sourceUrl: string;
  apiUrl?: string;
  license: string;
  updateFrequency: string;
  lastKnownUpdate: string;
  underlyingDataDate: string;
  isApiAvailable: boolean;
  isRealtime: boolean;
  fields: string[];
  notes: string;
}

export interface UpiTransactionStatistic {
  financialYear: string;
  volumeCrores: number;
  valueLakhCrores: number;
  growthPercentageYoy?: number;
  source: string;
}

export interface UpiFraudStatistic {
  financialYear: string;
  reportedFraudCount: number;
  fraudAmountCrores: number;
  fraudToSalesBasisPoints: number;
  source: string;
  notes: string;
}

export interface McaCompanyRecord {
  cin: string;
  companyName: string;
  rocCode: string;
  registrationNumber: string;
  companyCategory: string;
  classOfCompany: string;
  authorizedCapitalInr: number;
  paidUpCapitalInr: number;
  dateOfIncorporation: string;
  registeredOfficeAddress: string;
  listingStatus: 'Listed' | 'Unlisted';
  companyStatus: 'Active' | 'Under Liquidation' | 'Dormant' | 'Strike Off';
  dataDate: string;
  dataSource: string;
}

export interface NcrbCybercrimeStatistic {
  year: number;
  category: string;
  totalReportedCases: number;
  financialFraudPercentage: number;
  chargeSheetRate: number;
  source: string;
}

// -------------------------------------------------------------
// API Setu Models
// -------------------------------------------------------------

export interface ApiSetuDirectoryRecord {
  apiId: string;
  apiName: string;
  publisher: string;
  category: 'Banking' | 'Insurance' | 'Finance' | 'Company Verification' | 'Identity Verification' | 'Public Records';
  documentationUrl: string;
  subscriptionRequirement: string;
  authenticationMethod: 'API_KEY' | 'OAUTH2' | 'MTLS' | 'NONE';
  sandboxAvailable: boolean;
  productionAvailable: boolean;
  approvalRequired: boolean;
  dataType: string;
  dataFreshness: string;
  allowedUse: string;
  status: ApiSetuStatus;
  sampleEndpoint?: string;
}

// -------------------------------------------------------------
// Market & Crypto Live Models
// -------------------------------------------------------------

export interface LiveMarketTick {
  symbol: string;
  exchange: 'NSE' | 'BSE';
  lastPrice: number;
  previousPrice: number;
  change: number;
  changePercent: number;
  volume: number;
  marketTimestamp: string;
  receivedTimestamp: string;
  source: string;
  dataAgeMs: number;
  transportLatencyMs: number;
  status: 'LIVE' | 'DELAYED' | 'STALE' | 'UNAVAILABLE';
}

export interface LiveCryptoTick {
  asset: string;
  symbol: string;
  pair: string;
  priceInr: number;
  priceUsd: number;
  change24h: number;
  volume24hInr: number;
  marketCapInr: number;
  marketTimestamp: string;
  receivedTimestamp: string;
  source: string;
  dataAgeMs: number;
  transportLatencyMs: number;
  status: 'LIVE' | 'DELAYED' | 'STALE' | 'UNAVAILABLE';
  riskSignals: string[];
}
