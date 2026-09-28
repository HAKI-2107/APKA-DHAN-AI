import {
  MarketDataProvider,
  StockQuote,
  HistoricalPricePoint,
  HistoricalDataRange,
  StockSearchResult,
} from './types';

interface InternalStockRecord {
  symbol: string;
  name: string;
  exchange: 'NSE' | 'BSE';
  sector: string;
  marketCapCategory: 'LARGE_CAP' | 'MID_CAP' | 'SMALL_CAP';
  basePrice: number;
  fiftyTwoWeekHigh: number;
  fiftyTwoWeekLow: number;
  peRatio: number;
  debtToEquity: number;
  promoterPledge: number;
}

const STOCK_UNIVERSE: InternalStockRecord[] = [
  {
    symbol: 'RELIANCE.NS',
    name: 'Reliance Industries Limited',
    exchange: 'NSE',
    sector: 'Energy & Conglomerate',
    marketCapCategory: 'LARGE_CAP',
    basePrice: 2980.50,
    fiftyTwoWeekHigh: 3217.90,
    fiftyTwoWeekLow: 2220.30,
    peRatio: 27.4,
    debtToEquity: 0.38,
    promoterPledge: 0.0,
  },
  {
    symbol: 'TCS.NS',
    name: 'Tata Consultancy Services Limited',
    exchange: 'NSE',
    sector: 'Information Technology',
    marketCapCategory: 'LARGE_CAP',
    basePrice: 4210.00,
    fiftyTwoWeekHigh: 4585.00,
    fiftyTwoWeekLow: 3313.00,
    peRatio: 31.2,
    debtToEquity: 0.04,
    promoterPledge: 0.45,
  },
  {
    symbol: 'HDFCBANK.NS',
    name: 'HDFC Bank Limited',
    exchange: 'NSE',
    sector: 'Banking & Financials',
    marketCapCategory: 'LARGE_CAP',
    basePrice: 1680.00,
    fiftyTwoWeekHigh: 1794.00,
    fiftyTwoWeekLow: 1363.55,
    peRatio: 18.9,
    debtToEquity: 0.85,
    promoterPledge: 0.0,
  },
  {
    symbol: 'INFY.NS',
    name: 'Infosys Limited',
    exchange: 'NSE',
    sector: 'Information Technology',
    marketCapCategory: 'LARGE_CAP',
    basePrice: 1892.40,
    fiftyTwoWeekHigh: 1991.45,
    fiftyTwoWeekLow: 1358.35,
    peRatio: 26.8,
    debtToEquity: 0.08,
    promoterPledge: 0.0,
  },
  {
    symbol: 'ICICIBANK.NS',
    name: 'ICICI Bank Limited',
    exchange: 'NSE',
    sector: 'Banking & Financials',
    marketCapCategory: 'LARGE_CAP',
    basePrice: 1245.80,
    fiftyTwoWeekHigh: 1335.00,
    fiftyTwoWeekLow: 915.00,
    peRatio: 17.5,
    debtToEquity: 0.72,
    promoterPledge: 0.0,
  },
  {
    symbol: 'BHARTIARTL.NS',
    name: 'Bharti Airtel Limited',
    exchange: 'NSE',
    sector: 'Telecom',
    marketCapCategory: 'LARGE_CAP',
    basePrice: 1640.20,
    fiftyTwoWeekHigh: 1779.00,
    fiftyTwoWeekLow: 900.00,
    peRatio: 52.1,
    debtToEquity: 1.45,
    promoterPledge: 0.0,
  },
  {
    symbol: 'ITC.NS',
    name: 'ITC Limited',
    exchange: 'NSE',
    sector: 'FMCG',
    marketCapCategory: 'LARGE_CAP',
    basePrice: 504.60,
    fiftyTwoWeekHigh: 528.50,
    fiftyTwoWeekLow: 399.30,
    peRatio: 28.2,
    debtToEquity: 0.0,
    promoterPledge: 0.0,
  },
  {
    symbol: 'SBIN.NS',
    name: 'State Bank of India',
    exchange: 'NSE',
    sector: 'Banking & Financials',
    marketCapCategory: 'LARGE_CAP',
    basePrice: 792.15,
    fiftyTwoWeekHigh: 912.00,
    fiftyTwoWeekLow: 543.20,
    peRatio: 10.4,
    debtToEquity: 1.12,
    promoterPledge: 0.0,
  },
  {
    symbol: 'VEDL.NS',
    name: 'Vedanta Limited',
    exchange: 'NSE',
    sector: 'Metals & Mining',
    marketCapCategory: 'LARGE_CAP',
    basePrice: 465.00,
    fiftyTwoWeekHigh: 506.85,
    fiftyTwoWeekLow: 207.85,
    peRatio: 14.8,
    debtToEquity: 2.15,
    promoterPledge: 62.4, // Warning indicator
  },
  {
    symbol: 'TATAMOTORS.NS',
    name: 'Tata Motors Limited',
    exchange: 'NSE',
    sector: 'Automobile',
    marketCapCategory: 'LARGE_CAP',
    basePrice: 968.30,
    fiftyTwoWeekHigh: 1179.05,
    fiftyTwoWeekLow: 600.65,
    peRatio: 9.8,
    debtToEquity: 0.94,
    promoterPledge: 1.82,
  },
  {
    symbol: 'ZOMATO.NS',
    name: 'Zomato Limited',
    exchange: 'NSE',
    sector: 'Consumer Technology',
    marketCapCategory: 'MID_CAP',
    basePrice: 274.50,
    fiftyTwoWeekHigh: 298.20,
    fiftyTwoWeekLow: 98.60,
    peRatio: 112.5,
    debtToEquity: 0.02,
    promoterPledge: 0.0,
  },
  {
    symbol: 'LT.NS',
    name: 'Larsen & Toubro Limited',
    exchange: 'NSE',
    sector: 'Capital Goods & Infra',
    marketCapCategory: 'LARGE_CAP',
    basePrice: 3620.00,
    fiftyTwoWeekHigh: 3919.90,
    fiftyTwoWeekLow: 2860.00,
    peRatio: 33.4,
    debtToEquity: 1.25,
    promoterPledge: 0.0,
  },
];

/**
 * APKA DHAN AI - MOCK MARKET DATA PROVIDER
 * 
 * Provides simulated stock prices, daily percentage movements,
 * search results, and historical price sequences.
 * 
 * DESIGNED FOR ABSTRACTION:
 * Interface matches production specifications. Does NOT fabricate live exchange connectivity.
 */
export class MockMarketDataProvider implements MarketDataProvider {
  readonly providerName = 'MockMarketDataProvider (Synthetic Offline Feed)';
  readonly isLiveFeed = false;

  private stockMap: Map<string, InternalStockRecord> = new Map();

  constructor() {
    for (const s of STOCK_UNIVERSE) {
      this.stockMap.set(s.symbol.toUpperCase(), s);
    }
  }

  async getQuote(symbol: string): Promise<StockQuote | null> {
    const cleanSym = symbol.trim().toUpperCase();
    const record = this.stockMap.get(cleanSym);
    if (!record) return null;

    // Deterministic day movement based on symbol ASCII sum so it remains stable across render cycles
    const hash = this.getSymbolHash(cleanSym);
    const dayChangeFactor = ((hash % 70) - 30) / 1000; // e.g. -3.0% to +4.0%
    const currentPrice = Number((record.basePrice * (1 + dayChangeFactor)).toFixed(2));
    const previousClose = record.basePrice;
    const dayChange = Number((currentPrice - previousClose).toFixed(2));
    const dayChangePercent = Number(((dayChange / previousClose) * 100).toFixed(2));
    const dayHigh = Number((Math.max(currentPrice, previousClose) * 1.012).toFixed(2));
    const dayLow = Number((Math.min(currentPrice, previousClose) * 0.988).toFixed(2));
    const volume = 250000 + (hash * 1337) % 5000000;

    return {
      symbol: record.symbol,
      name: record.name,
      exchange: record.exchange,
      currentPrice,
      previousClose,
      dayChange,
      dayChangePercent,
      dayHigh,
      dayLow,
      fiftyTwoWeekHigh: record.fiftyTwoWeekHigh,
      fiftyTwoWeekLow: record.fiftyTwoWeekLow,
      volume,
      currency: 'INR',
      timestampEpochMs: Date.now(),
      marketState: 'CLOSED', // Explicitly declare state
      isMockData: true,      // Invariant: Zero invented live data
    };
  }

  async getQuotes(symbols: string[]): Promise<Map<string, StockQuote>> {
    const results = new Map<string, StockQuote>();
    for (const sym of symbols) {
      const q = await this.getQuote(sym);
      if (q) results.set(sym.toUpperCase(), q);
    }
    return results;
  }

  async getHistoricalData(symbol: string, range: HistoricalDataRange): Promise<HistoricalPricePoint[]> {
    const cleanSym = symbol.trim().toUpperCase();
    const record = this.stockMap.get(cleanSym);
    const basePrice = record ? record.basePrice : 1000.0;
    const hash = this.getSymbolHash(cleanSym);

    let numPoints = 30;
    let daysStep = 1;

    switch (range) {
      case '1D':
        numPoints = 24; // Hourly
        daysStep = 1 / 24;
        break;
      case '1W':
        numPoints = 7;
        daysStep = 1;
        break;
      case '1M':
        numPoints = 30;
        daysStep = 1;
        break;
      case '3M':
        numPoints = 45;
        daysStep = 2;
        break;
      case '1Y':
        numPoints = 52; // Weekly
        daysStep = 7;
        break;
      case '5Y':
        numPoints = 60; // Monthly
        daysStep = 30;
        break;
    }

    const points: HistoricalPricePoint[] = [];
    const now = Date.now();
    let currentWalk = basePrice * 0.85;

    for (let i = numPoints; i >= 0; i--) {
      const timestamp = now - i * daysStep * 24 * 60 * 60 * 1000;
      const date = new Date(timestamp);
      const dateStr = date.toISOString().split('T')[0];

      // Pseudo-random walk with deterministic trigonometric curve
      const wave = Math.sin((i + hash) * 0.35) * (basePrice * 0.035);
      const trend = ((numPoints - i) / numPoints) * (basePrice * 0.18);
      const close = Number((currentWalk + wave + trend).toFixed(2));
      const open = Number((close * (1 + (Math.sin(i) * 0.008))).toFixed(2));
      const high = Number((Math.max(open, close) * 1.01).toFixed(2));
      const low = Number((Math.min(open, close) * 0.99).toFixed(2));
      const volume = Math.floor(100000 + Math.abs(Math.sin(i + hash)) * 1500000);

      points.push({
        timestampEpochMs: timestamp,
        dateStr,
        open,
        high,
        low,
        close,
        volume,
      });

      currentWalk = close;
    }

    return points;
  }

  async searchStocks(query: string): Promise<StockSearchResult[]> {
    const cleanQ = query.trim().toLowerCase();
    if (!cleanQ) {
      // Return top 8 prominent stocks
      return STOCK_UNIVERSE.slice(0, 8).map((s) => ({
        symbol: s.symbol,
        name: s.name,
        exchange: s.exchange,
        sector: s.sector,
        marketCapCategory: s.marketCapCategory,
        currentPrice: s.basePrice,
      }));
    }

    const matches = STOCK_UNIVERSE.filter(
      (s) =>
        s.symbol.toLowerCase().includes(cleanQ) ||
        s.name.toLowerCase().includes(cleanQ) ||
        s.sector.toLowerCase().includes(cleanQ)
    );

    return matches.map((s) => ({
      symbol: s.symbol,
      name: s.name,
      exchange: s.exchange,
      sector: s.sector,
      marketCapCategory: s.marketCapCategory,
      currentPrice: s.basePrice,
    }));
  }

  getFundamentalRecord(symbol: string): InternalStockRecord | null {
    return this.stockMap.get(symbol.toUpperCase()) || null;
  }

  private getSymbolHash(sym: string): number {
    let hash = 0;
    for (let i = 0; i < sym.length; i++) {
      hash = (hash << 5) - hash + sym.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  }
}

export const globalMarketDataProvider = new MockMarketDataProvider();
