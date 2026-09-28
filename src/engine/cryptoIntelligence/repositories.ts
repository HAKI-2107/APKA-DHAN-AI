import {
  CryptoDataProvider,
  CryptoAsset,
  CryptoHistoricalPoint,
  CryptoHistoricalRange,
  CryptoSearchResult,
  UserCryptoHolding,
  HoldingWithCryptoMarket,
  CryptoPortfolioSummary,
  CryptoAllocationItem,
  CryptoWatchlist,
  CryptoAlert,
  CryptoRiskIndicator,
} from './types';
import { globalCryptoDataProvider } from './MockCryptoDataProvider';

// ==========================================
// 1. CRYPTO ASSET REPOSITORY
// ==========================================

export class CryptoAssetRepository {
  private provider: CryptoDataProvider;
  private cache: Map<string, { asset: CryptoAsset; cachedAt: number }> = new Map();
  private cacheTtlMs = 60000;

  constructor(provider: CryptoDataProvider = globalCryptoDataProvider) {
    this.provider = provider;
  }

  async getAsset(symbolOrId: string): Promise<CryptoAsset | null> {
    const key = symbolOrId.toUpperCase();
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.cachedAt < this.cacheTtlMs) {
      return cached.asset;
    }

    const fresh = await this.provider.getAsset(symbolOrId);
    if (fresh) {
      this.cache.set(fresh.symbol.toUpperCase(), { asset: fresh, cachedAt: Date.now() });
      this.cache.set(fresh.id.toUpperCase(), { asset: fresh, cachedAt: Date.now() });
    }
    return fresh;
  }

  async getAssets(symbolsOrIds: string[]): Promise<Map<string, CryptoAsset>> {
    const results = new Map<string, CryptoAsset>();
    const missing: string[] = [];

    for (const s of symbolsOrIds) {
      const key = s.toUpperCase();
      const cached = this.cache.get(key);
      if (cached && Date.now() - cached.cachedAt < this.cacheTtlMs) {
        results.set(key, cached.asset);
      } else {
        missing.push(s);
      }
    }

    if (missing.length > 0) {
      const fetched = await this.provider.getAssets(missing);
      fetched.forEach((asset, sym) => {
        this.cache.set(sym.toUpperCase(), { asset, cachedAt: Date.now() });
        results.set(sym.toUpperCase(), asset);
      });
    }

    return results;
  }

  async searchAssets(query: string): Promise<CryptoSearchResult[]> {
    return this.provider.searchAssets(query);
  }

  async getHistoricalData(symbolOrId: string, range: CryptoHistoricalRange): Promise<CryptoHistoricalPoint[]> {
    return this.provider.getHistoricalData(symbolOrId, range);
  }
}

// ==========================================
// 2. CRYPTO WATCHLIST REPOSITORY
// ==========================================

export class CryptoWatchlistRepository {
  private watchlists: Map<string, CryptoWatchlist> = new Map();

  constructor() {
    this.initDefaultWatchlist();
  }

  private initDefaultWatchlist() {
    const defaultList: CryptoWatchlist = {
      id: 'default_crypto_watchlist',
      name: 'Major Cap Cryptos',
      symbols: ['BTC', 'ETH', 'SOL', 'AVAX'],
      createdAtEpochMs: Date.now(),
      updatedAtEpochMs: Date.now(),
    };
    this.watchlists.set(defaultList.id, defaultList);
  }

  getAll(): CryptoWatchlist[] {
    return Array.from(this.watchlists.values());
  }

  getById(id: string): CryptoWatchlist | null {
    return this.watchlists.get(id) || null;
  }

  createWatchlist(name: string, initialSymbols: string[] = []): CryptoWatchlist {
    const id = `cwl_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newWl: CryptoWatchlist = {
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
    if (watchlistId === 'default_crypto_watchlist') return false;
    return this.watchlists.delete(watchlistId);
  }
}

// ==========================================
// 3. CRYPTO HOLDING REPOSITORY
// STRICT INVARIANT: NEVER REQUEST OR STORE PRIVATE KEYS, SEED PHRASES, OR PASSWORDS
// ==========================================

export class CryptoHoldingRepository {
  private holdings: Map<string, UserCryptoHolding> = new Map();

  constructor() {
    this.initDefaultHoldings();
  }

  private initDefaultHoldings() {
    const defaults: UserCryptoHolding[] = [
      {
        id: 'ch_btc',
        assetId: 'bitcoin',
        symbol: 'BTC',
        amount: 0.018,
        averageBuyPriceUsd: 58000.0,
        buyDateEpochMs: Date.now() - 90 * 24 * 60 * 60 * 1000,
        storageType: 'HARDWARE',
        notes: 'Cold storage reserve',
      },
      {
        id: 'ch_eth',
        assetId: 'ethereum',
        symbol: 'ETH',
        amount: 0.25,
        averageBuyPriceUsd: 3100.0,
        buyDateEpochMs: Date.now() - 60 * 24 * 60 * 60 * 1000,
        storageType: 'NON_CUSTODIAL',
        notes: 'Smart contract ecosystem allocation',
      },
    ];

    for (const h of defaults) {
      this.holdings.set(h.id, h);
    }
  }

  getAll(): UserCryptoHolding[] {
    return Array.from(this.holdings.values());
  }

  getById(id: string): UserCryptoHolding | null {
    return this.holdings.get(id) || null;
  }

  addHolding(holding: Omit<UserCryptoHolding, 'id'>): UserCryptoHolding {
    // SECURITY GUARDRAIL: Refuse any attempts to submit sensitive secrets
    const suspiciousKeys = ['privateKey', 'seedPhrase', 'mnemonic', 'password', 'private_key', 'secret'];
    const holdingAny = holding as any;
    for (const sk of suspiciousKeys) {
      if (holdingAny[sk]) {
        throw new Error(
          `Security Violation: Apka Dhan AI strictly prohibits submitting or storing "${sk}". Only track quantities and purchase prices.`
        );
      }
    }

    const id = `ch_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newRecord: UserCryptoHolding = {
      id,
      assetId: holding.assetId.toLowerCase(),
      symbol: holding.symbol.trim().toUpperCase(),
      amount: holding.amount,
      averageBuyPriceUsd: holding.averageBuyPriceUsd,
      buyDateEpochMs: holding.buyDateEpochMs || Date.now(),
      storageType: holding.storageType || 'NON_CUSTODIAL',
      notes: holding.notes,
    };
    this.holdings.set(id, newRecord);
    return newRecord;
  }

  updateHolding(id: string, updates: Partial<Omit<UserCryptoHolding, 'id' | 'symbol'>>): boolean {
    const existing = this.holdings.get(id);
    if (!existing) return false;

    if (updates.amount !== undefined) existing.amount = updates.amount;
    if (updates.averageBuyPriceUsd !== undefined) existing.averageBuyPriceUsd = updates.averageBuyPriceUsd;
    if (updates.storageType !== undefined) existing.storageType = updates.storageType;
    if (updates.notes !== undefined) existing.notes = updates.notes;

    return true;
  }

  removeHolding(id: string): boolean {
    return this.holdings.delete(id);
  }
}

// ==========================================
// 4. CRYPTO PORTFOLIO REPOSITORY
// COMPUTATION, ALLOCATION & RISK INDICATORS
// ==========================================

export class CryptoPortfolioRepository {
  private holdingRepo: CryptoHoldingRepository;
  private assetRepo: CryptoAssetRepository;
  private alerts: Map<string, CryptoAlert> = new Map();

  constructor(holdingRepo: CryptoHoldingRepository, assetRepo: CryptoAssetRepository) {
    this.holdingRepo = holdingRepo;
    this.assetRepo = assetRepo;
    this.initDefaultAlerts();
  }

  private initDefaultAlerts() {
    const alert: CryptoAlert = {
      id: 'calert_btc_70k',
      symbol: 'BTC',
      direction: 'PRICE_ABOVE',
      targetPriceUsd: 70000.0,
      isActive: true,
      isTriggered: false,
      createdAtEpochMs: Date.now(),
      note: 'Bitcoin $70,000 threshold test',
    };
    this.alerts.set(alert.id, alert);
  }

  async getPortfolioSummary(): Promise<{
    summary: CryptoPortfolioSummary;
    holdingsWithMarket: HoldingWithCryptoMarket[];
  }> {
    const holdings = this.holdingRepo.getAll();
    const symbols = holdings.map((h) => h.symbol);
    const assets = await this.assetRepo.getAssets(symbols);

    let totalCurrentValueUsd = 0;
    let totalInvestedValueUsd = 0;

    const enriched: Array<{
      holding: UserCryptoHolding;
      asset: CryptoAsset;
      curValUsd: number;
      curValInr: number;
      invValUsd: number;
    }> = [];

    for (const h of holdings) {
      const asset = assets.get(h.symbol.toUpperCase());
      const curPrice = asset ? asset.priceUsd : h.averageBuyPriceUsd;
      const curValUsd = h.amount * curPrice;
      const curValInr = curValUsd * 85.5;
      const invValUsd = h.amount * h.averageBuyPriceUsd;

      totalCurrentValueUsd += curValUsd;
      totalInvestedValueUsd += invValUsd;

      if (asset) {
        enriched.push({
          holding: h,
          asset,
          curValUsd,
          curValInr,
          invValUsd,
        });
      }
    }

    const totalCurrentValueInr = Number((totalCurrentValueUsd * 85.5).toFixed(2));
    const totalUnrealizedGainLossUsd = Number((totalCurrentValueUsd - totalInvestedValueUsd).toFixed(2));
    const totalUnrealizedGainLossPercent = totalInvestedValueUsd > 0
      ? Number(((totalUnrealizedGainLossUsd / totalInvestedValueUsd) * 100).toFixed(2))
      : 0;

    const holdingsWithMarket: HoldingWithCryptoMarket[] = [];
    const allocations: CryptoAllocationItem[] = [];
    const riskIndicators: CryptoRiskIndicator[] = [];

    for (const item of enriched) {
      const pnlUsd = Number((item.curValUsd - item.invValUsd).toFixed(2));
      const pnlPct = item.invValUsd > 0 ? Number(((pnlUsd / item.invValUsd) * 100).toFixed(2)) : 0;
      const weight = totalCurrentValueUsd > 0
        ? Number(((item.curValUsd / totalCurrentValueUsd) * 100).toFixed(1))
        : 0;

      holdingsWithMarket.push({
        holding: item.holding,
        asset: item.asset,
        currentValueUsd: Number(item.curValUsd.toFixed(2)),
        currentValueInr: Number(item.curValInr.toFixed(2)),
        investedValueUsd: Number(item.invValUsd.toFixed(2)),
        unrealizedGainLossUsd: pnlUsd,
        unrealizedGainLossPercent: pnlPct,
        portfolioWeightPercent: weight,
      });

      allocations.push({
        symbol: item.asset.symbol,
        name: item.asset.name,
        valueUsd: Number(item.curValUsd.toFixed(2)),
        valueInr: Number(item.curValInr.toFixed(2)),
        percentage: weight,
      });

      // ----------------------------------------------------
      // RISK INDICATOR 1: CONCENTRATION RISK
      // ----------------------------------------------------
      if (weight >= 55.0 && holdings.length > 1) {
        riskIndicators.push({
          code: 'PORTFOLIO_CONCENTRATION',
          name: `Portfolio Concentration (${item.asset.symbol}: ${weight}%)`,
          severity: 'MEDIUM',
          description: `${item.asset.name} constitutes ${weight}% of total crypto capital. Heavy single-asset weighting increases drawdown risk during market cycles.`,
          metricObserved: `${weight}% of portfolio`,
          disclaimer: 'Risk observation only — NOT proof of fraud or illicit activity.',
        });
      }

      // ----------------------------------------------------
      // RISK INDICATOR 2: HIGH VOLATILITY
      // ----------------------------------------------------
      if (item.asset.volatility === 'HIGH' || item.asset.volatility === 'EXTREME') {
        riskIndicators.push({
          code: 'HIGH_VOLATILITY',
          name: `Elevated Volatility (${item.asset.symbol})`,
          severity: item.asset.volatility === 'EXTREME' ? 'HIGH' : 'MEDIUM',
          description: `${item.asset.name} exhibits ${item.asset.volatility30dPercent}% annualized 30-day volatility. Expect sharp price fluctuations.`,
          metricObserved: `${item.asset.volatility30dPercent}% 30-day volatility`,
          disclaimer: 'Risk observation only — NOT proof of fraud or illicit activity.',
        });
      }

      // ----------------------------------------------------
      // RISK INDICATOR 3: ABNORMAL 24H PRICE MOVEMENT
      // ----------------------------------------------------
      if (Math.abs(item.asset.change24hPercent) >= 8.0) {
        riskIndicators.push({
          code: 'ABNORMAL_PRICE_MOVEMENT',
          name: `Abnormal Intraday Movement (${item.asset.symbol}: ${item.asset.change24hPercent}%)`,
          severity: 'MEDIUM',
          description: `Rapid 24-hour price displacement of ${item.asset.change24hPercent}% detected. Monitor support/resistance levels.`,
          metricObserved: `${item.asset.change24hPercent}% in 24h`,
          disclaimer: 'Risk observation only — NOT proof of fraud or illicit activity.',
        });
      }

      // ----------------------------------------------------
      // RISK INDICATOR 4: LIQUIDITY OR VOLUME SURGE
      // ----------------------------------------------------
      if (item.asset.marketCapUsd && item.asset.volume24hUsd) {
        const turnoverRatio = item.asset.volume24hUsd / item.asset.marketCapUsd;
        if (turnoverRatio < 0.015) {
          riskIndicators.push({
            code: 'LIQUIDITY_CONCERN',
            name: `Low Relative Liquidity (${item.asset.symbol})`,
            severity: 'LOW',
            description: `24-hour volume represents only ${(turnoverRatio * 100).toFixed(2)}% of total market capitalization. High slippage may occur during large liquidations.`,
            metricObserved: `${(turnoverRatio * 100).toFixed(2)}% volume-to-cap ratio`,
            disclaimer: 'Risk observation only — NOT proof of fraud or illicit activity.',
          });
        }
      }
    }

    allocations.sort((a, b) => b.valueUsd - a.valueUsd);
    holdingsWithMarket.sort((a, b) => b.currentValueUsd - a.currentValueUsd);

    const summary: CryptoPortfolioSummary = {
      totalCurrentValueUsd: Number(totalCurrentValueUsd.toFixed(2)),
      totalCurrentValueInr,
      totalInvestedValueUsd: Number(totalInvestedValueUsd.toFixed(2)),
      totalUnrealizedGainLossUsd,
      totalUnrealizedGainLossPercent,
      holdingsCount: holdings.length,
      allocations,
      riskIndicators,
      calculatedAtEpochMs: Date.now(),
    };

    return { summary, holdingsWithMarket };
  }

  // ==========================================
  // ALERTS MANAGEMENT
  // ==========================================

  getAlerts(): CryptoAlert[] {
    return Array.from(this.alerts.values());
  }

  createAlert(alert: Omit<CryptoAlert, 'id' | 'createdAtEpochMs' | 'isTriggered'>): CryptoAlert {
    const id = `calert_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newAlert: CryptoAlert = {
      id,
      symbol: alert.symbol.trim().toUpperCase(),
      direction: alert.direction,
      targetPriceUsd: alert.targetPriceUsd,
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

  async evaluateAlerts(): Promise<CryptoAlert[]> {
    const triggered: CryptoAlert[] = [];
    for (const alert of this.alerts.values()) {
      if (!alert.isActive || alert.isTriggered) continue;
      const asset = await this.assetRepo.getAsset(alert.symbol);
      if (!asset) continue;

      let isTriggered = false;
      if (alert.direction === 'PRICE_ABOVE' && alert.targetPriceUsd && asset.priceUsd >= alert.targetPriceUsd) {
        isTriggered = true;
      } else if (alert.direction === 'PRICE_BELOW' && alert.targetPriceUsd && asset.priceUsd <= alert.targetPriceUsd) {
        isTriggered = true;
      } else if (alert.direction === 'PERCENT_SPIKE_24H' && alert.thresholdPercent && asset.change24hPercent >= alert.thresholdPercent) {
        isTriggered = true;
      } else if (alert.direction === 'PERCENT_DROP_24H' && alert.thresholdPercent && asset.change24hPercent <= -alert.thresholdPercent) {
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

  // INVARIANT: DO NOT EXECUTE TRADES
  executeTrade(): never {
    throw new Error('Trade execution is strictly prohibited. Apka Dhan AI is a non-custodial read-only intelligence monitor.');
  }
}

// Global Singletons
export const globalCryptoAssetRepository = new CryptoAssetRepository(globalCryptoDataProvider);
export const globalCryptoWatchlistRepository = new CryptoWatchlistRepository();
export const globalCryptoHoldingRepository = new CryptoHoldingRepository();
export const globalCryptoPortfolioRepository = new CryptoPortfolioRepository(
  globalCryptoHoldingRepository,
  globalCryptoAssetRepository
);
