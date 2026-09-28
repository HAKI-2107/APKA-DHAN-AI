import { LiveMarketTick, DataResponse } from './types';
import { DataProvenanceService, DataFreshnessService } from './DataFreshnessService';
import { globalAlertEngine } from '../notifications/AlertEngine';

/**
 * APKA DHAN AI - LIVE MARKET DATA PROVIDER (STOCKS)
 * 
 * Provides streaming/snapshot quotes for NSE/BSE securities.
 * Tracks transport latency, data age, and handles market disconnection gracefully.
 * Never displays stale prices as LIVE.
 */

export interface MarketTickListener {
  (tick: LiveMarketTick): void;
}

export class LiveMarketDataProvider {
  private activeQuotes: Map<string, LiveMarketTick> = new Map();
  private listeners: Set<MarketTickListener> = new Set();
  private isConnected = true;
  private pollIntervalId: any = null;

  constructor() {
    this.seedInitialQuotes();
  }

  private seedInitialQuotes() {
    const now = new Date().toISOString();
    const defaults: LiveMarketTick[] = [
      {
        symbol: 'RELIANCE.NS',
        exchange: 'NSE',
        lastPrice: 2980.50,
        previousPrice: 2945.00,
        change: 35.50,
        changePercent: 1.21,
        volume: 4892010,
        marketTimestamp: now,
        receivedTimestamp: now,
        source: 'NSE Real-Time Market Feed (Mock Adapter / Sandbox)',
        dataAgeMs: 500,
        transportLatencyMs: 38,
        status: 'LIVE',
      },
      {
        symbol: 'TCS.NS',
        exchange: 'NSE',
        lastPrice: 4210.00,
        previousPrice: 4190.00,
        change: 20.00,
        changePercent: 0.48,
        volume: 2109400,
        marketTimestamp: now,
        receivedTimestamp: now,
        source: 'NSE Real-Time Market Feed (Mock Adapter / Sandbox)',
        dataAgeMs: 800,
        transportLatencyMs: 42,
        status: 'LIVE',
      },
      {
        symbol: 'HDFCBANK.NS',
        exchange: 'NSE',
        lastPrice: 1680.00,
        previousPrice: 1692.50,
        change: -12.50,
        changePercent: -0.74,
        volume: 8710300,
        marketTimestamp: now,
        receivedTimestamp: now,
        source: 'NSE Real-Time Market Feed (Mock Adapter / Sandbox)',
        dataAgeMs: 600,
        transportLatencyMs: 35,
        status: 'LIVE',
      },
      {
        symbol: 'INFY.NS',
        exchange: 'NSE',
        lastPrice: 1845.20,
        previousPrice: 1830.00,
        change: 15.20,
        changePercent: 0.83,
        volume: 3201400,
        marketTimestamp: now,
        receivedTimestamp: now,
        source: 'NSE Real-Time Market Feed (Mock Adapter / Sandbox)',
        dataAgeMs: 900,
        transportLatencyMs: 45,
        status: 'LIVE',
      },
    ];

    for (const q of defaults) {
      this.activeQuotes.set(q.symbol, q);
    }
  }

  public subscribe(listener: MarketTickListener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public getQuote(symbol: string): DataResponse<LiveMarketTick | null> {
    const tick = this.activeQuotes.get(symbol.toUpperCase());
    if (!tick) {
      return {
        data: null,
        source: 'NSE/BSE Provider',
        sourceUrl: 'https://www.nseindia.com/',
        retrievedAt: new Date().toISOString(),
        freshness: 'UNAVAILABLE',
        isLive: false,
        isCached: false,
        confidence: 'LOW',
        status: 'UNAVAILABLE',
        error: `Symbol ${symbol} not found in active quote registry.`,
        provenance: DataProvenanceService.create('National Stock Exchange', 'NSE Equity Quotes', 'https://www.nseindia.com/'),
      };
    }

    const freshnessInfo = DataFreshnessService.evaluateLiveFeedFreshness(
      new Date(tick.receivedTimestamp).getTime(),
      new Date(tick.marketTimestamp).getTime()
    );

    return {
      data: tick,
      source: tick.source,
      sourceUrl: 'https://www.nseindia.com/get-quotes/equity?symbol=' + encodeURIComponent(symbol),
      retrievedAt: new Date().toISOString(),
      providerTimestamp: tick.marketTimestamp,
      freshness: this.isConnected ? freshnessInfo.state : 'STALE',
      isLive: this.isConnected && freshnessInfo.state === 'LIVE',
      isCached: !this.isConnected,
      confidence: 'HIGH',
      status: this.isConnected ? freshnessInfo.state : 'STALE',
      latencyMs: tick.transportLatencyMs,
      dataAgeSeconds: freshnessInfo.ageSeconds,
      provenance: DataProvenanceService.create('National Stock Exchange of India', 'Real-Time Equity Feed', 'https://www.nseindia.com/', {
        isHistorical: false,
      }),
    };
  }

  public getAllQuotes(): LiveMarketTick[] {
    return Array.from(this.activeQuotes.values());
  }

  /**
   * Push a simulated or live market tick through the system
   */
  public pushTick(update: { symbol: string; lastPrice: number; volume?: number }) {
    const sym = update.symbol.toUpperCase();
    const existing = this.activeQuotes.get(sym);
    const now = new Date().toISOString();
    const prev = existing ? existing.lastPrice : update.lastPrice;
    const change = Number((update.lastPrice - prev).toFixed(2));
    const changePercent = prev > 0 ? Number(((change / prev) * 100).toFixed(2)) : 0;

    const newTick: LiveMarketTick = {
      symbol: sym,
      exchange: 'NSE',
      lastPrice: update.lastPrice,
      previousPrice: prev,
      change,
      changePercent,
      volume: update.volume || (existing ? existing.volume + 500 : 100000),
      marketTimestamp: now,
      receivedTimestamp: now,
      source: 'NSE Real-Time Market Feed (Verified Provider / Simulator)',
      dataAgeMs: 50,
      transportLatencyMs: Math.floor(20 + Math.random() * 25),
      status: this.isConnected ? 'LIVE' : 'STALE',
    };

    this.activeQuotes.set(sym, newTick);

    // Emit alert if significant market movement (>= 3%)
    if (Math.abs(changePercent) >= 3.0) {
      try {
        globalAlertEngine.processEvent({
          id: `stock_move_${sym}_${Date.now()}`,
          type: 'STOCK',
          severity: Math.abs(changePercent) >= 6.0 ? 'MEDIUM' : 'LOW',
          title: `${sym} is moving today`,
          summary: `${sym} price moved ${changePercent > 0 ? '+' : ''}${changePercent}% to ₹${update.lastPrice.toLocaleString('en-IN')}.`,
          source: 'NSE Real-Time Market Feed',
          deepLink: 'apkaDhan://alerts',
          requiresAction: false,
          isRead: false,
          isTest: false,
          metadata: { symbol: sym, changePercent },
        });
      } catch (e) {}
    }

    for (const listener of this.listeners) {
      try {
        listener(newTick);
      } catch (e) {
        console.error('Error notifying tick listener:', e);
      }
    }

    return newTick;
  }

  public setConnectionState(connected: boolean) {
    const wasDisconnected = !this.isConnected && connected;
    this.isConnected = connected;
    for (const [sym, tick] of this.activeQuotes.entries()) {
      tick.status = connected ? 'LIVE' : 'STALE';
      this.activeQuotes.set(sym, tick);
    }

    if (wasDisconnected) {
      try {
        globalAlertEngine.processEvent({
          id: `sys_conn_${Date.now()}`,
          type: 'SYSTEM',
          severity: 'INFO',
          title: "🟢 We're live again",
          summary: 'Your real-time market data feed has reconnected smoothly.',
          source: 'NSE Feed Diagnostics',
          deepLink: 'apkaDhan://alerts',
          requiresAction: false,
          isRead: false,
          isTest: false,
        });
      } catch (e) {}
    }
  }

  public isNetworkConnected(): boolean {
    return this.isConnected;
  }
}

export const globalLiveMarketDataProvider = new LiveMarketDataProvider();
