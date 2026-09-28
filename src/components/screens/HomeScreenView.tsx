import React, { useMemo } from 'react';
import { SecurityAlert, StockItem, CryptoItem } from '../../types';
import { globalUnifiedPortfolioEngine } from '../../engine/unifiedPortfolio/unifiedPortfolioEngine';
import { useLanguage } from '../../context/LanguageContext';
import {
  ShieldCheck,
  QrCode,
  CreditCard,
  Link2,
  TrendingUp,
  AlertTriangle,
  Lock,
  ChevronRight,
  Database,
  Coins,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
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
  const { t } = useLanguage();
  const assessment = useMemo(() => {
    return globalUnifiedPortfolioEngine.calculateAssessment();
  }, []);

  const highRiskAlerts = recentAlerts.filter((a) => a.severity === 'HIGH RISK');
  const hasAlerts = highRiskAlerts.length > 0;

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* 1. Greeting & Money Safety Status Card */}
      <div className="space-y-1">
        <div className="text-xs text-slate-400 font-medium">Good day</div>
        <div className="text-sm font-bold text-slate-100">Your Money Safety</div>
      </div>

      <div
        className={`p-4 rounded-2xl border transition-all ${
          hasAlerts
            ? 'bg-gradient-to-br from-amber-950/40 to-[#0D1630] border-amber-600/40'
            : 'bg-gradient-to-br from-[#121F42] to-[#0D1630] border-[#233562]'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                hasAlerts ? 'bg-amber-400' : 'bg-emerald-400'
              } animate-pulse`}
            />
            <span
              className={`text-xs font-bold uppercase tracking-wider font-mono ${
                hasAlerts ? 'text-amber-400' : 'text-emerald-400'
              }`}
            >
              {hasAlerts ? `⚠️ ${t('attention', 'SOMETHING NEEDS ATTENTION')}` : `🛡️ ${t('protected', "YOU'RE PROTECTED")}`}
            </span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">Real-time Check</span>
        </div>

        <p className="text-xs text-slate-200 mt-2 leading-relaxed">
          {hasAlerts
            ? `${highRiskAlerts.length} item requires verification before you proceed.`
            : 'Nothing important needs your attention right now. All verified safety filters are active.'}
        </p>

        <div className="mt-3 pt-2.5 border-t border-[#1F2F57] flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1">
            <Lock className="w-3 h-3 text-[#E0A96D]" /> Zero Credentials Requested
          </span>
          <span className="flex items-center gap-1">
            <Database className="w-3 h-3 text-emerald-400" /> On-Device Privacy
          </span>
        </div>
      </div>

      {/* 2. Four Large Quick Action Cards */}
      <div className="space-y-2">
        <div className="text-[11px] font-bold text-[#E0A96D] tracking-wider uppercase">
          Quick Verification Actions
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          {/* Card 1: Scan QR */}
          <button
            onClick={() => onNavigate('protect', 'qr_scanner')}
            className="bg-[#101C38] hover:bg-[#16274D] border border-[#1E2F5B] rounded-2xl p-3.5 text-left transition-all group flex flex-col justify-between"
          >
            <div className="w-8 h-8 rounded-xl bg-[#E0A96D]/15 border border-[#E0A96D]/30 flex items-center justify-center text-[#E0A96D] group-hover:scale-105 transition-transform">
              <QrCode className="w-4 h-4" />
            </div>
            <div className="mt-3">
              <div className="text-xs font-bold text-slate-100">{t('scan_qr', 'Scan QR')}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Check before paying</div>
            </div>
          </button>

          {/* Card 2: Check a Link */}
          <button
            onClick={() => onNavigate('protect', 'link_checker')}
            className="bg-[#101C38] hover:bg-[#16274D] border border-[#1E2F5B] rounded-2xl p-3.5 text-left transition-all group flex flex-col justify-between"
          >
            <div className="w-8 h-8 rounded-xl bg-[#E0A96D]/15 border border-[#E0A96D]/30 flex items-center justify-center text-[#E0A96D] group-hover:scale-105 transition-transform">
              <Link2 className="w-4 h-4" />
            </div>
            <div className="mt-3">
              <div className="text-xs font-bold text-slate-100">{t('check_link', 'Check a Link')}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Phishing & fake portals</div>
            </div>
          </button>

          {/* Card 3: Check a Payment */}
          <button
            onClick={() => onNavigate('protect', 'upi_checker')}
            className="bg-[#101C38] hover:bg-[#16274D] border border-[#1E2F5B] rounded-2xl p-3.5 text-left transition-all group flex flex-col justify-between"
          >
            <div className="w-8 h-8 rounded-xl bg-[#E0A96D]/15 border border-[#E0A96D]/30 flex items-center justify-center text-[#E0A96D] group-hover:scale-105 transition-transform">
              <CreditCard className="w-4 h-4" />
            </div>
            <div className="mt-3">
              <div className="text-xs font-bold text-slate-100">{t('check_payment', 'Check a Payment')}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">UPI ID & Collect requests</div>
            </div>
          </button>

          {/* Card 4: Check an Investment */}
          <button
            onClick={() => onNavigate('protect', 'scam_analyzer')}
            className="bg-[#101C38] hover:bg-[#16274D] border border-[#1E2F5B] rounded-2xl p-3.5 text-left transition-all group flex flex-col justify-between"
          >
            <div className="w-8 h-8 rounded-xl bg-[#E0A96D]/15 border border-[#E0A96D]/30 flex items-center justify-center text-[#E0A96D] group-hover:scale-105 transition-transform">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div className="mt-3">
              <div className="text-xs font-bold text-slate-100">{t('check_invest', 'Check an Investment')}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Claims & WhatsApp groups</div>
            </div>
          </button>
        </div>
      </div>

      {/* 3. Your Money at a Glance */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-[#E0A96D] tracking-wider uppercase">
            Your Money at a Glance
          </span>
          <button
            onClick={() => onNavigate('money')}
            className="text-[11px] text-slate-400 hover:text-[#E0A96D] flex items-center gap-0.5 transition-colors"
          >
            View Finances <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        <div className="bg-[#101C38] border border-[#1E2F5A] rounded-2xl p-4 space-y-3">
          <div className="flex items-baseline justify-between">
            <div>
              <span className="text-[10px] text-slate-400 block uppercase">Total Portfolio Net Worth</span>
              <div className="text-xl font-bold text-slate-100 font-mono">
                ₹{assessment.totalCurrentValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block uppercase">Unrealized Gain / Loss</span>
              <div
                className={`text-xs font-bold font-mono flex items-center justify-end gap-0.5 ${
                  assessment.totalUnrealizedPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {assessment.totalUnrealizedPnL >= 0 ? (
                  <ArrowUpRight className="w-3.5 h-3.5" />
                ) : (
                  <ArrowDownRight className="w-3.5 h-3.5" />
                )}
                {assessment.totalUnrealizedPnL >= 0 ? '+' : ''}
                ₹{assessment.totalUnrealizedPnL.toLocaleString('en-IN')} ({assessment.totalPercentageReturn}%)
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#1C2C55] text-xs">
            <div>
              <span className="text-[10px] text-slate-400 block">Stocks & MFs</span>
              <span className="font-semibold text-slate-200 font-mono">
                {(
                  (assessment.assetClassExposures.find((a) => a.assetClass === 'STOCKS')?.percentage || 0) +
                  (assessment.assetClassExposures.find((a) => a.assetClass === 'MUTUAL_FUNDS')?.percentage || 0)
                ).toFixed(1)}%
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">Gold & ETFs</span>
              <span className="font-semibold text-slate-200 font-mono">
                {(assessment.assetClassExposures.find((a) => a.assetClass === 'ETFS')?.percentage || 0).toFixed(1)}%
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">Crypto</span>
              <span className="font-semibold text-slate-200 font-mono">
                {(assessment.assetClassExposures.find((a) => a.assetClass === 'CRYPTO')?.percentage || 0).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Recent Activity (Natural Language Narrative) */}
      <div className="space-y-2">
        <span className="text-[11px] font-bold text-[#E0A96D] tracking-wider uppercase">
          Recent Financial Activity
        </span>

        <div className="space-y-2 text-xs">
          <div className="bg-[#101C38] border border-[#1E2F5A] rounded-xl p-3 flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-950/60 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-600/30">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div className="space-y-0.5">
              <div className="font-bold text-slate-100">₹2,500 sent to Swiggy via UPI</div>
              <div className="text-[11px] text-slate-300">Verified merchant • Routine food delivery expense.</div>
            </div>
          </div>

          <div className="bg-[#101C38] border border-[#1E2F5A] rounded-xl p-3 flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#E0A96D]/15 text-[#E0A96D] flex items-center justify-center shrink-0 border border-[#E0A96D]/30">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div className="space-y-0.5">
              <div className="font-bold text-slate-100">Your portfolio value updated</div>
              <div className="text-[11px] text-slate-300">Reliance & TCS gained +0.8% today in market trading.</div>
            </div>
          </div>

          {hasAlerts && (
            <div
              onClick={() => onNavigate('alerts')}
              className="bg-amber-950/30 border border-amber-600/40 rounded-xl p-3 flex items-start gap-2.5 cursor-pointer hover:bg-amber-950/40 transition-colors"
            >
              <div className="w-7 h-7 rounded-lg bg-amber-950 text-amber-400 flex items-center justify-center shrink-0 border border-amber-600/40">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <div className="font-bold text-amber-300">⚠️ Suspicious interaction flagged</div>
                <div className="text-[11px] text-slate-300">
                  {highRiskAlerts[0]?.title || 'Review flagged item in alerts'}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
