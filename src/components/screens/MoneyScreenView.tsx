import React, { useState, useMemo } from 'react';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  CreditCard,
  BellRing,
  PieChart,
  ShieldCheck,
  Calendar,
  Layers,
  HelpCircle,
} from 'lucide-react';
import { globalUnifiedPortfolioEngine } from '../../engine/unifiedPortfolio/unifiedPortfolioEngine';
import { MessageAnalysisView } from './MessageAnalysisView';
import { FinancialTermExplanation } from '../common/FinancialTermExplanation';

export const MoneyScreenView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'spending' | 'anomalies'>('overview');
  const assessment = useMemo(() => {
    return globalUnifiedPortfolioEngine.calculateAssessment();
  }, []);

  // Synthetic local baseline transactions for demonstration
  const recentTransactions = [
    { id: 'tx_1', name: 'Swiggy Online Food', category: 'Food & Dining', amount: 480, type: 'DEBIT', time: 'Today, 1:15 PM', status: 'VERIFIED' },
    { id: 'tx_2', name: 'Blinkit Instant Delivery', category: 'Groceries', amount: 890, type: 'DEBIT', time: 'Yesterday, 6:40 PM', status: 'VERIFIED' },
    { id: 'tx_3', name: 'Salary Credit - Employer', category: 'Income', amount: 125000, type: 'CREDIT', time: 'Sep 25, 10:00 AM', status: 'VERIFIED' },
    { id: 'tx_4', name: 'SIP - Parag Parikh Flexi Cap', category: 'Investment', amount: 10000, type: 'DEBIT', time: 'Sep 20, 9:30 AM', status: 'VERIFIED' },
  ];

  const monthlySpendingTotal = recentTransactions
    .filter((t) => t.type === 'DEBIT')
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-1.5">
            <Wallet className="w-4 h-4 text-[#E0A96D]" /> Money & Financial Overview
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Track routine spending, offline parsed transaction messages, and net worth.
          </p>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="grid grid-cols-3 gap-1 bg-[#0A1226] p-1.5 rounded-xl border border-[#1E2F5E] text-xs font-semibold">
        <button
          onClick={() => setActiveTab('overview')}
          className={`py-2 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-colors ${
            activeTab === 'overview'
              ? 'bg-[#E0A96D] text-[#0A1128] font-bold shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <PieChart className="w-3.5 h-3.5" />
          <span>Overview</span>
        </button>
        <button
          onClick={() => setActiveTab('spending')}
          className={`py-2 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-colors ${
            activeTab === 'spending'
              ? 'bg-[#E0A96D] text-[#0A1128] font-bold shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <CreditCard className="w-3.5 h-3.5" />
          <span>Spending</span>
        </button>
        <button
          onClick={() => setActiveTab('anomalies')}
          className={`py-2 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-colors ${
            activeTab === 'anomalies'
              ? 'bg-[#E0A96D] text-[#0A1128] font-bold shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <BellRing className="w-3.5 h-3.5" />
          <span>SMS & Alerts</span>
        </button>
      </div>

      {/* Tab 1: Financial Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          {/* Net Worth Card */}
          <div className="bg-gradient-to-br from-[#121F42] to-[#0D1630] border border-[#233562] rounded-2xl p-4 shadow-md space-y-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#E0A96D] block">
              Aggregate Net Worth
            </span>

            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
              <div className="text-2xl font-bold text-slate-100 font-mono">
                ₹{assessment.totalCurrentValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
              <div
                className={`text-xs font-bold font-mono flex items-center gap-0.5 ${
                  assessment.totalUnrealizedPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {assessment.totalUnrealizedPnL >= 0 ? (
                  <ArrowUpRight className="w-3.5 h-3.5" />
                ) : (
                  <ArrowDownRight className="w-3.5 h-3.5" />
                )}
                ₹{Math.abs(assessment.totalUnrealizedPnL).toLocaleString('en-IN')} (
                {assessment.totalPercentageReturn}%)
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2.5 border-t border-[#1F2F57] text-xs">
              <div>
                <span className="text-[10px] text-slate-400 block uppercase">Total Invested</span>
                <span className="font-semibold text-slate-200 font-mono">
                  ₹{assessment.totalInvestedAmount.toLocaleString('en-IN')}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block uppercase">Tracked Assets</span>
                <span className="font-semibold text-slate-200 font-mono">
                  {assessment.positionsCount} holdings
                </span>
              </div>
            </div>
          </div>

          {/* Asset Allocation Breakdown */}
          <div className="bg-[#101C38] border border-[#1E2F59] rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-100 uppercase tracking-wide">
                Where is your money?
              </span>
              <FinancialTermExplanation
                term="Diversification"
                simpleExplanation="Spreading money across multiple asset types to lower risk."
              />
            </div>

            <div className="space-y-2">
              {assessment.assetClassExposures.map((ac) => (
                <div
                  key={ac.assetClass}
                  className="bg-[#0A1226] p-2.5 rounded-xl border border-[#1C2C55] flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-200">{ac.assetClass.replace('_', ' ')}</span>
                    <span className="text-[10px] bg-[#16254A] text-[#E0A96D] px-1.5 rounded font-mono font-bold">
                      {ac.percentage}%
                    </span>
                  </div>
                  <span className="font-mono text-slate-100 font-semibold">
                    ₹{ac.currentValue.toLocaleString('en-IN')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Spending Ledger */}
      {activeTab === 'spending' && (
        <div className="space-y-3">
          <div className="bg-[#101C38] border border-[#1E2F59] rounded-2xl p-4 space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-mono block">Recent Spending</span>
            <div className="text-xl font-bold text-slate-100 font-mono">
              ₹{monthlySpendingTotal.toLocaleString('en-IN')}
            </div>
            <p className="text-[11px] text-slate-400">
              Extracted from verified payment confirmations.
            </p>
          </div>

          <div className="space-y-2">
            {recentTransactions.map((tx) => (
              <div
                key={tx.id}
                className="bg-[#0A1226] border border-[#1C2C55] rounded-xl p-3 flex items-center justify-between text-xs"
              >
                <div className="space-y-0.5">
                  <div className="font-bold text-slate-200">{tx.name}</div>
                  <div className="text-[10px] text-slate-400">{tx.category} • {tx.time}</div>
                </div>
                <div className="text-right font-mono font-bold">
                  <span className={tx.type === 'CREDIT' ? 'text-emerald-400' : 'text-slate-100'}>
                    {tx.type === 'CREDIT' ? '+' : '-'}₹{tx.amount.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: SMS Parser & Baseline Anomalies */}
      {activeTab === 'anomalies' && (
        <div className="space-y-4">
          <MessageAnalysisView />
        </div>
      )}
    </div>
  );
};
