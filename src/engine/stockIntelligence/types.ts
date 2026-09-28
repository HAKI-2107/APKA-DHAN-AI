/**
 * APKA DHAN AI - STOCK INTELLIGENCE MODULE TYPES
 * 
 * Formal data models and provider interfaces for stock intelligence,
 * market data, user portfolios, watchlists, holdings, and alerts.
 * 
 * STRICT ARCHITECTURAL SEPARATION:
 * 1. Market Data: Quotes, Historical Price Data, Exchange Status (from MarketDataProvider)
 * 2. User Portfolio Data: Holdings, Transactions, Watchlists (from User Repositories)
 * 3. Analytical Data: Allocations, Gains/Losses, Diversification Metrics
 * 4. AI Explanations: Fundamental and Risk Educational Insights (NO BUY/SELL ADVICE)
 * 
 * CONSTITUTIONAL INVARIANT:
 * - Do not invent live data (MockMarketDataProvider explicitly flags its mock nature).
 * - Do not produce automatic buy/sell decisions.
 */

// ==========================================
// 1. MARKET DATA LAYER
// ==========================================

export type MarketState = 'OPEN' | 'CLOSED' | 'PRE_MARKET' | 'POST_MARKET';

export interface StockQuote {
  symbol: string;             // e.g. "RELIANCE.NS", "TCS.NS"
  name: string;               // e.g. "Reliance Industries Limited"
  exchange: 'NSE' | 'BSE';
  currentPrice: number;       // In INR
  previousClose: number;
  dayChange: number;          // Absolute change
  dayChangePercent: number;   // Percentage change (e.g. +1.45%)
  dayHigh: number;
  dayLow: number;
  fiftyTwoWeekHigh: number;
  fiftyTwoWeekLow: number;
  volume: number;
  currency: 'INR';
  timestampEpochMs: number;
  marketState: MarketState;
  isMockData: boolean;        // Invariant: transparently indicates if data is mock
}

export type HistoricalDataRange = '1D' | '1W' | '1M' | '3M' | '1Y' | '5Y';

export interface HistoricalPricePoint {
  timestampEpochMs: number;
  dateStr: string;            // ISO or readable date (YYYY-MM-DD)
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface StockSearchResult {
  symbol: string;
  name: string;
  exchange: 'NSE' | 'BSE';
  sector: string;
  marketCapCategory: 'LARGE_CAP' | 'MID_CAP' | 'SMALL_CAP';
  currentPrice: number;
}

/**
 * Pluggable Market Data Provider Interface
 * Allows seamless replacement of MockMarketDataProvider with production feeds (NSE/BSE/AlphaVantage/Bloomberg)
 */
export interface MarketDataProvider {
  readonly providerName: string;
  readonly isLiveFeed: boolean;

  getQuote(symbol: string): Promise<StockQuote | null>;
  getQuotes(symbols: string[]): Promise<Map<string, StockQuote>>;
  getHistoricalData(symbol: string, range: HistoricalDataRange): Promise<HistoricalPricePoint[]>;
  searchStocks(query: string): Promise<StockSearchResult[]>;
}

// ==========================================
// 2. USER PORTFOLIO & HOLDINGS LAYER
// ==========================================

export interface UserHolding {
  id: string;                 // Unique holding record ID
  symbol: string;             // e.g. "RELIANCE.NS"
  shares: number;             // Quantity owned
  averageBuyPrice: number;    // In INR
  buyDateEpochMs: number;
  notes?: string;
}

export interface HoldingWithMarketData {
  holding: UserHolding;
  quote: StockQuote;
  currentValue: number;
  investedValue: number;
  unrealizedGainLoss: number;
  unrealizedGainLossPercent: number;
  portfolioWeightPercent: number;
}

export interface SectorAllocation {
  sector: string;
  currentValue: number;
  investedValue: number;
  percentage: number;
}

export interface PortfolioSummary {
  totalCurrentValue: number;
  totalInvestedValue: number;
  totalUnrealizedGainLoss: number;
  totalUnrealizedGainLossPercent: number;
  holdingsCount: number;
  topGainer?: {
    symbol: string;
    gainPercent: number;
    gainAmount: number;
  };
  topLoser?: {
    symbol: string;
    lossPercent: number;
    lossAmount: number;
  };
  sectorAllocations: SectorAllocation[];
  calculatedAtEpochMs: number;
}

// ==========================================
// 3. WATCHLIST LAYER
// ==========================================

export interface Watchlist {
  id: string;
  name: string;
  symbols: string[];
  createdAtEpochMs: number;
  updatedAtEpochMs: number;
}

// ==========================================
// 4. PRICE ALERTS LAYER
// ==========================================

export type AlertDirection = 'PRICE_ABOVE' | 'PRICE_BELOW' | 'PERCENT_MOVE_UP' | 'PERCENT_MOVE_DOWN';

export interface StockAlert {
  id: string;
  symbol: string;
  direction: AlertDirection;
  targetPrice: number;
  thresholdPercent?: number;
  isActive: boolean;
  isTriggered: boolean;
  triggeredAtEpochMs?: number;
  createdAtEpochMs: number;
  note?: string;
}

// ==========================================
// 5. ANALYSIS & AI EXPLANATION LAYER
// (NO AUTOMATED BUY/SELL SIGNALS)
// ==========================================

export interface StockFundamentalAnalysis {
  symbol: string;
  peRatio: number;
  industryPe: number;
  debtToEquity: number;
  promoterPledgePercent: number;
  isAsmGsmSurveillance: boolean;
  observations: string[];
  riskIndicators: string[];
}

export interface AIStockExplanation {
  symbol: string;
  topic: 'FUNDAMENTAL_HEALTH' | 'RISK_FACTORS' | 'REGULATORY_SCRUTINY';
  factualExplanation: string;
  limitations: string[];
  disclaimer: string;
}
