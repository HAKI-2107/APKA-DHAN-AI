import React, { useState } from 'react';
import { SafeAnalysisResultScreen } from '../engine/safeAnalysisPipeline';
import { RiskBadgeView } from './RiskBadgeView';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Info,
  HelpCircle,
  CheckCircle2,
  ExternalLink,
  Copy,
  Check,
  Lock,
  ChevronDown,
  ChevronUp,
  FileText,
  CreditCard,
  Link as LinkIcon,
  EyeOff,
  Terminal,
} from 'lucide-react';

interface ResultScreenViewProps {
  assessment: SafeAnalysisResultScreen;
  onReset?: () => void;
}

export const ResultScreenView: React.FC<ResultScreenViewProps> = ({ assessment, onReset }) => {
  const [copied, setCopied] = useState(false);
  const [showRawJson, setShowRawJson] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'found' | 'why' | 'unverified' | 'actions'>('all');

  const {
    riskLevel,
    riskSummary,
    confidence,
    whatWasFound,
    whyItMatters,
    whatCouldNotBeVerified,
    whatTheUserShouldDo,
  } = assessment;

  const handleCopyDetails = () => {
    navigator.clipboard.writeText(JSON.stringify(assessment, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* 1. SECTION 1: RISK LEVEL BANNER */}
      <div className="bg-[#101C38] border border-[#1E2F59] rounded-2xl p-4 space-y-3 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono tracking-wider uppercase text-slate-400 font-bold bg-[#142347] px-2 py-0.5 rounded border border-[#223565]">
              Section 1 of 5
            </span>
            <span className="text-xs font-bold text-slate-300">SECURITY AUDIT VERDICT</span>
          </div>
          <RiskBadgeView level={riskLevel} size="md" />
        </div>

        <div className="bg-[#0A1226] p-3.5 rounded-xl border border-[#1C2C55] space-y-2">
          <div className="flex items-start gap-2.5">
            {riskLevel === 'HIGH RISK' ? (
              <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            ) : riskLevel === 'MEDIUM RISK' ? (
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            ) : (
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            )}
            <div>
              <h2 className="text-sm font-bold text-slate-100">{riskLevel}</h2>
              <p className="text-xs text-slate-300 leading-relaxed mt-0.5">{riskSummary}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#162548] text-[11px] text-slate-400">
            <div className="flex items-center gap-1.5 font-mono">
              <span className="text-slate-500">CONFIDENCE:</span>
              <span className="text-slate-200 font-semibold">{confidence}</span>
            </div>
            <div className="flex items-center gap-1.5 font-mono text-[10px] text-amber-300/80 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-500/20">
              <Lock className="w-3 h-3" />
              <span>Safe Sandbox: Link Auto-Open Blocked</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. SECTION 2: WHAT WAS FOUND */}
      <div className="bg-[#101C38] border border-[#1E2F59] rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono tracking-wider uppercase text-slate-400 font-bold bg-[#142347] px-2 py-0.5 rounded border border-[#223565]">
              Section 2 of 5
            </span>
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wide">
              WHAT WAS FOUND
            </h3>
          </div>
          <span className="text-[10px] font-mono text-[#E0A96D] bg-[#E0A96D]/10 px-2 py-0.5 rounded border border-[#E0A96D]/30">
            {whatWasFound.inputType}
          </span>
        </div>

        {/* UPI Details Extracted */}
        {whatWasFound.upiDetails && (
          <div className="bg-[#0C152B] p-3 rounded-xl border border-[#1C2C55] space-y-2">
            <div className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-[#E0A96D]" />
              <span>Extracted UPI Parameters</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="bg-[#091021] p-2 rounded border border-[#172547]">
                <span className="text-[10px] text-slate-500 block">UPI ID (VPA):</span>
                <span className="text-slate-200 truncate block font-bold">
                  {whatWasFound.upiDetails.vpa || 'Not declared'}
                </span>
              </div>
              <div className="bg-[#091021] p-2 rounded border border-[#172547]">
                <span className="text-[10px] text-slate-500 block">MERCHANT / PAYEE:</span>
                <span className="text-slate-200 truncate block">
                  {whatWasFound.upiDetails.merchantName || 'Not specified'}
                </span>
              </div>
              <div className="bg-[#091021] p-2 rounded border border-[#172547]">
                <span className="text-[10px] text-slate-500 block">AMOUNT:</span>
                <span className="text-slate-200 font-bold block">
                  {whatWasFound.upiDetails.amount
                    ? `₹${whatWasFound.upiDetails.amount.toLocaleString('en-IN')}`
                    : 'User specified on payment'}
                </span>
              </div>
              <div className="bg-[#091021] p-2 rounded border border-[#172547]">
                <span className="text-[10px] text-slate-500 block">TRANSACTION MODE:</span>
                <span
                  className={`font-bold block ${
                    whatWasFound.upiDetails.isCollectRequest ? 'text-rose-400' : 'text-slate-200'
                  }`}
                >
                  {whatWasFound.upiDetails.isCollectRequest
                    ? '02 (COLLECT / DEBIT REQUEST)'
                    : whatWasFound.upiDetails.mode || '00 (Standard P2M)'}
                </span>
              </div>
            </div>

            {/* Other Encoded UPI Info */}
            <div className="grid grid-cols-3 gap-1.5 pt-1 text-[10px] font-mono text-slate-400">
              <div className="bg-[#080E1E] p-1.5 rounded border border-[#152240]">
                <span className="block text-[8px] text-slate-500">NOTE (tn):</span>
                <span className="truncate block text-slate-300">
                  {whatWasFound.upiDetails.transactionNote || 'None'}
                </span>
              </div>
              <div className="bg-[#080E1E] p-1.5 rounded border border-[#152240]">
                <span className="block text-[8px] text-slate-500">MCC (mc):</span>
                <span className="truncate block text-slate-300">
                  {whatWasFound.upiDetails.merchantCategoryCode || 'None'}
                </span>
              </div>
              <div className="bg-[#080E1E] p-1.5 rounded border border-[#152240]">
                <span className="block text-[8px] text-slate-500">REF ID (tr):</span>
                <span className="truncate block text-slate-300">
                  {whatWasFound.upiDetails.transactionRef || 'None'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Link & URL Details Extracted */}
        {whatWasFound.linkDetails && (
          <div className="bg-[#0C152B] p-3 rounded-xl border border-[#1C2C55] space-y-2">
            <div className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
              <LinkIcon className="w-3.5 h-3.5 text-[#E0A96D]" />
              <span>Extracted URL Anatomy</span>
            </div>
            <div className="space-y-1.5 text-xs font-mono">
              <div className="bg-[#091021] p-2 rounded border border-[#172547]">
                <span className="text-[10px] text-slate-500 block">BASE DOMAIN:</span>
                <span className="text-slate-100 font-bold block">{whatWasFound.linkDetails.domain}</span>
              </div>

              {whatWasFound.linkDetails.subdomain && (
                <div className="bg-[#091021] p-2 rounded border border-[#172547]">
                  <span className="text-[10px] text-slate-500 block">SUBDOMAIN:</span>
                  <span className="text-slate-300 block">{whatWasFound.linkDetails.subdomain}</span>
                </div>
              )}

              <div className="bg-[#091021] p-2 rounded border border-[#172547]">
                <span className="text-[10px] text-slate-500 block">PATH:</span>
                <span className="text-slate-300 block truncate">{whatWasFound.linkDetails.path || '/'}</span>
              </div>

              {/* Query Parameters */}
              {Object.keys(whatWasFound.linkDetails.queryParameters).length > 0 && (
                <div className="bg-[#091021] p-2 rounded border border-[#172547] space-y-1">
                  <span className="text-[10px] text-slate-500 block">QUERY PARAMETERS:</span>
                  <div className="space-y-0.5">
                    {Object.entries(whatWasFound.linkDetails.queryParameters).map(([k, v]) => (
                      <div key={k} className="text-[11px] text-slate-300 flex items-center justify-between">
                        <span className="text-[#E0A96D]">{k}:</span>
                        <span className="text-slate-200 truncate max-w-[200px]">{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Redirects & Shorteners */}
              {whatWasFound.linkDetails.redirects.isShortener && (
                <div className="bg-amber-950/20 border border-amber-500/40 p-2 rounded text-[11px] text-amber-200">
                  <span className="font-bold">Redirect Shortener: </span>
                  Uses {whatWasFound.linkDetails.redirects.shortenerService}. True target is hidden until resolved.
                  {whatWasFound.linkDetails.redirects.finalDestinationUrl && (
                    <div className="pt-1 text-slate-300 font-mono text-[10px]">
                      ↳ Unfurled target: {whatWasFound.linkDetails.redirects.finalDestinationUrl}
                    </div>
                  )}
                </div>
              )}

              {/* Open Redirects */}
              {whatWasFound.linkDetails.redirects.openRedirectParameters.length > 0 && (
                <div className="bg-rose-950/20 border border-rose-500/40 p-2 rounded text-[11px] text-rose-200">
                  <span className="font-bold">Open Redirect Param: </span>
                  Parameter &apos;{whatWasFound.linkDetails.redirects.openRedirectParameters[0].parameterName}&apos; targets{' '}
                  <span className="underline font-mono">
                    {whatWasFound.linkDetails.redirects.openRedirectParameters[0].targetUrl}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Screenshot Details Extracted */}
        {whatWasFound.screenshotDetails && (
          <div className="bg-[#0C152B] p-3 rounded-xl border border-[#1C2C55] space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-[#E0A96D]" />
                <span>Screenshot OCR & Receipt Forensics</span>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                {whatWasFound.screenshotDetails.redactedPiiCount} PII Redacted
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="bg-[#091021] p-2 rounded border border-[#172547]">
                <span className="text-[10px] text-slate-500 block">APP DETECTED:</span>
                <span className="text-slate-200 block">
                  {whatWasFound.screenshotDetails.paymentDetails.detectedApp || 'Generic'}
                </span>
              </div>
              <div className="bg-[#091021] p-2 rounded border border-[#172547]">
                <span className="text-[10px] text-slate-500 block">AMOUNT:</span>
                <span className="text-slate-200 font-bold block">
                  {whatWasFound.screenshotDetails.paymentDetails.amount
                    ? `₹${whatWasFound.screenshotDetails.paymentDetails.amount}`
                    : 'Undeclared'}
                </span>
              </div>
              <div className="bg-[#091021] p-2 rounded border border-[#172547]">
                <span className="text-[10px] text-slate-500 block">BANK REF (UTR):</span>
                <span className="text-slate-200 block truncate">
                  {whatWasFound.screenshotDetails.paymentDetails.transactionReference || 'Missing UTR'}
                </span>
              </div>
              <div className="bg-[#091021] p-2 rounded border border-[#172547]">
                <span className="text-[10px] text-slate-500 block">STATUS:</span>
                <span className="text-slate-200 block font-bold">
                  {whatWasFound.screenshotDetails.paymentDetails.transactionStatus}
                </span>
              </div>
            </div>

            {whatWasFound.screenshotDetails.forgeryIndicators.length > 0 && (
              <div className="bg-rose-950/30 border border-rose-500/40 p-2 rounded-lg text-xs text-rose-200 space-y-1">
                <span className="font-bold flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                  Receipt Forgery Flags:
                </span>
                <ul className="text-[11px] space-y-0.5">
                  {whatWasFound.screenshotDetails.forgeryIndicators.map((f, i) => (
                    <li key={i}>• {f}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Threat Intelligence Feed Status (Zero Invented Reputation) */}
        <div className="bg-[#0A1226] p-3 rounded-xl border border-[#1C2C55] space-y-1.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 font-bold text-[11px]">THREAT INTELLIGENCE STATUS:</span>
            <span
              className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold ${
                whatWasFound.threatIntelligence.verdict === 'CONFIRMED_MALICIOUS' ||
                whatWasFound.threatIntelligence.verdict === 'CONFIRMED_PHISHING'
                  ? 'bg-rose-950 text-rose-400 border border-rose-600'
                  : whatWasFound.threatIntelligence.verdict === 'OFFICIALLY_VERIFIED'
                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-600'
                  : 'bg-slate-900 text-slate-300 border border-slate-700'
              }`}
            >
              {whatWasFound.threatIntelligence.verdict}
            </span>
          </div>
          <div className="text-[11px] text-slate-300">
            {whatWasFound.threatIntelligence.details.join(' • ')}
          </div>
          <div className="text-[10px] text-slate-500 pt-1 flex items-center justify-between font-mono">
            <span>Sources: {whatWasFound.threatIntelligence.sources.join(', ')}</span>
            <span className="italic">No invented reputation scores</span>
          </div>
        </div>
      </div>

      {/* 3. SECTION 3: WHY IT MATTERS */}
      <div className="bg-[#101C38] border border-[#1E2F59] rounded-2xl p-4 space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono tracking-wider uppercase text-slate-400 font-bold bg-[#142347] px-2 py-0.5 rounded border border-[#223565]">
            Section 3 of 5
          </span>
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wide">
            WHY IT MATTERS
          </h3>
        </div>

        <div className="space-y-2">
          {whyItMatters.map((item, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-xl border text-xs space-y-1 ${
                item.severity === 'CRITICAL'
                  ? 'bg-rose-950/20 border-rose-500/40 text-rose-100'
                  : item.severity === 'WARNING'
                  ? 'bg-amber-950/20 border-amber-500/40 text-amber-100'
                  : 'bg-[#0E1A36] border-[#223565] text-slate-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs flex items-center gap-1.5">
                  {item.severity === 'CRITICAL' && <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />}
                  {item.severity === 'WARNING' && <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />}
                  {item.severity === 'INFORMATIONAL' && <Info className="w-3.5 h-3.5 text-sky-400" />}
                  {item.title}
                </span>
                <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-black/40 border border-slate-700 text-slate-300">
                  {item.severity}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">{item.explanation}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 4. SECTION 4: WHAT COULD NOT BE VERIFIED */}
      <div className="bg-[#101C38] border border-[#1E2F59] rounded-2xl p-4 space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono tracking-wider uppercase text-slate-400 font-bold bg-[#142347] px-2 py-0.5 rounded border border-[#223565]">
            Section 4 of 5
          </span>
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wide">
            WHAT COULD NOT BE VERIFIED
          </h3>
        </div>

        <div className="bg-[#131524] border border-amber-500/30 rounded-xl p-3.5 space-y-2">
          <p className="text-[11px] text-slate-300 font-medium">
            Apka Dhan AI strictly bounds analysis to verifiable signals and never guesses:
          </p>
          <ul className="space-y-1.5 text-xs text-slate-300">
            {whatCouldNotBeVerified.map((unv, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <HelpCircle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                <span className="text-[11px]">{unv}</span>
              </li>
            ))}
          </ul>
          <p className="text-[10px] text-slate-400 italic pt-1 border-t border-[#232338]">
            *Final decision authority remains with you. Always cross-verify unexpected requests.
          </p>
        </div>
      </div>

      {/* 5. SECTION 5: WHAT THE USER SHOULD DO */}
      <div className="bg-[#101C38] border border-[#1E2F59] rounded-2xl p-4 space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono tracking-wider uppercase text-slate-400 font-bold bg-[#142347] px-2 py-0.5 rounded border border-[#223565]">
            Section 5 of 5
          </span>
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wide">
            WHAT THE USER SHOULD DO
          </h3>
        </div>

        <div className="space-y-2">
          {whatTheUserShouldDo.map((step) => (
            <div
              key={step.stepNumber}
              className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                step.importance === 'MUST_DO'
                  ? 'bg-rose-950/20 border-rose-500/40 text-slate-100'
                  : 'bg-[#0E1A36] border-[#1E2F59] text-slate-200'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 font-mono ${
                  step.importance === 'MUST_DO'
                    ? 'bg-rose-600 text-white'
                    : 'bg-[#1D2F5A] text-[#E0A96D]'
                }`}
              >
                {step.stepNumber}
              </div>
              <div className="space-y-0.5 flex-1">
                <p className="text-xs font-medium leading-relaxed">{step.action}</p>
                <span className="text-[9px] font-mono text-slate-400 uppercase">
                  PRIORITY: {step.importance.replace('_', ' ')}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex flex-wrap gap-2">
          <button
            onClick={handleCopyDetails}
            className="flex-1 bg-[#132042] hover:bg-[#182852] text-slate-200 text-xs py-2 px-3 rounded-xl border border-[#223565] flex items-center justify-center gap-1.5 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Audit Copied' : 'Copy Audit Dossier'}</span>
          </button>

          {onReset && (
            <button
              onClick={onReset}
              className="bg-[#E0A96D] hover:bg-[#F4A261] text-[#0A1128] font-bold text-xs py-2 px-4 rounded-xl flex items-center justify-center gap-1.5 transition-colors"
            >
              Inspect Another Target
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
