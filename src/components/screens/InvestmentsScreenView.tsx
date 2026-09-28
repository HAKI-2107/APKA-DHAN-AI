import React, { useState } from 'react';
import { StockItem } from '../../types';
import { RiskBadgeView } from '../RiskBadgeView';
import { InvestmentScamView } from './InvestmentScamView';
import { StockIntelligenceView } from './StockIntelligenceView';
import {
  TrendingUp,
  AlertTriangle,
  PieChart,
  ShieldCheck,
  ChevronDown,
  Layers,
  ArrowUpRight,
  ShieldAlert,
} from 'lucide-react';

interface InvestmentsScreenViewProps {
  stocks: StockItem[];
}

export const InvestmentsScreenView: React.FC<InvestmentsScreenViewProps> = ({ stocks }) => {
  const [activeTab, setActiveTab] = useState<'stocks' | 'mutual_funds' | 'etfs' | 'scam_detector'>('stocks');

  const totalValue = 1845200;
  const investedValue = 1420000;
  const unrealizedProfit = totalValue - investedValue;
  const unrealizedPct = ((unrealizedProfit / investedValue) * 100).toFixed(1);

  const mutualFunds = [
    {
      name: 'Parag Parikh Flexi Cap Fund',
      nav: 78.45,
      allocation: '₹2,40,000',
      expenseRatio: '0.62%',
      riskCategory: 'Very High Risk (Equity)',
      safetyCheck: 'Portfolio churn low, well-diversified across 35 bluechip & tech stocks.'
    },
    {
      name: 'Mirae Asset Large Cap Fund',
      nav: 112.30,
      allocation: '₹2,02,800',
      expenseRatio: '0.54%',
      riskCategory: 'High Risk (Large Cap)',
      safetyCheck: 'Meets SEBI 80% large-cap concentration mandate.'
    }
  ];

  const etfs = [
    {
      name: 'Nippon India ETF Nifty 50 BeES',
      symbol: 'NIFTYBEES',
      price: 268.40,
      allocation: '₹1,20,000',
      trackingError: '0.03%',
      safetyCheck: 'Direct replica of benchmark Nifty 50.'
    },
    {
      name: 'Nippon India ETF Gold BeES',
      symbol: 'GOLDBEES',
      price: 68.90,
      allocation: '₹84,000',
      trackingError: '0.08%',
      safetyCheck: 'Physical gold backed, institutional custodian audit verified.'
    }
  ];

  return (
    <div className="space-y-4">
      {/* Portfolio Value Summary Card */}
      <div className="bg-gradient-to-br from-[#121F42] to-[#0D1630] border border-[#233562] rounded-2xl p-4 shadow-md space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold tracking-widest text-[#E0A96D] uppercase">
            TOTAL PORTFOLIO NET WORTH
          </span>
          <RiskBadgeView level="LOW RISK" size="sm" />
        </div>

        <div>
          <div className="text-2xl font-bold text-slate-100 font-mono">
            ₹{totalValue.toLocaleString('en-IN')}.00
          </div>
          <div className="text-xs text-slate-400 mt-0.5">Audited from connected demat/CAS statements</div>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#1F2F57]">
          <div>
            <div className="text-[10px] text-slate-400 uppercase">Invested Capital</div>
            <div className="text-sm font-semibold text-slate-200 font-mono">
              ₹{investedValue.toLocaleString('en-IN')}.00
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-slate-400 uppercase">Unrealized P/L</div>
            <div className="text-sm font-bold text-emerald-400 font-mono flex items-center justify-end gap-0.5">
              <ArrowUpRight className="w-4 h-4 text-emerald-400" />
              +₹{unrealizedProfit.toLocaleString('en-IN')} (+{unrealizedPct}%)
            </div>
          </div>
        </div>
      </div>

      {/* Investment Risk Alerts Banner */}
      <div className="bg-amber-950/40 border border-amber-600/40 rounded-xl p-3.5 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            Investment Risk Alerts (2 Identified)
          </span>
          <RiskBadgeView level="MEDIUM RISK" size="sm" />
        </div>
        <div className="space-y-1.5 text-xs text-slate-200">
          <div className="bg-[#101931] p-2.5 rounded-lg border border-[#223159]">
            <span className="font-semibold text-amber-300">High Promoter Pledge:</span> Vedanta Ltd (VEDL) has 62.4% promoter shares pledged as debt collateral. Volatility may trigger forced bank auctions.
          </div>
          <div className="bg-[#101931] p-2.5 rounded-lg border border-[#223159]">
            <span className="font-semibold text-amber-300">Single Asset Concentration:</span> Reliance Industries accounts for 28.5% of total equity holdings, exceeding the 20% prudence threshold.
          </div>
        </div>
      </div>

      {/* Asset Allocation Breakdown */}
      <div className="bg-[#101C38] border border-[#1E2F59] rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-[#E0A96D] uppercase tracking-wider flex items-center gap-1.5">
            <PieChart className="w-4 h-4" /> Asset Allocation Audit
          </span>
          <span className="text-[10px] text-slate-400">Target Diversified</span>
        </div>

        {/* Visual Progress Bar */}
        <div className="h-3 rounded-full bg-[#0A1226] overflow-hidden flex border border-[#1F315E]">
          <div style={{ width: '58%' }} className="bg-[#E0A96D]" title="Equity 58%" />
          <div style={{ width: '24%' }} className="bg-emerald-400" title="Mutual Funds 24%" />
          <div style={{ width: '10%' }} className="bg-amber-400" title="Gold SGB 10%" />
          <div style={{ width: '8%' }} className="bg-slate-500" title="Debt/FD 8%" />
        </div>

        {/* Legend */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#E0A96D]" />
            <span className="text-slate-300">Direct Equity: <b className="text-slate-100 font-mono">58%</b></span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-400" />
            <span className="text-slate-300">Mutual Funds: <b className="text-slate-100 font-mono">24%</b></span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-sm bg-amber-400" />
            <span className="text-slate-300">Gold / SGB: <b className="text-slate-100 font-mono">10%</b></span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-sm bg-slate-500" />
            <span className="text-slate-300">Debt / Liquid: <b className="text-slate-100 font-mono">8%</b></span>
          </div>
        </div>
      </div>

      {/* Holdings Tabs */}
      <div className="space-y-3">
        <div className="flex bg-[#0A1226] p-1 rounded-xl border border-[#1F315E]">
          <button
            onClick={() => setActiveTab('stocks')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors ${
              activeTab === 'stocks' ? 'bg-[#E0A96D] text-[#0A1128]' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Stock Intelligence
          </button>
          <button
            onClick={() => setActiveTab('mutual_funds')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors ${
              activeTab === 'mutual_funds' ? 'bg-[#E0A96D] text-[#0A1128]' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Mutual Funds ({mutualFunds.length})
          </button>
          <button
            onClick={() => setActiveTab('etfs')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors ${
              activeTab === 'etfs' ? 'bg-[#E0A96D] text-[#0A1128]' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            ETFs ({etfs.length})
          </button>
          <button
            onClick={() => setActiveTab('scam_detector')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1 ${
              activeTab === 'scam_detector'
                ? 'bg-[#E0A96D] text-[#0A1128]'
                : 'text-rose-400 hover:text-rose-300 hover:bg-rose-950/20'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Scam Detector</span>
          </button>
        </div>

        {/* Tab 1: Stock Intelligence & Portfolio Tracker */}
        {activeTab === 'stocks' && (
          <StockIntelligenceView />
        )}

        {/* Tab 2: Mutual Funds */}
        {activeTab === 'mutual_funds' && (
          <div className="space-y-2.5">
            {mutualFunds.map((mf, i) => (
              <div key={i} className="bg-[#101C38] border border-[#1E2F59] rounded-xl p-3.5 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-xs font-bold text-slate-100">{mf.name}</div>
                    <div className="text-[10px] text-slate-400">NAV: ₹{mf.nav} | TER: {mf.expenseRatio}</div>
                  </div>
                  <div className="text-xs font-bold text-slate-100 font-mono">{mf.allocation}</div>
                </div>
                <div className="text-[11px] text-slate-300 bg-[#0C152B] p-2 rounded border border-[#1C2B52]">
                  {mf.safetyCheck}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 3: ETFs */}
        {activeTab === 'etfs' && (
          <div className="space-y-2.5">
            {etfs.map((etf, i) => (
              <div key={i} className="bg-[#101C38] border border-[#1E2F59] rounded-xl p-3.5 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-xs font-bold text-slate-100">{etf.name}</div>
                    <div className="text-[10px] text-slate-400">Ticker: {etf.symbol} | Price: ₹{etf.price}</div>
                  </div>
                  <div className="text-xs font-bold text-slate-100 font-mono">{etf.allocation}</div>
                </div>
                <div className="text-[11px] text-slate-300 bg-[#0C152B] p-2 rounded border border-[#1C2B52]">
                  {etf.safetyCheck}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 4: Investment Scam Detector */}
        {activeTab === 'scam_detector' && (
          <div className="pt-1">
            <InvestmentScamView />
          </div>
        )}
      </div>
    </div>
  );
};
