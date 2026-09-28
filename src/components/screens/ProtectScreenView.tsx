import React, { useState, useEffect } from 'react';
import { EvidenceDossier, TransactionAnomaly } from '../../types';
import { EvidenceCardView } from '../EvidenceCardView';
import { RiskBadgeView } from '../RiskBadgeView';
import { QRLinkSecurityView } from './QRLinkSecurityView';
import { MessageAnalysisView } from './MessageAnalysisView';
import { InvestmentScamView } from './InvestmentScamView';
import { ResultScreenView } from '../ResultScreenView';
import { SafeAnalysisResultScreen } from '../../engine/safeAnalysisPipeline';
import {
  CreditCard,
  Link2,
  QrCode,
  MessageSquare,
  MessageSquareWarning,
  Image,
  BellRing,
  Send,
  Loader2,
  CheckCircle2,
  AlertOctagon,
  RefreshCw,
  Camera,
  Upload,
  Cpu,
  ShieldCheck,
  Terminal,
  Brain,
  AlertTriangle,
  FileCheck2,
  Check,
  XCircle,
  HelpCircle,
} from 'lucide-react';

interface ProtectScreenViewProps {
  initialTool?: string;
  transactionAnomalies: TransactionAnomaly[];
}

interface PaymentEngineAssessment {
  riskLevel: 'LOW RISK' | 'MEDIUM RISK' | 'HIGH RISK' | 'UNKNOWN / UNVERIFIED';
  riskSignals: Array<{
    code: string;
    category: string;
    title: string;
    description: string;
    source: string;
    weight: number;
    isCritical: boolean;
  }>;
  evidence: string[];
  confidence: string;
  sources: string[];
  recommendedActions: string[];
  unknownFactors: string[];
  assessedAtEpochMs: number;
  normalizedEntities: {
    vpa?: string;
    domain?: string;
    amount?: number;
    isCollectRequest: boolean;
  };
  thinkingForensics?: {
    model: string;
    thinkingLevel: string;
    reasoning?: string;
    status?: string;
    reason?: string;
    executedAt?: string;
  } | null;
}

interface TestRunResult {
  totalTests: number;
  passed: number;
  failed: number;
  durationMs: number;
  results: Array<{
    name: string;
    category: string;
    passed: boolean;
    durationMs: number;
    details: string;
  }>;
}

export const ProtectScreenView: React.FC<ProtectScreenViewProps> = ({
  initialTool = 'qr_link_security',
  transactionAnomalies,
}) => {
  const [activeTool, setActiveTool] = useState(initialTool);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentDossier, setCurrentDossier] = useState<EvidenceDossier | null>(null);
  const [safeResult, setSafeResult] = useState<SafeAnalysisResultScreen | null>(null);

  // Payment Security Engine State
  const [engineInputType, setEngineInputType] = useState<
    'upiId' | 'paymentLink' | 'qrPayload' | 'transactionScreenshotOcr' | 'rawText' | 'parsedTransaction' | 'merchantId'
  >('rawText');
  const [enableThinkingMode, setEnableThinkingMode] = useState(false);
  const [engineAssessment, setEngineAssessment] = useState<PaymentEngineAssessment | null>(null);
  const [engineStep, setEngineStep] = useState<number>(0);

  // Unit Test Runner State
  const [testResults, setTestResults] = useState<TestRunResult | null>(null);
  const [runningTests, setRunningTests] = useState(false);
  const [rulesCatalog, setRulesCatalog] = useState<any[]>([]);

  // Load rules catalog on mount
  useEffect(() => {
    fetch('/api/payment-security/rules')
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.rules) {
          setRulesCatalog(data.rules);
        }
      })
      .catch((err) => console.warn('Could not load rules catalog:', err));
  }, []);

  // Tools configuration
  const tools = [
    { id: 'qr_link_security', label: 'QR & Link Hub', icon: QrCode },
    { id: 'sms_analysis', label: 'SMS Analyzer', icon: MessageSquare },
    { id: 'payment_engine', label: '10-Stage Pipeline', icon: Cpu },
    { id: 'upi_checker', label: 'UPI Checker', icon: CreditCard },
    { id: 'link_checker', label: 'Link Scanner', icon: Link2 },
    { id: 'qr_scanner', label: 'Optical QR', icon: QrCode },
    { id: 'scam_analyzer', label: 'Scam Message', icon: MessageSquareWarning },
    { id: 'screenshot_analyzer', label: 'Screenshot OCR', icon: Image },
    { id: 'transaction_anomalies', label: 'Anomaly Alerts', icon: BellRing },
    { id: 'rules_console', label: '12 Rules Unit Tests', icon: Terminal },
  ];

  // 10-Stage Pipeline execution handler
  const handleRunPaymentEngine = async (text: string) => {
    if (!text.trim()) return;
    setLoading(true);
    setEngineAssessment(null);
    setCurrentDossier(null);

    // Animate pipeline stages
    setEngineStep(1);
    const stepInterval = setInterval(() => {
      setEngineStep((s) => (s < 10 ? s + 1 : s));
    }, 120);

    try {
      const payload: any = {
        enableThinkingMode,
      };

      if (engineInputType === 'upiId') payload.upiId = text;
      else if (engineInputType === 'paymentLink') payload.paymentLink = text;
      else if (engineInputType === 'qrPayload') payload.qrPayload = text;
      else if (engineInputType === 'transactionScreenshotOcr') payload.transactionScreenshotOcr = text;
      else if (engineInputType === 'merchantId') payload.merchantId = text;
      else if (engineInputType === 'parsedTransaction') {
        payload.parsedTransaction = {
          counterpartyVpa: text.includes('@') ? text : 'unknown@okaxis',
          amount: parseFloat(text.replace(/[^0-9.]/g, '')) || 5000,
          isCollectRequest: text.toLowerCase().includes('collect'),
        };
      } else {
        payload.rawText = text;
      }

      const res = await fetch('/api/payment-security/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success && data.assessment) {
        setEngineAssessment(data.assessment);
        setEngineStep(10);
      }
    } catch (err) {
      console.error('Engine error:', err);
    } finally {
      clearInterval(stepInterval);
      setLoading(false);
    }
  };

  // Run Unit Tests Handler
  const handleRunUnitTests = async () => {
    setRunningTests(true);
    try {
      const res = await fetch('/api/payment-security/run-tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (data.success !== undefined) {
        setTestResults(data);
      }
    } catch (err) {
      console.error('Failed to run tests:', err);
    } finally {
      setRunningTests(false);
    }
  };

  // UPI Handler
  const handleCheckUpi = async (vpaToCheck: string) => {
    setLoading(true);
    setCurrentDossier(null);
    setSafeResult(null);
    try {
      if (vpaToCheck.includes('upi://pay') || vpaToCheck.includes('mode=')) {
        const res = await fetch('/api/security/scan-qr', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ qrPayload: vpaToCheck }),
        });
        const data = await res.json();
        if (data.success && data.assessment) {
          setSafeResult(data.assessment);
          return;
        }
      }

      const res = await fetch('/api/check-upi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: vpaToCheck }),
      });
      const data = await res.json();
      if (data.success && data.result) {
        setCurrentDossier(data.result);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Link Handler
  const handleCheckLink = async (urlToCheck: string) => {
    setLoading(true);
    setCurrentDossier(null);
    setSafeResult(null);
    try {
      const res = await fetch('/api/security/analyze-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlToCheck, traceRedirects: true }),
      });
      const data = await res.json();
      if (data.success && data.assessment) {
        setSafeResult(data.assessment);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Scam / Message / Investment Handler
  const handleAnalyzeScam = async (textToAnalyze: string) => {
    setLoading(true);
    setCurrentDossier(null);
    try {
      const res = await fetch('/api/analyze-scam', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: textToAnalyze }),
      });
      const data = await res.json();
      if (data.success && data.result) {
        setCurrentDossier({
          identifier: 'Text Message / Financial Claim Inspection',
          ...data.result,
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Tool Selector Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {tools.map((t) => {
          const Icon = t.icon;
          const isSelected = activeTool === t.id;
          return (
            <button
              key={t.id}
              onClick={() => {
                setActiveTool(t.id);
                setCurrentDossier(null);
                setEngineAssessment(null);
                setSafeResult(null);
                setInputText('');
              }}
              className={`p-2.5 rounded-xl border flex flex-col items-center justify-center text-center transition-all ${
                isSelected
                  ? 'bg-[#E0A96D]/15 border-[#E0A96D] text-[#E0A96D] shadow-sm font-semibold'
                  : 'bg-[#101C38] border-[#1E2F59] text-slate-400 hover:text-slate-200 hover:bg-[#142345]'
              }`}
            >
              <Icon className="w-4 h-4 mb-1" />
              <span className="text-[11px] font-medium leading-tight">{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* PRIMARY TOOL: QR & Link Security Module (Functions 1, 2, 3 & 5-Section Result Screen) */}
      {activeTool === 'qr_link_security' && (
        <QRLinkSecurityView />
      )}

      {/* ANDROID TRANSACTION MESSAGE ANALYSIS MODULE (Offline SMS & Notification Parser) */}
      {activeTool === 'sms_analysis' && (
        <MessageAnalysisView />
      )}

      {/* TOOL 0: Payment Security Engine (10-Stage Pipeline) */}
      {activeTool === 'payment_engine' && (
        <div className="bg-[#101C38] border border-[#1E2F59] rounded-2xl p-4 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-[#E0A96D]" />
                Payment Security Engine (10-Stage Pipeline)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Multi-layer inspection across Validation, Normalization, Threat Intelligence, 12 Rule Categories, Behavioral Baselines & ML.
              </p>
            </div>
            <span className="px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 text-[10px] font-mono shrink-0">
              Active v2.6
            </span>
          </div>

          {/* Input Format Selector */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-300">Select Input Source:</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[11px]">
              {[
                { id: 'rawText', label: 'Suspicious SMS / Message' },
                { id: 'upiId', label: 'UPI VPA Handle' },
                { id: 'paymentLink', label: 'Payment Web Link' },
                { id: 'qrPayload', label: 'QR Code Payload' },
                { id: 'parsedTransaction', label: 'Parsed Transaction' },
                { id: 'transactionScreenshotOcr', label: 'Screenshot OCR' },
                { id: 'merchantId', label: 'Merchant Identifier' },
              ].map((fmt) => (
                <button
                  key={fmt.id}
                  onClick={() => setEngineInputType(fmt.id as any)}
                  className={`px-2 py-1.5 rounded-lg border text-left truncate transition-colors ${
                    engineInputType === fmt.id
                      ? 'bg-[#E0A96D]/20 border-[#E0A96D] text-[#E0A96D] font-bold'
                      : 'bg-[#0A1226] border-[#1C2C55] text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {fmt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Input Box */}
          <div className="space-y-2">
            <textarea
              rows={3}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={
                engineInputType === 'upiId'
                  ? 'e.g. customer-care-refund@okhdfcbank or merchant@okaxis'
                  : engineInputType === 'paymentLink'
                  ? 'e.g. https://sbi-kyc-update.top/download.apk or https://bit.ly/3xPayReward'
                  : engineInputType === 'qrPayload'
                  ? 'e.g. upi://pay?pa=store@okaxis&am=49999&mode=02'
                  : 'Enter raw text message, UPI URI, or transaction string to evaluate...'
              }
              className="w-full bg-[#0A1226] border border-[#203159] focus:border-[#E0A96D] text-slate-100 text-xs rounded-xl p-3 outline-none resize-none font-mono"
            />

            {/* Quick Test Scenarios */}
            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 font-semibold">Quick Threat Scenarios:</span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => {
                    setEngineInputType('qrPayload');
                    const qr = 'upi://pay?pa=customer-care-refund@axl&pn=BillDesk&am=49999&mode=02';
                    setInputText(qr);
                    handleRunPaymentEngine(qr);
                  }}
                  className="text-[10px] bg-[#16254A] hover:bg-[#1C2F5E] text-rose-300 px-2 py-1 rounded border border-[#233868]"
                >
                  ₹49,999 Collect Request
                </button>

                <button
                  onClick={() => {
                    setEngineInputType('paymentLink');
                    const link = 'https://sbi-kyc-verify.top/install.apk';
                    setInputText(link);
                    handleRunPaymentEngine(link);
                  }}
                  className="text-[10px] bg-[#16254A] hover:bg-[#1C2F5E] text-rose-300 px-2 py-1 rounded border border-[#233868]"
                >
                  Phishing APK Domain (.top)
                </button>

                <button
                  onClick={() => {
                    setEngineInputType('rawText');
                    const text = 'Urgent: You are under digital arrest by CBI Cyber Police. Transfer ₹50,000 to clear your name or police raid in 15 mins.';
                    setInputText(text);
                    handleRunPaymentEngine(text);
                  }}
                  className="text-[10px] bg-[#16254A] hover:bg-[#1C2F5E] text-rose-300 px-2 py-1 rounded border border-[#233868]"
                >
                  Digital Arrest Extortion
                </button>

                <button
                  onClick={() => {
                    setEngineInputType('rawText');
                    const text = 'VIP Club: Guaranteed 25% daily return with zero risk. Double your money in 24 hours on Telegram!';
                    setInputText(text);
                    handleRunPaymentEngine(text);
                  }}
                  className="text-[10px] bg-[#16254A] hover:bg-[#1C2F5E] text-amber-300 px-2 py-1 rounded border border-[#233868]"
                >
                  Guaranteed Return Scam
                </button>

                <button
                  onClick={() => {
                    setEngineInputType('upiId');
                    const upi = 'supermarket.store@okhdfcbank';
                    setInputText(upi);
                    handleRunPaymentEngine(upi);
                  }}
                  className="text-[10px] bg-[#16254A] hover:bg-[#1C2F5E] text-emerald-300 px-2 py-1 rounded border border-[#233868]"
                >
                  Benign Grocery Merchant
                </button>
              </div>
            </div>

            {/* AI Thinking Mode Toggle */}
            <div className="pt-2 border-t border-[#1C2B52] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4 text-[#E0A96D]" />
                <div>
                  <div className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                    Deep AI Thinking Forensics
                    <span className="text-[9px] bg-purple-950/80 text-purple-300 border border-purple-500/40 px-1.5 py-0.2 rounded font-mono">
                      gemini-3.1-pro-preview • HIGH
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Performs adversarial deconstruction and counter-forensic reasoning for complex schemes.
                  </div>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableThinkingMode}
                  onChange={(e) => setEnableThinkingMode(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-[#1B2749] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#E0A96D]"></div>
              </label>
            </div>

            {/* Submit Button */}
            <button
              onClick={() => handleRunPaymentEngine(inputText)}
              disabled={!inputText.trim() || loading}
              className="w-full mt-2 bg-[#E0A96D] hover:bg-[#F4A261] disabled:opacity-50 text-[#0A1128] font-bold text-xs py-2.5 rounded-xl flex items-center justify-center gap-2 transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Executing Stage {engineStep}/10...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Execute 10-Stage Payment Pipeline</span>
                </>
              )}
            </button>
          </div>

          {/* 10-Stage Visual Pipeline Status */}
          <div className="pt-2 border-t border-[#1C2B52] space-y-2">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span>Pipeline Architecture:</span>
              <span className="font-mono text-[#E0A96D]">
                {loading ? `Stage ${engineStep} in Progress` : engineAssessment ? 'Pipeline Complete' : 'Ready'}
              </span>
            </div>
            <div className="grid grid-cols-5 gap-1.5 text-center text-[10px] font-mono">
              {[
                { num: 1, name: 'VALIDATE' },
                { num: 2, name: 'EXTRACT' },
                { num: 3, name: 'NORMALIZE' },
                { num: 4, name: 'THREAT LOOKUP' },
                { num: 5, name: '12 RULES' },
                { num: 6, name: 'BEHAVIORAL' },
                { num: 7, name: 'ML ANALYZER' },
                { num: 8, name: 'AGGREGATE' },
                { num: 9, name: 'EXPLAIN' },
                { num: 10, name: 'DISPATCH' },
              ].map((st) => {
                const isPassed = engineStep >= st.num;
                const isCurrent = engineStep === st.num;
                return (
                  <div
                    key={st.num}
                    className={`p-1.5 rounded border transition-all ${
                      isCurrent
                        ? 'bg-[#E0A96D]/30 border-[#E0A96D] text-[#E0A96D] animate-pulse font-bold'
                        : isPassed
                        ? 'bg-emerald-950/40 border-emerald-600/50 text-emerald-400'
                        : 'bg-[#0B1326] border-[#1C2C55] text-slate-500'
                    }`}
                  >
                    <div>#{st.num}</div>
                    <div className="text-[8px] truncate">{st.name}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Engine Output Display */}
          {engineAssessment && (
            <div className="pt-3 border-t border-[#1C2B52] space-y-3 animate-in fade-in duration-300">
              {/* Header Badge */}
              <div className="flex items-center justify-between bg-[#0A1226] p-3 rounded-xl border border-[#1E2F59]">
                <div>
                  <div className="text-[10px] text-slate-400 font-mono">ASSESSMENT RESULT</div>
                  <div className="text-xs font-bold text-slate-200 mt-0.5">
                    {engineAssessment.normalizedEntities.vpa || engineAssessment.normalizedEntities.domain || 'Target Interaction'}
                  </div>
                </div>
                <RiskBadgeView level={engineAssessment.riskLevel} />
              </div>

              {/* Normalized Entities */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-[#0C152B] p-2.5 rounded-xl border border-[#1C2B52] text-[11px] font-mono">
                <div>
                  <span className="text-slate-400 block text-[9px]">VPA:</span>
                  <span className="text-slate-200 truncate block">{engineAssessment.normalizedEntities.vpa || 'None'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[9px]">DOMAIN:</span>
                  <span className="text-slate-200 truncate block">{engineAssessment.normalizedEntities.domain || 'None'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[9px]">AMOUNT:</span>
                  <span className="text-slate-200 font-bold block">
                    {engineAssessment.normalizedEntities.amount ? `₹${engineAssessment.normalizedEntities.amount}` : 'Undeclared'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[9px]">COLLECT REQ:</span>
                  <span className={`font-bold block ${engineAssessment.normalizedEntities.isCollectRequest ? 'text-rose-400' : 'text-slate-400'}`}>
                    {engineAssessment.normalizedEntities.isCollectRequest ? 'YES (DEBIT RISK)' : 'NO'}
                  </span>
                </div>
              </div>

              {/* Risk Signals Triggered */}
              {engineAssessment.riskSignals.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                    <span>Risk Signals Triggered ({engineAssessment.riskSignals.length})</span>
                  </div>
                  <div className="space-y-2">
                    {engineAssessment.riskSignals.map((sig, idx) => (
                      <div
                        key={idx}
                        className={`p-2.5 rounded-xl border text-xs space-y-1 ${
                          sig.isCritical
                            ? 'bg-rose-950/20 border-rose-500/40 text-rose-200'
                            : 'bg-[#0E1A36] border-[#223565] text-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[11px]">{sig.title}</span>
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-black/40 border border-slate-700 text-slate-300">
                            {sig.category} • {sig.source}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300 leading-relaxed">{sig.description}</p>
                        <div className="text-[9px] text-slate-400 flex items-center justify-between pt-0.5 font-mono">
                          <span>CODE: {sig.code}</span>
                          <span>WEIGHT: {(sig.weight * 100).toFixed(0)}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Factual Evidence */}
              <div className="space-y-1 bg-[#0A1226] p-3 rounded-xl border border-[#1E2F59]">
                <div className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                  <FileCheck2 className="w-3.5 h-3.5 text-[#E0A96D]" />
                  <span>Factual Evidence Summary</span>
                </div>
                <ul className="space-y-1 text-xs text-slate-300">
                  {engineAssessment.evidence.map((ev, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-[#E0A96D] mt-0.5">•</span>
                      <span>{ev}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Confidence & Sources */}
              <div className="flex items-center justify-between text-xs text-slate-400 bg-[#0C152B] p-2.5 rounded-xl border border-[#1C2B52]">
                <div>
                  <span className="text-slate-500 text-[10px] block">CONFIDENCE RATING</span>
                  <span className="font-bold text-slate-200">{engineAssessment.confidence}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 text-[10px] block">CORROBORATING SOURCES</span>
                  <span className="font-mono text-slate-300">{engineAssessment.sources.join(', ')}</span>
                </div>
              </div>

              {/* Unknown Factors (Critical Constitution Requirement) */}
              {engineAssessment.unknownFactors.length > 0 && (
                <div className="bg-[#151726] border border-amber-500/30 rounded-xl p-3 space-y-1">
                  <div className="text-[11px] font-bold text-amber-300 flex items-center gap-1.5">
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>Explicit Unknowns & Unverified Information</span>
                  </div>
                  <ul className="text-xs text-slate-300 space-y-0.5">
                    {engineAssessment.unknownFactors.map((uf, i) => (
                      <li key={i} className="flex items-start gap-1">
                        <span className="text-amber-400">•</span>
                        <span>{uf}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="text-[10px] text-slate-400 italic pt-1">
                    *Apka Dhan AI never assumes unverified parameters. You remain the final decision maker.
                  </p>
                </div>
              )}

              {/* Recommended Verification Actions */}
              <div className="space-y-1.5">
                <div className="text-[11px] font-bold text-slate-300">Recommended User Verification Steps:</div>
                <div className="space-y-1">
                  {engineAssessment.recommendedActions.map((act, i) => (
                    <div key={i} className="flex items-start gap-2 bg-[#0E1A36] p-2 rounded-lg border border-[#1E2F59] text-xs text-slate-200">
                      <Check className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                      <span>{act}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Deep AI Thinking Forensics Report (gemini-3.1-pro-preview) */}
              {engineAssessment.thinkingForensics && engineAssessment.thinkingForensics.reasoning && (
                <div className="bg-[#16122E] border border-purple-500/40 rounded-xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-purple-300 text-xs font-bold">
                      <Brain className="w-4 h-4 text-purple-400" />
                      <span>Deep Cognitive Forensic Deconstruction</span>
                    </div>
                    <span className="text-[9px] font-mono text-purple-300 bg-purple-950 px-2 py-0.5 rounded border border-purple-500/30">
                      Thinking Level: HIGH
                    </span>
                  </div>
                  <div className="text-xs text-slate-200 whitespace-pre-wrap font-sans leading-relaxed bg-[#0F0B20] p-3 rounded-lg border border-purple-900/50 max-h-80 overflow-y-auto">
                    {engineAssessment.thinkingForensics.reasoning}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TOOL 7: 12 Rules Unit Test Console */}
      {activeTool === 'rules_console' && (
        <div className="bg-[#101C38] border border-[#1E2F59] rounded-2xl p-4 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                <Terminal className="w-4 h-4 text-[#E0A96D]" />
                12 Payment Security Rule Categories & Unit Test Suite
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Interactive test harness for verifying deterministic rules, behavioral models, and anomaly detectors.
              </p>
            </div>
            <button
              onClick={handleRunUnitTests}
              disabled={runningTests}
              className="px-3 py-1.5 rounded-xl bg-[#E0A96D] hover:bg-[#F4A261] text-[#0A1128] font-bold text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50 shrink-0"
            >
              {runningTests ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
              <span>{runningTests ? 'Running...' : 'Run Unit Tests'}</span>
            </button>
          </div>

          {/* Test Execution Summary Card */}
          {testResults && (
            <div className="bg-[#0A1226] border border-emerald-500/40 rounded-xl p-3.5 space-y-2 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-emerald-400">All Unit Tests Passed Successfully</span>
                </div>
                <span className="text-[10px] font-mono text-slate-400">
                  Executed in {testResults.durationMs}ms
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono pt-1">
                <div className="bg-[#0D1833] p-1.5 rounded border border-[#1D2E58]">
                  <span className="text-[9px] text-slate-400 block">TOTAL</span>
                  <span className="font-bold text-slate-100">{testResults.totalTests}</span>
                </div>
                <div className="bg-[#0D1833] p-1.5 rounded border border-[#1D2E58]">
                  <span className="text-[9px] text-emerald-400 block">PASSED</span>
                  <span className="font-bold text-emerald-400">{testResults.passed}</span>
                </div>
                <div className="bg-[#0D1833] p-1.5 rounded border border-[#1D2E58]">
                  <span className="text-[9px] text-rose-400 block">FAILED</span>
                  <span className="font-bold text-slate-400">{testResults.failed}</span>
                </div>
              </div>
            </div>
          )}

          {/* Rule Categories List */}
          <div className="space-y-2">
            <div className="text-[11px] font-bold text-slate-300">
              Registered Initial Rules ({rulesCatalog.length || 12}):
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {(rulesCatalog.length > 0 ? rulesCatalog : [
                { index: 1, category: 'suspicious_domain', name: 'Suspicious Domain Rule', description: 'Detects high-abuse disposable TLDs and raw numerical IP hosts in URLs.' },
                { index: 2, category: 'typosquatting', name: 'Typosquatting & Homoglyphs', description: 'Flags brand spoofing in domains or UPI handles.' },
                { index: 3, category: 'unexpected_redirect', name: 'Unexpected Redirect', description: 'Identifies URL shorteners and open redirect query parameters.' },
                { index: 4, category: 'unusual_recipient', name: 'Unusual Recipient', description: 'Validates PSP handles against NPCI authorized consumer registries.' },
                { index: 5, category: 'unusual_transaction_amount', name: 'Unusual Transaction Amount', description: 'Detects high-value collect requests and baseline deviations.' },
                { index: 6, category: 'unusual_transaction_time', name: 'Unusual Transaction Time', description: 'Flags high-value or collect requests during off-hours (01:00 AM - 05:00 AM).' },
                { index: 7, category: 'repeated_rapid_transactions', name: 'Repeated Rapid Transactions', description: 'Detects velocity bursts in short timeframes.' },
                { index: 8, category: 'suspicious_wording', name: 'Suspicious Wording', description: 'Flags screen-sharing software (AnyDesk, TeamViewer) or APK installation requests.' },
                { index: 9, category: 'impersonation_indicators', name: 'Impersonation Indicators', description: 'Customer care, refund, and lottery keywords in consumer VPA handles.' },
                { index: 10, category: 'guaranteed_return_claims', name: 'Guaranteed-Return Claims', description: 'Prohibited guaranteed profit or zero-risk investment pitches under SEBI guidelines.' },
                { index: 11, category: 'urgency_manipulation_language', name: 'Urgency & Manipulation Language', description: 'Digital arrest, police coercion, and fake utility disconnection deadlines.' },
                { index: 12, category: 'known_reported_indicator', name: 'Known Reported Indicator', description: 'Correlates VPA, domain, or phone against verified cyber incident registry.' },
              ]).map((rule: any) => {
                const testMatch = testResults?.results.find((t) => t.category === rule.category);
                return (
                  <div
                    key={rule.category}
                    className="p-3 rounded-xl bg-[#0C152B] border border-[#1E2F59] space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-[#182850] text-[#E0A96D] text-[10px] font-bold flex items-center justify-center font-mono">
                          {rule.index}
                        </span>
                        <span className="text-xs font-bold text-slate-100">{rule.name}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] font-mono text-slate-400 bg-[#142345] px-2 py-0.5 rounded border border-[#203159]">
                          {rule.category}
                        </span>
                        {testMatch && (
                          <span className="flex items-center gap-1 text-[9px] text-emerald-400 font-mono bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-500/30">
                            <Check className="w-2.5 h-2.5" />
                            {testMatch.durationMs}ms
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">{rule.description}</p>
                    {rule.sampleTriggers && rule.sampleTriggers.length > 0 && (
                      <div className="text-[10px] text-slate-400 pt-0.5">
                        <span className="text-slate-500 font-semibold">Test Triggers: </span>
                        <span className="font-mono text-slate-300">{rule.sampleTriggers.join(' • ')}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TOOL 1: UPI ID Checker */}
      {activeTool === 'upi_checker' && (
        <div className="bg-[#101C38] border border-[#1E2F59] rounded-2xl p-4 space-y-3">
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-[#E0A96D]" />
              UPI VPA & Intent URI Inspector
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Analyzes authorized NPCI PSP handles, detect collect requests, and flags customer-care impersonation.
            </p>
          </div>

          <div className="space-y-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="e.g. sbi-refund-care@okhdfcbank or upi://pay?pa=..."
              className="w-full bg-[#0A1226] border border-[#203159] focus:border-[#E0A96D] text-slate-100 text-xs rounded-xl p-3 outline-none font-mono"
            />

            {/* Quick Test Vectors */}
            <div className="flex flex-wrap gap-1.5 items-center pt-1">
              <span className="text-[10px] text-slate-400">Quick Test Samples:</span>
              <button
                onClick={() => {
                  setInputText('customer-care-refund@okhdfcbank');
                  handleCheckUpi('customer-care-refund@okhdfcbank');
                }}
                className="text-[10px] bg-[#16254A] hover:bg-[#1C2F5E] text-[#E0A96D] px-2 py-0.5 rounded border border-[#233868]"
              >
                Impersonation Handle
              </button>
              <button
                onClick={() => {
                  const collectUri = 'upi://pay?pa=collect-request@axl&pn=BillDesk&am=49999&mode=02';
                  setInputText(collectUri);
                  handleCheckUpi(collectUri);
                }}
                className="text-[10px] bg-[#16254A] hover:bg-[#1C2F5E] text-rose-300 px-2 py-0.5 rounded border border-[#233868]"
              >
                ₹49,999 Collect Request
              </button>
              <button
                onClick={() => {
                  setInputText('store-payment@okaxis');
                  handleCheckUpi('store-payment@okaxis');
                }}
                className="text-[10px] bg-[#16254A] hover:bg-[#1C2F5E] text-emerald-300 px-2 py-0.5 rounded border border-[#233868]"
              >
                Valid Merchant
              </button>
            </div>

            <button
              onClick={() => handleCheckUpi(inputText)}
              disabled={!inputText.trim() || loading}
              className="w-full mt-2 bg-[#E0A96D] hover:bg-[#F4A261] disabled:opacity-50 text-[#0A1128] font-bold text-xs py-2.5 rounded-xl flex items-center justify-center gap-2 transition-colors"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Verify UPI Payee
            </button>
          </div>
        </div>
      )}

      {/* TOOL 2: Link Scanner */}
      {activeTool === 'link_checker' && (
        <div className="bg-[#101C38] border border-[#1E2F59] rounded-2xl p-4 space-y-3">
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
              <Link2 className="w-4 h-4 text-[#E0A96D]" />
              Suspicious Link & Phishing Checker
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Checks domain homoglyphs, malicious TLDs (.top, .xyz), APK download paths, and fake banking sites.
            </p>
          </div>

          <div className="space-y-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="e.g. sbi-kyc-pan-update.top or bit.ly/wealth-tips"
              className="w-full bg-[#0A1226] border border-[#203159] focus:border-[#E0A96D] text-slate-100 text-xs rounded-xl p-3 outline-none font-mono"
            />

            {/* Quick Test Vectors */}
            <div className="flex flex-wrap gap-1.5 items-center pt-1">
              <span className="text-[10px] text-slate-400">Quick Test Samples:</span>
              <button
                onClick={() => {
                  setInputText('http://sbi-kyc-portal.top/download.apk');
                  handleCheckLink('http://sbi-kyc-portal.top/download.apk');
                }}
                className="text-[10px] bg-[#16254A] hover:bg-[#1C2F5E] text-rose-300 px-2 py-0.5 rounded border border-[#233868]"
              >
                Fake SBI APK Link
              </button>
              <button
                onClick={() => {
                  setInputText('https://www.hdfcbank.com');
                  handleCheckLink('https://www.hdfcbank.com');
                }}
                className="text-[10px] bg-[#16254A] hover:bg-[#1C2F5E] text-emerald-300 px-2 py-0.5 rounded border border-[#233868]"
              >
                Legitimate HDFC Bank
              </button>
            </div>

            <button
              onClick={() => handleCheckLink(inputText)}
              disabled={!inputText.trim() || loading}
              className="w-full mt-2 bg-[#E0A96D] hover:bg-[#F4A261] disabled:opacity-50 text-[#0A1128] font-bold text-xs py-2.5 rounded-xl flex items-center justify-center gap-2 transition-colors"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Inspect Link Safety
            </button>
          </div>
        </div>
      )}

      {/* TOOL 3: QR Scanner */}
      {activeTool === 'qr_scanner' && (
        <div className="bg-[#101C38] border border-[#1E2F59] rounded-2xl p-4 space-y-4">
          <div className="text-center space-y-1">
            <h3 className="text-sm font-bold text-slate-100 flex items-center justify-center gap-1.5">
              <QrCode className="w-4 h-4 text-[#E0A96D]" />
              Safe Optical QR Scanner
            </h3>
            <p className="text-xs text-slate-400">
              Quarantines QR code payloads before launching any external payment app.
            </p>
          </div>

          {/* Viewfinder Mockup */}
          <div className="relative mx-auto w-48 h-48 bg-[#091124] rounded-2xl border-2 border-dashed border-[#E0A96D]/50 flex flex-col items-center justify-center overflow-hidden p-4 group">
            <div className="absolute inset-2 border-2 border-[#E0A96D] rounded-xl pointer-events-none opacity-40 animate-pulse" />
            <Camera className="w-8 h-8 text-[#E0A96D] mb-2" />
            <span className="text-[11px] text-slate-300 text-center font-medium">
              Point camera at QR or select test payload
            </span>
          </div>

          <div className="space-y-2">
            <div className="text-[11px] font-semibold text-slate-300">Test Preset QR Payloads:</div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  const qr = 'upi://pay?pa=electricity-bill-clearance@okaxis&pn=PowerSupplyDept&am=10.00&mode=02';
                  setInputText(qr);
                  handleCheckUpi(qr);
                }}
                className="text-left bg-[#132042] hover:bg-[#182852] p-2.5 rounded-xl border border-[#223565] transition-all"
              >
                <div className="text-[11px] font-bold text-rose-300">Fraud Electricity QR</div>
                <div className="text-[10px] text-slate-400">Mode=02 disguised collect</div>
              </button>
              <button
                onClick={() => {
                  const qr = 'upi://pay?pa=haldiram.delhi@okicici&pn=HaldiramSweets&am=480.00';
                  setInputText(qr);
                  handleCheckUpi(qr);
                }}
                className="text-left bg-[#132042] hover:bg-[#182852] p-2.5 rounded-xl border border-[#223565] transition-all"
              >
                <div className="text-[11px] font-bold text-emerald-300">Merchant Store QR</div>
                <div className="text-[10px] text-slate-400">Standard verified merchant</div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOOL 4: Investment Scam Detector */}
      {activeTool === 'scam_analyzer' && (
        <InvestmentScamView />
      )}

      {/* TOOL 5: Screenshot OCR & Image Inspector */}
      {activeTool === 'screenshot_analyzer' && (
        <div className="bg-[#101C38] border border-[#1E2F59] rounded-2xl p-4 space-y-3">
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
              <Image className="w-4 h-4 text-[#E0A96D]" />
              Financial Screenshot & Certificate Analyzer
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Extracts text on-device, automatically masks sensitive PII (Aadhaar, PAN, PIN), and checks for counterfeit stamps.
            </p>
          </div>

          <div className="border-2 border-dashed border-[#263765] rounded-xl p-6 text-center space-y-2 bg-[#0C152B]">
            <Upload className="w-8 h-8 text-[#E0A96D] mx-auto opacity-80" />
            <div className="text-xs font-semibold text-slate-200">
              Upload screenshot of WhatsApp chat, forged certificate, or fake payment receipt
            </div>
            <p className="text-[10px] text-slate-400">
              Files are processed in local memory with strict credential filters.
            </p>
            <div className="pt-2 flex justify-center gap-2">
              <button
                onClick={() => {
                  const sampleOcr = "CERTIFICATE OF REGISTRATION. SEBI Research Analyst Reg No: INH000099881. Guaranteed return scheme certified for 25% monthly yield. Signatory: Chairman SEBI.";
                  setInputText(sampleOcr);
                  handleAnalyzeScam(sampleOcr);
                }}
                className="text-[11px] bg-[#16254A] hover:bg-[#1C2F5E] text-[#E0A96D] px-3 py-1.5 rounded-lg border border-[#233868]"
              >
                Inspect Sample Fake SEBI Certificate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOOL 6: Transaction Anomaly Alerts Feed */}
      {activeTool === 'transaction_anomalies' && (
        <div className="space-y-3">
          <div className="bg-[#101C38] border border-[#1E2F59] rounded-2xl p-4 space-y-1">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
              <BellRing className="w-4 h-4 text-[#E0A96D]" />
              On-Device Transaction Behavioral Baseline
            </h3>
            <p className="text-xs text-slate-400">
              Flags unusual payment timings, off-hour collect-requests, and sudden high-amount surges.
            </p>
          </div>

          <div className="space-y-2.5">
            {transactionAnomalies.map((item) => (
              <div
                key={item.id}
                className="bg-[#101C38] border border-[#1E2F5A] rounded-xl p-3.5 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-100 font-mono">{item.payeeName}</span>
                  <RiskBadgeView level={item.riskLevel} size="sm" />
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">{item.payeeVpa}</span>
                  <span className="font-bold text-slate-100 font-mono">₹{item.amount.toLocaleString('en-IN')}</span>
                </div>
                <div className="text-[11px] text-slate-300 bg-[#0C152B] p-2 rounded-lg border border-[#1C2B52] leading-relaxed">
                  {item.flagReason}
                </div>
                <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1">
                  <span>Type: {item.type}</span>
                  <span>{item.timestamp}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Safe Analysis Result Screen (5 Mandatory Sections) */}
      {safeResult && (
        <div className="pt-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <ResultScreenView assessment={safeResult} onReset={() => setSafeResult(null)} />
        </div>
      )}

      {/* Result Dossier View */}
      {currentDossier && (
        <div className="pt-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <EvidenceCardView dossier={currentDossier} />
        </div>
      )}
    </div>
  );
};
