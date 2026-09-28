import {
  CryptoDataProvider,
  CryptoAsset,
  CryptoHistoricalPoint,
  CryptoHistoricalRange,
  CryptoSearchResult,
  VolatilityCategory,
} from './types';

interface InternalCryptoSeed {
  id: string;
  symbol: string;
  name: string;
  basePriceUsd: number;
  marketCapRank: number;
  marketCapUsd: number;
  volume24hUsd: number;
  circulatingSupply: number;
  volatility: VolatilityCategory;
  volatility30dPercent: number;
}

const USD_TO_INR_RATE = 85.5; // Standard INR foreign exchange benchmark

const CRYPTO_UNIVERSE: InternalCryptoSeed[] = [
  {
    id: 'bitcoin',
    symbol: 'BTC',
    name: 'Bitcoin',
    basePriceUsd: 64200.0,
    marketCapRank: 1,
    marketCapUsd: 1265000000000,
    volume24hUsd: 28500000000,
    circulatingSupply: 19750000,
    volatility: 'MODERATE',
    volatility30dPercent: 42.5,
  },
  {
    id: 'ethereum',
    symbol: 'ETH',
    name: 'Ethereum',
    basePriceUsd: 3450.0,
    marketCapRank: 2,
    marketCapUsd: 415000000000,
    volume24hUsd: 14200000000,
    circulatingSupply: 120400000,
    volatility: 'MODERATE',
    volatility30dPercent: 48.2,
  },
  {
    id: 'solana',
    symbol: 'SOL',
    name: 'Solana',
    basePriceUsd: 148.5,
    marketCapRank: 5,
    marketCapUsd: 69200000000,
    volume24hUsd: 3800000000,
    circulatingSupply: 466000000,
    volatility: 'HIGH',
    volatility30dPercent: 68.4,
  },
  {
    id: 'binancecoin',
    symbol: 'BNB',
    name: 'BNB',
    basePriceUsd: 585.0,
    marketCapRank: 4,
    marketCapUsd: 85400000000,
    volume24hUsd: 1100000000,
    circulatingSupply: 146000000,
    volatility: 'MODERATE',
    volatility30dPercent: 36.1,
  },
  {
    id: 'ripple',
    symbol: 'XRP',
    name: 'XRP',
    basePriceUsd: 0.58,
    marketCapRank: 7,
    marketCapUsd: 32800000000,
    volume24hUsd: 950000000,
    circulatingSupply: 56500000000,
    volatility: 'HIGH',
    volatility30dPercent: 62.0,
  },
  {
    id: 'cardano',
    symbol: 'ADA',
    name: 'Cardano',
    basePriceUsd: 0.38,
    marketCapRank: 11,
    marketCapUsd: 13600000000,
    volume24hUsd: 320000000,
    circulatingSupply: 35700000000,
    volatility: 'MODERATE',
    volatility30dPercent: 54.3,
  },
  {
    id: 'dogecoin',
    symbol: 'DOGE',
    name: 'Dogecoin',
    basePriceUsd: 0.11,
    marketCapRank: 9,
    marketCapUsd: 16100000000,
    volume24hUsd: 880000000,
    circulatingSupply: 146000000000,
    volatility: 'EXTREME',
    volatility30dPercent: 88.5,
  },
  {
    id: 'avalanche-2',
    symbol: 'AVAX',
    name: 'Avalanche',
    basePriceUsd: 28.5,
    marketCapRank: 13,
    marketCapUsd: 11300000000,
    volume24hUsd: 410000000,
    circulatingSupply: 396000000,
    volatility: 'HIGH',
    volatility30dPercent: 71.0,
  },
  {
    id: 'polkadot',
    symbol: 'DOT',
    name: 'Polkadot',
    basePriceUsd: 4.8,
    marketCapRank: 16,
    marketCapUsd: 6900000000,
    volume24hUsd: 180000000,
    circulatingSupply: 1430000000,
    volatility: 'HIGH',
    volatility30dPercent: 64.2,
  },
  {
    id: 'shiba-inu',
    symbol: 'SHIB',
    name: 'Shiba Inu',
    basePriceUsd: 0.000018,
    marketCapRank: 14,
    marketCapUsd: 10600000000,
    volume24hUsd: 540000000,
    circulatingSupply: 589000000000000,
    volatility: 'EXTREME',
    volatility30dPercent: 94.0,
  },
];

/**
 * APKA DHAN AI - MOCK CRYPTO DATA PROVIDER
 * 
 * Provides simulated crypto quotes, historical time series, 24h movements,
 * volume, market cap, and volatility metrics.
 * 
 * ZERO PRICE FABRICATION:
 * Invariant: Never claims to be connected to live exchange WebSockets.
 * Architecture matches production specifications for CoinGecko / Binance feeds.
 */
export class MockCryptoDataProvider implements CryptoDataProvider {
  readonly providerName = 'MockCryptoDataProvider (Synthetic Offline Spec)';
  readonly isLiveFeed = false;

  private assetMap: Map<string, InternalCryptoSeed> = new Map();

  constructor() {
    for (const a of CRYPTO_UNIVERSE) {
      this.assetMap.set(a.symbol.toUpperCase(), a);
      this.assetMap.set(a.id.toLowerCase(), a);
    }
  }

  async getAsset(symbolOrId: string): Promise<CryptoAsset | null> {
    const key = symbolOrId.trim();
    const seed = this.assetMap.get(key.toUpperCase()) || this.assetMap.get(key.toLowerCase());
    if (!seed) return null;

    const hash = this.getHash(seed.symbol);
    // Deterministic 24h change factor (-6.0% to +8.0%)
    const changeFactor = ((hash % 140) - 60) / 1000;
    const priceUsd = Number((seed.basePriceUsd * (1 + changeFactor)).toFixed(seed.basePriceUsd < 1 ? 6 : 2));
    const priceInr = Number((priceUsd * USD_TO_INR_RATE).toFixed(seed.basePriceUsd < 1 ? 4 : 2));
    const change24hPercent = Number((changeFactor * 100).toFixed(2));
    const high24hUsd = Number((priceUsd * 1.035).toFixed(seed.basePriceUsd < 1 ? 6 : 2));
    const low24hUsd = Number((priceUsd * 0.965).toFixed(seed.basePriceUsd < 1 ? 6 : 2));

    return {
      id: seed.id,
      symbol: seed.symbol,
      name: seed.name,
      priceUsd,
      priceInr,
      change24hPercent,
      high24hUsd,
      low24hUsd,
      marketCapUsd: seed.marketCapUsd,
      volume24hUsd: seed.volume24hUsd,
      marketCapRank: seed.marketCapRank,
      circulatingSupply: seed.circulatingSupply,
      volatility: seed.volatility,
      volatility30dPercent: seed.volatility30dPercent,
      timestampEpochMs: Date.now(),
      isMockFeed: true, // Invariant: Zero invented live data
    };
  }

  async getAssets(symbolsOrIds: string[]): Promise<Map<string, CryptoAsset>> {
    const results = new Map<string, CryptoAsset>();
    for (const sym of symbolsOrIds) {
      const asset = await this.getAsset(sym);
      if (asset) {
        results.set(asset.symbol.toUpperCase(), asset);
      }
    }
    return results;
  }

  async searchAssets(query: string): Promise<CryptoSearchResult[]> {
    const cleanQ = query.trim().toLowerCase();
    if (!cleanQ) {
      return CRYPTO_UNIVERSE.slice(0, 8).map((c) => ({
        id: c.id,
        symbol: c.symbol,
        name: c.name,
        marketCapRank: c.marketCapRank,
        priceUsd: c.basePriceUsd,
        change24hPercent: 2.45,
      }));
    }

    const matches = CRYPTO_UNIVERSE.filter(
      (c) =>
        c.symbol.toLowerCase().includes(cleanQ) ||
        c.name.toLowerCase().includes(cleanQ) ||
        c.id.toLowerCase().includes(cleanQ)
    );

    return matches.map((c) => ({
      id: c.id,
      symbol: c.symbol,
      name: c.name,
      marketCapRank: c.marketCapRank,
      priceUsd: c.basePriceUsd,
      change24hPercent: 1.85,
    }));
  }

  async getHistoricalData(symbolOrId: string, range: CryptoHistoricalRange): Promise<CryptoHistoricalPoint[]> {
    const key = symbolOrId.trim();
    const seed = this.assetMap.get(key.toUpperCase()) || this.assetMap.get(key.toLowerCase());
    const basePrice = seed ? seed.basePriceUsd : 100.0;
    const baseVol = seed ? seed.volume24hUsd : 10000000;
    const hash = this.getHash(seed ? seed.symbol : key);

    let numPoints = 30;
    let stepMs = 24 * 60 * 60 * 1000;

    switch (range) {
      case '24H':
        numPoints = 24;
        stepMs = 60 * 60 * 1000;
        break;
      case '7D':
        numPoints = 28;
        stepMs = 6 * 60 * 60 * 1000;
        break;
      case '30D':
        numPoints = 30;
        stepMs = 24 * 60 * 60 * 1000;
        break;
      case '90D':
        numPoints = 45;
        stepMs = 2 * 24 * 60 * 60 * 1000;
        break;
      case '1Y':
        numPoints = 52;
        stepMs = 7 * 24 * 60 * 60 * 1000;
        break;
    }

    const points: CryptoHistoricalPoint[] = [];
    const now = Date.now();
    let currentPrice = basePrice * 0.88;

    for (let i = numPoints; i >= 0; i--) {
      const timestamp = now - i * stepMs;
      const date = new Date(timestamp);
      const dateStr = range === '24H' ? date.toLocaleTimeString() : date.toISOString().split('T')[0];

      const wave = Math.sin((i + hash) * 0.45) * (basePrice * 0.05);
      const trend = ((numPoints - i) / numPoints) * (basePrice * 0.14);
      const priceUsd = Number(
        Math.max(basePrice * 0.4, currentPrice + wave + trend).toFixed(basePrice < 1 ? 6 : 2)
      );
      const volumeUsd = Math.floor(baseVol * (0.8 + Math.abs(Math.cos(i + hash)) * 0.4));

      points.push({
        timestampEpochMs: timestamp,
        dateStr,
        priceUsd,
        volumeUsd,
      });

      currentPrice = priceUsd;
    }

    return points;
  }

  private getHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  }
}

export const globalCryptoDataProvider = new MockCryptoDataProvider();
