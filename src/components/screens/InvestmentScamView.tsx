import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Info,
  CheckCircle2,
  HelpCircle,
  FileCheck2,
  ExternalLink,
  Loader2,
  Sparkles,
  Search,
  Building2,
  CreditCard,
  Link2,
  MessageSquare,
  Send,
  RotateCcw,
  BadgeAlert,
  FileText,
  Lock,
  Layers,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import {
  InvestmentScamInput,
  InvestmentScamAssessment,
  InvestmentSourceType,
} from '../../engine/investmentScam/types';
import { globalInvestmentScamDetector } from '../../engine/investmentScam/investmentScamDetector';
import { RiskBadgeView } from '../RiskBadgeView';

interface PresetScenario {
  id: string;
  name: string;
  badge: string;
  badgeColor: string;
  sourceType: InvestmentSourceType;
  entityName?: string;
  regNumber?: string;
  websiteUrl?: string;
  paymentAccount?: string;
  text: string;
  description: string;
}

const PRESET_SCENARIOS: PresetScenario[] = [
  {
    id: 'telegram_ponzi',
    name: 'Guaranteed 10% Daily Ponzi',
    badge: 'High Risk Scheme',
    badgeColor: 'text-rose-400 bg-rose-950/80 border-rose-500/40',
    sourceType: 'TELEGRAM_CHANNEL',
    entityName: 'Apex Quantum Wealth Bot',
    text: 'Earn 10% daily return guaranteed with our algorithmic trading bot. Double your capital in 7 days! Transfer funds to personal savings a/c of Rohit Sharma via UPI: apexwealth@okhdfcbank. Only 3 slots left before group closes!',
    description: 'Guaranteed returns, daily compounding yield, personal UPI, artificial urgency.',
  },
  {
    id: 'fake_sebi_group',
    name: 'Fake SEBI Approved VIP IPO Group',
    badge: 'Impersonation Vector',
    badgeColor: 'text-rose-400 bg-rose-950/80 border-rose-500/40',
    sourceType: 'WHATSAPP_MESSAGE',
    entityName: 'Goldman Sachs Institutional Allotment Club',
    regNumber: 'INH999888777',
    text: 'Welcome to the official Goldman Sachs VIP IPO Allotment WhatsApp group. 100% SEBI approved and government certified. We guarantee 200% profit on pre-IPO SME shares. Pay advance booking fee to savings a/c.',
    description: 'Impersonates institutional brand, claims fake SEBI WhatsApp approval.',
  },
  {
    id: 'clone_broker_apk',
    name: 'Clone Broker & Malicious APK',
    badge: 'Malware / Fake Portal',
    badgeColor: 'text-rose-400 bg-rose-950/80 border-rose-500/40',
    sourceType: 'WEBSITE_PORTAL',
    entityName: 'Groww Wealth Institutional Limited',
    websiteUrl: 'https://groww-vip-trade.top/login',
    text: 'Special institutional VIP portal: groww-vip-trade.top. Download our custom trading application install-groww.apk to view guaranteed 50x returns and trade directly on sub-accounts.',
    description: 'Disposable .top TLD, clone domain, unverified APK download request.',
  },
  {
    id: 'withdrawal_fee_extortion',
    name: 'Withdrawal Tax Extortion Fee',
    badge: 'Advance Fee Fraud',
    badgeColor: 'text-rose-400 bg-rose-950/80 border-rose-500/40',
    sourceType: 'DIRECT_MESSAGE',
    entityName: 'CryptoDouble International Trade',
    text: 'Congratulations! Your trading balance has reached ₹8,50,000. Your withdrawal request is currently locked. Pay 18% GST advance tax of ₹1,53,000 to unfreeze your account and release your funds immediately.',
    description: 'Demands advance tax fee to release fabricated trading profits.',
  },
  {
    id: 'weak_evidence_webinar',
    name: 'Educational Webinar (Weak Evidence)',
    badge: 'Restraint / Weak Evidence',
    badgeColor: 'text-amber-400 bg-amber-950/80 border-amber-500/40',
    sourceType: 'INVESTMENT_ADVERTISEMENT',
    entityName: 'National Financial Literacy Foundation',
    text: 'Only 15 seats left for our upcoming weekend beginner workshop on reading balance sheets and stock valuation. Registration fee ₹499.',
    description: 'Mild marketing urgency in legitimate educational context. Evaluates to UNKNOWN / UNVERIFIED without accusing of fraud.',
  },
  {
    id: 'legitimate_broker',
    name: 'Legitimate SEBI Registered Broker Offer',
    badge: 'Compliant Intermediary',
    badgeColor: 'text-emerald-400 bg-emerald-950/80 border-emerald-500/40',
    sourceType: 'BROKER_OFFER',
    entityName: 'Zerodha Broking Limited',
    regNumber: 'INZ000031633',
    websiteUrl: 'https://zerodha.com',
    text: 'Open a Demat and Trading account with Zerodha Broking Limited (SEBI Reg: INZ000031633). Investments in securities market are subject to market risks, read all the related documents carefully before investing.',
    description: 'Officially registered SEBI broker, standard statutory risk disclaimer, no illegal guarantees.',
  },
];

export const InvestmentScamView: React.FC = () => {
  const [sourceType, setSourceType] = useState<InvestmentSourceType>('TELEGRAM_CHANNEL');
  const [inputText, setInputText] = useState(PRESET_SCENARIOS[0].text);
  const [claimedEntity, setClaimedEntity] = useState(PRESET_SCENARIOS[0].entityName || '');
  const [claimedReg, setClaimedReg] = useState(PRESET_SCENARIOS[0].regNumber || '');
  const [websiteUrl, setWebsiteUrl] = useState(PRESET_SCENARIOS[0].websiteUrl || '');
  const [paymentAccount, setPaymentAccount] = useState(PRESET_SCENARIOS[0].paymentAccount || '');
  const [enableAiReasoning, setEnableAiReasoning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [assessment, setAssessment] = useState<InvestmentScamAssessment | null>(null);
  const [activeTab, setActiveTab] = useState<'signals' | 'evidence' | 'verification' | 'sources' | 'unknowns'>('signals');

  const handleSelectPreset = (preset: PresetScenario) => {
    setSourceType(preset.sourceType);
    setInputText(preset.text);
    setClaimedEntity(preset.entityName || '');
    setClaimedReg(preset.regNumber || '');
    setWebsiteUrl(preset.websiteUrl || '');
    setPaymentAccount(preset.paymentAccount || '');
    setAssessment(null);
  };

  const handleRunAnalysis = async () => {
    if (!inputText.trim()) return;
    setLoading(true);

    try {
      const payload: InvestmentScamInput = {
        text: inputText.trim(),
        sourceType,
        claimedEntityName: claimedEntity.trim() || undefined,
        claimedRegistrationNo: claimedReg.trim() || undefined,
        websiteUrl: websiteUrl.trim() || undefined,
        paymentAccountOrVpa: paymentAccount.trim() || undefined,
      };

      // Try calling server endpoint first, fallback to client-side engine
      const res = await fetch('/api/security/analyze-investment-scam', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...payload,
          enableAiDeepReasoning: enableAiReasoning,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.assessment) {
          setAssessment(data.assessment);
          setLoading(false);
          return;
        }
      }

      // Offline deterministic fallback
      const localResult = await globalInvestmentScamDetector.analyze(payload);
      setAssessment(localResult);
    } catch (err) {
      console.warn('Network call failed, executing local InvestmentScamDetector:', err);
      const fallbackResult = await globalInvestmentScamDetector.analyze({
        text: inputText.trim(),
        sourceType,
        claimedEntityName: claimedEntity.trim() || undefined,
        claimedRegistrationNo: claimedReg.trim() || undefined,
        websiteUrl: websiteUrl.trim() || undefined,
        paymentAccountOrVpa: paymentAccount.trim() || undefined,
      });
      setAssessment(fallbackResult);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {/* 1. Module Header & Evidentiary Constitution Banner */}
      <div className="bg-[#101C38] border border-[#1E2F59] rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-[#E0A96D]" />
              Investment Scam & Offer Detector
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Multi-layer analysis of investment ads, Telegram/WhatsApp groups, PDFs, websites, and returns claims.
            </p>
          </div>
          <span className="text-[10px] font-mono text-[#E0A96D] bg-[#E0A96D]/15 px-2.5 py-1 rounded border border-[#E0A96D]/30 shrink-0 font-bold">
            SEBI Regulatory Audit
          </span>
        </div>

        {/* Evidentiary Constitution Directives */}
        <div className="bg-[#0C152B] p-3 rounded-xl border border-[#1C2B52] grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          <div className="flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-[10px] text-slate-500 block font-mono">EVIDENTIARY THRESHOLD:</span>
              <span className="text-slate-200 font-medium leading-relaxed">
                Zero accusation on weak evidence alone. Strict distinction between confirmed facts and unknowns.
              </span>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Lock className="w-4 h-4 text-[#E0A96D] shrink-0 mt-0.5" />
            <div>
              <span className="text-[10px] text-slate-500 block font-mono">REGULATORY GROUND TRUTH:</span>
              <span className="text-slate-200 font-medium leading-relaxed">
                Never fabricates registrations. Entity status must be verified against official registries.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Preset Scenarios Bar */}
      <div className="space-y-1.5">
        <div className="text-[11px] font-semibold text-slate-300 flex items-center justify-between">
          <span>Synthetic Test Scenarios:</span>
          <span className="text-[10px] text-slate-500 font-mono italic">
            *100% synthetic fictitious test vectors
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-xs">
          {PRESET_SCENARIOS.map((p) => {
            const isSelected = inputText === p.text;
            return (
              <button
                key={p.id}
                onClick={() => handleSelectPreset(p)}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'bg-[#E0A96D]/15 border-[#E0A96D] text-[#E0A96D] font-bold shadow-sm'
                    : 'bg-[#101C38] border-[#1E2F59] text-slate-400 hover:text-slate-200 hover:bg-[#142345]'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold text-slate-200 truncate">{p.name}</span>
                </div>
                <div className="text-[9px] text-slate-500 truncate font-mono">{p.description}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Input Console */}
      <div className="bg-[#101C38] border border-[#1E2F59] rounded-2xl p-4 space-y-3.5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {/* Source Type Selector */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-300">Communication Source:</label>
            <select
              value={sourceType}
              onChange={(e) => setSourceType(e.target.value as InvestmentSourceType)}
              className="w-full bg-[#0A1226] border border-[#203159] focus:border-[#E0A96D] text-slate-200 text-xs rounded-xl p-2.5 outline-none font-mono"
            >
              <option value="TELEGRAM_CHANNEL">Telegram Channel / VIP Group</option>
              <option value="WHATSAPP_MESSAGE">WhatsApp Group / Direct Message</option>
              <option value="INVESTMENT_ADVERTISEMENT">Investment Advertisement / Social Ad</option>
              <option value="SOCIAL_MEDIA_POST">Social Media Post / Instagram DM</option>
              <option value="PDF_PROSPECTUS">PDF Prospectus / Term Sheet</option>
              <option value="SCREENSHOT_OCR">Screenshot OCR / Profit Screenshot</option>
              <option value="WEBSITE_PORTAL">Website Portal / Clone Broker Link</option>
              <option value="BROKER_OFFER">Broker Offer / PMS Email</option>
              <option value="PAYMENT_INSTRUCTION">Payment Instruction / Bank Transfer</option>
            </select>
          </div>

          {/* Claimed Entity Name */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-300">Claimed Company / Broker:</label>
            <input
              type="text"
              value={claimedEntity}
              onChange={(e) => setClaimedEntity(e.target.value)}
              placeholder="e.g. Goldman Sachs VIP, Zerodha, Apex Trades"
              className="w-full bg-[#0A1226] border border-[#203159] focus:border-[#E0A96D] text-slate-200 text-xs rounded-xl p-2.5 outline-none font-mono"
            />
          </div>
        </div>

        {/* Claimed Reg No & Website */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-300">SEBI Reg No (if claimed):</label>
            <input
              type="text"
              value={claimedReg}
              onChange={(e) => setClaimedReg(e.target.value)}
              placeholder="e.g. INZ000031633 or INH000001234"
              className="w-full bg-[#0A1226] border border-[#203159] focus:border-[#E0A96D] text-slate-200 text-xs rounded-xl p-2.5 outline-none font-mono"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-300">Website / Link (if any):</label>
            <input
              type="text"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              placeholder="e.g. https://groww-wealth.top"
              className="w-full bg-[#0A1226] border border-[#203159] focus:border-[#E0A96D] text-slate-200 text-xs rounded-xl p-2.5 outline-none font-mono"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-300">Payment Account / UPI:</label>
            <input
              type="text"
              value={paymentAccount}
              onChange={(e) => setPaymentAccount(e.target.value)}
              placeholder="e.g. Savings A/C or vpa@okhdfcbank"
              className="w-full bg-[#0A1226] border border-[#203159] focus:border-[#E0A96D] text-slate-200 text-xs rounded-xl p-2.5 outline-none font-mono"
            />
          </div>
        </div>

        {/* Offer Message Text */}
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-slate-300">
            Investment Communication / Advertisement / Return Claim:
          </label>
          <textarea
            rows={3}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Paste text of the investment ad, WhatsApp pitch, Telegram tip, or email here..."
            className="w-full bg-[#0A1226] border border-[#203159] focus:border-[#E0A96D] text-slate-100 text-xs rounded-xl p-3 outline-none font-mono resize-none leading-relaxed"
          />
        </div>

        {/* AI Deep Reasoning & Action Button */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
          <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-400">
            <input
              type="checkbox"
              checked={enableAiReasoning}
              onChange={(e) => setEnableAiReasoning(e.target.checked)}
              className="rounded bg-[#0A1226] border-[#203159] text-[#E0A96D] focus:ring-0"
            />
            <span className="flex items-center gap-1 text-slate-300">
              <Sparkles className="w-3.5 h-3.5 text-[#E0A96D]" />
              Enable Gemini Deep Scam Reasoning
            </span>
          </label>

          <button
            onClick={handleRunAnalysis}
            disabled={!inputText.trim() || loading}
            className="w-full sm:w-auto px-6 py-2.5 bg-[#E0A96D] hover:bg-[#F4A261] disabled:opacity-50 text-[#0A1128] font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            Analyze Investment Offer Safety
          </button>
        </div>
      </div>

      {/* 4. RESULTS DISPLAY (Exact 6 Output Fields) */}
      {assessment && (
        <div className="space-y-4 animate-in fade-in duration-300">
          {/* FIELD 1: RISK LEVEL BANNER */}
          <div
            className={`rounded-2xl p-4 border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
              assessment.riskLevel === 'HIGH RISK'
                ? 'bg-rose-950/40 border-rose-600/50 text-rose-200'
                : assessment.riskLevel === 'MEDIUM RISK'
                ? 'bg-amber-950/40 border-amber-600/50 text-amber-200'
                : assessment.riskLevel === 'LOW RISK'
                ? 'bg-emerald-950/40 border-emerald-600/50 text-emerald-200'
                : 'bg-slate-900 border-slate-700 text-slate-300'
            }`}
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-slate-400">
                  EVALUATED RISK LEVEL:
                </span>
                <RiskBadgeView level={assessment.riskLevel} size="md" />
              </div>
              <p className="text-xs text-slate-300 leading-relaxed max-w-2xl mt-1">
                {assessment.summaryRationale}
              </p>
            </div>

            <div className="shrink-0 text-right sm:border-l sm:border-[#2C3B63] sm:pl-4">
              <span className="text-[10px] text-slate-400 font-mono block">SIGNALS TRIGGERED</span>
              <span className="text-xl font-bold font-mono text-slate-100">
                {assessment.signals.length}
              </span>
            </div>
          </div>

          {/* Section Navigation Tabs for 6 Fields */}
          <div className="flex flex-wrap gap-1.5 border-b border-[#1E2F59] pb-2 text-xs">
            <button
              onClick={() => setActiveTab('signals')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === 'signals'
                  ? 'bg-[#E0A96D] text-[#0A1128] font-bold'
                  : 'bg-[#101C38] text-slate-400 hover:text-slate-200'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              Signals ({assessment.signals.length})
            </button>
            <button
              onClick={() => setActiveTab('evidence')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === 'evidence'
                  ? 'bg-[#E0A96D] text-[#0A1128] font-bold'
                  : 'bg-[#101C38] text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileCheck2 className="w-3.5 h-3.5" />
              Evidence ({assessment.evidence.length})
            </button>
            <button
              onClick={() => setActiveTab('verification')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === 'verification'
                  ? 'bg-[#E0A96D] text-[#0A1128] font-bold'
                  : 'bg-[#101C38] text-slate-400 hover:text-slate-200'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Verification Steps ({assessment.verificationSteps.length})
            </button>
            <button
              onClick={() => setActiveTab('sources')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === 'sources'
                  ? 'bg-[#E0A96D] text-[#0A1128] font-bold'
                  : 'bg-[#101C38] text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Source Requirements ({assessment.sourceRequirements.length})
            </button>
            <button
              onClick={() => setActiveTab('unknowns')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === 'unknowns'
                  ? 'bg-[#E0A96D] text-[#0A1128] font-bold'
                  : 'bg-[#101C38] text-slate-400 hover:text-slate-200'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5" />
              Unknowns ({assessment.unknowns.length})
            </button>
          </div>

          {/* TAB 1: SIGNALS */}
          {activeTab === 'signals' && (
            <div className="space-y-2.5">
              {assessment.signals.length > 0 ? (
                assessment.signals.map((sig, idx) => (
                  <div
                    key={idx}
                    className="bg-[#101C38] border border-[#1E2F59] rounded-xl p-3.5 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                            sig.severity === 'CRITICAL'
                              ? 'bg-rose-950 text-rose-400 border border-rose-600'
                              : sig.severity === 'HIGH'
                              ? 'bg-orange-950 text-orange-400 border border-orange-600'
                              : 'bg-amber-950 text-amber-400 border border-amber-600'
                          }`}
                        >
                          {sig.severity}
                        </span>
                        <span className="text-xs font-bold text-slate-200">{sig.name}</span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">
                        Category: {sig.category}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">{sig.description}</p>

                    {sig.matchedText && (
                      <div className="bg-[#0A1226] p-2 rounded-lg border border-[#1C2C55] text-[11px] font-mono text-[#E0A96D]">
                        Matched Token: "{sig.matchedText}"
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="bg-[#101C38] border border-[#1E2F59] rounded-xl p-6 text-center text-xs text-slate-400">
                  No scam or deceptive signals detected in this input.
                </div>
              )}
            </div>
          )}

          {/* TAB 2: EVIDENCE */}
          {activeTab === 'evidence' && (
            <div className="bg-[#101C38] border border-[#1E2F59] rounded-xl p-4 space-y-3">
              <h3 className="text-xs font-bold text-slate-200 flex items-center gap-1.5 uppercase tracking-wide">
                <FileCheck2 className="w-4 h-4 text-[#E0A96D]" />
                Concrete Extracted Evidence
              </h3>
              <p className="text-xs text-slate-400">
                Factual quotes, URLs, and regulatory records extracted directly from the offer.
              </p>
              <div className="space-y-2 pt-1">
                {assessment.evidence.map((ev, idx) => (
                  <div
                    key={idx}
                    className="bg-[#0A1226] p-3 rounded-lg border border-[#1C2C55] flex items-start gap-2.5 text-xs text-slate-200"
                  >
                    <span className="w-5 h-5 rounded-full bg-[#18284E] text-[#E0A96D] text-[10px] font-mono flex items-center justify-center shrink-0 mt-0.5 font-bold">
                      {idx + 1}
                    </span>
                    <span className="leading-relaxed font-mono">{ev}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: VERIFICATION STEPS */}
          {activeTab === 'verification' && (
            <div className="bg-[#101C38] border border-[#1E2F59] rounded-xl p-4 space-y-3">
              <h3 className="text-xs font-bold text-slate-200 flex items-center gap-1.5 uppercase tracking-wide">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Actionable Verification Checklist
              </h3>
              <p className="text-xs text-slate-400">
                Mandatory due diligence actions before engaging or committing capital.
              </p>
              <div className="space-y-2 pt-1">
                {assessment.verificationSteps.map((step, idx) => (
                  <div
                    key={idx}
                    className="bg-[#0A1226] p-3 rounded-lg border border-[#1C2C55] flex items-start gap-2.5 text-xs text-slate-200"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{step}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: SOURCE REQUIREMENTS */}
          {activeTab === 'sources' && (
            <div className="bg-[#101C38] border border-[#1E2F59] rounded-xl p-4 space-y-3">
              <h3 className="text-xs font-bold text-slate-200 flex items-center gap-1.5 uppercase tracking-wide">
                <FileText className="w-4 h-4 text-[#E0A96D]" />
                Mandatory Regulatory Proofs & Source Documents
              </h3>
              <p className="text-xs text-slate-400">
                Official documents that must be produced by the offer provider to validate legitimacy.
              </p>
              <div className="space-y-2 pt-1">
                {assessment.sourceRequirements.map((src, idx) => (
                  <div
                    key={idx}
                    className="bg-[#0A1226] p-3 rounded-lg border border-[#1C2C55] flex items-start gap-2.5 text-xs text-slate-200"
                  >
                    <FileCheck2 className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                    <span className="leading-relaxed font-mono">{src}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: UNKNOWNS */}
          {activeTab === 'unknowns' && (
            <div className="bg-[#101C38] border border-[#1E2F59] rounded-xl p-4 space-y-3">
              <h3 className="text-xs font-bold text-slate-200 flex items-center gap-1.5 uppercase tracking-wide">
                <HelpCircle className="w-4 h-4 text-amber-400" />
                What Could Not Be Verified (Unknowns)
              </h3>
              <p className="text-xs text-slate-400">
                Explicit disclosure of unverified variables to prevent false accusations or assumptions.
              </p>
              <div className="space-y-2 pt-1">
                {assessment.unknowns.length > 0 ? (
                  assessment.unknowns.map((unk, idx) => (
                    <div
                      key={idx}
                      className="bg-[#0A1226] p-3 rounded-lg border border-[#1C2C55] flex items-start gap-2.5 text-xs text-amber-300/90"
                    >
                      <HelpCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <span className="leading-relaxed">{unk}</span>
                    </div>
                  ))
                ) : (
                  <div className="bg-[#0A1226] p-3 rounded-lg text-xs text-slate-400 font-mono">
                    All claimed entities and registration identifiers were matched against authoritative registries.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 5. Regulatory Verification Adapter Status Banner */}
          <div className="bg-[#0A1226] border border-[#1C2C55] rounded-xl p-3.5 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#E0A96D]" />
                <span className="font-bold text-slate-200">Regulatory Verification Adapter Status</span>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Zero Fabricated Records Guaranteed
              </span>
            </div>

            {assessment.regulatoryVerification.length > 0 ? (
              assessment.regulatoryVerification.map((reg, idx) => (
                <div key={idx} className="bg-[#101C38] p-2.5 rounded-lg border border-[#1E2F59] space-y-1">
                  <div className="flex items-center justify-between font-mono text-[11px]">
                    <span className="text-[#E0A96D] font-bold">{reg.officialRegistryName}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        reg.status === 'VERIFIED_OFFICIAL_RECORD'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-600'
                          : 'bg-rose-950 text-rose-400 border border-rose-600'
                      }`}
                    >
                      {reg.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300">{reg.notes}</p>
                </div>
              ))
            ) : (
              <p className="text-[11px] text-slate-400">
                No explicit SEBI/RBI registration claim was submitted in the prompt. You can enter an entity name or registration number above to query the registry adapter.
              </p>
            )}

            <div className="pt-1.5 flex items-center justify-between text-[10px] font-mono text-slate-500">
              <span>Authoritative Registry: SEBI SCORES Directory</span>
              <a
                href="https://scores.sebi.gov.in"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#E0A96D] hover:underline flex items-center gap-1"
              >
                scores.sebi.gov.in <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
