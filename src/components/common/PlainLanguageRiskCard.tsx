import React, { useState } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  AlertOctagon,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  ExternalLink,
  Info,
  ArrowLeft,
  Share2,
} from 'lucide-react';

export type PlainRiskState = 'LOOKS OK' | 'BE CAREFUL' | 'HIGH RISK' | 'NOT ENOUGH INFORMATION';

export interface PlainLanguageRiskProps {
  riskState: PlainRiskState;
  headline: string;
  summaryWhatHappened: string;
  reasonsWhyItMatters: string[];
  whatWasChecked: string[];
  whatCouldNotBeConfirmed: string[];
  whatShouldUserDo: string[];
  technicalDetails?: {
    rawIdentifier?: string;
    source?: string;
    confidence?: string;
    rulesTriggered?: string[];
    threatDatabaseMatches?: string[];
    modelInference?: string;
  };
  onReset?: () => void;
  onReport?: () => void;
}

export const PlainLanguageRiskCard: React.FC<PlainLanguageRiskProps> = ({
  riskState,
  headline,
  summaryWhatHappened,
  reasonsWhyItMatters,
  whatWasChecked,
  whatCouldNotBeConfirmed,
  whatShouldUserDo,
  technicalDetails,
  onReset,
  onReport,
}) => {
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  // Configuration for each state
  const stateConfig = {
    'LOOKS OK': {
      bg: 'bg-emerald-950/40 border-emerald-600/40',
      badgeBg: 'bg-emerald-950 text-emerald-400 border-emerald-600',
      icon: ShieldCheck,
      iconColor: 'text-emerald-400',
      titleColor: 'text-emerald-300',
      defaultStatement: 'Nothing unusual was found from the information we checked.',
    },
    'BE CAREFUL': {
      bg: 'bg-amber-950/40 border-amber-600/40',
      badgeBg: 'bg-amber-950 text-amber-400 border-amber-600',
      icon: AlertTriangle,
      iconColor: 'text-amber-400',
      titleColor: 'text-amber-300',
      defaultStatement: 'We found something unusual. Check the details before continuing.',
    },
    'HIGH RISK': {
      bg: 'bg-rose-950/40 border-rose-600/40',
      badgeBg: 'bg-rose-950 text-rose-400 border-rose-600',
      icon: AlertOctagon,
      iconColor: 'text-rose-400',
      titleColor: 'text-rose-300',
      defaultStatement: 'We found several strong warning signs. Avoid sending money until you verify the situation.',
    },
    'NOT ENOUGH INFORMATION': {
      bg: 'bg-slate-900 border-slate-700',
      badgeBg: 'bg-slate-800 text-slate-300 border-slate-600',
      icon: HelpCircle,
      iconColor: 'text-slate-400',
      titleColor: 'text-slate-200',
      defaultStatement: 'We do not have enough verified information to judge this safely.',
    },
  }[riskState];

  const Icon = stateConfig.icon;

  return (
    <div className="space-y-3.5 animate-in fade-in duration-200">
      {/* 1. Main Plain Language Verdict Card */}
      <div className={`p-4 rounded-2xl border ${stateConfig.bg} space-y-3 shadow-md`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className={`w-5 h-5 ${stateConfig.iconColor}`} />
            <span className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded border font-mono ${stateConfig.badgeBg}`}>
              {riskState}
            </span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">Apka Dhan Safety Check</span>
        </div>

        <div>
          <h3 className={`text-base font-bold ${stateConfig.titleColor} leading-snug`}>
            {headline}
          </h3>
          <p className="text-xs text-slate-200 mt-1 leading-relaxed">
            {summaryWhatHappened || stateConfig.defaultStatement}
          </p>
        </div>
      </div>

      {/* 2. "Why does this matter?" (3-4 prominent clear reasons) */}
      {reasonsWhyItMatters && reasonsWhyItMatters.length > 0 && (
        <div className="bg-[#101C38] border border-[#1E2F59] rounded-2xl p-4 space-y-2">
          <span className="text-xs font-bold text-slate-200 uppercase tracking-wide flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-[#E0A96D]" /> Why?
          </span>
          <ul className="space-y-1.5 text-xs text-slate-300">
            {reasonsWhyItMatters.map((reason, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-[#E0A96D] font-bold mt-0.5">•</span>
                <span className="leading-relaxed">{reason}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 3. "What was checked?" & "What could not be confirmed" */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {/* Checked */}
        <div className="bg-[#101C38] border border-[#1E2F59] rounded-2xl p-3.5 space-y-2 text-xs">
          <span className="font-bold text-slate-200 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> What We Checked
          </span>
          <ul className="space-y-1 text-[11px] text-slate-300">
            {whatWasChecked.map((item, idx) => (
              <li key={idx} className="flex items-start gap-1.5">
                <span className="text-emerald-400">✓</span>
                <span className="leading-snug">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Not Confirmed */}
        <div className="bg-[#101C38] border border-[#1E2F59] rounded-2xl p-3.5 space-y-2 text-xs">
          <span className="font-bold text-slate-200 flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-slate-400" /> What We Could Not Confirm
          </span>
          <ul className="space-y-1 text-[11px] text-slate-400">
            {whatCouldNotBeConfirmed.map((item, idx) => (
              <li key={idx} className="flex items-start gap-1.5">
                <span>?</span>
                <span className="leading-snug">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* 4. "What should you do?" Actionable Steps */}
      <div className="bg-[#101C38] border border-[#1E2F59] rounded-2xl p-4 space-y-2.5">
        <span className="text-xs font-bold text-slate-100 uppercase tracking-wide flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-400" /> What Should You Do?
        </span>
        <div className="space-y-1.5 text-xs text-slate-200">
          {whatShouldUserDo.map((step, idx) => (
            <div key={idx} className="bg-[#0A1226] p-2.5 rounded-xl border border-[#1C2C55] flex items-start gap-2">
              <span className="font-mono text-[10px] bg-[#16254A] text-[#E0A96D] px-1.5 py-0.5 rounded font-bold">
                {idx + 1}
              </span>
              <span className="leading-relaxed">{step}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons: Go Back, Report */}
      <div className="flex items-center gap-2 pt-1">
        {onReset && (
          <button
            onClick={onReset}
            className="flex-1 bg-[#16254A] hover:bg-[#1E2F5A] text-slate-200 text-xs font-semibold py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Check Another Item
          </button>
        )}
        {onReport && (
          <button
            onClick={onReport}
            className="px-4 bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 border border-rose-700/40 text-xs font-semibold py-2.5 rounded-xl transition-colors"
          >
            Report This
          </button>
        )}
      </div>

      {/* 5. Optional Technical Details Collapsible for Advanced Users */}
      {technicalDetails && (
        <div className="pt-2 border-t border-[#1E2F5A]">
          <button
            type="button"
            onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
            className="w-full flex items-center justify-between text-[11px] text-slate-400 hover:text-slate-200 py-1 transition-colors"
          >
            <span>Advanced Technical Details & Provenance</span>
            {showTechnicalDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {showTechnicalDetails && (
            <div className="mt-2 p-3 bg-[#081022] rounded-xl border border-[#18274B] text-[10px] font-mono text-slate-300 space-y-1.5">
              {technicalDetails.rawIdentifier && (
                <div><span className="text-slate-500">Identifier:</span> {technicalDetails.rawIdentifier}</div>
              )}
              {technicalDetails.source && (
                <div><span className="text-slate-500">Source:</span> {technicalDetails.source}</div>
              )}
              {technicalDetails.confidence && (
                <div><span className="text-slate-500">Confidence:</span> {technicalDetails.confidence}</div>
              )}
              {technicalDetails.rulesTriggered && technicalDetails.rulesTriggered.length > 0 && (
                <div>
                  <span className="text-slate-500">Rules Triggered:</span>
                  <div className="pl-2 text-rose-400 mt-0.5">
                    {technicalDetails.rulesTriggered.map((r, i) => <div key={i}>• {r}</div>)}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
