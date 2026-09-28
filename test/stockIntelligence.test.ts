import test, { describe } from 'node:test';
import assert from 'node:assert';
import { MockMarketDataProvider } from '../src/engine/stockIntelligence/MockMarketDataProvider';
import {
  StockRepository,
  WatchlistRepository,
  HoldingRepository,
  PortfolioRepository,
} from '../src/engine/stockIntelligence/repositories';

describe('Stock Intelligence Module - MarketDataProvider & Repositories', () => {
  const provider = new MockMarketDataProvider();
  const stockRepo = new StockRepository(provider);
  const watchlistRepo = new WatchlistRepository();
  const holdingRepo = new HoldingRepository();
  const portfolioRepo = new PortfolioRepository(holdingRepo, stockRepo);

  // ----------------------------------------------------
  // TEST 1: MarketDataProvider & Stock Quotes
  // ----------------------------------------------------
  test('MarketDataProvider fetches stock quote with price and daily percentage movement', async () => {
    const quote = await provider.getQuote('RELIANCE.NS');
    assert.ok(quote, 'Should return quote for RELIANCE.NS');
    assert.strictEqual(quote.symbol, 'RELIANCE.NS');
    assert.ok(quote.currentPrice > 0, 'Current price must be positive');
    assert.ok(quote.previousClose > 0, 'Previous close must be positive');
    assert.ok(typeof quote.dayChangePercent === 'number', 'Day change percent must be numeric');
    assert.strictEqual(quote.currency, 'INR');
    assert.strictEqual(quote.isMockData, true, 'Zero invented live data invariant');
  });

  test('MarketDataProvider fetches historical price series', async () => {
    const history1M = await provider.getHistoricalData('TCS.NS', '1M');
    assert.ok(history1M.length >= 25, '1M range should have approximately 30 data points');
    const firstPoint = history1M[0];
    assert.ok(firstPoint.close > 0, 'Historical close must be positive');
    assert.ok(firstPoint.dateStr, 'Must contain date string');
  });

  test('MarketDataProvider searches stocks by symbol, name, or sector', async () => {
    const results = await provider.searchStocks('HDFC');
    assert.ok(results.length > 0, 'Should find HDFC related stocks');
    assert.ok(results.some((r) => r.symbol === 'HDFCBANK.NS'));
  });

  // ----------------------------------------------------
  // TEST 2: WatchlistRepository
  // ----------------------------------------------------
  test('WatchlistRepository creates watchlists and manages symbols', () => {
    const initialLists = watchlistRepo.getAll();
    assert.ok(initialLists.length >= 1, 'Should have default watchlist');

    const custom = watchlistRepo.createWatchlist('Tech & Growth', ['TCS.NS', 'INFY.NS']);
    assert.strictEqual(custom.name, 'Tech & Growth');
    assert.strictEqual(custom.symbols.length, 2);

    // Add symbol
    const added = watchlistRepo.addSymbol(custom.id, 'ZOMATO.NS');
    assert.strictEqual(added, true);
    assert.ok(watchlistRepo.getById(custom.id)!.symbols.includes('ZOMATO.NS'));

    // Remove symbol
    const removed = watchlistRepo.removeSymbol(custom.id, 'TCS.NS');
    assert.strictEqual(removed, true);
    assert.strictEqual(watchlistRepo.getById(custom.id)!.symbols.includes('TCS.NS'), false);
  });

  // ----------------------------------------------------
  // TEST 3: HoldingRepository
  // ----------------------------------------------------
  test('HoldingRepository tracks user holdings', () => {
    const newHold = holdingRepo.addHolding({
      symbol: 'INFY.NS',
      shares: 50,
      averageBuyPrice: 1750.0,
      buyDateEpochMs: Date.now(),
      notes: 'Quarterly SIP buy',
    });

    assert.ok(newHold.id, 'New holding must have generated ID');
    assert.strictEqual(newHold.symbol, 'INFY.NS');

    const retrieved = holdingRepo.getBySymbol('INFY.NS');
    assert.ok(retrieved);
    assert.strictEqual(retrieved.shares, 50);

    // Update
    holdingRepo.updateHolding(newHold.id, { shares: 75 });
    assert.strictEqual(holdingRepo.getById(newHold.id)!.shares, 75);

    // Clean up
    holdingRepo.removeHolding(newHold.id);
    assert.strictEqual(holdingRepo.getById(newHold.id), null);
  });

  // ----------------------------------------------------
  // TEST 4: PortfolioRepository (Value, P/L, Allocation)
  // ----------------------------------------------------
  test('PortfolioRepository calculates portfolio value, unrealized gain/loss, and allocation', async () => {
    const { summary, holdingsWithMarket } = await portfolioRepo.getPortfolioSummary();

    assert.ok(summary.totalCurrentValue > 0, 'Total current value must be positive');
    assert.ok(summary.totalInvestedValue > 0, 'Total invested value must be positive');
    assert.ok(typeof summary.totalUnrealizedGainLoss === 'number');
    assert.ok(typeof summary.totalUnrealizedGainLossPercent === 'number');
    assert.ok(summary.holdingsCount >= 4, 'Should include initial default holdings');

    // Allocation check
    assert.ok(summary.sectorAllocations.length > 0, 'Must produce sector allocations');
    const totalSectorPct = summary.sectorAllocations.reduce((acc, s) => acc + s.percentage, 0);
    assert.ok(Math.abs(totalSectorPct - 100) < 1.0, 'Sector allocations should sum near 100%');

    // Individual holdings enriched
    assert.ok(holdingsWithMarket.length >= 4);
    const rel = holdingsWithMarket.find((h) => h.holding.symbol === 'RELIANCE.NS');
    assert.ok(rel);
    assert.ok(rel.currentValue > 0);
    assert.ok(rel.portfolioWeightPercent > 0);
  });

  // ----------------------------------------------------
  // TEST 5: Alerts System
  // ----------------------------------------------------
  test('PortfolioRepository creates and evaluates stock price alerts', async () => {
    const alert = portfolioRepo.createAlert({
      symbol: 'TCS.NS',
      direction: 'PRICE_ABOVE',
      targetPrice: 3000.0, // TCS price is ~4200, so it should trigger immediately
      isActive: true,
      note: 'Target price reached',
    });

    assert.ok(alert.id);
    const triggered = await portfolioRepo.evaluateAlerts();
    assert.ok(triggered.some((a) => a.id === alert.id), 'TCS alert should trigger above 3000');

    // Clean up
    portfolioRepo.deleteAlert(alert.id);
  });

  // ----------------------------------------------------
  // TEST 6: Constitutional Invariant: NO AUTOMATIC BUY/SELL DECISIONS
  // ----------------------------------------------------
  test('Constitutional Invariant: Explanation provides educational facts without BUY/SELL commands', () => {
    const explanation = portfolioRepo.getEducationalExplanation('RELIANCE.NS');

    assert.ok(explanation.disclaimer.includes('NEVER issues automated buy, sell, or trade recommendations'));
    assert.strictEqual(
      /(?:buy now|sell now|strong buy|strong sell|target price target hit execute order)/i.test(
        explanation.factualExplanation
      ),
      false,
      'Explanation must not issue algorithmic trade orders'
    );
  });
});
