export type RiskLevel = 'LOW RISK' | 'MEDIUM RISK' | 'HIGH RISK' | 'UNKNOWN / UNVERIFIED';

export type AlertCategory = 
  | 'Payment Risk' 
  | 'Investment Scam' 
  | 'Portfolio Alert' 
  | 'Crypto Alert' 
  | 'Security Alert';

export interface EvidenceDossier {
  identifier: string;
  riskLevel: RiskLevel;
  evidence: string[];
  explanation: string;
  source: string;
  confidence: string;
  recommendedSteps: string[];
  timestamp?: number;
}

export interface SecurityAlert {
  id: string;
  category: AlertCategory;
  title: string;
  severity: RiskLevel;
  timestamp: string;
  source: string;
  summary: string;
  evidence: string[];
  recommendedSteps: string[];
}

export interface StockItem {
  symbol: string;
  name: string;
  shares: number;
  avgPrice: number;
  currentPrice: number;
  peRatio: number;
  debtToEquity: number;
  promoterPledgePercentage: number;
  isAsmGsmSurveillance: boolean;
  riskAlert?: string;
}

export interface CryptoItem {
  symbol: string;
  name: string;
  balance: number;
  currentPriceUsd: number;
  change24h: number;
  volatility: 'Low' | 'Moderate' | 'High' | 'Extreme';
  marketCapRank: number;
  honeypotRisk: boolean;
  unverifiedCreator: boolean;
  riskSignals: string[];
}

export interface TransactionAnomaly {
  id: string;
  timestamp: string;
  payeeName: string;
  payeeVpa: string;
  amount: number;
  type: 'COLLECT_REQUEST' | 'DEBIT' | 'CREDIT';
  riskLevel: RiskLevel;
  flagReason: string;
}
