/**
 * APKA DHAN AI - UNIFIED PORTFOLIO ENGINE TYPES
 * 
 * Formal data models for multi-asset portfolio aggregation supporting:
 * - Stocks
 * - Mutual Funds
 * - ETFs
 * - Crypto
 * 
 * STRICT STATUTORY & CONSTITUTIONAL DIRECTIVES:
 * 1. Descriptive risk signals: "High concentration detected" rather than "Sell this asset."
 * 2. Fully explainable calculations with formulas, inputs, and step-by-step math.
 * 3. Never provide personalized financial advice or automated buy/sell instructions.
 */

export type AssetClass = 'STOCKS' | 'MUTUAL_FUNDS' | 'ETFS' | 'CRYPTO';

export interface UnifiedAssetHolding {
  id: string;
  symbolOrIdentifier: string;  // e.g. "RELIANCE.NS", "INF209K01167", "GOLDBEES", "BTC"
  name: string;                // e.g. "Reliance Industries", "Parag Parikh Flexi Cap", "Nippon Gold BeES", "Bitcoin"
  assetClass: AssetClass;
  subCategory: string;         // e.g. "Large Cap Energy", "Flexi Cap Equity", "Precious Metal ETF", "Layer 1 Crypto"
  quantity: number;            // Shares, units, or tokens
  averageBuyPrice: number;     // In INR
  currentPrice: number;        // In INR
  currency: 'INR';
  notes?: string;
}

export interface EnrichedAssetPosition {
  holding: UnifiedAssetHolding;
  investedAmount: number;
  currentValue: number;
  unrealizedPnL: number;
  percentageReturn: number;
  portfolioWeightPercent: number;
}

export interface AssetClassExposure {
  assetClass: AssetClass;
  currentValue: number;
  investedAmount: number;
  percentage: number;
  unrealizedPnL: number;
  percentageReturn: number;
  count: number;
}

export interface CategoryExposure {
  category: string;
  currentValue: number;
  investedAmount: number;
  percentage: number;
}

export type ConcentrationSeverity = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';

export interface ConcentrationMetrics {
  topAsset: {
    id: string;
    symbol: string;
    name: string;
    currentValue: number;
    percentage: number;
  };
  top3AssetsPercentage: number;
  herfindahlIndex: number;      // Herfindahl-Hirschman Index (sum of squared weight percentages: 0 to 10,000)
  concentrationLevel: ConcentrationSeverity;
}

export type RiskSignalSeverity = 'HIGH' | 'MEDIUM' | 'LOW' | 'INFORMATIONAL';

export interface PortfolioRiskSignal {
  code: string;
  name: string;
  severity: RiskSignalSeverity;
  descriptiveObservation: string;  // e.g. "High concentration detected: ..." (NEVER "Sell this asset")
  explanationMath: string;         // Step-by-step formula and numbers
  statutoryDisclaimer: string;
}

export interface ExplainableCalculation {
  metricName: string;
  formula: string;
  inputs: Record<string, number | string>;
  stepByStep: string[];
  finalFormattedValue: string;
}

export interface UnifiedPortfolioAssessment {
  totalInvestedAmount: number;
  totalCurrentValue: number;
  totalUnrealizedPnL: number;
  totalPercentageReturn: number;
  positionsCount: number;
  positions: EnrichedAssetPosition[];
  assetClassExposures: AssetClassExposure[];
  categoryExposures: CategoryExposure[];
  concentration: ConcentrationMetrics;
  riskSignals: PortfolioRiskSignal[];
  explainableCalculations: ExplainableCalculation[];
  calculatedAtEpochMs: number;
  statutoryNotice: string;
}
