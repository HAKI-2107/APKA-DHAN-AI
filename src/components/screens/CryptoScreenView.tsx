import React, { useState, useEffect } from 'react';
import {
  Coins,
  ShieldAlert,
  AlertTriangle,
  ExternalLink,
  CheckCircle,
  TrendingUp,
  Search,
  Plus,
  Trash2,
  Bell,
  Star,
  Layers,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  Lock,
  Flame,
  Info,
  RefreshCw,
  Wallet,
  Activity,
  BarChart3,
} from 'lucide-react';
import {
  CryptoAsset,
  CryptoHistoricalPoint,
  CryptoHistoricalRange,
  CryptoSearchResult,
  UserCryptoHolding,
  HoldingWithCryptoMarket,
  CryptoPortfolioSummary,
  CryptoWatchlist,
  CryptoAlert,
  CryptoRiskIndicator,
} from '../../engine/cryptoIntelligence/types';
import {
  globalCryptoAssetRepository,
  globalCryptoWatchlistRepository,
  globalCryptoHoldingRepository,
  globalCryptoPortfolioRepository,
} from '../../engine/cryptoIntelligence/repositories';
import { RiskBadgeView } from '../RiskBadgeView';

export const CryptoScreenView: React.FC<{ cryptoList?: any[] }> = () => {
  const [activeTab, setActiveTab] = useState<'holdings' | 'search_chart' | 'watchlist' | 'alerts' | 'risks'>('holdings');

  // Portfolio State
  const [portfolioData, setPortfolioData] = useState<{
    summary: CryptoPortfolioSummary;
    holdingsWithMarket: HoldingWithCryptoMarket[];
  } | null>(null);

  // Add Holding Form State
  const [showAddHolding, setShowAddHolding] = useState(false);
  const [newSymbol, setNewSymbol] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newBuyPrice, setNewBuyPrice] = useState('');
  const [newStorage, setNewStorage] = useState<'HARDWARE' | 'COLD_WALLET' | 'NON_CUSTODIAL' | 'EXCHANGE'>('HARDWARE');
  const [newNotes, setNewNotes] = useState('');
  const [securityWarning, setSecurityWarning] = useState<string | null>(null);

  // Search & Chart State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<CryptoSearchResult[]>([]);
  const [selectedSymbol, setSelectedSymbol] = useState('BTC');
  const [selectedAsset, setSelectedAsset] = useState<CryptoAsset | null>(null);
  const [historicalRange, setHistoricalRange] = useState<CryptoHistoricalRange>('30D');
  const [historicalPoints, setHistoricalPoints] = useState<CryptoHistoricalPoint[]>([]);

  // Watchlist State
  const [watchlists, setWatchlists] = useState<CryptoWatchlist[]>([]);
  const [selectedWatchlistId, setSelectedWatchlistId] = useState('default_crypto_watchlist');
  const [watchlistAssets, setWatchlistAssets] = useState<Map<string, CryptoAsset>>(new Map());
  const [newWlName, setNewWlName] = useState('');
  const [showCreateWl, setShowCreateWl] = useState(false);

  // Alerts State
  const [alerts, setAlerts] = useState<CryptoAlert[]>([]);
  const [alertSymbol, setAlertSymbol] = useState('BTC');
  const [alertDirection, setAlertDirection] = useState<'PRICE_ABOVE' | 'PRICE_BELOW'>('PRICE_ABOVE');
  const [alertTargetPrice, setAlertTargetPrice] = useState('70000');
  const [alertNote, setAlertNote] = useState('');

  // Initial load
  useEffect(() => {
    refreshPortfolio();
    loadWatchlists();
    loadAlerts();
    loadSelectedAsset(selectedSymbol, historicalRange);
  }, []);

  const refreshPortfolio = async () => {
    try {
      const data = await globalCryptoPortfolioRepository.getPortfolioSummary();
      setPortfolioData(data);
    } catch (err) {
      console.error('Failed to load crypto portfolio:', err);
    }
  };

  const loadWatchlists = async () => {
    const lists = globalCryptoWatchlistRepository.getAll();
    setWatchlists(lists);

    const cur = lists.find((w) => w.id === selectedWatchlistId) || lists[0];
    if (cur) {
      setSelectedWatchlistId(cur.id);
      const assets = await globalCryptoAssetRepository.getAssets(cur.symbols);
      setWatchlistAssets(assets);
    }
  };

  const loadAlerts = async () => {
    await globalCryptoPortfolioRepository.evaluateAlerts();
    setAlerts(globalCryptoPortfolioRepository.getAlerts());
  };

  const loadSelectedAsset = async (symbol: string, range: CryptoHistoricalRange) => {
    const asset = await globalCryptoAssetRepository.getAsset(symbol);
    setSelectedAsset(asset);
    const hist = await globalCryptoAssetRepository.getHistoricalData(symbol, range);
    setHistoricalPoints(hist);
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    const results = await globalCryptoAssetRepository.searchAssets(query);
    setSearchResults(results);
  };

  const handleSelectSearchAsset = (symbol: string) => {
    setSelectedSymbol(symbol);
    setSearchQuery('');
    setSearchResults([]);
    loadSelectedAsset(symbol, historicalRange);
  };

  const handleRangeChange = (range: CryptoHistoricalRange) => {
    setHistoricalRange(range);
    loadSelectedAsset(selectedSymbol, range);
  };

  const handleAddHolding = async (e: React.FormEvent) => {
    e.preventDefault();
    setSecurityWarning(null);

    // Safeguard check for sensitive text in notes or inputs
    const forbidden = ['key', 'seed', 'mnemonic', 'password', 'passphrase'];
    if (forbidden.some((f) => newNotes.toLowerCase().includes(f))) {
      setSecurityWarning('Security Guardrail: Never store private keys, seed phrases, or passwords in Apka Dhan AI.');
      return;
    }

    try {
      globalCryptoHoldingRepository.addHolding({
        assetId: newSymbol.trim().toLowerCase(),
        symbol: newSymbol.trim().toUpperCase(),
        amount: parseFloat(newAmount),
        averageBuyPriceUsd: parseFloat(newBuyPrice),
        buyDateEpochMs: Date.now(),
        storageType: newStorage,
        notes: newNotes.trim() || undefined,
      });

      setNewSymbol('');
      setNewAmount('');
      setNewBuyPrice('');
      setNewNotes('');
      setShowAddHolding(false);
      await refreshPortfolio();
    } catch (err: any) {
      setSecurityWarning(err.message);
    }
  };

  const handleDeleteHolding = async (id: string) => {
    globalCryptoHoldingRepository.removeHolding(id);
    await refreshPortfolio();
  };

  const handleCreateWatchlist = () => {
    if (!newWlName.trim()) return;
    const created = globalCryptoWatchlistRepository.createWatchlist(newWlName);
    setNewWlName('');
    setShowCreateWl(false);
    loadWatchlists();
    setSelectedWatchlistId(created.id);
  };

  const handleAddToWatchlist = (symbol: string) => {
    globalCryptoWatchlistRepository.addSymbol(selectedWatchlistId, symbol);
    loadWatchlists();
  };

  const handleRemoveFromWatchlist = (symbol: string) => {
    globalCryptoWatchlistRepository.removeSymbol(selectedWatchlistId, symbol);
    loadWatchlists();
  };

  const handleCreateAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!alertSymbol || !alertTargetPrice) return;

    globalCryptoPortfolioRepository.createAlert({
      symbol: alertSymbol.trim().toUpperCase(),
      direction: alertDirection,
      targetPriceUsd: parseFloat(alertTargetPrice),
      isActive: true,
      note: alertNote || undefined,
    });

    setAlertNote('');
    await loadAlerts();
  };

  const handleDeleteAlert = async (id: string) => {
    globalCryptoPortfolioRepository.deleteAlert(id);
    await loadAlerts();
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {/* 1. Module Header & Security Invariants Banner */}
      <div className="bg-[#101C38] border border-[#1E2F59] rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
              <Coins className="w-4 h-4 text-[#E0A96D]" />
              Crypto Intelligence & Safeguards Hub
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Non-custodial intelligence: asset tracking, market cap rankings, historical volatility, and alerts.
            </p>
          </div>
          <span className="text-[10px] font-mono text-sky-400 bg-sky-950/80 px-2 py-0.5 rounded border border-sky-500/30 shrink-0">
            Read-Only Monitor
          </span>
        </div>

        {/* Security Constitution Directives */}
        <div className="bg-[#0C152B] p-3 rounded-xl border border-[#1C2B52] grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          <div className="flex items-start gap-2">
            <Lock className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-[10px] text-slate-500 block font-mono">NON-CUSTODIAL INVARIANT:</span>
              <span className="text-slate-200 font-medium leading-relaxed">
                Never requests or stores private keys, seed phrases, or exchange credentials. Zero trade execution.
              </span>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 text-[#E0A96D] shrink-0 mt-0.5" />
            <div>
              <span className="text-[10px] text-slate-500 block font-mono">EVIDENTIARY CLASSIFICATION:</span>
              <span className="text-slate-200 font-medium leading-relaxed">
                Risk indicators (volatility, concentration) are analytical observations, strictly NOT proof of fraud.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Top Navigation Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 bg-[#0C152B] p-1.5 rounded-xl border border-[#1C2B52] text-xs font-semibold">
        <button
          onClick={() => setActiveTab('holdings')}
          className={`py-2 px-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-colors ${
            activeTab === 'holdings'
              ? 'bg-[#E0A96D] text-[#0A1128] font-bold shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <PieChart className="w-3.5 h-3.5" />
          <span>Holdings & Value</span>
        </button>
        <button
          onClick={() => setActiveTab('search_chart')}
          className={`py-2 px-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-colors ${
            activeTab === 'search_chart'
              ? 'bg-[#E0A96D] text-[#0A1128] font-bold shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Search className="w-3.5 h-3.5" />
          <span>Asset Search</span>
        </button>
        <button
          onClick={() => setActiveTab('watchlist')}
          className={`py-2 px-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-colors ${
            activeTab === 'watchlist'
              ? 'bg-[#E0A96D] text-[#0A1128] font-bold shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Star className="w-3.5 h-3.5" />
          <span>Watchlist ({watchlists.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('alerts')}
          className={`py-2 px-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-colors ${
            activeTab === 'alerts'
              ? 'bg-[#E0A96D] text-[#0A1128] font-bold shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Bell className="w-3.5 h-3.5" />
          <span>Alerts ({alerts.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('risks')}
          className={`py-2 px-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-colors ${
            activeTab === 'risks'
              ? 'bg-[#E0A96D] text-[#0A1128] font-bold shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Risk Indicators</span>
        </button>
      </div>

      {/* ==================================================== */}
      {/* TAB 1: HOLDINGS, PORTFOLIO VALUE & ALLOCATION */}
      {/* ==================================================== */}
      {activeTab === 'holdings' && (
        <div className="space-y-4">
          {portfolioData && (
            <>
              {/* Crypto Net Worth Card */}
              <div className="bg-gradient-to-br from-[#121F42] to-[#0D1630] border border-[#233562] rounded-2xl p-4 shadow-md space-y-3">
                <div className="flex items-center justify-between text-[10px] font-bold tracking-widest text-[#E0A96D] uppercase">
                  <span>TOTAL CRYPTO PORTFOLIO VALUE</span>
                  <span className="font-mono text-slate-400 font-normal">
                    {portfolioData.summary.holdingsCount} Assets Tracked
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                  <div>
                    <div className="text-2xl sm:text-3xl font-bold text-slate-100 font-mono">
                      ${portfolioData.summary.totalCurrentValueUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-xs text-slate-400 font-mono mt-0.5">
                      ≈ ₹{portfolioData.summary.totalCurrentValueInr.toLocaleString('en-IN')} (@ ₹85.5/USD)
                    </div>
                  </div>

                  <div
                    className={`text-sm font-bold font-mono flex items-center gap-1 ${
                      portfolioData.summary.totalUnrealizedGainLossUsd >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {portfolioData.summary.totalUnrealizedGainLossUsd >= 0 ? (
                      <ArrowUpRight className="w-4 h-4" />
                    ) : (
                      <ArrowDownRight className="w-4 h-4" />
                    )}
                    <span>
                      {portfolioData.summary.totalUnrealizedGainLossUsd >= 0 ? '+' : ''}
                      ${Math.abs(portfolioData.summary.totalUnrealizedGainLossUsd).toLocaleString('en-US')} (
                      {portfolioData.summary.totalUnrealizedGainLossPercent}%)
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2.5 border-t border-[#1F2F57] text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Invested Cost Basis</span>
                    <span className="font-bold font-mono text-slate-200">
                      ${portfolioData.summary.totalInvestedValueUsd.toLocaleString('en-US')}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block uppercase">Net Unrealized P/L</span>
                    <span
                      className={`font-bold font-mono ${
                        portfolioData.summary.totalUnrealizedGainLossUsd >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {portfolioData.summary.totalUnrealizedGainLossUsd >= 0 ? '+' : ''}
                      ${portfolioData.summary.totalUnrealizedGainLossUsd.toLocaleString('en-US')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Portfolio Asset Allocation Bar */}
              <div className="bg-[#101C38] border border-[#1E2F59] rounded-2xl p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5 uppercase tracking-wide">
                    <Layers className="w-4 h-4 text-[#E0A96D]" /> Crypto Allocation Breakdown
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">Weight Distribution</span>
                </div>

                {/* Progress Bar */}
                <div className="h-2.5 rounded-full bg-[#0A1226] overflow-hidden flex border border-[#1F315E]">
                  {portfolioData.summary.allocations.map((item, i) => {
                    const colors = ['bg-[#F7931A]', 'bg-[#627EEA]', 'bg-[#14F195]', 'bg-[#E0A96D]', 'bg-purple-400'];
                    return (
                      <div
                        key={item.symbol}
                        style={{ width: `${item.percentage}%` }}
                        className={colors[i % colors.length]}
                        title={`${item.symbol}: ${item.percentage}%`}
                      />
                    );
                  })}
                </div>

                {/* Badges */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs font-mono">
                  {portfolioData.summary.allocations.map((item) => (
                    <div key={item.symbol} className="bg-[#0A1226] p-2 rounded-lg border border-[#1C2C55]">
                      <span className="text-[10px] text-slate-400 block truncate">{item.name} ({item.symbol})</span>
                      <span className="font-bold text-slate-200">{item.percentage}%</span>
                      <span className="text-[9px] text-slate-500 block truncate">
                        ${item.valueUsd.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Holdings Positions Table */}
              <div className="bg-[#101C38] border border-[#1E2F59] rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wide">
                    Tracked Positions ({portfolioData.holdingsWithMarket.length})
                  </h3>
                  <button
                    onClick={() => setShowAddHolding(!showAddHolding)}
                    className="text-[11px] bg-[#E0A96D] hover:bg-[#F4A261] text-[#0A1128] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Track Asset</span>
                  </button>
                </div>

                {/* Add Holding Form Modal */}
                {showAddHolding && (
                  <form onSubmit={handleAddHolding} className="bg-[#0A1226] p-3 rounded-xl border border-[#203159] space-y-2.5 text-xs">
                    <div className="text-[11px] font-bold text-[#E0A96D]">Enter Read-Only Holding Details:</div>
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                      <input
                        type="text"
                        placeholder="Symbol (e.g. BTC, ETH, SOL)"
                        value={newSymbol}
                        onChange={(e) => setNewSymbol(e.target.value)}
                        className="bg-[#101C38] border border-[#233560] rounded-lg p-2 text-slate-200 font-mono outline-none"
                        required
                      />
                      <input
                        type="number"
                        step="any"
                        placeholder="Quantity (Tokens)"
                        value={newAmount}
                        onChange={(e) => setNewAmount(e.target.value)}
                        className="bg-[#101C38] border border-[#233560] rounded-lg p-2 text-slate-200 font-mono outline-none"
                        required
                      />
                      <input
                        type="number"
                        step="any"
                        placeholder="Cost Basis (Avg USD)"
                        value={newBuyPrice}
                        onChange={(e) => setNewBuyPrice(e.target.value)}
                        className="bg-[#101C38] border border-[#233560] rounded-lg p-2 text-slate-200 font-mono outline-none"
                        required
                      />
                      <select
                        value={newStorage}
                        onChange={(e) => setNewStorage(e.target.value as any)}
                        className="bg-[#101C38] border border-[#233560] rounded-lg p-2 text-slate-200 font-mono outline-none"
                      >
                        <option value="HARDWARE">Hardware Wallet (Ledger/Trezor)</option>
                        <option value="COLD_WALLET">Cold Storage / Paper</option>
                        <option value="NON_CUSTODIAL">Non-Custodial (Metamask/Phantom)</option>
                        <option value="EXCHANGE">Centralized Exchange (Spot)</option>
                      </select>
                    </div>

                    <input
                      type="text"
                      placeholder="Optional Public Label / Note (e.g. Long-term DCA)"
                      value={newNotes}
                      onChange={(e) => setNewNotes(e.target.value)}
                      className="w-full bg-[#101C38] border border-[#233560] rounded-lg p-2 text-slate-200 outline-none text-xs"
                    />

                    {securityWarning && (
                      <div className="text-[10px] text-rose-400 bg-rose-950/40 p-2 rounded border border-rose-600/30">
                        {securityWarning}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] text-slate-500 italic">
                        *Never enter private keys or seed phrases.
                      </span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setShowAddHolding(false)}
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
                    </div>
                  </form>
                )}

                {/* Holdings Table */}
                <div className="space-y-2">
                  {portfolioData.holdingsWithMarket.map((item) => (
                    <div
                      key={item.holding.id}
                      className="bg-[#0A1226] p-3 rounded-xl border border-[#1C2C55] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-100 font-mono">{item.holding.symbol}</span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {item.holding.amount} tokens @ ${item.holding.averageBuyPriceUsd.toLocaleString()}
                          </span>
                          <span className="text-[9px] bg-[#142345] text-sky-300 px-1.5 py-0.2 rounded font-mono">
                            {item.holding.storageType}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">
                          {item.asset.name} • {item.portfolioWeightPercent}% of crypto capital
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-4 text-right">
                        <div>
                          <div className="font-bold text-slate-100 font-mono">
                            ${item.currentValueUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </div>
                          <div
                            className={`text-[10px] font-mono font-bold flex items-center justify-end gap-0.5 ${
                              item.unrealizedGainLossUsd >= 0 ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            {item.unrealizedGainLossUsd >= 0 ? '+' : ''}
                            ${item.unrealizedGainLossUsd.toLocaleString('en-US')} ({item.unrealizedGainLossPercent}%)
                          </div>
                        </div>

                        <button
                          onClick={() => handleDeleteHolding(item.holding.id)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
                          title="Delete tracked position"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB 2: ASSET SEARCH, PRICE, 24H CHANGE & CHARTS */}
      {/* ==================================================== */}
      {activeTab === 'search_chart' && (
        <div className="space-y-4">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search crypto assets (e.g. Bitcoin, ETH, Solana, Ripple, Doge)..."
              className="w-full bg-[#101C38] border border-[#1E2F59] focus:border-[#E0A96D] text-slate-100 text-xs rounded-xl pl-9 pr-3 py-2.5 outline-none font-mono"
            />

            {/* Suggestions Dropdown */}
            {searchResults.length > 0 && (
              <div className="absolute left-0 right-0 top-12 z-20 bg-[#0C152B] border border-[#203159] rounded-xl shadow-xl max-h-56 overflow-y-auto p-1 space-y-1">
                {searchResults.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => handleSelectSearchAsset(s.symbol)}
                    className="w-full text-left p-2 rounded-lg hover:bg-[#142345] flex items-center justify-between text-xs transition-colors"
                  >
                    <div>
                      <span className="font-bold text-slate-200 font-mono">{s.symbol}</span>
                      <span className="text-[10px] text-slate-400 ml-2">{s.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-100 font-mono font-semibold">${s.priceUsd}</span>
                      <span className="text-[9px] text-slate-500 block font-mono">Rank #{s.marketCapRank}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Selected Asset Details Card */}
          {selectedAsset && (
            <div className="bg-[#101C38] border border-[#1E2F59] rounded-2xl p-4 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#1C2C55] pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-slate-100 font-mono">
                      {selectedAsset.name} ({selectedAsset.symbol})
                    </span>
                    <span className="text-[10px] bg-[#142345] text-amber-400 px-2 py-0.5 rounded font-mono font-bold">
                      Rank #{selectedAsset.marketCapRank}
                    </span>
                    <span
                      className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-bold ${
                        selectedAsset.volatility === 'EXTREME'
                          ? 'bg-rose-950 text-rose-400 border border-rose-600'
                          : selectedAsset.volatility === 'HIGH'
                          ? 'bg-orange-950 text-orange-400 border border-orange-600'
                          : 'bg-emerald-950 text-emerald-400 border border-emerald-600'
                      }`}
                    >
                      {selectedAsset.volatility} VOLATILITY
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    30-Day Volatility Metric: {selectedAsset.volatility30dPercent}%
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleAddToWatchlist(selectedAsset.symbol)}
                    className="text-xs bg-[#16254A] hover:bg-[#1C2F5E] text-[#E0A96D] px-2.5 py-1.5 rounded-lg border border-[#233868] flex items-center gap-1 transition-colors"
                  >
                    <Star className="w-3.5 h-3.5" />
                    <span>Watchlist</span>
                  </button>
                  <button
                    onClick={() => {
                      setAlertSymbol(selectedAsset.symbol);
                      setAlertTargetPrice((selectedAsset.priceUsd * 1.08).toFixed(selectedAsset.priceUsd < 1 ? 4 : 1));
                      setActiveTab('alerts');
                    }}
                    className="text-xs bg-[#16254A] hover:bg-[#1C2F5E] text-slate-200 px-2.5 py-1.5 rounded-lg border border-[#233868] flex items-center gap-1 transition-colors"
                  >
                    <Bell className="w-3.5 h-3.5" />
                    <span>Set Alert</span>
                  </button>
                </div>
              </div>

              {/* Price & 24h Movement */}
              <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                <div>
                  <div className="text-3xl font-bold font-mono text-slate-100">
                    ${selectedAsset.priceUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
                  <div
                    className={`text-xs font-bold font-mono flex items-center gap-1 mt-0.5 ${
                      selectedAsset.change24hPercent >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {selectedAsset.change24hPercent >= 0 ? '+' : ''}
                    {selectedAsset.change24hPercent}% (24h Change)
                    <span className="text-slate-500 font-normal">≈ ₹{selectedAsset.priceInr.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                {/* Market Cap & Trading Volume Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono text-right pt-2 sm:pt-0">
                  <div className="bg-[#0A1226] p-2 rounded-lg border border-[#1C2C55]">
                    <span className="text-[9px] text-slate-500 block">MARKET CAP</span>
                    <span className="font-bold text-slate-200">
                      ${((selectedAsset.marketCapUsd || 0) / 1e9).toFixed(2)}B
                    </span>
                  </div>
                  <div className="bg-[#0A1226] p-2 rounded-lg border border-[#1C2C55]">
                    <span className="text-[9px] text-slate-500 block">24H VOLUME</span>
                    <span className="font-bold text-slate-200">
                      ${((selectedAsset.volume24hUsd || 0) / 1e6).toFixed(1)}M
                    </span>
                  </div>
                  <div className="bg-[#0A1226] p-2 rounded-lg border border-[#1C2C55]">
                    <span className="text-[9px] text-slate-500 block">24H HIGH</span>
                    <span className="font-bold text-slate-200">${selectedAsset.high24hUsd}</span>
                  </div>
                  <div className="bg-[#0A1226] p-2 rounded-lg border border-[#1C2C55]">
                    <span className="text-[9px] text-slate-500 block">24H LOW</span>
                    <span className="font-bold text-slate-200">${selectedAsset.low24hUsd}</span>
                  </div>
                </div>
              </div>

              {/* Historical Price Chart */}
              <div className="space-y-2 pt-2 border-t border-[#1C2C55]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wide">
                    Historical Price Trajectory
                  </span>
                  <div className="flex gap-1 bg-[#0A1226] p-1 rounded-lg border border-[#1C2C55] text-[10px] font-mono">
                    {(['24H', '7D', '30D', '90D', '1Y'] as CryptoHistoricalRange[]).map((r) => (
                      <button
                        key={r}
                        onClick={() => handleRangeChange(r)}
                        className={`px-2 py-0.5 rounded transition-colors ${
                          historicalRange === r
                            ? 'bg-[#E0A96D] text-[#0A1128] font-bold'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                {/* SVG Area Sparkline */}
                {historicalPoints.length > 0 && (
                  <div className="bg-[#070D1E] p-3 rounded-xl border border-[#172547] h-48 flex flex-col justify-between">
                    <div className="flex justify-between text-[10px] font-mono text-slate-500">
                      <span>Start: ${historicalPoints[0]?.priceUsd}</span>
                      <span>Latest: ${historicalPoints[historicalPoints.length - 1]?.priceUsd}</span>
                    </div>

                    <div className="w-full h-32 relative">
                      <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 50">
                        {(() => {
                          const prices = historicalPoints.map((d) => d.priceUsd);
                          const min = Math.min(...prices);
                          const max = Math.max(...prices);
                          const range = max - min || 1;

                          const points = prices
                            .map((p, i) => {
                              const x = (i / (prices.length - 1)) * 100;
                              const y = 45 - ((p - min) / range) * 40;
                              return `${x.toFixed(1)},${y.toFixed(1)}`;
                            })
                            .join(' ');

                          const isUp = prices[prices.length - 1] >= prices[0];
                          const strokeColor = isUp ? '#34D399' : '#F87171';
                          const fillColor = isUp ? 'rgba(52, 211, 153, 0.12)' : 'rgba(248, 113, 113, 0.12)';
                          const areaPoints = `0,50 ${points} 100,50`;

                          return (
                            <>
                              <polygon points={areaPoints} fill={fillColor} />
                              <polyline
                                fill="none"
                                stroke={strokeColor}
                                strokeWidth="1.8"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                points={points}
                              />
                            </>
                          );
                        })()}
                      </svg>
                    </div>

                    <div className="flex justify-between text-[9px] font-mono text-slate-500 border-t border-[#142347] pt-1">
                      <span>{historicalPoints[0]?.dateStr}</span>
                      <span>Range: {historicalRange}</span>
                      <span>{historicalPoints[historicalPoints.length - 1]?.dateStr}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB 3: CRYPTO WATCHLISTS */}
      {/* ==================================================== */}
      {activeTab === 'watchlist' && (
        <div className="bg-[#101C38] border border-[#1E2F59] rounded-2xl p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wide">
                Custom Crypto Watchlists
              </h3>
              <p className="text-[11px] text-slate-400">Track target tokens without custody or wallet connection.</p>
            </div>
            <button
              onClick={() => setShowCreateWl(!showCreateWl)}
              className="text-xs bg-[#E0A96D] text-[#0A1128] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New List</span>
            </button>
          </div>

          {showCreateWl && (
            <div className="bg-[#0A1226] p-3 rounded-xl border border-[#203159] space-y-2 text-xs">
              <label className="text-[11px] font-semibold text-slate-300">Watchlist Name:</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. DeFi Core, Metaverse, High Volatility"
                  value={newWlName}
                  onChange={(e) => setNewWlName(e.target.value)}
                  className="flex-1 bg-[#101C38] border border-[#233560] rounded-lg p-2 text-slate-200 text-xs outline-none"
                />
                <button
                  onClick={handleCreateWatchlist}
                  className="px-3 py-1 bg-[#E0A96D] text-[#0A1128] font-bold rounded-lg"
                >
                  Create
                </button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {watchlists.map((wl) => (
              <div key={wl.id} className="space-y-2 bg-[#0C152B] p-3 rounded-xl border border-[#1C2C55]">
                <div className="flex items-center justify-between text-xs font-bold text-[#E0A96D]">
                  <span>{wl.name} ({wl.symbols.length} assets)</span>
                </div>

                <div className="space-y-1.5">
                  {wl.symbols.map((sym) => {
                    const a = watchlistAssets.get(sym.toUpperCase());
                    return (
                      <div
                        key={sym}
                        className="bg-[#070D1E] p-2.5 rounded-lg border border-[#172547] flex items-center justify-between text-xs"
                      >
                        <div
                          className="cursor-pointer"
                          onClick={() => {
                            setSelectedSymbol(sym);
                            loadSelectedAsset(sym, historicalRange);
                            setActiveTab('search_chart');
                          }}
                        >
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-100 font-mono">{sym}</span>
                            <span className="text-[9px] bg-[#142345] text-slate-400 px-1.5 rounded">
                              {a?.volatility}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 block truncate">{a?.name || 'Crypto'}</span>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-right font-mono">
                            <span className="font-bold text-slate-200 block">
                              ${a?.priceUsd.toLocaleString() || '---'}
                            </span>
                            <span
                              className={`text-[10px] font-bold ${
                                (a?.change24hPercent || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'
                              }`}
                            >
                              {(a?.change24hPercent || 0) >= 0 ? '+' : ''}
                              {a?.change24hPercent}%
                            </span>
                          </div>

                          <button
                            onClick={() => handleRemoveFromWatchlist(sym)}
                            className="p-1 text-slate-500 hover:text-rose-400"
                            title="Remove from watchlist"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB 4: PRICE & VOLATILITY ALERTS */}
      {/* ==================================================== */}
      {activeTab === 'alerts' && (
        <div className="bg-[#101C38] border border-[#1E2F59] rounded-2xl p-4 space-y-4">
          <div>
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wide">
              Price & Volatility Threshold Alerts
            </h3>
            <p className="text-[11px] text-slate-400">
              Get notified when price levels breach resistance/support thresholds without leaving sensitive credentials.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleCreateAlert} className="bg-[#0A1226] p-3 rounded-xl border border-[#203159] space-y-2.5 text-xs">
            <div className="text-[11px] font-bold text-[#E0A96D]">Configure Crypto Price Alert:</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input
                type="text"
                placeholder="Symbol (e.g. BTC, ETH, SOL)"
                value={alertSymbol}
                onChange={(e) => setAlertSymbol(e.target.value)}
                className="bg-[#101C38] border border-[#233560] rounded-lg p-2 text-slate-200 font-mono outline-none"
                required
              />
              <select
                value={alertDirection}
                onChange={(e) => setAlertDirection(e.target.value as any)}
                className="bg-[#101C38] border border-[#233560] rounded-lg p-2 text-slate-200 font-mono outline-none"
              >
                <option value="PRICE_ABOVE">Price Rises Above ($ &gt;=)</option>
                <option value="PRICE_BELOW">Price Drops Below ($ &lt;=)</option>
              </select>
              <input
                type="number"
                step="any"
                placeholder="Target Price (USD)"
                value={alertTargetPrice}
                onChange={(e) => setAlertTargetPrice(e.target.value)}
                className="bg-[#101C38] border border-[#233560] rounded-lg p-2 text-slate-200 font-mono outline-none"
                required
              />
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Optional Note (e.g. Resistance test or DCA zone)"
                value={alertNote}
                onChange={(e) => setAlertNote(e.target.value)}
                className="flex-1 bg-[#101C38] border border-[#233560] rounded-lg p-2 text-slate-200 text-xs outline-none"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-[#E0A96D] hover:bg-[#F4A261] text-[#0A1128] font-bold rounded-lg transition-colors"
              >
                Set Alert
              </button>
            </div>
          </form>

          {/* Active Alerts List */}
          <div className="space-y-2">
            {alerts.length > 0 ? (
              alerts.map((a) => (
                <div
                  key={a.id}
                  className="bg-[#0A1226] p-3 rounded-xl border border-[#1C2C55] flex items-center justify-between text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-100 font-mono">{a.symbol}</span>
                      <span
                        className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold ${
                          a.isTriggered
                            ? 'bg-rose-950 text-rose-400 border border-rose-600'
                            : 'bg-emerald-950 text-emerald-400 border border-emerald-600'
                        }`}
                      >
                        {a.isTriggered ? 'TRIGGERED' : 'MONITORING ACTIVE'}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      Target: {a.direction === 'PRICE_ABOVE' ? 'Above' : 'Below'} ${a.targetPriceUsd}{' '}
                      {a.note && `• Note: ${a.note}`}
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteAlert(a.id)}
                    className="p-1.5 text-slate-500 hover:text-rose-400"
                    title="Delete alert"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-xs text-slate-500 bg-[#070D1E] rounded-xl border border-dashed border-[#172547]">
                No active crypto price alerts set.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB 5: RISK INDICATORS & SAFEGUARDS */}
      {/* ==================================================== */}
      {activeTab === 'risks' && (
        <div className="bg-[#101C38] border border-[#1E2F59] rounded-2xl p-4 space-y-4">
          <div className="flex items-start justify-between border-b border-[#1C2C55] pb-3">
            <div>
              <h3 className="text-xs font-bold text-slate-100 flex items-center gap-1.5 uppercase tracking-wide">
                <AlertTriangle className="w-4 h-4 text-[#E0A96D]" /> Crypto Risk Indicators & Safeguards
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Evaluates portfolio concentration, elevated volatility, and liquidity turnover ratios.
              </p>
            </div>
            <RiskBadgeView level="LOW RISK" size="sm" />
          </div>

          {/* Active Risk Indicators */}
          <div className="space-y-2.5">
            {portfolioData?.summary.riskIndicators && portfolioData.summary.riskIndicators.length > 0 ? (
              portfolioData.summary.riskIndicators.map((risk, i) => (
                <div key={i} className="bg-[#0A1226] p-3 rounded-xl border border-[#1C2C55] space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[9px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                          risk.severity === 'HIGH'
                            ? 'bg-rose-950 text-rose-400 border border-rose-600'
                            : risk.severity === 'MEDIUM'
                            ? 'bg-amber-950 text-amber-400 border border-amber-600'
                            : 'bg-sky-950 text-sky-400 border border-sky-600'
                        }`}
                      >
                        {risk.severity}
                      </span>
                      <span className="text-xs font-bold text-slate-200">{risk.name}</span>
                    </div>
                    <span className="text-[10px] font-mono text-[#E0A96D]">{risk.metricObserved}</span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">{risk.description}</p>

                  <div className="text-[10px] font-mono text-slate-500 pt-1 border-t border-[#142347]">
                    Notice: {risk.disclaimer}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-xs text-slate-400 bg-[#0A1226] rounded-xl border border-[#1C2C55]">
                No elevated risk indicators detected in your tracked crypto assets.
              </div>
            )}
          </div>

          {/* Constitutional Invariant Disclaimer */}
          <div className="p-3 bg-[#0A1226] rounded-xl border border-[#1E2F59] space-y-1.5 text-xs">
            <div className="text-[11px] font-bold text-[#E0A96D] uppercase flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Constitutional Safe Harbor Disclaimer
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Risk indicators such as high volatility, portfolio concentration, and liquidity concerns are analytical
              observations designed to help users manage exposure. <b>These indicators are strictly NOT proof of fraud or illicit activity.</b> Apka Dhan AI never asks for private keys, never stores seed phrases, and never executes trades.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
