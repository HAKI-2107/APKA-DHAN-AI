import test, { describe } from 'node:test';
import assert from 'node:assert';
import { GovernmentDataCatalog } from '../src/engine/dataSource/GovernmentDataCatalog';
import { ApiSetuCatalog } from '../src/engine/dataSource/ApiSetuCatalog';
import { LiveMarketDataProvider } from '../src/engine/dataSource/LiveMarketDataProvider';
import { LiveCryptoDataProvider } from '../src/engine/dataSource/LiveCryptoDataProvider';
import { DataFreshnessService } from '../src/engine/dataSource/DataFreshnessService';
import { UnifiedPortfolioEngine } from '../src/engine/unifiedPortfolio/unifiedPortfolioEngine';

describe('Data Source & Provenance Layer (data.gov.in & API Setu)', () => {
  // -----------------------------------------------------------------
  // 1. data.gov.in Government Open Data
  // -----------------------------------------------------------------
  test('data.gov.in: UPI transaction statistics carry verifiable provenance and historical status', () => {
    const res = GovernmentDataCatalog.getUpiTransactions();

    assert.strictEqual(res.isLive, false, 'Government data.gov.in historical dataset must NOT be marked live');
    assert.strictEqual(res.status, 'HISTORICAL');
    assert.strictEqual(res.provenance.isHistorical, true);
    assert.ok(res.data.length >= 4, 'Must return at least 4 financial years of records');
    assert.ok(res.provenance.sourceOrganization.includes('Ministry of Electronics'));
    assert.ok(res.provenance.sourceUrl.includes('data.gov.in'));
  });

  test('data.gov.in: UPI fraud statistics contain ombudsman trends without claiming to be live blacklists', () => {
    const res = GovernmentDataCatalog.getUpiFraudStatistics();

    assert.strictEqual(res.status, 'HISTORICAL');
    assert.ok(res.data.length > 0);
    assert.ok(res.provenance.datasetTitle.includes('Unified Payments Interface (UPI) Frauds'));
    for (const record of res.data) {
      assert.ok(record.financialYear);
      assert.ok(record.reportedFraudCount > 0);
      assert.ok(record.fraudToSalesBasisPoints > 0);
    }
  });

  test('data.gov.in: MCA Company Master Data preserves source data date distinctly from retrieval date', () => {
    const res = GovernmentDataCatalog.searchMcaCompany('RELIANCE');

    assert.ok(res.data.length > 0, 'Should find Reliance Industries record');
    const company = res.data[0];
    assert.strictEqual(company.cin, 'L17110MH1973PLC019786');
    assert.strictEqual(company.dataDate, '2023-11-03', 'Must preserve original source cutoff date 2023-11-03');
    assert.strictEqual(res.provenance.underlyingDataDate, '2023-11-03 (Statutory cutoff date recorded at source)');
  });

  // -----------------------------------------------------------------
  // 2. API Setu Integration
  // -----------------------------------------------------------------
  test('API Setu: Catalog categorizes Banking, Insurance, and Company verification APIs', () => {
    const dir = ApiSetuCatalog.getDirectory();
    assert.ok(dir.length >= 5);

    const categories = new Set(dir.map((a) => a.category));
    assert.ok(categories.has('Company Verification'));
    assert.ok(categories.has('Banking'));
    assert.ok(categories.has('Finance'));
  });

  test('API Setu: Protected or unapproved APIs return REQUIRES_APPROVAL without faking credentials', () => {
    const res = ApiSetuCatalog.testSandbox('apisetu_npci_vpa_02', { vpa: 'test@okaxis' });
    assert.strictEqual(res.status, 'REQUIRES_APPROVAL');
    assert.strictEqual(res.confidence, 'UNVERIFIED');
    assert.ok(res.error?.includes('requires organizational clearance'));
  });

  test('API Setu: Sandbox enabled APIs return validated sandbox data labeled SANDBOX DATA', () => {
    const res = ApiSetuCatalog.testSandbox('apisetu_mca_cin_01', { cin: 'L17110MH1973PLC019786' });
    assert.strictEqual(res.status, 'AVAILABLE_SANDBOX');
    assert.ok(res.data.sandboxNotice.includes('SANDBOX DATA'));
    assert.ok(res.latencyMs && res.latencyMs > 0);
  });
});

describe('Live Market & Crypto Providers with Stale Detection & Portfolio Sync', () => {
  test('LiveMarketDataProvider calculates transport latency, data age, and handles disconnection', () => {
    const provider = new LiveMarketDataProvider();
    const quoteRes = provider.getQuote('RELIANCE.NS');

    assert.ok(quoteRes.data);
    assert.strictEqual(quoteRes.isLive, true);
    assert.strictEqual(quoteRes.status, 'LIVE');
    assert.ok(quoteRes.latencyMs !== undefined && quoteRes.latencyMs > 0);

    // Simulate network disconnect
    provider.setConnectionState(false);
    const staleQuote = provider.getQuote('RELIANCE.NS');
    assert.strictEqual(staleQuote.status, 'STALE');
    assert.strictEqual(staleQuote.isLive, false);
    assert.strictEqual(staleQuote.isCached, true);

    // Reconnect
    provider.setConnectionState(true);
    assert.strictEqual(provider.getQuote('RELIANCE.NS').status, 'LIVE');
  });

  test('LiveCryptoDataProvider maintains live quote metrics and spot risk signals', () => {
    const provider = new LiveCryptoDataProvider();
    const btc = provider.getQuote('BTC');

    assert.ok(btc.data);
    assert.strictEqual(btc.data?.pair, 'BTC/INR');
    assert.ok(btc.data?.priceInr > 1000000);
    assert.ok(btc.data?.riskSignals.length > 0);
  });

  test('Portfolio recalculation responds in real time to market ticks', () => {
    const portfolio = new UnifiedPortfolioEngine();
    const initial = portfolio.calculateAssessment();
    const relPosBefore = initial.positions.find((p) => p.holding.symbolOrIdentifier === 'RELIANCE.NS');
    assert.ok(relPosBefore);

    // Simulate price increase for RELIANCE from 2980.50 to 3200.00
    portfolio.updatePriceBySymbol('RELIANCE.NS', 3200.00);
    const updated = portfolio.calculateAssessment();
    const relPosAfter = updated.positions.find((p) => p.holding.symbolOrIdentifier === 'RELIANCE.NS');
    assert.ok(relPosAfter);

    assert.strictEqual(relPosAfter.holding.currentPrice, 3200.00);
    assert.ok(relPosAfter.currentValue > relPosBefore.currentValue);
    assert.ok(updated.totalCurrentValue > initial.totalCurrentValue);
    assert.ok(updated.totalUnrealizedPnL > initial.totalUnrealizedPnL);
  });
});
