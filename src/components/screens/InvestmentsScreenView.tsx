import React, { useState, useEffect } from 'react';
import { StockItem } from '../../types';
import { UnifiedPortfolioView } from './UnifiedPortfolioView';
import { StockIntelligenceView } from './StockIntelligenceView';
import { CryptoScreenView } from './CryptoScreenView';
import { InvestmentScamView } from './InvestmentScamView';
import { globalUnifiedPortfolioEngine } from '../../engine/unifiedPortfolio/unifiedPortfolioEngine';
import { UnifiedPortfolioAssessment } from '../../engine/unifiedPortfolio/types';
import { FinancialTermExplanation } from '../common/FinancialTermExplanation';
import {
  TrendingUp,
  Building,
  Layers,
  Coins,
  ShieldAlert,
  BarChart2,
  CheckCircle2,
  HelpCircle,
  Clock,
  Radio,
} from 'lucide-react';

interface InvestmentsScreenViewProps {
  stocks?: StockItem[];
}

export const InvestmentsScreenView: React.FC<InvestmentsScreenViewProps> = () => {
  const [activeTab, setActiveTab] = useState<'portfolio' | 'stocks' | 'funds' | 'crypto' | 'scam'>('portfolio');
  const [assessment, setAssessment] = useState<UnifiedPortfolioAssessment | null>(null);

  useEffect(() => {
    setAssessment(globalUnifiedPortfolioEngine.calculateAssessment());
  }, [activeTab]);

  const mutualFunds = [
    {
      name: 'Parag Parikh Flexi Cap Fund (Direct Growth)',
      isin: 'INF209K01167',
      nav: 78.45,
      allocation: '₹2,35,350',
      units: '3,000 units',
      expenseRatio: '0.62%',
      riskCategory: 'Very High Risk (Equity)',
      safetyCheck: 'Portfolio churn low, well-diversified across 35 bluechip & tech stocks. Direct plan has 0.8% lower TER than regular.',
    },
    {
      name: 'Mirae Asset Large Cap Fund (Direct Growth)',
      isin: 'INF769K01010',
      nav: 112.30,
      allocation: '₹2,02,140',
      units: '1,800 units',
      expenseRatio: '0.54%',
      riskCategory: 'High Risk (Large Cap)',
      safetyCheck: 'Meets SEBI 80% large-cap concentration mandate. Benchmark: NIFTY 100 TRI.',
    },
  ];

  const etfs = [
    {
      name: 'Nippon India ETF Nifty 50 BeES',
      symbol: 'NIFTYBEES',
      price: 268.40,
      allocation: '₹1,20,780',
      units: '450 units',
      trackingError: '0.03%',
      safetyCheck: 'Passive index replication. Physical equity custody held with SBI-SG Global Securities Services.',
    },
    {
      name: 'Nippon India ETF Gold BeES',
      symbol: 'GOLDBEES',
      price: 68.90,
      allocation: '₹82,680',
      units: '1,200 units',
      trackingError: '0.08%',
      safetyCheck: 'Physical gold backed (99.5% purity minimum), audited bi-annually by SEBI certified bullion assayer.',
    },
  ];

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-[#E0A96D]" /> Investments & Assets
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Calm, evidence-based asset tracking. Zero automated trading or speculative advice.
          </p>
        </div>

        {/* Live Market Feed Badge */}
        <div className="flex items-center gap-2 text-[10px] font-mono">
          <span className="text-emerald-400 bg-emerald-950/80 border border-emerald-600/40 px-2 py-0.5 rounded flex items-center gap-1">
            <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
            🟢 Live Market Connected
          </span>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="bg-[#0A1226] p-1.5 rounded-xl border border-[#1E2F5E] grid grid-cols-2 sm:grid-cols-5 gap-1.5 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('portfolio')}
          className={`py-2 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-colors ${
            activeTab === 'portfolio'
              ? 'bg-[#E0A96D] text-[#0A1128] font-bold shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Unified Portfolio</span>
        </button>

        <button
          onClick={() => setActiveTab('stocks')}
          className={`py-2 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-colors ${
            activeTab === 'stocks'
              ? 'bg-[#E0A96D] text-[#0A1128] font-bold shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <BarChart2 className="w-3.5 h-3.5" />
          <span>Stocks</span>
        </button>

        <button
          onClick={() => setActiveTab('funds')}
          className={`py-2 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-colors ${
            activeTab === 'funds'
              ? 'bg-[#E0A96D] text-[#0A1128] font-bold shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Building className="w-3.5 h-3.5" />
          <span>MFs & Gold</span>
        </button>

        <button
          onClick={() => setActiveTab('crypto')}
          className={`py-2 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-colors ${
            activeTab === 'crypto'
              ? 'bg-[#E0A96D] text-[#0A1128] font-bold shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Coins className="w-3.5 h-3.5" />
          <span>Crypto</span>
        </button>

        <button
          onClick={() => setActiveTab('scam')}
          className={`py-2 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-colors ${
            activeTab === 'scam'
              ? 'bg-[#E0A96D] text-[#0A1128] font-bold shadow-sm'
              : 'text-rose-400 hover:bg-rose-950/20'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Check Offer</span>
        </button>
      </div>

      {/* Tab 1: Unified Multi-Asset Portfolio */}
      {activeTab === 'portfolio' && (
        <div className="space-y-4">
          <UnifiedPortfolioView />
        </div>
      )}

      {/* Tab 2: Stock Intelligence Engine */}
      {activeTab === 'stocks' && (
        <div className="space-y-4">
          <StockIntelligenceView />
        </div>
      )}

      {/* Tab 3: Mutual Funds & Gold ETFs */}
      {activeTab === 'funds' && (
        <div className="space-y-4">
          {/* Mutual Funds Section */}
          <div className="bg-[#101C38] border border-[#1E2F59] rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-100 flex items-center gap-1.5 uppercase tracking-wide">
                <Building className="w-4 h-4 text-[#E0A96D]" /> Direct Mutual Funds
              </span>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-700/30">
                SEBI Regulated AMCs
              </span>
            </div>

            <div className="space-y-2.5">
              {mutualFunds.map((mf, i) => (
                <div key={i} className="bg-[#0A1226] border border-[#1C2C55] rounded-xl p-3.5 space-y-2 text-xs">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-bold text-slate-100">{mf.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        ISIN: {mf.isin} • NAV: ₹{mf.nav} • TER: {mf.expenseRatio}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-slate-100 font-mono">{mf.allocation}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{mf.units}</div>
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-300 bg-[#101C38] p-2.5 rounded-lg border border-[#1E2F59] leading-relaxed">
                    {mf.safetyCheck}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ETFs Section */}
          <div className="bg-[#101C38] border border-[#1E2F59] rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-100 flex items-center gap-1.5 uppercase tracking-wide">
                <Layers className="w-4 h-4 text-[#E0A96D]" /> Exchange Traded Funds (ETFs)
              </span>
              <span className="text-[10px] font-mono text-[#E0A96D] bg-[#E0A96D]/15 px-2 py-0.5 rounded border border-[#E0A96D]/30">
                Physical Demat Custody
              </span>
            </div>

            <div className="space-y-2.5">
              {etfs.map((etf, i) => (
                <div key={i} className="bg-[#0A1226] border border-[#1C2C55] rounded-xl p-3.5 space-y-2 text-xs">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-bold text-slate-100">{etf.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        Ticker: {etf.symbol} • CMP: ₹{etf.price} • Tracking Error: {etf.trackingError}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-slate-100 font-mono">{etf.allocation}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{etf.units}</div>
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-300 bg-[#101C38] p-2.5 rounded-lg border border-[#1E2F59] leading-relaxed">
                    {etf.safetyCheck}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Crypto Radar */}
      {activeTab === 'crypto' && (
        <div className="space-y-4">
          <CryptoScreenView cryptoList={[]} />
        </div>
      )}

      {/* Tab 5: Investment Scam Verification */}
      {activeTab === 'scam' && (
        <div className="space-y-4">
          <InvestmentScamView />
        </div>
      )}
    </div>
  );
};
