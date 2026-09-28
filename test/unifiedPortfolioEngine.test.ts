import test, { describe } from 'node:test';
import assert from 'node:assert';
import { UnifiedPortfolioEngine } from '../src/engine/unifiedPortfolio/unifiedPortfolioEngine';
import { UnifiedAssetHolding } from '../src/engine/unifiedPortfolio/types';

describe('Unified Portfolio Engine - Calculations & Risk Signals', () => {
  const engine = new UnifiedPortfolioEngine();

  // ----------------------------------------------------
  // TEST 1: Multi-Asset Support & Basic Valuation
  // ----------------------------------------------------
  test('Engine supports Stocks, Mutual Funds, ETFs, and Crypto simultaneously', () => {
    const assessment = engine.calculateAssessment();

    assert.ok(assessment.positionsCount >= 4, 'Should contain positions across all asset classes');
    const assetClasses = new Set(assessment.positions.map((p) => p.holding.assetClass));
    assert.ok(assetClasses.has('STOCKS'), 'Must include Stocks');
    assert.ok(assetClasses.has('MUTUAL_FUNDS'), 'Must include Mutual Funds');
    assert.ok(assetClasses.has('ETFS'), 'Must include ETFs');
    assert.ok(assetClasses.has('CRYPTO'), 'Must include Crypto');
  });

  test('Calculates invested amount, current value, unrealized P/L, and percentage return accurately', () => {
    const assessment = engine.calculateAssessment();

    assert.ok(assessment.totalInvestedAmount > 0, 'Invested amount must be positive');
    assert.ok(assessment.totalCurrentValue > 0, 'Current value must be positive');
    assert.strictEqual(
      Number((assessment.totalCurrentValue - assessment.totalInvestedAmount).toFixed(2)),
      assessment.totalUnrealizedPnL,
      'Unrealized PnL must equal Current Value - Invested Amount'
    );

    const expectedPct = Number(
      ((assessment.totalUnrealizedPnL / assessment.totalInvestedAmount) * 100).toFixed(2)
    );
    assert.strictEqual(
      assessment.totalPercentageReturn,
      expectedPct,
      'Percentage return must equal (PnL / Invested) * 100'
    );
  });

  // ----------------------------------------------------
  // TEST 2: Asset Allocation & Category Exposure
  // ----------------------------------------------------
  test('Calculates asset allocation and category exposure summing to 100%', () => {
    const assessment = engine.calculateAssessment();

    assert.ok(assessment.assetClassExposures.length >= 4);
    const totalClassPct = assessment.assetClassExposures.reduce((sum, a) => sum + a.percentage, 0);
    assert.ok(Math.abs(totalClassPct - 100) < 1.0, 'Asset class allocations must sum near 100%');

    assert.ok(assessment.categoryExposures.length > 0);
    const totalCatPct = assessment.categoryExposures.reduce((sum, c) => sum + c.percentage, 0);
    assert.ok(Math.abs(totalCatPct - 100) < 1.0, 'Category exposures must sum near 100%');
  });

  // ----------------------------------------------------
  // TEST 3: Concentration & Risk Signal Generation
  // ----------------------------------------------------
  test('A portfolio with an unusually high percentage in one asset produces "High concentration detected" rather than "Sell this asset"', () => {
    // Construct a portfolio heavily concentrated in one stock (80% in one stock)
    const concentratedHoldings: UnifiedAssetHolding[] = [
      {
        id: 'c1',
        symbolOrIdentifier: 'HEAVY_STOCK',
        name: 'Mega Energy Corp',
        assetClass: 'STOCKS',
        subCategory: 'Energy',
        quantity: 1000,
        averageBuyPrice: 800,
        currentPrice: 800, // ₹8,00,000 (80%)
        currency: 'INR',
      },
      {
        id: 'c2',
        symbolOrIdentifier: 'SMALL_MF',
        name: 'Index Fund',
        assetClass: 'MUTUAL_FUNDS',
        subCategory: 'Equity MF',
        quantity: 1000,
        averageBuyPrice: 100,
        currentPrice: 100, // ₹1,00,000 (10%)
        currency: 'INR',
      },
      {
        id: 'c3',
        symbolOrIdentifier: 'SMALL_GOLD',
        name: 'Gold ETF',
        assetClass: 'ETFS',
        subCategory: 'Commodity',
        quantity: 1000,
        averageBuyPrice: 100,
        currentPrice: 100, // ₹1,00,000 (10%)
        currency: 'INR',
      },
    ];

    const assessment = engine.calculateAssessment(concentratedHoldings);

    assert.strictEqual(assessment.concentration.concentrationLevel, 'HIGH');
    assert.ok(assessment.concentration.topAsset.percentage >= 79.0);

    // Verify Risk Signal
    const concentrationSignal = assessment.riskSignals.find(
      (s) => s.code === 'HIGH_SINGLE_ASSET_CONCENTRATION'
    );
    assert.ok(concentrationSignal, 'Must trigger HIGH_SINGLE_ASSET_CONCENTRATION signal');

    // CONSTITUTIONAL REQUIREMENT: Must produce "High concentration detected" rather than "Sell this asset"
    assert.ok(
      concentrationSignal.descriptiveObservation.toLowerCase().includes('high concentration detected'),
      'Must contain "High concentration detected"'
    );
    assert.strictEqual(
      /sell this asset|sell now|dump shares|divest immediately|exit position/i.test(
        concentrationSignal.descriptiveObservation
      ),
      false,
      'Must NOT contain "Sell this asset" or trade execution directives'
    );
  });

  // ----------------------------------------------------
  // TEST 4: Explainable Calculations
  // ----------------------------------------------------
  test('Produces step-by-step explainable calculations for every primary metric', () => {
    const assessment = engine.calculateAssessment();

    assert.ok(assessment.explainableCalculations.length >= 4);
    const metricNames = assessment.explainableCalculations.map((e) => e.metricName);
    assert.ok(metricNames.includes('Total Invested Capital'));
    assert.ok(metricNames.includes('Total Current Valuation'));
    assert.ok(metricNames.includes('Total Unrealized Gain / Loss (PnL)'));
    assert.ok(metricNames.includes('Portfolio Percentage Return'));
    assert.ok(metricNames.includes('Herfindahl-Hirschman Concentration Index (HHI)'));

    for (const calc of assessment.explainableCalculations) {
      assert.ok(calc.formula, 'Every calculation must show its formula');
      assert.ok(calc.stepByStep.length > 0, 'Every calculation must show step-by-step math');
      assert.ok(calc.finalFormattedValue, 'Every calculation must display final formatted value');
    }
  });

  // ----------------------------------------------------
  // TEST 5: Constitutional Invariant: NO PERSONALIZED FINANCIAL ADVICE
  // ----------------------------------------------------
  test('Constitutional Invariant: Engine strictly avoids personalized financial advice', () => {
    const assessment = engine.calculateAssessment();

    assert.ok(assessment.statutoryNotice.includes('NEVER produces personalized financial advice'));
    for (const signal of assessment.riskSignals) {
      assert.ok(signal.statutoryDisclaimer.includes('Does NOT constitute personalized financial advice'));
      assert.strictEqual(
        /buy|sell|rebalance your portfolio immediately|you should purchase/i.test(
          signal.descriptiveObservation
        ),
        false,
        'Risk signal must remain descriptive observation only'
      );
    }
  });
});
