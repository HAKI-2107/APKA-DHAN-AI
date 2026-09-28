import {
  AssetClass,
  UnifiedAssetHolding,
  EnrichedAssetPosition,
  AssetClassExposure,
  CategoryExposure,
  ConcentrationMetrics,
  PortfolioRiskSignal,
  ExplainableCalculation,
  UnifiedPortfolioAssessment,
} from './types';
import { globalAlertEngine } from '../notifications/AlertEngine';

/**
 * APKA DHAN AI - UNIFIED PORTFOLIO ENGINE
 * 
 * Aggregates and analyzes investments across:
 * - Stocks
 * - Mutual Funds
 * - ETFs
 * - Crypto
 * 
 * CONSTITUTIONAL INVARIANTS:
 * 1. Descriptive risk signals: "High concentration detected" rather than "Sell this asset."
 * 2. Step-by-step explainable calculations.
 * 3. Never provide personalized financial advice or algorithmic buy/sell instructions.
 */
export class UnifiedPortfolioEngine {
  private holdings: Map<string, UnifiedAssetHolding> = new Map();

  constructor(initialHoldings: UnifiedAssetHolding[] = []) {
    if (initialHoldings.length > 0) {
      for (const h of initialHoldings) {
        this.holdings.set(h.id, h);
      }
    } else {
      this.seedDefaultPortfolio();
    }
  }

  private seedDefaultPortfolio() {
    const defaultPositions: UnifiedAssetHolding[] = [
      // 1. STOCKS
      {
        id: 'pos_rel',
        symbolOrIdentifier: 'RELIANCE.NS',
        name: 'Reliance Industries Limited',
        assetClass: 'STOCKS',
        subCategory: 'Large Cap Energy & Conglomerate',
        quantity: 120,
        averageBuyPrice: 2450.00,
        currentPrice: 2980.50,
        currency: 'INR',
        notes: 'Core private equity holding',
      },
      {
        id: 'pos_tcs',
        symbolOrIdentifier: 'TCS.NS',
        name: 'Tata Consultancy Services',
        assetClass: 'STOCKS',
        subCategory: 'Information Technology',
        quantity: 60,
        averageBuyPrice: 3500.00,
        currentPrice: 4210.00,
        currency: 'INR',
        notes: 'IT bluechip export earnings',
      },
      {
        id: 'pos_hdfc',
        symbolOrIdentifier: 'HDFCBANK.NS',
        name: 'HDFC Bank Limited',
        assetClass: 'STOCKS',
        subCategory: 'Banking & Financials',
        quantity: 150,
        averageBuyPrice: 1520.00,
        currentPrice: 1680.00,
        currency: 'INR',
        notes: 'Private banking anchor',
      },

      // 2. MUTUAL FUNDS
      {
        id: 'pos_ppfc',
        symbolOrIdentifier: 'INF209K01167',
        name: 'Parag Parikh Flexi Cap Fund',
        assetClass: 'MUTUAL_FUNDS',
        subCategory: 'Flexi Cap Equity MF',
        quantity: 3000,
        averageBuyPrice: 62.00,
        currentPrice: 78.45,
        currency: 'INR',
        notes: 'Diversified domestic + international value',
      },
      {
        id: 'pos_mirae',
        symbolOrIdentifier: 'INF769K01010',
        name: 'Mirae Asset Large Cap Fund',
        assetClass: 'MUTUAL_FUNDS',
        subCategory: 'Large Cap Equity MF',
        quantity: 1800,
        averageBuyPrice: 98.00,
        currentPrice: 112.30,
        currency: 'INR',
        notes: 'Top 100 Indian corporate leaders',
      },

      // 3. ETFS
      {
        id: 'pos_goldbees',
        symbolOrIdentifier: 'GOLDBEES',
        name: 'Nippon India ETF Gold BeES',
        assetClass: 'ETFS',
        subCategory: 'Precious Metal Commodity',
        quantity: 1200,
        averageBuyPrice: 58.00,
        currentPrice: 68.90,
        currency: 'INR',
        notes: 'Physical gold sovereign inflation hedge',
      },
      {
        id: 'pos_niftybees',
        symbolOrIdentifier: 'NIFTYBEES',
        name: 'Nippon India ETF Nifty 50 BeES',
        assetClass: 'ETFS',
        subCategory: 'Broad Market Equity Index',
        quantity: 450,
        averageBuyPrice: 230.00,
        currentPrice: 268.40,
        currency: 'INR',
        notes: 'Passive Nifty 50 replica',
      },

      // 4. CRYPTO (Stored strictly in INR @ standard 85.5 USD/INR peg)
      {
        id: 'pos_btc',
        symbolOrIdentifier: 'BTC',
        name: 'Bitcoin',
        assetClass: 'CRYPTO',
        subCategory: 'Decentralized Digital Asset',
        quantity: 0.018,
        averageBuyPrice: 4959000.00, // $58,000 * 85.5
        currentPrice: 5489100.00,    // $64,200 * 85.5
        currency: 'INR',
        notes: 'Cold storage hardware allocation (~$1,155)',
      },
      {
        id: 'pos_eth',
        symbolOrIdentifier: 'ETH',
        name: 'Ethereum',
        assetClass: 'CRYPTO',
        subCategory: 'Smart Contract Platform',
        quantity: 0.25,
        averageBuyPrice: 265050.00,  // $3,100 * 85.5
        currentPrice: 294975.00,    // $3,450 * 85.5
        currency: 'INR',
        notes: 'Non-custodial decentralised ecosystem (~$862)',
      },
    ];

    for (const pos of defaultPositions) {
      this.holdings.set(pos.id, pos);
    }
  }

  // ==========================================
  // HOLDINGS CRUD
  // ==========================================

  getHoldings(): UnifiedAssetHolding[] {
    return Array.from(this.holdings.values());
  }

  getHoldingById(id: string): UnifiedAssetHolding | null {
    return this.holdings.get(id) || null;
  }

  addHolding(holding: Omit<UnifiedAssetHolding, 'id'>): UnifiedAssetHolding {
    const id = `uhold_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const record: UnifiedAssetHolding = {
      ...holding,
      id,
      symbolOrIdentifier: holding.symbolOrIdentifier.trim().toUpperCase(),
      name: holding.name.trim(),
    };
    this.holdings.set(id, record);
    return record;
  }

  updateHolding(id: string, updates: Partial<Omit<UnifiedAssetHolding, 'id'>>): boolean {
    const existing = this.holdings.get(id);
    if (!existing) return false;
    Object.assign(existing, updates);
    return true;
  }

  updatePriceBySymbol(symbolOrIdentifier: string, newPrice: number): boolean {
    const sym = symbolOrIdentifier.trim().toUpperCase();
    let found = false;
    for (const holding of this.holdings.values()) {
      if (holding.symbolOrIdentifier === sym) {
        holding.currentPrice = newPrice;
        found = true;
      }
    }
    return found;
  }

  removeHolding(id: string): boolean {
    return this.holdings.delete(id);
  }

  // ==========================================
  // UNIFIED CALCULATIONS ENGINE
  // ==========================================

  calculateAssessment(customHoldings?: UnifiedAssetHolding[]): UnifiedPortfolioAssessment {
    const holdingsList = customHoldings || this.getHoldings();

    let totalInvestedAmount = 0;
    let totalCurrentValue = 0;

    // Preliminary pass: Calculate invested & current values for each asset
    const rawEnriched: Array<{
      holding: UnifiedAssetHolding;
      invested: number;
      current: number;
      pnl: number;
      pctReturn: number;
    }> = [];

    for (const h of holdingsList) {
      const invested = Number((h.quantity * h.averageBuyPrice).toFixed(2));
      const current = Number((h.quantity * h.currentPrice).toFixed(2));
      const pnl = Number((current - invested).toFixed(2));
      const pctReturn = invested > 0 ? Number(((pnl / invested) * 100).toFixed(2)) : 0;

      totalInvestedAmount += invested;
      totalCurrentValue += current;

      rawEnriched.push({
        holding: h,
        invested,
        current,
        pnl,
        pctReturn,
      });
    }

    totalInvestedAmount = Number(totalInvestedAmount.toFixed(2));
    totalCurrentValue = Number(totalCurrentValue.toFixed(2));

    const totalUnrealizedPnL = Number((totalCurrentValue - totalInvestedAmount).toFixed(2));
    const totalPercentageReturn = totalInvestedAmount > 0
      ? Number(((totalUnrealizedPnL / totalInvestedAmount) * 100).toFixed(2))
      : 0;

    // Second pass: Calculate portfolio weights and group exposures
    const positions: EnrichedAssetPosition[] = [];
    const assetClassMap = new Map<AssetClass, { current: number; invested: number; count: number }>();
    const categoryMap = new Map<string, { current: number; invested: number }>();

    for (const item of rawEnriched) {
      const weight = totalCurrentValue > 0
        ? Number(((item.current / totalCurrentValue) * 100).toFixed(2))
        : 0;

      positions.push({
        holding: item.holding,
        investedAmount: item.invested,
        currentValue: item.current,
        unrealizedPnL: item.pnl,
        percentageReturn: item.pctReturn,
        portfolioWeightPercent: weight,
      });

      // Asset Class Aggregation
      const ac = item.holding.assetClass;
      const acExisting = assetClassMap.get(ac) || { current: 0, invested: 0, count: 0 };
      acExisting.current += item.current;
      acExisting.invested += item.invested;
      acExisting.count += 1;
      assetClassMap.set(ac, acExisting);

      // Category Aggregation
      const cat = item.holding.subCategory;
      const catExisting = categoryMap.get(cat) || { current: 0, invested: 0 };
      catExisting.current += item.current;
      catExisting.invested += item.invested;
      categoryMap.set(cat, catExisting);
    }

    // Sort positions descending by current value
    positions.sort((a, b) => b.currentValue - a.currentValue);

    // Build Asset Class Exposures
    const assetClassExposures: AssetClassExposure[] = [];
    assetClassMap.forEach((val, ac) => {
      const pct = totalCurrentValue > 0 ? Number(((val.current / totalCurrentValue) * 100).toFixed(1)) : 0;
      const pnl = Number((val.current - val.invested).toFixed(2));
      const ret = val.invested > 0 ? Number(((pnl / val.invested) * 100).toFixed(2)) : 0;

      assetClassExposures.push({
        assetClass: ac,
        currentValue: Number(val.current.toFixed(2)),
        investedAmount: Number(val.invested.toFixed(2)),
        percentage: pct,
        unrealizedPnL: pnl,
        percentageReturn: ret,
        count: val.count,
      });
    });
    assetClassExposures.sort((a, b) => b.currentValue - a.currentValue);

    // Build Category Exposures
    const categoryExposures: CategoryExposure[] = [];
    categoryMap.forEach((val, cat) => {
      const pct = totalCurrentValue > 0 ? Number(((val.current / totalCurrentValue) * 100).toFixed(1)) : 0;
      categoryExposures.push({
        category: cat,
        currentValue: Number(val.current.toFixed(2)),
        investedAmount: Number(val.invested.toFixed(2)),
        percentage: pct,
      });
    });
    categoryExposures.sort((a, b) => b.currentValue - a.currentValue);

    // ==========================================
    // CONCENTRATION METRICS
    // ==========================================
    const topAssetPos = positions[0];
    const top3Percentage = positions.slice(0, 3).reduce((sum, p) => sum + p.portfolioWeightPercent, 0);

    // Herfindahl-Hirschman Index (sum of squared weight percentages)
    let herfindahlIndex = 0;
    for (const p of positions) {
      herfindahlIndex += Math.pow(p.portfolioWeightPercent, 2);
    }
    herfindahlIndex = Math.round(herfindahlIndex);

    let concentrationLevel: ConcentrationMetrics['concentrationLevel'] = 'LOW';
    if (herfindahlIndex > 2500 || (topAssetPos && topAssetPos.portfolioWeightPercent > 35.0)) {
      concentrationLevel = 'HIGH';
    } else if (herfindahlIndex > 1800 || (topAssetPos && topAssetPos.portfolioWeightPercent > 25.0)) {
      concentrationLevel = 'MODERATE';
    } else if (herfindahlIndex > 4000) {
      concentrationLevel = 'CRITICAL';
    }

    const concentration: ConcentrationMetrics = {
      topAsset: {
        id: topAssetPos?.holding.id || '',
        symbol: topAssetPos?.holding.symbolOrIdentifier || '',
        name: topAssetPos?.holding.name || '',
        currentValue: topAssetPos?.currentValue || 0,
        percentage: topAssetPos?.portfolioWeightPercent || 0,
      },
      top3AssetsPercentage: Number(top3Percentage.toFixed(1)),
      herfindahlIndex,
      concentrationLevel,
    };

    // ==========================================
    // PORTFOLIO-LEVEL RISK SIGNALS
    // (DESCRIPTIVE ONLY — STRICTLY NO "SELL" DIRECTIVES)
    // ==========================================
    const riskSignals: PortfolioRiskSignal[] = [];

    // 1. Single Asset Concentration Signal
    if (topAssetPos && topAssetPos.portfolioWeightPercent >= 25.0) {
      riskSignals.push({
        code: 'HIGH_SINGLE_ASSET_CONCENTRATION',
        name: 'Single Asset Concentration Detected',
        severity: topAssetPos.portfolioWeightPercent >= 35.0 ? 'HIGH' : 'MEDIUM',
        descriptiveObservation: `High concentration detected: ${topAssetPos.holding.name} (${topAssetPos.holding.symbolOrIdentifier}) represents ${topAssetPos.portfolioWeightPercent}% of total portfolio value.`,
        explanationMath: `Formula: (Asset Current Value ₹${topAssetPos.currentValue.toLocaleString('en-IN')} / Total Portfolio Value ₹${totalCurrentValue.toLocaleString('en-IN')}) × 100 = ${topAssetPos.portfolioWeightPercent}%, exceeding standard conservative 20% single-holding threshold.`,
        statutoryDisclaimer: 'Analytical risk observation only. Does NOT constitute personalized financial advice, trade recommendations, or sell instructions.',
      });

      if (topAssetPos.portfolioWeightPercent >= 35.0) {
        try {
          globalAlertEngine.processEvent({
            id: `port_conc_${topAssetPos.holding.id}`,
            type: 'PORTFOLIO',
            severity: topAssetPos.portfolioWeightPercent >= 45.0 ? 'HIGH' : 'MEDIUM',
            title: `Portfolio Concentration: ${topAssetPos.holding.name}`,
            summary: `${topAssetPos.holding.name} accounts for ${topAssetPos.portfolioWeightPercent}% of total portfolio value.`,
            details: `Position value is ₹${topAssetPos.currentValue.toLocaleString('en-IN')} out of ₹${totalCurrentValue.toLocaleString('en-IN')}. Diversification review suggested.`,
            source: 'On-Device Unified Portfolio Engine',
            deepLink: 'apkaDhan://alerts',
            requiresAction: false,
            isRead: false,
            isTest: false,
            metadata: { symbol: topAssetPos.holding.symbolOrIdentifier, weight: topAssetPos.portfolioWeightPercent },
          });
        } catch (e) {}
      }
    }

    // 2. Top-3 Assets Dominance Signal
    if (positions.length >= 4 && top3Percentage >= 60.0) {
      riskSignals.push({
        code: 'TOP_3_DOMINANCE',
        name: 'Top 3 Holdings Concentration Detected',
        severity: 'MEDIUM',
        descriptiveObservation: `Concentration alert: The top 3 largest positions account for ${top3Percentage.toFixed(1)}% of total capital.`,
        explanationMath: `Sum of top 3 weights: ${positions[0].portfolioWeightPercent}% + ${positions[1].portfolioWeightPercent}% + ${positions[2].portfolioWeightPercent}% = ${top3Percentage.toFixed(1)}%.`,
        statutoryDisclaimer: 'Analytical risk observation only. Does NOT constitute personalized financial advice or rebalancing instructions.',
      });
    }

    // 3. Crypto Allocation Guideline Signal
    const cryptoExp = assetClassExposures.find((a) => a.assetClass === 'CRYPTO');
    if (cryptoExp && cryptoExp.percentage > 10.0) {
      riskSignals.push({
        code: 'ELEVATED_CRYPTO_EXPOSURE',
        name: 'Elevated Cryptocurrency Exposure Detected',
        severity: cryptoExp.percentage > 20.0 ? 'HIGH' : 'MEDIUM',
        descriptiveObservation: `Cryptocurrency holdings represent ${cryptoExp.percentage}% of overall portfolio wealth, exceeding conventional conservative risk tolerance boundaries (typically 5%–10%).`,
        explanationMath: `Crypto Value ₹${cryptoExp.currentValue.toLocaleString('en-IN')} / Total Value ₹${totalCurrentValue.toLocaleString('en-IN')} = ${cryptoExp.percentage}%.`,
        statutoryDisclaimer: 'Observation only. Does NOT constitute personalized financial advice or divestment instructions.',
      });
    }

    // 4. Low Defensive Asset Buffer
    const etfAndDebtExp = assetClassExposures.find((a) => a.assetClass === 'ETFS');
    if (!etfAndDebtExp || etfAndDebtExp.percentage < 5.0) {
      riskSignals.push({
        code: 'LOW_DEFENSIVE_ALLOCATION',
        name: 'Low Defensive / Commodity Allocation Observed',
        severity: 'LOW',
        descriptiveObservation: `Hedging assets (such as Sovereign Gold ETFs or liquid instruments) represent ${etfAndDebtExp?.percentage || 0}% of the portfolio.`,
        explanationMath: `ETF Allocation is ${etfAndDebtExp?.percentage || 0}% against an equity exposure of ${(assetClassExposures.find(a => a.assetClass === 'STOCKS')?.percentage || 0) + (assetClassExposures.find(a => a.assetClass === 'MUTUAL_FUNDS')?.percentage || 0)}%.`,
        statutoryDisclaimer: 'Observation only. Does NOT constitute personalized financial advice.',
      });
    }

    // ==========================================
    // EXPLAINABLE CALCULATIONS
    // ==========================================
    const explainableCalculations: ExplainableCalculation[] = [
      {
        metricName: 'Total Invested Capital',
        formula: '∑ (Quantity_i × Average_Buy_Price_i)',
        inputs: {
          holdingsEvaluated: holdingsList.length,
          currency: 'INR',
        },
        stepByStep: holdingsList.map(
          (h) => `${h.symbolOrIdentifier}: ${h.quantity} × ₹${h.averageBuyPrice} = ₹${(h.quantity * h.averageBuyPrice).toLocaleString('en-IN')}`
        ),
        finalFormattedValue: `₹${totalInvestedAmount.toLocaleString('en-IN')}`,
      },
      {
        metricName: 'Total Current Valuation',
        formula: '∑ (Quantity_i × Current_Market_Price_i)',
        inputs: {
          holdingsEvaluated: holdingsList.length,
          currency: 'INR',
        },
        stepByStep: holdingsList.map(
          (h) => `${h.symbolOrIdentifier}: ${h.quantity} × ₹${h.currentPrice} = ₹${(h.quantity * h.currentPrice).toLocaleString('en-IN')}`
        ),
        finalFormattedValue: `₹${totalCurrentValue.toLocaleString('en-IN')}`,
      },
      {
        metricName: 'Total Unrealized Gain / Loss (PnL)',
        formula: 'Total_Current_Valuation − Total_Invested_Capital',
        inputs: {
          totalCurrentValuation: totalCurrentValue,
          totalInvestedCapital: totalInvestedAmount,
        },
        stepByStep: [
          `₹${totalCurrentValue.toLocaleString('en-IN')} − ₹${totalInvestedAmount.toLocaleString('en-IN')} = ${totalUnrealizedPnL >= 0 ? '+' : ''}₹${totalUnrealizedPnL.toLocaleString('en-IN')}`,
        ],
        finalFormattedValue: `${totalUnrealizedPnL >= 0 ? '+' : ''}₹${totalUnrealizedPnL.toLocaleString('en-IN')}`,
      },
      {
        metricName: 'Portfolio Percentage Return',
        formula: '(Total_Unrealized_PnL ÷ Total_Invested_Capital) × 100',
        inputs: {
          unrealizedPnL: totalUnrealizedPnL,
          investedCapital: totalInvestedAmount,
        },
        stepByStep: [
          `(${totalUnrealizedPnL} ÷ ${totalInvestedAmount}) × 100 = ${totalPercentageReturn}%`,
        ],
        finalFormattedValue: `${totalPercentageReturn >= 0 ? '+' : ''}${totalPercentageReturn}%`,
      },
      {
        metricName: 'Herfindahl-Hirschman Concentration Index (HHI)',
        formula: '∑ (Portfolio_Weight_Percent_i)^2',
        inputs: {
          assetsCount: positions.length,
        },
        stepByStep: positions.map(
          (p) => `${p.holding.symbolOrIdentifier}: (${p.portfolioWeightPercent}%)^2 = ${Math.pow(p.portfolioWeightPercent, 2).toFixed(1)}`
        ),
        finalFormattedValue: `${herfindahlIndex} / 10,000 (${concentrationLevel} Concentration)`,
      },
    ];

    return {
      totalInvestedAmount,
      totalCurrentValue,
      totalUnrealizedPnL,
      totalPercentageReturn,
      positionsCount: holdingsList.length,
      positions,
      assetClassExposures,
      categoryExposures,
      concentration,
      riskSignals,
      explainableCalculations,
      calculatedAtEpochMs: Date.now(),
      statutoryNotice:
        'Constitutional Notice: Apka Dhan AI generates objective, mathematical, and explainable portfolio analytics. It strictly NEVER produces personalized financial advice, trade recommendations, or automated buy/sell instructions.',
    };
  }
}

export const globalUnifiedPortfolioEngine = new UnifiedPortfolioEngine();

// Auto-wire real-time providers to unified portfolio engine
import { globalLiveMarketDataProvider } from '../dataSource/LiveMarketDataProvider';
import { globalLiveCryptoDataProvider } from '../dataSource/LiveCryptoDataProvider';

globalLiveMarketDataProvider.subscribe((tick) => {
  globalUnifiedPortfolioEngine.updatePriceBySymbol(tick.symbol, tick.lastPrice);
});

globalLiveCryptoDataProvider.subscribe((tick) => {
  globalUnifiedPortfolioEngine.updatePriceBySymbol(tick.symbol, tick.priceInr);
});
