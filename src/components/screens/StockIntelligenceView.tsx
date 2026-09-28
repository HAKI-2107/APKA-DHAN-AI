import React, { useState, useEffect } from 'react';
import {
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
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  DollarSign,
  Activity,
  BarChart2,
  RefreshCw,
  ExternalLink,
  BookOpen,
} from 'lucide-react';
import {
  StockQuote,
  HistoricalPricePoint,
  HistoricalDataRange,
  StockSearchResult,
  UserHolding,
  HoldingWithMarketData,
  PortfolioSummary,
  Watchlist,
  StockAlert,
  StockFundamentalAnalysis,
} from '../../engine/stockIntelligence/types';
import {
  globalStockRepository,
  globalWatchlistRepository,
  globalHoldingRepository,
  globalPortfolioRepository,
} from '../../engine/stockIntelligence/repositories';

export const StockIntelligenceView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'portfolio' | 'search_quote' | 'watchlist' | 'alerts' | 'analysis'>('portfolio');

  // Portfolio State
  const [portfolioData, setPortfolioData] = useState<{
    summary: PortfolioSummary;
    holdingsWithMarket: HoldingWithMarketData[];
  } | null>(null);
  const [loadingPortfolio, setLoadingPortfolio] = useState(false);

  // Add Holding Form State
  const [showAddHolding, setShowAddHolding] = useState(false);
  const [newHoldSymbol, setNewHoldSymbol] = useState('');
  const [newHoldShares, setNewHoldShares] = useState('');
  const [newHoldPrice, setNewHoldPrice] = useState('');

  // Stock Search & Quote State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<StockSearchResult[]>([]);
  const [selectedSymbol, setSelectedSymbol] = useState<string>('RELIANCE.NS');
  const [selectedQuote, setSelectedQuote] = useState<StockQuote | null>(null);
  const [historicalRange, setHistoricalRange] = useState<HistoricalDataRange>('1M');
  const [historicalData, setHistoricalData] = useState<HistoricalPricePoint[]>([]);
  const [fundamentalData, setFundamentalData] = useState<StockFundamentalAnalysis | null>(null);

  // Watchlist State
  const [watchlists, setWatchlists] = useState<Watchlist[]>([]);
  const [selectedWatchlistId, setSelectedWatchlistId] = useState<string>('default_watchlist');
  const [watchlistQuotes, setWatchlistQuotes] = useState<Map<string, StockQuote>>(new Map());
  const [newWatchlistName, setNewWatchlistName] = useState('');
  const [showCreateWatchlist, setShowCreateWatchlist] = useState(false);

  // Alerts State
  const [alerts, setAlerts] = useState<StockAlert[]>([]);
  const [alertSymbol, setAlertSymbol] = useState('RELIANCE.NS');
  const [alertDirection, setAlertDirection] = useState<'PRICE_ABOVE' | 'PRICE_BELOW'>('PRICE_ABOVE');
  const [alertTargetPrice, setAlertTargetPrice] = useState('3100');
  const [alertNote, setAlertNote] = useState('');

  // Initial load
  useEffect(() => {
    refreshPortfolio();
    loadWatchlists();
    loadAlerts();
    loadSelectedStock(selectedSymbol, historicalRange);
  }, []);

  const refreshPortfolio = async () => {
    setLoadingPortfolio(true);
    try {
      const data = await globalPortfolioRepository.getPortfolioSummary();
      setPortfolioData(data);
    } catch (err) {
      console.error('Failed to load portfolio:', err);
    } finally {
      setLoadingPortfolio(false);
    }
  };

  const loadWatchlists = async () => {
    const lists = globalWatchlistRepository.getAll();
    setWatchlists(lists);

    const currentWl = lists.find((w) => w.id === selectedWatchlistId) || lists[0];
    if (currentWl) {
      setSelectedWatchlistId(currentWl.id);
      const quotes = await globalStockRepository.getQuotes(currentWl.symbols);
      setWatchlistQuotes(quotes);
    }
  };

  const loadAlerts = async () => {
    await globalPortfolioRepository.evaluateAlerts();
    setAlerts(globalPortfolioRepository.getAlerts());
  };

  const loadSelectedStock = async (symbol: string, range: HistoricalDataRange) => {
    const q = await globalStockRepository.getQuote(symbol);
    setSelectedQuote(q);
    const hist = await globalStockRepository.getHistoricalData(symbol, range);
    setHistoricalData(hist);
    const fund = globalStockRepository.getFundamentalAnalysis(symbol);
    setFundamentalData(fund);
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    const results = await globalStockRepository.searchStocks(query);
    setSearchResults(results);
  };

  const handleSelectSearchedStock = (symbol: string) => {
    setSelectedSymbol(symbol);
    setSearchQuery('');
    setSearchResults([]);
    loadSelectedStock(symbol, historicalRange);
  };

  const handleRangeChange = (range: HistoricalDataRange) => {
    setHistoricalRange(range);
    loadSelectedStock(selectedSymbol, range);
  };

  const handleAddHolding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHoldSymbol || !newHoldShares || !newHoldPrice) return;

    globalHoldingRepository.addHolding({
      symbol: newHoldSymbol.trim().toUpperCase(),
      shares: parseInt(newHoldShares, 10),
      averageBuyPrice: parseFloat(newHoldPrice),
      buyDateEpochMs: Date.now(),
    });

    setNewHoldSymbol('');
    setNewHoldShares('');
    setNewHoldPrice('');
    setShowAddHolding(false);
    await refreshPortfolio();
  };

  const handleDeleteHolding = async (id: string) => {
    globalHoldingRepository.removeHolding(id);
    await refreshPortfolio();
  };

  const handleCreateWatchlist = () => {
    if (!newWatchlistName.trim()) return;
    const created = globalWatchlistRepository.createWatchlist(newWatchlistName);
    setNewWatchlistName('');
    setShowCreateWatchlist(false);
    loadWatchlists();
    setSelectedWatchlistId(created.id);
  };

  const handleAddToWatchlist = (symbol: string) => {
    globalWatchlistRepository.addSymbol(selectedWatchlistId, symbol);
    loadWatchlists();
  };

  const handleRemoveFromWatchlist = (symbol: string) => {
    globalWatchlistRepository.removeSymbol(selectedWatchlistId, symbol);
    loadWatchlists();
  };

  const handleCreateAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!alertSymbol || !alertTargetPrice) return;

    globalPortfolioRepository.createAlert({
      symbol: alertSymbol.trim().toUpperCase(),
      direction: alertDirection,
      targetPrice: parseFloat(alertTargetPrice),
      isActive: true,
      note: alertNote || undefined,
    });

    setAlertNote('');
    await loadAlerts();
  };

  const handleDeleteAlert = async (id: string) => {
    globalPortfolioRepository.deleteAlert(id);
    await loadAlerts();
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {/* 1. Module Header Banner */}
      <div className="bg-[#101C38] border border-[#1E2F59] rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-[#E0A96D]" />
              Stock Intelligence & Portfolio Engine
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Track holdings, compute real-time unrealized gains, chart historical prices, and create target alerts.
            </p>
          </div>
          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/30 shrink-0">
            Market Data Layer
          </span>
        </div>

        {/* Constitutional Guardrail Callout */}
        <div className="bg-[#0C152B] p-2.5 rounded-xl border border-[#1C2B52] flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-slate-300 text-[11px]">
              <b>Zero Automated Buy/Sell Advice</b>: Strictly neutral market intelligence and educational analytics.
            </span>
          </div>
          <span className="text-[10px] font-mono text-slate-500 hidden sm:inline">
            Provider: MockMarketDataProvider
          </span>
        </div>
      </div>

      {/* 2. Top Navigation Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 bg-[#0C152B] p-1.5 rounded-xl border border-[#1C2B52] text-xs font-semibold">
        <button
          onClick={() => setActiveTab('portfolio')}
          className={`py-2 px-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-colors ${
            activeTab === 'portfolio'
              ? 'bg-[#E0A96D] text-[#0A1128] font-bold shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <PieChart className="w-3.5 h-3.5" />
          <span>Portfolio Value</span>
        </button>
        <button
          onClick={() => setActiveTab('search_quote')}
          className={`py-2 px-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-colors ${
            activeTab === 'search_quote'
              ? 'bg-[#E0A96D] text-[#0A1128] font-bold shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Search className="w-3.5 h-3.5" />
          <span>Stock Search</span>
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
          onClick={() => setActiveTab('analysis')}
          className={`py-2 px-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-colors ${
            activeTab === 'analysis'
              ? 'bg-[#E0A96D] text-[#0A1128] font-bold shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Analysis & Facts</span>
        </button>
      </div>

      {/* ==================================================== */}
      {/* TAB 1: PORTFOLIO VALUE, GAIN/LOSS & ALLOCATION */}
      {/* ==================================================== */}
      {activeTab === 'portfolio' && (
        <div className="space-y-4">
          {portfolioData && (
            <>
              {/* Value Summary Card */}
              <div className="bg-gradient-to-br from-[#121F42] to-[#0D1630] border border-[#233562] rounded-2xl p-4 shadow-md space-y-3">
                <div className="flex items-center justify-between text-[10px] font-bold tracking-widest text-[#E0A96D] uppercase">
                  <span>TOTAL EQUITY HOLDINGS VALUE</span>
                  <span className="font-mono text-slate-400 font-normal">
                    {portfolioData.summary.holdingsCount} Positions
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                  <div className="text-2xl sm:text-3xl font-bold text-slate-100 font-mono">
                    ₹{portfolioData.summary.totalCurrentValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                  <div
                    className={`text-sm font-bold font-mono flex items-center gap-1 ${
                      portfolioData.summary.totalUnrealizedGainLoss >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {portfolioData.summary.totalUnrealizedGainLoss >= 0 ? (
                      <ArrowUpRight className="w-4 h-4" />
                    ) : (
                      <ArrowDownRight className="w-4 h-4" />
                    )}
                    <span>
                      {portfolioData.summary.totalUnrealizedGainLoss >= 0 ? '+' : ''}
                      ₹{Math.abs(portfolioData.summary.totalUnrealizedGainLoss).toLocaleString('en-IN')} (
                      {portfolioData.summary.totalUnrealizedGainLossPercent}%)
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2.5 border-t border-[#1F2F57] text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Total Invested Capital</span>
                    <span className="font-bold font-mono text-slate-200">
                      ₹{portfolioData.summary.totalInvestedValue.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block uppercase">Net Unrealized P/L</span>
                    <span
                      className={`font-bold font-mono ${
                        portfolioData.summary.totalUnrealizedGainLoss >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {portfolioData.summary.totalUnrealizedGainLoss >= 0 ? '+' : ''}
                      ₹{portfolioData.summary.totalUnrealizedGainLoss.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Sector Allocations */}
              <div className="bg-[#101C38] border border-[#1E2F59] rounded-2xl p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5 uppercase tracking-wide">
                    <Layers className="w-4 h-4 text-[#E0A96D]" /> Sector Allocation Breakdown
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">Normalized Percentages</span>
                </div>

                {/* Progress bar */}
                <div className="h-2.5 rounded-full bg-[#0A1226] overflow-hidden flex border border-[#1F315E]">
                  {portfolioData.summary.sectorAllocations.map((sec, i) => {
                    const colors = ['bg-[#E0A96D]', 'bg-emerald-400', 'bg-sky-400', 'bg-amber-400', 'bg-purple-400'];
                    return (
                      <div
                        key={sec.sector}
                        style={{ width: `${sec.percentage}%` }}
                        className={colors[i % colors.length]}
                        title={`${sec.sector}: ${sec.percentage}%`}
                      />
                    );
                  })}
                </div>

                {/* Badges */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs font-mono">
                  {portfolioData.summary.sectorAllocations.map((sec, i) => (
                    <div key={sec.sector} className="bg-[#0A1226] p-2 rounded-lg border border-[#1C2C55]">
                      <span className="text-[10px] text-slate-400 block truncate">{sec.sector}</span>
                      <span className="font-bold text-slate-200">{sec.percentage}%</span>
                      <span className="text-[9px] text-slate-500 block truncate">
                        ₹{sec.currentValue.toLocaleString('en-IN')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Holdings List with Actions */}
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
                    <span>Add Position</span>
                  </button>
                </div>

                {/* Add Holding Form Modal / Dropdown */}
                {showAddHolding && (
                  <form onSubmit={handleAddHolding} className="bg-[#0A1226] p-3 rounded-xl border border-[#203159] space-y-2.5 text-xs">
                    <div className="text-[11px] font-bold text-[#E0A96D]">Enter New Holding Details:</div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <input
                        type="text"
                        placeholder="Symbol (e.g. INFY.NS)"
                        value={newHoldSymbol}
                        onChange={(e) => setNewHoldSymbol(e.target.value)}
                        className="bg-[#101C38] border border-[#233560] rounded-lg p-2 text-slate-200 font-mono outline-none"
                        required
                      />
                      <input
                        type="number"
                        placeholder="Quantity (Shares)"
                        value={newHoldShares}
                        onChange={(e) => setNewHoldShares(e.target.value)}
                        className="bg-[#101C38] border border-[#233560] rounded-lg p-2 text-slate-200 font-mono outline-none"
                        required
                      />
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Avg Buy Price (₹)"
                        value={newHoldPrice}
                        onChange={(e) => setNewHoldPrice(e.target.value)}
                        className="bg-[#101C38] border border-[#233560] rounded-lg p-2 text-slate-200 font-mono outline-none"
                        required
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
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
                        Save Holding
                      </button>
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
                            {item.holding.shares} shares @ ₹{item.holding.averageBuyPrice.toLocaleString('en-IN')}
                          </span>
                          <span className="text-[9px] bg-[#142345] text-[#E0A96D] px-1.5 py-0.2 rounded font-mono">
                            {item.portfolioWeightPercent}% portf.
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">{item.quote.name}</div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-4 text-right">
                        <div>
                          <div className="font-bold text-slate-100 font-mono">
                            ₹{item.currentValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </div>
                          <div
                            className={`text-[10px] font-mono font-bold flex items-center justify-end gap-0.5 ${
                              item.unrealizedGainLoss >= 0 ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            {item.unrealizedGainLoss >= 0 ? '+' : ''}
                            ₹{item.unrealizedGainLoss.toLocaleString('en-IN')} ({item.unrealizedGainLossPercent}%)
                          </div>
                        </div>

                        <button
                          onClick={() => handleDeleteHolding(item.holding.id)}
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
            </>
          )}
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB 2: SEARCH STOCKS, LIVE QUOTE & HISTORICAL CHART */}
      {/* ==================================================== */}
      {activeTab === 'search_quote' && (
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search stocks by name or ticker (e.g. Reliance, TCS, HDFC, Zomato)..."
              className="w-full bg-[#101C38] border border-[#1E2F59] focus:border-[#E0A96D] text-slate-100 text-xs rounded-xl pl-9 pr-3 py-2.5 outline-none font-mono"
            />

            {/* Dropdown Suggestions */}
            {searchResults.length > 0 && (
              <div className="absolute left-0 right-0 top-12 z-20 bg-[#0C152B] border border-[#203159] rounded-xl shadow-xl max-h-56 overflow-y-auto p-1 space-y-1">
                {searchResults.map((s) => (
                  <button
                    key={s.symbol}
                    onClick={() => handleSelectSearchedStock(s.symbol)}
                    className="w-full text-left p-2 rounded-lg hover:bg-[#142345] flex items-center justify-between text-xs transition-colors"
                  >
                    <div>
                      <span className="font-bold text-slate-200 font-mono">{s.symbol}</span>
                      <span className="text-[10px] text-slate-400 ml-2">{s.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-100 font-mono font-semibold">₹{s.currentPrice}</span>
                      <span className="text-[9px] text-[#E0A96D] block font-mono">{s.sector}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Detailed Selected Stock Quote */}
          {selectedQuote && (
            <div className="bg-[#101C38] border border-[#1E2F59] rounded-2xl p-4 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#1C2C55] pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-slate-100 font-mono">
                      {selectedQuote.symbol}
                    </span>
                    <span className="text-[10px] bg-[#142345] text-[#E0A96D] px-2 py-0.5 rounded font-mono font-bold">
                      {selectedQuote.exchange}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">{selectedQuote.name}</div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleAddToWatchlist(selectedQuote.symbol)}
                    className="text-xs bg-[#16254A] hover:bg-[#1C2F5E] text-[#E0A96D] px-2.5 py-1.5 rounded-lg border border-[#233868] flex items-center gap-1 transition-colors"
                  >
                    <Star className="w-3.5 h-3.5" />
                    <span>Watchlist</span>
                  </button>
                  <button
                    onClick={() => {
                      setAlertSymbol(selectedQuote.symbol);
                      setAlertTargetPrice((selectedQuote.currentPrice * 1.05).toFixed(1));
                      setActiveTab('alerts');
                    }}
                    className="text-xs bg-[#16254A] hover:bg-[#1C2F5E] text-slate-200 px-2.5 py-1.5 rounded-lg border border-[#233868] flex items-center gap-1 transition-colors"
                  >
                    <Bell className="w-3.5 h-3.5" />
                    <span>Set Alert</span>
                  </button>
                </div>
              </div>

              {/* Price & Daily Movement */}
              <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                <div>
                  <div className="text-3xl font-bold font-mono text-slate-100">
                    ₹{selectedQuote.currentPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                  <div
                    className={`text-xs font-bold font-mono flex items-center gap-1 mt-0.5 ${
                      selectedQuote.dayChange >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {selectedQuote.dayChange >= 0 ? '+' : ''}
                    ₹{selectedQuote.dayChange} ({selectedQuote.dayChangePercent >= 0 ? '+' : ''}
                    {selectedQuote.dayChangePercent}%)
                    <span className="text-slate-500 font-normal">Today's Movement</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono text-right pt-2 sm:pt-0">
                  <div className="bg-[#0A1226] p-2 rounded-lg border border-[#1C2C55]">
                    <span className="text-[9px] text-slate-500 block">DAY HIGH</span>
                    <span className="font-bold text-slate-200">₹{selectedQuote.dayHigh}</span>
                  </div>
                  <div className="bg-[#0A1226] p-2 rounded-lg border border-[#1C2C55]">
                    <span className="text-[9px] text-slate-500 block">DAY LOW</span>
                    <span className="font-bold text-slate-200">₹{selectedQuote.dayLow}</span>
                  </div>
                  <div className="bg-[#0A1226] p-2 rounded-lg border border-[#1C2C55]">
                    <span className="text-[9px] text-slate-500 block">52W HIGH</span>
                    <span className="font-bold text-slate-200">₹{selectedQuote.fiftyTwoWeekHigh}</span>
                  </div>
                  <div className="bg-[#0A1226] p-2 rounded-lg border border-[#1C2C55]">
                    <span className="text-[9px] text-slate-500 block">52W LOW</span>
                    <span className="font-bold text-slate-200">₹{selectedQuote.fiftyTwoWeekLow}</span>
                  </div>
                </div>
              </div>

              {/* Historical Price Chart Visualizer */}
              <div className="space-y-2 pt-2 border-t border-[#1C2C55]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wide">
                    Historical Price Trajectory
                  </span>
                  <div className="flex gap-1 bg-[#0A1226] p-1 rounded-lg border border-[#1C2C55] text-[10px] font-mono">
                    {(['1D', '1W', '1M', '3M', '1Y', '5Y'] as HistoricalDataRange[]).map((r) => (
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
                {historicalData.length > 0 && (
                  <div className="bg-[#070D1E] p-3 rounded-xl border border-[#172547] h-48 flex flex-col justify-between">
                    <div className="flex justify-between text-[10px] font-mono text-slate-500">
                      <span>Start: ₹{historicalData[0]?.close}</span>
                      <span>Latest: ₹{historicalData[historicalData.length - 1]?.close}</span>
                    </div>

                    {/* Dynamic SVG Curve */}
                    <div className="w-full h-32 relative">
                      <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 50">
                        {(() => {
                          const prices = historicalData.map((d) => d.close);
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
                      <span>{historicalData[0]?.dateStr}</span>
                      <span>Range: {historicalRange}</span>
                      <span>{historicalData[historicalData.length - 1]?.dateStr}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB 3: WATCHLIST MANAGER */}
      {/* ==================================================== */}
      {activeTab === 'watchlist' && (
        <div className="bg-[#101C38] border border-[#1E2F59] rounded-2xl p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wide">
                Custom Watchlists
              </h3>
              <p className="text-[11px] text-slate-400">Organize and monitor target equities in real time.</p>
            </div>
            <button
              onClick={() => setShowCreateWatchlist(!showCreateWatchlist)}
              className="text-xs bg-[#E0A96D] text-[#0A1128] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New List</span>
            </button>
          </div>

          {/* Create Watchlist Modal/Input */}
          {showCreateWatchlist && (
            <div className="bg-[#0A1226] p-3 rounded-xl border border-[#203159] space-y-2 text-xs">
              <label className="text-[11px] font-semibold text-slate-300">Watchlist Name:</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. Dividend Stars, High Beta, FMCG"
                  value={newWatchlistName}
                  onChange={(e) => setNewWatchlistName(e.target.value)}
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

          {/* Watchlist Items */}
          <div className="space-y-2">
            {watchlists.map((wl) => (
              <div key={wl.id} className="space-y-2 bg-[#0C152B] p-3 rounded-xl border border-[#1C2C55]">
                <div className="flex items-center justify-between text-xs font-bold text-[#E0A96D]">
                  <span>{wl.name} ({wl.symbols.length} tickers)</span>
                </div>

                <div className="space-y-1.5">
                  {wl.symbols.map((sym) => {
                    const q = watchlistQuotes.get(sym.toUpperCase());
                    return (
                      <div
                        key={sym}
                        className="bg-[#070D1E] p-2.5 rounded-lg border border-[#172547] flex items-center justify-between text-xs"
                      >
                        <div
                          className="cursor-pointer"
                          onClick={() => {
                            setSelectedSymbol(sym);
                            loadSelectedStock(sym, historicalRange);
                            setActiveTab('search_quote');
                          }}
                        >
                          <span className="font-bold text-slate-100 font-mono">{sym}</span>
                          <span className="text-[10px] text-slate-400 block truncate">{q?.name || 'Equity'}</span>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-right font-mono">
                            <span className="font-bold text-slate-200 block">
                              ₹{q?.currentPrice.toLocaleString('en-IN') || '---'}
                            </span>
                            <span
                              className={`text-[10px] font-bold ${
                                (q?.dayChangePercent || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'
                              }`}
                            >
                              {(q?.dayChangePercent || 0) >= 0 ? '+' : ''}
                              {q?.dayChangePercent}%
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
      {/* TAB 4: PRICE ALERTS CONSOLE */}
      {/* ==================================================== */}
      {activeTab === 'alerts' && (
        <div className="bg-[#101C38] border border-[#1E2F59] rounded-2xl p-4 space-y-4">
          <div>
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wide">
              Price Movement Alerts
            </h3>
            <p className="text-[11px] text-slate-400">
              Receive automatic notifications when target resistance or support price thresholds trigger.
            </p>
          </div>

          {/* Create Alert Form */}
          <form onSubmit={handleCreateAlert} className="bg-[#0A1226] p-3 rounded-xl border border-[#203159] space-y-2.5 text-xs">
            <div className="text-[11px] font-bold text-[#E0A96D]">Create New Stock Alert:</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input
                type="text"
                placeholder="Symbol (e.g. RELIANCE.NS)"
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
                <option value="PRICE_ABOVE">Price Rises Above (&gt;=)</option>
                <option value="PRICE_BELOW">Price Drops Below (&lt;=)</option>
              </select>
              <input
                type="number"
                step="0.01"
                placeholder="Target Price (₹)"
                value={alertTargetPrice}
                onChange={(e) => setAlertTargetPrice(e.target.value)}
                className="bg-[#101C38] border border-[#233560] rounded-lg p-2 text-slate-200 font-mono outline-none"
                required
              />
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Optional Note (e.g. Take profit target or rebalance level)"
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
                      Target: {a.direction === 'PRICE_ABOVE' ? 'Above' : 'Below'} ₹{a.targetPrice}{' '}
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
                No active stock price alerts set.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB 5: OBJECTIVE ANALYSIS & FACTS (NO BUY/SELL ADVICE) */}
      {/* ==================================================== */}
      {activeTab === 'analysis' && (
        <div className="bg-[#101C38] border border-[#1E2F59] rounded-2xl p-4 space-y-4">
          <div className="flex items-start justify-between border-b border-[#1C2C55] pb-3">
            <div>
              <h3 className="text-xs font-bold text-slate-100 flex items-center gap-1.5 uppercase tracking-wide">
                <BookOpen className="w-4 h-4 text-[#E0A96D]" /> Fundamental Health & Regulatory Checks
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Neutral, educational financial metrics evaluated strictly from statutory exchange filings.
              </p>
            </div>
            <span className="text-[10px] font-mono text-[#E0A96D] bg-[#E0A96D]/15 px-2 py-0.5 rounded border border-[#E0A96D]/30 font-bold">
              {selectedSymbol}
            </span>
          </div>

          {fundamentalData ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                <div className="bg-[#0A1226] p-2.5 rounded-xl border border-[#1C2C55]">
                  <span className="text-[10px] text-slate-500 block">P/E RATIO</span>
                  <span className="font-bold text-slate-100">{fundamentalData.peRatio}x</span>
                  <span className="text-[9px] text-slate-500 block">Ind: {fundamentalData.industryPe}x</span>
                </div>
                <div className="bg-[#0A1226] p-2.5 rounded-xl border border-[#1C2C55]">
                  <span className="text-[10px] text-slate-500 block">DEBT / EQUITY</span>
                  <span
                    className={`font-bold ${
                      fundamentalData.debtToEquity > 1.5 ? 'text-rose-400' : 'text-emerald-400'
                    }`}
                  >
                    {fundamentalData.debtToEquity}x
                  </span>
                  <span className="text-[9px] text-slate-500 block">Max 1.0x safe</span>
                </div>
                <div className="bg-[#0A1226] p-2.5 rounded-xl border border-[#1C2C55]">
                  <span className="text-[10px] text-slate-500 block">PROMOTER PLEDGE</span>
                  <span
                    className={`font-bold ${
                      fundamentalData.promoterPledgePercent > 20 ? 'text-rose-400' : 'text-emerald-400'
                    }`}
                  >
                    {fundamentalData.promoterPledgePercent}%
                  </span>
                  <span className="text-[9px] text-slate-500 block">Lender collateral</span>
                </div>
                <div className="bg-[#0A1226] p-2.5 rounded-xl border border-[#1C2C55]">
                  <span className="text-[10px] text-slate-500 block">SURVEILLANCE LIST</span>
                  <span className="font-bold text-emerald-400">
                    {fundamentalData.isAsmGsmSurveillance ? 'FLAGGED (ASM/GSM)' : 'CLEAR'}
                  </span>
                  <span className="text-[9px] text-slate-500 block">SEBI/NSE Alert</span>
                </div>
              </div>

              {/* Factual Observations */}
              <div className="space-y-1.5">
                <div className="text-[11px] font-bold text-slate-300">Factual Financial Observations:</div>
                {fundamentalData.observations.map((obs, i) => (
                  <div key={i} className="bg-[#0A1226] p-2.5 rounded-lg border border-[#1C2C55] text-xs text-slate-300 flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{obs}</span>
                  </div>
                ))}
                {fundamentalData.riskIndicators.map((risk, i) => (
                  <div key={i} className="bg-rose-950/20 p-2.5 rounded-lg border border-rose-600/30 text-xs text-rose-300 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <span>{risk}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-6 text-xs text-slate-500 bg-[#0A1226] rounded-xl border border-dashed border-[#1C2C55]">
              Select a stock in Stock Search tab to view detailed fundamental metrics.
            </div>
          )}

          {/* Constitutional Invariant Disclaimer */}
          <div className="p-3 bg-[#0A1226] rounded-xl border border-amber-600/30 text-[11px] text-amber-300/90 leading-relaxed">
            <span className="font-bold block mb-1">CONSTITUTIONAL STATUTORY DIRECTIVE:</span>
            Apka Dhan AI provides objective financial data and balance sheet ratios for user empowerment. It NEVER produces automated buy, sell, hold, or trading signals. Market investment decisions are solely the responsibility of the investor.
          </div>
        </div>
      )}
    </div>
  );
};
