import React, { useState, useEffect } from 'react';
import {
  PieChart,
  Layers,
  TrendingUp,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  Plus,
  Trash2,
  HelpCircle,
  Calculator,
  Coins,
  Building,
  Award,
  BarChart3,
  Percent,
  CheckCircle2,
  Info,
} from 'lucide-react';
import {
  AssetClass,
  UnifiedAssetHolding,
  UnifiedPortfolioAssessment,
} from '../../engine/unifiedPortfolio/types';
import { globalUnifiedPortfolioEngine } from '../../engine/unifiedPortfolio/unifiedPortfolioEngine';

export const UnifiedPortfolioView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'concentration' | 'holdings' | 'calculations'>('overview');
  const [assessment, setAssessment] = useState<UnifiedPortfolioAssessment | null>(null);

  // Add Position Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAssetClass, setNewAssetClass] = useState<AssetClass>('STOCKS');
  const [newSymbol, setNewSymbol] = useState('');
  const [newName, setNewName] = useState('');
  const [newSubCategory, setNewSubCategory] = useState('');
  const [newQty, setNewQty] = useState('');
  const [newBuyPrice, setNewBuyPrice] = useState('');
  const [newCurPrice, setNewCurPrice] = useState('');

  useEffect(() => {
    refreshAssessment();
  }, []);

  const refreshAssessment = () => {
    const result = globalUnifiedPortfolioEngine.calculateAssessment();
    setAssessment(result);
  };

  const handleAddHolding = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSymbol || !newName || !newQty || !newBuyPrice || !newCurPrice) return;

    globalUnifiedPortfolioEngine.addHolding({
      symbolOrIdentifier: newSymbol.trim().toUpperCase(),
      name: newName.trim(),
      assetClass: newAssetClass,
      subCategory: newSubCategory.trim() || 'General Exposure',
      quantity: parseFloat(newQty),
      averageBuyPrice: parseFloat(newBuyPrice),
      currentPrice: parseFloat(newCurPrice),
      currency: 'INR',
    });

    setNewSymbol('');
    setNewName('');
    setNewSubCategory('');
    setNewQty('');
    setNewBuyPrice('');
    setNewCurPrice('');
    setShowAddModal(false);
    refreshAssessment();
  };

  const handleDeleteHolding = (id: string) => {
    globalUnifiedPortfolioEngine.removeHolding(id);
    refreshAssessment();
  };

  if (!assessment) return null;

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {/* 1. Header & Statutory Guardrails */}
      <div className="bg-[#101C38] border border-[#1E2F59] rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
              <PieChart className="w-4 h-4 text-[#E0A96D]" />
              Unified Multi-Asset Portfolio Engine
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Integrated analytics across Stocks, Mutual Funds, ETFs, and Crypto with explainable calculations.
            </p>
          </div>
          <span className="text-[10px] font-mono text-[#E0A96D] bg-[#E0A96D]/15 px-2 py-0.5 rounded border border-[#E0A96D]/30 font-bold">
            Unified Aggregator
          </span>
        </div>

        {/* Constitutional Guardrail Directive */}
        <div className="bg-[#0C152B] p-2.5 rounded-xl border border-[#1C2B52] flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-slate-300 text-[11px] leading-relaxed">
              <b>Descriptive Risk Signals Only</b>: Produces objective concentration alerts (e.g. "High concentration detected") rather than trade directives ("Sell this asset"). Never provides personalized financial advice.
            </span>
          </div>
        </div>
      </div>

      {/* 2. Portfolio Valuation Summary Cards */}
      <div className="bg-gradient-to-br from-[#121F42] to-[#0D1630] border border-[#233562] rounded-2xl p-4 shadow-md space-y-3">
        <div className="flex items-center justify-between text-[10px] font-bold tracking-widest text-[#E0A96D] uppercase">
          <span>AGGREGATE MULTI-ASSET NET WORTH</span>
          <span className="font-mono text-slate-400 font-normal">
            {assessment.positionsCount} Positions (4 Asset Classes)
          </span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
          <div className="text-2xl sm:text-3xl font-bold text-slate-100 font-mono">
            ₹{assessment.totalCurrentValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div
            className={`text-sm font-bold font-mono flex items-center gap-1 ${
              assessment.totalUnrealizedPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {assessment.totalUnrealizedPnL >= 0 ? (
              <ArrowUpRight className="w-4 h-4" />
            ) : (
              <ArrowDownRight className="w-4 h-4" />
            )}
            <span>
              {assessment.totalUnrealizedPnL >= 0 ? '+' : ''}
              ₹{Math.abs(assessment.totalUnrealizedPnL).toLocaleString('en-IN')} (
              {assessment.totalPercentageReturn}%)
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2.5 border-t border-[#1F2F57] text-xs font-mono">
          <div>
            <span className="text-[10px] text-slate-400 block uppercase">Total Invested</span>
            <span className="font-bold text-slate-200">
              ₹{assessment.totalInvestedAmount.toLocaleString('en-IN')}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block uppercase">Unrealized P/L</span>
            <span
              className={`font-bold ${
                assessment.totalUnrealizedPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {assessment.totalUnrealizedPnL >= 0 ? '+' : ''}
              ₹{assessment.totalUnrealizedPnL.toLocaleString('en-IN')}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block uppercase">Top Position</span>
            <span className="font-bold text-slate-200 truncate block">
              {assessment.concentration.topAsset.symbol} ({assessment.concentration.topAsset.percentage}%)
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block uppercase">Concentration Level</span>
            <span
              className={`font-bold ${
                assessment.concentration.concentrationLevel === 'HIGH' || assessment.concentration.concentrationLevel === 'CRITICAL'
                  ? 'text-rose-400'
                  : assessment.concentration.concentrationLevel === 'MODERATE'
                  ? 'text-amber-400'
                  : 'text-emerald-400'
              }`}
            >
              {assessment.concentration.concentrationLevel} (HHI {assessment.concentration.herfindahlIndex})
            </span>
          </div>
        </div>
      </div>

      {/* 3. Navigation Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 bg-[#0C152B] p-1.5 rounded-xl border border-[#1C2B52] text-xs font-semibold">
        <button
          onClick={() => setActiveTab('overview')}
          className={`py-2 px-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-colors ${
            activeTab === 'overview'
              ? 'bg-[#E0A96D] text-[#0A1128] font-bold shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Allocation & Classes</span>
        </button>
        <button
          onClick={() => setActiveTab('concentration')}
          className={`py-2 px-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-colors ${
            activeTab === 'concentration'
              ? 'bg-[#E0A96D] text-[#0A1128] font-bold shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Concentration Signals ({assessment.riskSignals.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('holdings')}
          className={`py-2 px-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-colors ${
            activeTab === 'holdings'
              ? 'bg-[#E0A96D] text-[#0A1128] font-bold shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>Unified Holdings ({assessment.positionsCount})</span>
        </button>
        <button
          onClick={() => setActiveTab('calculations')}
          className={`py-2 px-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-colors ${
            activeTab === 'calculations'
              ? 'bg-[#E0A96D] text-[#0A1128] font-bold shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Calculator className="w-3.5 h-3.5" />
          <span>Explainable Math</span>
        </button>
      </div>

      {/* ==================================================== */}
      {/* TAB 1: ASSET ALLOCATION & CATEGORY EXPOSURE */}
      {/* ==================================================== */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          {/* Visual Asset Class Stack */}
          <div className="bg-[#101C38] border border-[#1E2F59] rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5 uppercase tracking-wide">
                <Layers className="w-4 h-4 text-[#E0A96D]" /> Asset Class Weighting
              </span>
              <span className="text-[10px] text-slate-400 font-mono">100% Normalized</span>
            </div>

            {/* Allocation Stack Bar */}
            <div className="h-3.5 rounded-full bg-[#0A1226] overflow-hidden flex border border-[#1F315E]">
              {assessment.assetClassExposures.map((ac) => {
                const colors: Record<AssetClass, string> = {
                  STOCKS: 'bg-[#E0A96D]',
                  MUTUAL_FUNDS: 'bg-emerald-400',
                  ETFS: 'bg-amber-400',
                  CRYPTO: 'bg-sky-400',
                };
                return (
                  <div
                    key={ac.assetClass}
                    style={{ width: `${ac.percentage}%` }}
                    className={colors[ac.assetClass]}
                    title={`${ac.assetClass}: ${ac.percentage}%`}
                  />
                );
              })}
            </div>

            {/* Detailed Asset Class Table */}
            <div className="space-y-2 pt-1">
              {assessment.assetClassExposures.map((ac) => (
                <div
                  key={ac.assetClass}
                  className="bg-[#0A1226] p-3 rounded-xl border border-[#1C2C55] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-100">{ac.assetClass.replace('_', ' ')}</span>
                      <span className="text-[10px] bg-[#16254A] text-[#E0A96D] px-1.5 rounded font-mono font-bold">
                        {ac.percentage}%
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        ({ac.count} positions)
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      Invested: ₹{ac.investedAmount.toLocaleString('en-IN')}
                    </div>
                  </div>

                  <div className="text-right font-mono">
                    <div className="font-bold text-slate-100">
                      ₹{ac.currentValue.toLocaleString('en-IN')}
                    </div>
                    <div
                      className={`text-[10px] font-bold ${
                        ac.unrealizedPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {ac.unrealizedPnL >= 0 ? '+' : ''}
                      ₹{ac.unrealizedPnL.toLocaleString('en-IN')} ({ac.percentageReturn}%)
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sub-Category Exposures */}
          <div className="bg-[#101C38] border border-[#1E2F59] rounded-2xl p-4 space-y-3">
            <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5 uppercase tracking-wide">
              <PieChart className="w-4 h-4 text-[#E0A96D]" /> Sub-Category & Sector Exposures
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
              {assessment.categoryExposures.map((cat) => (
                <div key={cat.category} className="bg-[#0A1226] p-2.5 rounded-xl border border-[#1C2C55] space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300 font-bold truncate max-w-[200px]">{cat.category}</span>
                    <span className="text-[#E0A96D] font-bold">{cat.percentage}%</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>Valuation: ₹{cat.currentValue.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB 2: CONCENTRATION METRICS & RISK SIGNALS */}
      {/* ==================================================== */}
      {activeTab === 'concentration' && (
        <div className="space-y-4">
          {/* Concentration Metrics Card */}
          <div className="bg-[#101C38] border border-[#1E2F59] rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wide">
                Portfolio Concentration Architecture
              </h3>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                  assessment.concentration.concentrationLevel === 'HIGH' || assessment.concentration.concentrationLevel === 'CRITICAL'
                    ? 'bg-rose-950 text-rose-400 border border-rose-600'
                    : assessment.concentration.concentrationLevel === 'MODERATE'
                    ? 'bg-amber-950 text-amber-400 border border-amber-600'
                    : 'bg-emerald-950 text-emerald-400 border border-emerald-600'
                }`}
              >
                {assessment.concentration.concentrationLevel} CONCENTRATION
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-mono">
              <div className="bg-[#0A1226] p-3 rounded-xl border border-[#1C2C55]">
                <span className="text-[10px] text-slate-400 block uppercase">Top Holding Weight</span>
                <span className="text-base font-bold text-slate-100">
                  {assessment.concentration.topAsset.percentage}%
                </span>
                <span className="text-[10px] text-[#E0A96D] block truncate mt-0.5">
                  {assessment.concentration.topAsset.name}
                </span>
              </div>
              <div className="bg-[#0A1226] p-3 rounded-xl border border-[#1C2C55]">
                <span className="text-[10px] text-slate-400 block uppercase">Top 3 Holdings Weight</span>
                <span className="text-base font-bold text-slate-100">
                  {assessment.concentration.top3AssetsPercentage}%
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Across top 3 largest assets
                </span>
              </div>
              <div className="bg-[#0A1226] p-3 rounded-xl border border-[#1C2C55]">
                <span className="text-[10px] text-slate-400 block uppercase">Herfindahl Index (HHI)</span>
                <span className="text-base font-bold text-slate-100">
                  {assessment.concentration.herfindahlIndex}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  &lt; 1,800 is diversified
                </span>
              </div>
            </div>
          </div>

          {/* Descriptive Portfolio Risk Signals */}
          <div className="bg-[#101C38] border border-[#1E2F59] rounded-2xl p-4 space-y-3">
            <div>
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wide flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-[#E0A96D]" /> Generated Portfolio Risk Signals ({assessment.riskSignals.length})
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Strictly factual and descriptive observations. Designed to diagnose asset concentration without issuing trade directives.
              </p>
            </div>

            <div className="space-y-2.5">
              {assessment.riskSignals.length > 0 ? (
                assessment.riskSignals.map((sig, idx) => (
                  <div
                    key={idx}
                    className="bg-[#0A1226] p-3.5 rounded-xl border border-[#1C2C55] space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[9px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                            sig.severity === 'HIGH'
                              ? 'bg-rose-950 text-rose-400 border border-rose-600'
                              : sig.severity === 'MEDIUM'
                              ? 'bg-amber-950 text-amber-400 border border-amber-600'
                              : 'bg-sky-950 text-sky-400 border border-sky-600'
                          }`}
                        >
                          {sig.severity}
                        </span>
                        <span className="font-bold text-slate-200">{sig.name}</span>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-[#101C38] border border-[#1E2F59] text-slate-200 leading-relaxed">
                      {sig.descriptiveObservation}
                    </div>

                    <div className="bg-[#070D1E] p-2 rounded-lg border border-[#162547] text-[11px] font-mono text-[#E0A96D]">
                      Math: {sig.explanationMath}
                    </div>

                    <div className="text-[10px] text-slate-500 font-mono pt-0.5">
                      Notice: {sig.statutoryDisclaimer}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-xs text-slate-400 bg-[#0A1226] rounded-xl border border-[#1C2C55]">
                  No high concentration or portfolio imbalance signals triggered.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB 3: UNIFIED HOLDINGS LEDGER */}
      {/* ==================================================== */}
      {activeTab === 'holdings' && (
        <div className="bg-[#101C38] border border-[#1E2F59] rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wide">
                Unified Multi-Asset Holdings ({assessment.positions.length})
              </h3>
              <p className="text-[11px] text-slate-400">
                Direct equities, mutual funds, ETFs, and crypto aggregated in unified INR denomination.
              </p>
            </div>
            <button
              onClick={() => setShowAddModal(!showAddModal)}
              className="text-xs bg-[#E0A96D] hover:bg-[#F4A261] text-[#0A1128] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Holding</span>
            </button>
          </div>

          {/* Add Holding Modal Form */}
          {showAddModal && (
            <form onSubmit={handleAddHolding} className="bg-[#0A1226] p-3 rounded-xl border border-[#203159] space-y-2.5 text-xs">
              <div className="text-[11px] font-bold text-[#E0A96D]">Add Position to Unified Portfolio:</div>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                <select
                  value={newAssetClass}
                  onChange={(e) => setNewAssetClass(e.target.value as AssetClass)}
                  className="bg-[#101C38] border border-[#233560] rounded-lg p-2 text-slate-200 font-mono outline-none"
                >
                  <option value="STOCKS">Stock (Direct Equity)</option>
                  <option value="MUTUAL_FUNDS">Mutual Fund (MF)</option>
                  <option value="ETFS">ETF / Commodity</option>
                  <option value="CRYPTO">Crypto Asset</option>
                </select>
                <input
                  type="text"
                  placeholder="Ticker/Symbol (e.g. INFY.NS, SOL)"
                  value={newSymbol}
                  onChange={(e) => setNewSymbol(e.target.value)}
                  className="bg-[#101C38] border border-[#233560] rounded-lg p-2 text-slate-200 font-mono outline-none"
                  required
                />
                <input
                  type="text"
                  placeholder="Asset Name (e.g. Infosys Ltd)"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="bg-[#101C38] border border-[#233560] rounded-lg p-2 text-slate-200 outline-none"
                  required
                />
                <input
                  type="text"
                  placeholder="Subcategory (e.g. Tech, Flexi Cap)"
                  value={newSubCategory}
                  onChange={(e) => setNewSubCategory(e.target.value)}
                  className="bg-[#101C38] border border-[#233560] rounded-lg p-2 text-slate-200 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  type="number"
                  step="any"
                  placeholder="Quantity (Shares/Units/Tokens)"
                  value={newQty}
                  onChange={(e) => setNewQty(e.target.value)}
                  className="bg-[#101C38] border border-[#233560] rounded-lg p-2 text-slate-200 font-mono outline-none"
                  required
                />
                <input
                  type="number"
                  step="any"
                  placeholder="Average Buy Price (₹)"
                  value={newBuyPrice}
                  onChange={(e) => setNewBuyPrice(e.target.value)}
                  className="bg-[#101C38] border border-[#233560] rounded-lg p-2 text-slate-200 font-mono outline-none"
                  required
                />
                <input
                  type="number"
                  step="any"
                  placeholder="Current Market Price (₹)"
                  value={newCurPrice}
                  onChange={(e) => setNewCurPrice(e.target.value)}
                  className="bg-[#101C38] border border-[#233560] rounded-lg p-2 text-slate-200 font-mono outline-none"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1 rounded bg-[#16254A] text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1 rounded bg-[#E0A96D] text-[#0A1128] font-bold"
                >
                  Save Position
                </button>
              </div>
            </form>
          )}

          {/* Holdings List */}
          <div className="space-y-2">
            {assessment.positions.map((pos) => (
              <div
                key={pos.holding.id}
                className="bg-[#0A1226] p-3 rounded-xl border border-[#1C2C55] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-100 font-mono">
                      {pos.holding.symbolOrIdentifier}
                    </span>
                    <span className="text-[9px] bg-[#142345] text-[#E0A96D] px-1.5 py-0.2 rounded font-mono font-bold">
                      {pos.holding.assetClass}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {pos.holding.quantity} units @ ₹{pos.holding.averageBuyPrice.toLocaleString('en-IN')}
                    </span>
                    <span className="text-[9px] bg-[#102242] text-sky-300 px-1.5 rounded font-mono">
                      {pos.portfolioWeightPercent}% portf.
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {pos.holding.name} • {pos.holding.subCategory}
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 text-right">
                  <div>
                    <div className="font-bold text-slate-100 font-mono">
                      ₹{pos.currentValue.toLocaleString('en-IN')}
                    </div>
                    <div
                      className={`text-[10px] font-mono font-bold flex items-center justify-end gap-0.5 ${
                        pos.unrealizedPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {pos.unrealizedPnL >= 0 ? '+' : ''}
                      ₹{pos.unrealizedPnL.toLocaleString('en-IN')} ({pos.percentageReturn}%)
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteHolding(pos.holding.id)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
                    title="Delete holding"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB 4: EXPLAINABLE CALCULATIONS CONSOLE */}
      {/* ==================================================== */}
      {activeTab === 'calculations' && (
        <div className="bg-[#101C38] border border-[#1E2F59] rounded-2xl p-4 space-y-3">
          <div>
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wide flex items-center gap-1.5">
              <Calculator className="w-4 h-4 text-[#E0A96D]" /> Explainable Mathematical Calculations
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Transparent, step-by-step mathematical derivation of every primary portfolio metric.
            </p>
          </div>

          <div className="space-y-3">
            {assessment.explainableCalculations.map((calc, idx) => (
              <div
                key={idx}
                className="bg-[#0A1226] p-3.5 rounded-xl border border-[#1C2C55] space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-100">{calc.metricName}</span>
                  <span className="font-mono text-xs font-bold text-[#E0A96D] bg-[#142345] px-2 py-0.5 rounded">
                    Result: {calc.finalFormattedValue}
                  </span>
                </div>

                <div className="bg-[#070D1E] p-2 rounded-lg border border-[#162547] text-[11px] font-mono text-emerald-400">
                  Formula: {calc.formula}
                </div>

                <div className="space-y-1 pt-1">
                  <div className="text-[10px] text-slate-400 font-semibold uppercase font-mono">
                    Step-by-step Math:
                  </div>
                  <div className="max-h-36 overflow-y-auto space-y-1 font-mono text-[10px] text-slate-300">
                    {calc.stepByStep.map((step, sIdx) => (
                      <div key={sIdx} className="bg-[#101C38] p-1.5 rounded border border-[#1A2A4E]">
                        {step}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
