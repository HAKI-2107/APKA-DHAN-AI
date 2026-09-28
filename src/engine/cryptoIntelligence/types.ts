/**
 * APKA DHAN AI - CRYPTO INTELLIGENCE MODULE TYPES
 * 
 * Formal data models, provider interfaces, risk indicators, and security contracts
 * for cryptocurrency intelligence, market data, user crypto holdings, watchlists,
 * and price/volatility alerts.
 * 
 * SECURITY & CONSTITUTIONAL INVARIANTS:
 * 1. Do not fabricate prices: MockCryptoDataProvider explicitly flags synthetic offline data.
 * 2. Pluggable provider abstraction ready for legitimate production APIs (CoinGecko, Binance, CoinMarketCap).
 * 3. Risk indicators (volatility, concentration, liquidity, abnormal moves, volume surges)
 *    are analytical observations — DO NOT call these indicators proof of fraud.
 * 4. NEVER request or store: private keys, seed phrases, or exchange passwords.
 * 5. Do NOT execute trades (Apka Dhan AI is strictly a non-custodial intelligence tool).
 */

// ==========================================
// 1. MARKET DATA LAYER
// ==========================================

export type VolatilityCategory = 'LOW' | 'MODERATE' | 'HIGH' | 'EXTREME';

export interface CryptoAsset {
  id: string;                      // e.g. "bitcoin", "ethereum", "solana"
  symbol: string;                  // e.g. "BTC", "ETH", "SOL"
  name: string;                    // e.g. "Bitcoin", "Ethereum"
  priceUsd: number;
  priceInr: number;                // In INR (~85.5 INR/USD standard peg)
  change24hPercent: number;        // e.g. +3.45% or -5.12%
  high24hUsd: number;
  low24hUsd: number;
  marketCapUsd?: number;           // Market Capitalization where available
  volume24hUsd?: number;           // 24h Trading Volume where available
  marketCapRank?: number;
  circulatingSupply?: number;
  volatility: VolatilityCategory;  // Risk indicator
  volatility30dPercent: number;    // 30-day annualized or standard volatility metric
  timestampEpochMs: number;
  isMockFeed: boolean;             // Invariant: transparently flags synthetic data
}

export type CryptoHistoricalRange = '24H' | '7D' | '30D' | '90D' | '1Y';

export interface CryptoHistoricalPoint {
  timestampEpochMs: number;
  dateStr: string;                 // ISO or readable date
  priceUsd: number;
  volumeUsd: number;
}

export interface CryptoSearchResult {
  id: string;
  symbol: string;
  name: string;
  marketCapRank: number;
  priceUsd: number;
  change24hPercent: number;
}

/**
 * Pluggable Crypto Market Data Provider Interface
 * Allows seamless replacement of MockCryptoDataProvider with production APIs
 */
export interface CryptoDataProvider {
  readonly providerName: string;
  readonly isLiveFeed: boolean;

  getAsset(symbolOrId: string): Promise<CryptoAsset | null>;
  getAssets(symbolsOrIds: string[]): Promise<Map<string, CryptoAsset>>;
  searchAssets(query: string): Promise<CryptoSearchResult[]>;
  getHistoricalData(symbolOrId: string, range: CryptoHistoricalRange): Promise<CryptoHistoricalPoint[]>;
}

// ==========================================
// 2. USER CRYPTO HOLDINGS & PORTFOLIO LAYER
// (NO PRIVATE KEYS - ONLY USER INPUT QUANTITIES)
// ==========================================

export type CryptoStorageType = 'COLD_WALLET' | 'HARDWARE' | 'EXCHANGE' | 'NON_CUSTODIAL';

export interface UserCryptoHolding {
  id: string;                      // Local holding identifier
  assetId: string;                 // e.g. "bitcoin"
  symbol: string;                  // e.g. "BTC"
  amount: number;                  // Balance quantity (e.g. 0.25 BTC)
  averageBuyPriceUsd: number;      // Cost basis
  buyDateEpochMs: number;
  storageType: CryptoStorageType;
  notes?: string;
}

export interface HoldingWithCryptoMarket {
  holding: UserCryptoHolding;
  asset: CryptoAsset;
  currentValueUsd: number;
  currentValueInr: number;
  investedValueUsd: number;
  unrealizedGainLossUsd: number;
  unrealizedGainLossPercent: number;
  portfolioWeightPercent: number;
}

export interface CryptoAllocationItem {
  symbol: string;
  name: string;
  valueUsd: number;
  valueInr: number;
  percentage: number;
}

export interface CryptoPortfolioSummary {
  totalCurrentValueUsd: number;
  totalCurrentValueInr: number;
  totalInvestedValueUsd: number;
  totalUnrealizedGainLossUsd: number;
  totalUnrealizedGainLossPercent: number;
  holdingsCount: number;
  allocations: CryptoAllocationItem[];
  riskIndicators: CryptoRiskIndicator[];
  calculatedAtEpochMs: number;
}

// ==========================================
// 3. WATCHLIST LAYER
// ==========================================

export interface CryptoWatchlist {
  id: string;
  name: string;
  symbols: string[];
  createdAtEpochMs: number;
  updatedAtEpochMs: number;
}

// ==========================================
// 4. PRICE & VOLATILITY ALERTS LAYER
// ==========================================

export type CryptoAlertDirection =
  | 'PRICE_ABOVE'
  | 'PRICE_BELOW'
  | 'PERCENT_SPIKE_24H'
  | 'PERCENT_DROP_24H'
  | 'HIGH_VOLATILITY_TRIGGER';

export interface CryptoAlert {
  id: string;
  symbol: string;
  direction: CryptoAlertDirection;
  targetPriceUsd?: number;
  thresholdPercent?: number;
  isActive: boolean;
  isTriggered: boolean;
  triggeredAtEpochMs?: number;
  createdAtEpochMs: number;
  note?: string;
}

// ==========================================
// 5. RISK INDICATORS LAYER
// (OBSERVATIONS ONLY — NOT PROOF OF FRAUD)
// ==========================================

export type CryptoRiskCode =
  | 'HIGH_VOLATILITY'
  | 'PORTFOLIO_CONCENTRATION'
  | 'LIQUIDITY_CONCERN'
  | 'ABNORMAL_PRICE_MOVEMENT'
  | 'SUDDEN_VOLUME_SURGE';

export interface CryptoRiskIndicator {
  code: CryptoRiskCode;
  name: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW' | 'INFORMATIONAL';
  description: string;
  metricObserved: string;
  disclaimer: string; // Invariant: "Analytical observation only, not proof of fraud"
}
