import React from 'react';
import { SecurityAlert, StockItem, CryptoItem } from '../../types';
import { RiskBadgeView } from '../RiskBadgeView';
import {
  ShieldCheck,
  QrCode,
  CreditCard,
  Link2,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  Lock,
  ChevronRight,
  Database,
  Coins,
  MessageSquare,
} from 'lucide-react';

interface HomeScreenViewProps {
  onNavigate: (tab: string, tool?: string) => void;
  recentAlerts: SecurityAlert[];
  stocks: StockItem[];
  crypto: CryptoItem[];
}

export const HomeScreenView: React.FC<HomeScreenViewProps> = ({
  onNavigate,
  recentAlerts,
  stocks,
  crypto,
}) => {
  const totalPortfolioValue = 1845200;
  const investedValue = 1420000;
  const unrealizedProfit = totalPortfolioValue - investedValue;
  const unrealizedPct = ((unrealizedProfit / investedValue) * 100).toFixed(1);

  return (
    <div className="space-y-4">
      {/* 1. Protection Status Shield */}
      <div className="bg-gradient-to-br from-[#121F42] to-[#0D1630] border border-[#233562] rounded-2xl p-4 shadow-md relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-bold tracking-wider text-emerald-400 uppercase font-mono">
              PROTECTION ACTIVE
            </span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">Synced 05:30 AM</span>
        </div>

        <div className="mt-2.5">
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-[#E0A96D]" />
            On-Device Threat Shield
          </h2>
          <p className="text-xs text-slate-300 mt-1 leading-relaxed">
            Local UPI syntax validator, phishing link inspector, and SEBI/RBI threat bloom filters active.
          </p>
        </div>

        <div className="mt-3 pt-2.5 border-t border-[#1F2F57] flex items-center justify-between text-[11px]">
          <span className="text-slate-400 flex items-center gap-1">
            <Lock className="w-3 h-3 text-[#E0A96D]" /> Zero Credentials Requested
          </span>
          <span className="text-slate-400 flex items-center gap-1">
            <Database className="w-3 h-3 text-emerald-400" /> SQLCipher Encrypted
          </span>
        </div>
      </div>

      {/* 2. Quick Verification Actions */}
      <div className="space-y-2">
        <div className="text-[11px] font-bold text-[#E0A96D] tracking-wider uppercase">
          Quick Verification Actions
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          <button
            onClick={() => onNavigate('protect', 'qr_link_security')}
            className="bg-[#101C38] hover:bg-[#16274D] border border-[#1E2F5B] rounded-xl p-3 text-left transition-all group flex flex-col justify-between"
          >
            <div className="w-7 h-7 rounded-lg bg-[#E0A96D]/15 border border-[#E0A96D]/30 flex items-center justify-center text-[#E0A96D] group-hover:scale-105 transition-transform">
              <QrCode className="w-4 h-4" />
            </div>
            <div className="mt-2">
              <div className="text-xs font-bold text-slate-100">QR & Link Security</div>
              <div className="text-[10px] text-slate-400">Scan QR & Analyze Links</div>
            </div>
          </button>

          <button
            onClick={() => onNavigate('protect', 'sms_analysis')}
            className="bg-[#101C38] hover:bg-[#16274D] border border-[#1E2F5B] rounded-xl p-3 text-left transition-all group flex flex-col justify-between"
          >
            <div className="w-7 h-7 rounded-lg bg-[#E0A96D]/15 border border-[#E0A96D]/30 flex items-center justify-center text-[#E0A96D] group-hover:scale-105 transition-transform">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div className="mt-2">
              <div className="text-xs font-bold text-slate-100">SMS Parser</div>
              <div className="text-[10px] text-slate-400">Offline Local Analysis</div>
            </div>
          </button>

          <button
            onClick={() => onNavigate('protect', 'upi_checker')}
            className="bg-[#101C38] hover:bg-[#16274D] border border-[#1E2F5B] rounded-xl p-3 text-left transition-all group flex flex-col justify-between"
          >
            <div className="w-7 h-7 rounded-lg bg-[#E0A96D]/15 border border-[#E0A96D]/30 flex items-center justify-center text-[#E0A96D] group-hover:scale-105 transition-transform">
              <CreditCard className="w-4 h-4" />
            </div>
            <div className="mt-2">
              <div className="text-xs font-bold text-slate-100">Check UPI ID</div>
              <div className="text-[10px] text-slate-400">Verify VPA handle</div>
            </div>
          </button>

          <button
            onClick={() => onNavigate('protect', 'link_checker')}
            className="bg-[#101C38] hover:bg-[#16274D] border border-[#1E2F5B] rounded-xl p-3 text-left transition-all group flex flex-col justify-between"
          >
            <div className="w-7 h-7 rounded-lg bg-[#E0A96D]/15 border border-[#E0A96D]/30 flex items-center justify-center text-[#E0A96D] group-hover:scale-105 transition-transform">
              <Link2 className="w-4 h-4" />
            </div>
            <div className="mt-2">
              <div className="text-xs font-bold text-slate-100">Check Link</div>
              <div className="text-[10px] text-slate-400">Phishing & Homoglyph</div>
            </div>
          </button>

          <button
            onClick={() => onNavigate('protect', 'scam_analyzer')}
            className="bg-[#101C38] hover:bg-[#16274D] border border-[#1E2F5B] rounded-xl p-3 text-left transition-all group flex flex-col justify-between"
          >
            <div className="w-7 h-7 rounded-lg bg-[#E0A96D]/15 border border-[#E0A96D]/30 flex items-center justify-center text-[#E0A96D] group-hover:scale-105 transition-transform">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div className="mt-2">
              <div className="text-xs font-bold text-slate-100">Check Offer</div>
              <div className="text-[10px] text-slate-400">Ponzi / Guaranteed ROI</div>
            </div>
          </button>
        </div>
      </div>

      {/* 3. Recent Security Alerts Preview */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-[#E0A96D] tracking-wider uppercase">
            Recent Security Alerts
          </span>
          <button
            onClick={() => onNavigate('alerts')}
            className="text-[11px] text-slate-400 hover:text-[#E0A96D] flex items-center gap-0.5 transition-colors"
          >
            View All ({recentAlerts.length}) <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-2">
          {recentAlerts.slice(0, 2).map((alert) => (
            <div
              key={alert.id}
              onClick={() => onNavigate('alerts')}
              className="bg-[#101C38] hover:bg-[#142345] border border-[#1E2F5A] rounded-xl p-3 cursor-pointer transition-colors space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-[#E0A96D]">{alert.category}</span>
                <RiskBadgeView level={alert.severity} size="sm" />
              </div>
              <div className="text-xs font-bold text-slate-100 leading-snug">{alert.title}</div>
              <p className="text-[11px] text-slate-300 line-clamp-2 leading-relaxed">
                {alert.summary}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Portfolio Snapshot Card */}
      <div
        onClick={() => onNavigate('investments')}
        className="bg-[#101C38] hover:bg-[#142345] border border-[#1E2F5A] rounded-xl p-4 cursor-pointer transition-colors space-y-2.5"
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-[#E0A96D] tracking-wider uppercase">
            Portfolio Health Snapshot
          </span>
          <RiskBadgeView level="MEDIUM RISK" size="sm" />
        </div>
        <div className="flex items-baseline justify-between">
          <div>
            <div className="text-[10px] text-slate-400 uppercase">Total Portfolio Value</div>
            <div className="text-lg font-bold text-slate-100 font-mono">₹{totalPortfolioValue.toLocaleString('en-IN')}</div>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-slate-400 uppercase">Unrealized P/L</div>
            <div className="text-xs font-bold text-emerald-400 font-mono">
              +₹{unrealizedProfit.toLocaleString('en-IN')} (+{unrealizedPct}%)
            </div>
          </div>
        </div>
        <div className="text-[11px] text-amber-300 bg-amber-950/40 border border-amber-600/30 p-2 rounded-lg flex items-center gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-400" />
          <span>Notice: Single holding concentration in RELIANCE is 28.5% (above 20% limit).</span>
        </div>
      </div>

      {/* 5. Crypto Snapshot Card */}
      <div
        onClick={() => onNavigate('crypto')}
        className="bg-[#101C38] hover:bg-[#142345] border border-[#1E2F5A] rounded-xl p-4 cursor-pointer transition-colors space-y-2"
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-[#E0A96D] tracking-wider uppercase flex items-center gap-1.5">
            <Coins className="w-3.5 h-3.5" /> Crypto Risk Radar
          </span>
          <RiskBadgeView level="LOW RISK" size="sm" />
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-300">Crypto Allocation:</span>
          <span className="font-bold text-slate-100 font-mono">6.5% of net wealth</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-300">Honeypot Checks:</span>
          <span className="text-emerald-400 font-semibold">0 Flagged in Core Holdings</span>
        </div>
      </div>
    </div>
  );
};
