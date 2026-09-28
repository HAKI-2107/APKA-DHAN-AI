import {
  MarketDataProvider,
  StockQuote,
  HistoricalPricePoint,
  HistoricalDataRange,
  StockSearchResult,
  UserHolding,
  HoldingWithMarketData,
  PortfolioSummary,
  SectorAllocation,
  Watchlist,
  StockAlert,
  StockFundamentalAnalysis,
  AIStockExplanation,
} from './types';
import { globalMarketDataProvider, MockMarketDataProvider } from './MockMarketDataProvider';

// ==========================================
// 1. STOCK REPOSITORY
// ==========================================

export class StockRepository {
  private marketDataProvider: MarketDataProvider;
  private quoteCache: Map<string, { quote: StockQuote; cachedAt: number }> = new Map();
  private cacheTtlMs = 60000; // 1 minute cache for quotes

  constructor(provider: MarketDataProvider = globalMarketDataProvider) {
    this.marketDataProvider = provider;
  }

  async getQuote(symbol: string): Promise<StockQuote | null> {
    const sym = symbol.toUpperCase();
    const cached = this.quoteCache.get(sym);
    if (cached && Date.now() - cached.cachedAt < this.cacheTtlMs) {
      return cached.quote;
    }

    const fresh = await this.marketDataProvider.getQuote(sym);
    if (fresh) {
      this.quoteCache.set(sym, { quote: fresh, cachedAt: Date.now() });
    }
    return fresh;
  }

  async getQuotes(symbols: string[]): Promise<Map<string, StockQuote>> {
    const results = new Map<string, StockQuote>();
    const missing: string[] = [];

    for (const s of symbols) {
      const sym = s.toUpperCase();
      const cached = this.quoteCache.get(sym);
      if (cached && Date.now() - cached.cachedAt < this.cacheTtlMs) {
        results.set(sym, cached.quote);
      } else {
        missing.push(sym);
      }
    }

    if (missing.length > 0) {
      const fetched = await this.marketDataProvider.getQuotes(missing);
      fetched.forEach((q, sym) => {
        this.quoteCache.set(sym, { quote: q, cachedAt: Date.now() });
        results.set(sym, q);
      });
    }

    return results;
  }

  async getHistoricalData(symbol: string, range: HistoricalDataRange): Promise<HistoricalPricePoint[]> {
    return this.marketDataProvider.getHistoricalData(symbol, range);
  }

  async searchStocks(query: string): Promise<StockSearchResult[]> {
    return this.marketDataProvider.searchStocks(query);
  }

  getFundamentalAnalysis(symbol: string): StockFundamentalAnalysis | null {
    if (this.marketDataProvider instanceof MockMarketDataProvider) {
      const rec = this.marketDataProvider.getFundamentalRecord(symbol);
      if (!rec) return null;

      const observations: string[] = [];
      const riskIndicators: string[] = [];

      if (rec.debtToEquity > 1.5) {
        riskIndicators.push(`High Debt-to-Equity (${rec.debtToEquity}x) exceeds conservative 1.0x threshold.`);
      } else {
        observations.push(`Healthy balance sheet: Debt-to-Equity stands at ${rec.debtToEquity}x.`);
      }

      if (rec.promoterPledge > 25.0) {
        riskIndicators.push(`Elevated promoter pledge (${rec.promoterPledge}%) indicates lender collateral vulnerability.`);
      } else if (rec.promoterPledge === 0) {
        observations.push('Zero promoter share pledge.');
      }

      if (rec.peRatio > 45) {
        observations.push(`Valuation premium: P/E of ${rec.peRatio}x reflects high growth expectations.`);
      } else {
        observations.push(`Moderate valuation: P/E is ${rec.peRatio}x.`);
      }

      return {
        symbol: rec.symbol,
        peRatio: rec.peRatio,
        industryPe: 24.5,
        debtToEquity: rec.debtToEquity,
        promoterPledgePercent: rec.promoterPledge,
        isAsmGsmSurveillance: false,
        observations,
        riskIndicators,
      };
    }
    return null;
  }
}

// ==========================================
// 2. WATCHLIST REPOSITORY
// ==========================================

export class WatchlistRepository {
  private watchlists: Map<string, Watchlist> = new Map();
  private storageKey: string | null;

  constructor(storageKey: string | null = 'apka_dhan_watchlists_v1') {
    this.storageKey = storageKey;
    this.initDefaultWatchlist();
  }

  private initDefaultWatchlist() {
    // Default watchlist with bluechip stocks
    const defaultList: Watchlist = {
      id: 'default_watchlist',
      name: 'Nifty Core Focus',
      symbols: ['RELIANCE.NS', 'TCS.NS', 'HDFCBANK.NS', 'INFY.NS', 'VEDL.NS'],
      createdAtEpochMs: Date.now(),
      updatedAtEpochMs: Date.now(),
    };
    this.watchlists.set(defaultList.id, defaultList);
  }

  getAll(): Watchlist[] {
    return Array.from(this.watchlists.values());
  }

  getById(id: string): Watchlist | null {
    return this.watchlists.get(id) || null;
  }

  createWatchlist(name: string, initialSymbols: string[] = []): Watchlist {
    const id = `wl_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newWl: Watchlist = {
      id,
      name: name.trim(),
      symbols: Array.from(new Set(initialSymbols.map((s) => s.toUpperCase()))),
      createdAtEpochMs: Date.now(),
      updatedAtEpochMs: Date.now(),
    };
    this.watchlists.set(id, newWl);
    return newWl;
  }

  addSymbol(watchlistId: string, symbol: string): boolean {
    const wl = this.watchlists.get(watchlistId);
    if (!wl) return false;
    const cleanSym = symbol.trim().toUpperCase();
    if (!wl.symbols.includes(cleanSym)) {
      wl.symbols.push(cleanSym);
      wl.updatedAtEpochMs = Date.now();
      return true;
    }
    return false;
  }

  removeSymbol(watchlistId: string, symbol: string): boolean {
    const wl = this.watchlists.get(watchlistId);
    if (!wl) return false;
    const cleanSym = symbol.trim().toUpperCase();
    const idx = wl.symbols.indexOf(cleanSym);
    if (idx >= 0) {
      wl.symbols.splice(idx, 1);
      wl.updatedAtEpochMs = Date.now();
      return true;
    }
    return false;
  }

  deleteWatchlist(watchlistId: string): boolean {
    if (watchlistId === 'default_watchlist') return false; // Prevent deleting default
    return this.watchlists.delete(watchlistId);
  }
}

// ==========================================
// 3. HOLDING REPOSITORY
// ==========================================

export class HoldingRepository {
  private holdings: Map<string, UserHolding> = new Map();
  private storageKey: string | null;

  constructor(storageKey: string | null = 'apka_dhan_holdings_v1') {
    this.storageKey = storageKey;
    this.initDefaultHoldings();
  }

  private initDefaultHoldings() {
    // Initial sample user portfolio holdings
    const defaults: UserHolding[] = [
      {
        id: 'hold_rel',
        symbol: 'RELIANCE.NS',
        shares: 120,
        averageBuyPrice: 2450.00,
        buyDateEpochMs: Date.now() - 180 * 24 * 60 * 60 * 1000,
        notes: 'Core energy & retail allocation',
      },
      {
        id: 'hold_tcs',
        symbol: 'TCS.NS',
        shares: 60,
        averageBuyPrice: 3500.00,
        buyDateEpochMs: Date.now() - 120 * 24 * 60 * 60 * 1000,
        notes: 'IT export bluechip',
      },
      {
        id: 'hold_hdfc',
        symbol: 'HDFCBANK.NS',
        shares: 150,
        averageBuyPrice: 1520.00,
        buyDateEpochMs: Date.now() - 90 * 24 * 60 * 60 * 1000,
        notes: 'Private banking anchor',
      },
      {
        id: 'hold_vedl',
        symbol: 'VEDL.NS',
        shares: 300,
        averageBuyPrice: 380.00,
        buyDateEpochMs: Date.now() - 60 * 24 * 60 * 60 * 1000,
        notes: 'High dividend metal yield',
      },
    ];

    for (const h of defaults) {
      this.holdings.set(h.id, h);
    }
  }

  getAll(): UserHolding[] {
    return Array.from(this.holdings.values());
  }

  getById(id: string): UserHolding | null {
    return this.holdings.get(id) || null;
  }

  getBySymbol(symbol: string): UserHolding | null {
    const sym = symbol.toUpperCase();
    return Array.from(this.holdings.values()).find((h) => h.symbol.toUpperCase() === sym) || null;
  }

  addHolding(holding: Omit<UserHolding, 'id'>): UserHolding {
    const id = `hold_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newRecord: UserHolding = {
      id,
      symbol: holding.symbol.trim().toUpperCase(),
      shares: holding.shares,
      averageBuyPrice: holding.averageBuyPrice,
      buyDateEpochMs: holding.buyDateEpochMs || Date.now(),
      notes: holding.notes,
    };
    this.holdings.set(id, newRecord);
    return newRecord;
  }

  updateHolding(id: string, updates: Partial<Omit<UserHolding, 'id' | 'symbol'>>): boolean {
    const existing = this.holdings.get(id);
    if (!existing) return false;

    if (updates.shares !== undefined) existing.shares = updates.shares;
    if (updates.averageBuyPrice !== undefined) existing.averageBuyPrice = updates.averageBuyPrice;
    if (updates.notes !== undefined) existing.notes = updates.notes;

    return true;
  }

  removeHolding(id: string): boolean {
    return this.holdings.delete(id);
  }
}

// ==========================================
// 4. PORTFOLIO REPOSITORY
// ==========================================

export class PortfolioRepository {
  private holdingRepo: HoldingRepository;
  private stockRepo: StockRepository;
  private alerts: Map<string, StockAlert> = new Map();

  constructor(
    holdingRepo: HoldingRepository,
    stockRepo: StockRepository
  ) {
    this.holdingRepo = holdingRepo;
    this.stockRepo = stockRepo;
    this.initDefaultAlerts();
  }

  private initDefaultAlerts() {
    const defaultAlert: StockAlert = {
      id: 'alert_rel_3100',
      symbol: 'RELIANCE.NS',
      direction: 'PRICE_ABOVE',
      targetPrice: 3100.0,
      isActive: true,
      isTriggered: false,
      createdAtEpochMs: Date.now(),
      note: 'Alert when Reliance crosses ₹3,100 resistance',
    };
    this.alerts.set(defaultAlert.id, defaultAlert);
  }

  /**
   * Calculates comprehensive portfolio values, gains, and allocations
   * using current market quotes.
   */
  async getPortfolioSummary(): Promise<{
    summary: PortfolioSummary;
    holdingsWithMarket: HoldingWithMarketData[];
  }> {
    const rawHoldings = this.holdingRepo.getAll();
    const symbols = rawHoldings.map((h) => h.symbol);
    const quotes = await this.stockRepo.getQuotes(symbols);

    let totalCurrentValue = 0;
    let totalInvestedValue = 0;

    // Preliminary pass to calculate total value for weight percentage
    const prelim: Array<{
      holding: UserHolding;
      quote: StockQuote;
      currentVal: number;
      investedVal: number;
    }> = [];

    for (const h of rawHoldings) {
      const quote = quotes.get(h.symbol.toUpperCase());
      const currentPrice = quote ? quote.currentPrice : h.averageBuyPrice;
      const currentVal = h.shares * currentPrice;
      const investedVal = h.shares * h.averageBuyPrice;

      totalCurrentValue += currentVal;
      totalInvestedValue += investedVal;

      if (quote) {
        prelim.push({ holding: h, quote, currentVal, investedVal });
      }
    }

    const totalUnrealizedGainLoss = Number((totalCurrentValue - totalInvestedValue).toFixed(2));
    const totalUnrealizedGainLossPercent = totalInvestedValue > 0
      ? Number(((totalUnrealizedGainLoss / totalInvestedValue) * 100).toFixed(2))
      : 0;

    // Build enriched holdings
    const holdingsWithMarket: HoldingWithMarketData[] = [];
    const sectorMap: Map<string, { current: number; invested: number }> = new Map();

    let topGainer: { symbol: string; gainPercent: number; gainAmount: number } | undefined;
    let topLoser: { symbol: string; lossPercent: number; lossAmount: number } | undefined;

    for (const item of prelim) {
      const gainLoss = Number((item.currentVal - item.investedVal).toFixed(2));
      const gainLossPct = item.investedVal > 0
        ? Number(((gainLoss / item.investedVal) * 100).toFixed(2))
        : 0;

      const weight = totalCurrentValue > 0
        ? Number(((item.currentVal / totalCurrentValue) * 100).toFixed(2))
        : 0;

      if (!topGainer || gainLossPct > topGainer.gainPercent) {
        topGainer = { symbol: item.holding.symbol, gainPercent: gainLossPct, gainAmount: gainLoss };
      }
      if (!topLoser || gainLossPct < topLoser.lossPercent) {
        topLoser = { symbol: item.holding.symbol, lossPercent: gainLossPct, lossAmount: gainLoss };
      }

      // Track sector
      const sector = this.getSectorForSymbol(item.holding.symbol);
      const existingSector = sectorMap.get(sector) || { current: 0, invested: 0 };
      existingSector.current += item.currentVal;
      existingSector.invested += item.investedVal;
      sectorMap.set(sector, existingSector);

      holdingsWithMarket.push({
        holding: item.holding,
        quote: item.quote,
        currentValue: item.currentVal,
        investedValue: item.investedVal,
        unrealizedGainLoss: gainLoss,
        unrealizedGainLossPercent: gainLossPct,
        portfolioWeightPercent: weight,
      });
    }

    // Sort holdings by current value descending
    holdingsWithMarket.sort((a, b) => b.currentValue - a.currentValue);

    // Build sector allocations
    const sectorAllocations: SectorAllocation[] = [];
    sectorMap.forEach((val, sec) => {
      const pct = totalCurrentValue > 0 ? Number(((val.current / totalCurrentValue) * 100).toFixed(1)) : 0;
      sectorAllocations.push({
        sector: sec,
        currentValue: Number(val.current.toFixed(2)),
        investedValue: Number(val.invested.toFixed(2)),
        percentage: pct,
      });
    });

    sectorAllocations.sort((a, b) => b.currentValue - a.currentValue);

    const summary: PortfolioSummary = {
      totalCurrentValue: Number(totalCurrentValue.toFixed(2)),
      totalInvestedValue: Number(totalInvestedValue.toFixed(2)),
      totalUnrealizedGainLoss,
      totalUnrealizedGainLossPercent,
      holdingsCount: rawHoldings.length,
      topGainer,
      topLoser,
      sectorAllocations,
      calculatedAtEpochMs: Date.now(),
    };

    return { summary, holdingsWithMarket };
  }

  // ==========================================
  // ALERTS MANAGEMENT
  // ==========================================

  getAlerts(): StockAlert[] {
    return Array.from(this.alerts.values());
  }

  createAlert(alert: Omit<StockAlert, 'id' | 'createdAtEpochMs' | 'isTriggered'>): StockAlert {
    const id = `alert_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`;
    const newAlert: StockAlert = {
      id,
      symbol: alert.symbol.trim().toUpperCase(),
      direction: alert.direction,
      targetPrice: alert.targetPrice,
      thresholdPercent: alert.thresholdPercent,
      isActive: alert.isActive ?? true,
      isTriggered: false,
      createdAtEpochMs: Date.now(),
      note: alert.note,
    };
    this.alerts.set(id, newAlert);
    return newAlert;
  }

  deleteAlert(id: string): boolean {
    return this.alerts.delete(id);
  }

  toggleAlert(id: string): boolean {
    const a = this.alerts.get(id);
    if (!a) return false;
    a.isActive = !a.isActive;
    return true;
  }

  async evaluateAlerts(): Promise<StockAlert[]> {
    const triggered: StockAlert[] = [];
    for (const alert of this.alerts.values()) {
      if (!alert.isActive || alert.isTriggered) continue;
      const quote = await this.stockRepo.getQuote(alert.symbol);
      if (!quote) continue;

      let isTriggered = false;
      if (alert.direction === 'PRICE_ABOVE' && quote.currentPrice >= alert.targetPrice) {
        isTriggered = true;
      } else if (alert.direction === 'PRICE_BELOW' && quote.currentPrice <= alert.targetPrice) {
        isTriggered = true;
      } else if (alert.direction === 'PERCENT_MOVE_UP' && alert.thresholdPercent && quote.dayChangePercent >= alert.thresholdPercent) {
        isTriggered = true;
      } else if (alert.direction === 'PERCENT_MOVE_DOWN' && alert.thresholdPercent && quote.dayChangePercent <= -alert.thresholdPercent) {
        isTriggered = true;
      }

      if (isTriggered) {
        alert.isTriggered = true;
        alert.triggeredAtEpochMs = Date.now();
        triggered.push(alert);
      }
    }
    return triggered;
  }

  // ==========================================
  // EDUCATIONAL / OBJECTIVE EXPLANATIONS
  // CONSTITUTION: NO AUTOMATIC BUY/SELL DECISIONS
  // ==========================================

  getEducationalExplanation(symbol: string): AIStockExplanation {
    const sym = symbol.toUpperCase();
    return {
      symbol: sym,
      topic: 'FUNDAMENTAL_HEALTH',
      factualExplanation: `Financial disclosures for ${sym} indicate operating cash flow metrics aligned with historical quarterly filings. Balance sheet indicators reflect conservative leverage within sector averages.`,
      limitations: [
        'Historical fundamentals do not guarantee future business cycles or market price movements.',
        'Market sentiment and macroeconomic interest rates directly impact asset valuation multiples.',
      ],
      disclaimer: 'Constitutional Directive: Apka Dhan AI strictly provides neutral financial intelligence and educational data. It NEVER issues automated buy, sell, or trade recommendations.',
    };
  }

  private getSectorForSymbol(symbol: string): string {
    const s = symbol.toUpperCase();
    if (s.includes('RELIANCE')) return 'Energy & Conglomerate';
    if (s.includes('TCS') || s.includes('INFY') || s.includes('WIPRO')) return 'Information Technology';
    if (s.includes('HDFC') || s.includes('ICICI') || s.includes('SBI') || s.includes('KOTAK')) return 'Banking & Financials';
    if (s.includes('VEDL') || s.includes('TATASTEEL')) return 'Metals & Mining';
    if (s.includes('TATAMOTORS') || s.includes('MARUTI')) return 'Automobile';
    if (s.includes('ITC')) return 'FMCG';
    if (s.includes('BHARTIARTL')) return 'Telecom';
    return 'Diversified';
  }
}

// Global Singletons
export const globalStockRepository = new StockRepository(globalMarketDataProvider);
export const globalWatchlistRepository = new WatchlistRepository();
export const globalHoldingRepository = new HoldingRepository();
export const globalPortfolioRepository = new PortfolioRepository(
  globalHoldingRepository,
  globalStockRepository
);
