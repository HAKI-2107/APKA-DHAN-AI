import test, { describe } from 'node:test';
import assert from 'node:assert';
import { MockCryptoDataProvider } from '../src/engine/cryptoIntelligence/MockCryptoDataProvider';
import {
  CryptoAssetRepository,
  CryptoWatchlistRepository,
  CryptoHoldingRepository,
  CryptoPortfolioRepository,
} from '../src/engine/cryptoIntelligence/repositories';

describe('Crypto Intelligence Module - Data Provider, Repositories & Safeguards', () => {
  const provider = new MockCryptoDataProvider();
  const assetRepo = new CryptoAssetRepository(provider);
  const watchlistRepo = new CryptoWatchlistRepository();
  const holdingRepo = new CryptoHoldingRepository();
  const portfolioRepo = new CryptoPortfolioRepository(holdingRepo, assetRepo);

  // ----------------------------------------------------
  // TEST 1: Market Data Provider & Price Invariants
  // ----------------------------------------------------
  test('CryptoDataProvider provides prices, 24h change, market cap, volume, and volatility without fabricating live feeds', async () => {
    const btc = await provider.getAsset('BTC');
    assert.ok(btc, 'Should return Bitcoin asset');
    assert.strictEqual(btc.symbol, 'BTC');
    assert.ok(btc.priceUsd > 10000, 'BTC price must be realistically scaled');
    assert.ok(btc.priceInr > 0, 'INR price must be computed');
    assert.ok(typeof btc.change24hPercent === 'number', '24h change must be numeric');
    assert.ok(btc.marketCapUsd && btc.marketCapUsd > 1000000000, 'Market cap must be available');
    assert.ok(btc.volume24hUsd && btc.volume24hUsd > 10000000, 'Trading volume must be available');
    assert.ok(btc.volatility, 'Volatility level must be categorized');
    assert.strictEqual(btc.isMockFeed, true, 'Zero invented live data invariant');
    assert.strictEqual(provider.isLiveFeed, false);
  });

  test('CryptoDataProvider generates historical data points across ranges', async () => {
    const history30D = await provider.getHistoricalData('ETH', '30D');
    assert.ok(history30D.length >= 25, '30D range should return daily points');
    assert.ok(history30D[0].priceUsd > 0, 'Historical price must be positive');
    assert.ok(history30D[0].volumeUsd > 0, 'Historical volume must be positive');
  });

  test('CryptoDataProvider searches assets by symbol or name', async () => {
    const search = await provider.searchAssets('Solana');
    assert.ok(search.length > 0);
    assert.ok(search.some((s) => s.symbol === 'SOL'));
  });

  // ----------------------------------------------------
  // TEST 2: Watchlist Repository
  // ----------------------------------------------------
  test('CryptoWatchlistRepository creates and manages custom watchlists', () => {
    const lists = watchlistRepo.getAll();
    assert.ok(lists.length >= 1, 'Should have default watchlist');

    const custom = watchlistRepo.createWatchlist('Layer 1 Tokens', ['ETH', 'SOL']);
    assert.strictEqual(custom.name, 'Layer 1 Tokens');
    assert.strictEqual(custom.symbols.length, 2);

    watchlistRepo.addSymbol(custom.id, 'AVAX');
    assert.ok(watchlistRepo.getById(custom.id)!.symbols.includes('AVAX'));

    watchlistRepo.removeSymbol(custom.id, 'ETH');
    assert.strictEqual(watchlistRepo.getById(custom.id)!.symbols.includes('ETH'), false);
  });

  // ----------------------------------------------------
  // TEST 3: Holding & Portfolio Calculations
  // ----------------------------------------------------
  test('CryptoPortfolioRepository calculates values, allocations, and unrealized gains', async () => {
    const { summary, holdingsWithMarket } = await portfolioRepo.getPortfolioSummary();

    assert.ok(summary.totalCurrentValueUsd > 0, 'Total USD value must be positive');
    assert.ok(summary.totalCurrentValueInr > 0, 'Total INR value must be positive');
    assert.ok(summary.totalInvestedValueUsd > 0, 'Total invested USD must be positive');
    assert.ok(typeof summary.totalUnrealizedGainLossUsd === 'number');
    assert.ok(summary.holdingsCount >= 2);
    assert.ok(summary.allocations.length >= 2, 'Allocations must be computed');

    const totalPct = summary.allocations.reduce((acc, a) => acc + a.percentage, 0);
    assert.ok(Math.abs(totalPct - 100) < 1.5, 'Allocations should sum near 100%');

    assert.ok(holdingsWithMarket.length >= 2);
    const btcHold = holdingsWithMarket.find((h) => h.holding.symbol === 'BTC');
    assert.ok(btcHold);
    assert.ok(btcHold.currentValueUsd > 0);
  });

  // ----------------------------------------------------
  // TEST 4: Risk Indicators (Must NOT Call Proof of Fraud)
  // ----------------------------------------------------
  test('Risk Indicators are descriptive observations and strictly do NOT declare fraud', async () => {
    const { summary } = await portfolioRepo.getPortfolioSummary();

    assert.ok(Array.isArray(summary.riskIndicators));
    for (const indicator of summary.riskIndicators) {
      assert.ok(indicator.code, 'Indicator must have code');
      assert.ok(indicator.description, 'Indicator must have description');
      assert.ok(indicator.metricObserved, 'Indicator must disclose factual metric');
      // CONSTITUTIONAL REQUIREMENT: "Do not call these indicators proof of fraud."
      assert.ok(
        indicator.disclaimer.includes('NOT proof of fraud'),
        'Disclaimer must explicitly state this is not proof of fraud'
      );
      assert.strictEqual(
        /fraud|criminal|scammer|thief/i.test(indicator.name),
        false,
        'Indicator name must not accuse of fraud'
      );
    }
  });

  // ----------------------------------------------------
  // TEST 5: Alerts Management
  // ----------------------------------------------------
  test('CryptoPortfolioRepository creates and evaluates alerts', async () => {
    const alert = portfolioRepo.createAlert({
      symbol: 'BTC',
      direction: 'PRICE_ABOVE',
      targetPriceUsd: 50000.0, // BTC is > 60k, so triggers immediately
      isActive: true,
      note: 'Bitcoin above 50k milestone',
    });

    assert.ok(alert.id);
    const triggered = await portfolioRepo.evaluateAlerts();
    assert.ok(triggered.some((a) => a.id === alert.id));

    portfolioRepo.deleteAlert(alert.id);
  });

  // ----------------------------------------------------
  // TEST 6: Strict Security Guardrails & Invariants
  // ----------------------------------------------------
  test('Security Guardrail: Rejects private keys, seed phrases, and passwords', () => {
    assert.throws(
      () => {
        holdingRepo.addHolding({
          assetId: 'bitcoin',
          symbol: 'BTC',
          amount: 1.0,
          averageBuyPriceUsd: 60000,
          buyDateEpochMs: Date.now(),
          storageType: 'HARDWARE',
          privateKey: '0x1234567890abcdef1234567890abcdef1234567890abcdef',
        } as any);
      },
      /Security Violation/i,
      'Must reject privateKey'
    );

    assert.throws(
      () => {
        holdingRepo.addHolding({
          assetId: 'ethereum',
          symbol: 'ETH',
          amount: 2.0,
          averageBuyPriceUsd: 3000,
          buyDateEpochMs: Date.now(),
          storageType: 'NON_CUSTODIAL',
          seedPhrase: 'apple banana cherry dog elephant fox grape horse igloo',
        } as any);
      },
      /Security Violation/i,
      'Must reject seedPhrase'
    );
  });

  test('Security Guardrail: Do not execute trades', () => {
    assert.throws(
      () => {
        portfolioRepo.executeTrade();
      },
      /Trade execution is strictly prohibited/i,
      'Must forbid trade execution'
    );
  });
});
