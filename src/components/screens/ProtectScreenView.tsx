import React, { useState } from 'react';
import {
  QrCode,
  Link2,
  CreditCard,
  MessageSquareWarning,
  TrendingUp,
  AlertOctagon,
  ArrowLeft,
  Send,
  Loader2,
  CheckCircle2,
  FileText,
  Upload,
} from 'lucide-react';
import { QRLinkSecurityView } from './QRLinkSecurityView';
import { InvestmentScamView } from './InvestmentScamView';
import { ReportsScreenView } from './ReportsScreenView';
import { PlainLanguageRiskCard, PlainRiskState } from '../common/PlainLanguageRiskCard';
import { useLanguage } from '../../context/LanguageContext';

interface ProtectScreenViewProps {
  initialTool?: string;
  transactionAnomalies?: any[];
}

export const ProtectScreenView: React.FC<ProtectScreenViewProps> = ({
  initialTool = 'hub',
}) => {
  const { t } = useLanguage();
  const [activeTool, setActiveTool] = useState<string>(initialTool === 'qr_scanner' ? 'qr' : 'hub');
  const [upiInput, setUpiInput] = useState('');
  const [linkInput, setLinkInput] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [riskResult, setRiskResult] = useState<any>(null);

  // 6 Action Cards
  const cards = [
    {
      id: 'qr',
      title: 'Check a QR',
      subtitle: 'Scan a payment QR before paying.',
      icon: QrCode,
      color: 'text-[#E0A96D]',
    },
    {
      id: 'link',
      title: 'Check a link',
      subtitle: 'See whether a payment or investment link looks suspicious.',
      icon: Link2,
      color: 'text-sky-400',
    },
    {
      id: 'upi',
      title: 'Check a UPI ID',
      subtitle: 'Check a payment recipient before you send money.',
      icon: CreditCard,
      color: 'text-emerald-400',
    },
    {
      id: 'message',
      title: 'Check a message',
      subtitle: 'Paste a WhatsApp, SMS or Telegram message.',
      icon: MessageSquareWarning,
      color: 'text-amber-400',
    },
    {
      id: 'investment',
      title: 'Check an investment',
      subtitle: 'Check an investment offer before sending money.',
      icon: TrendingUp,
      color: 'text-[#E0A96D]',
    },
    {
      id: 'report',
      title: 'Report a scam',
      subtitle: 'Help identify suspicious activity and protect others.',
      icon: AlertOctagon,
      color: 'text-rose-400',
    },
  ];

  // UPI Checker
  const handleCheckUpi = async (inputStr: string) => {
    if (!inputStr.trim()) return;
    setLoading(true);
    setRiskResult(null);

    try {
      const res = await fetch('/api/check-upi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: inputStr.trim() }),
      });
      const data = await res.json();
      if (data.success && data.result) {
        const r = data.result;
        let plainState: PlainRiskState = 'LOOKS OK';
        if (r.riskLevel === 'HIGH RISK') plainState = 'HIGH RISK';
        else if (r.riskLevel === 'MEDIUM RISK') plainState = 'BE CAREFUL';
        else if (r.riskLevel === 'UNKNOWN / UNVERIFIED') plainState = 'NOT ENOUGH INFORMATION';

        setRiskResult({
          riskState: plainState,
          headline:
            plainState === 'HIGH RISK'
              ? 'Warning: Suspicious Recipient or Collect Request'
              : plainState === 'BE CAREFUL'
              ? 'Please Verify This Recipient Before Paying'
              : 'Standard Banking Handle Verified',
          summaryWhatHappened: r.explanation,
          reasonsWhyItMatters: r.evidence,
          whatWasChecked: [
            'National Payments Corporation of India (NPCI) Banking Provider List',
            'Handle format syntax (name@bank)',
            'Impersonation keywords (customer support, lottery, refund)',
          ],
          whatCouldNotBeConfirmed: [
            'We cannot verify the real personal legal identity of the account holder.',
          ],
          whatShouldUserDo: r.recommendedSteps,
          technicalDetails: {
            rawIdentifier: r.identifier,
            source: r.source,
            confidence: r.confidence,
          },
        });
      }
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Link Checker
  const handleCheckLink = async (urlStr: string) => {
    if (!urlStr.trim()) return;
    setLoading(true);
    setRiskResult(null);

    try {
      const res = await fetch('/api/check-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlStr.trim() }),
      });
      const data = await res.json();
      if (data.success && data.result) {
        const r = data.result;
        let plainState: PlainRiskState = 'LOOKS OK';
        if (r.riskLevel === 'HIGH RISK') plainState = 'HIGH RISK';
        else if (r.riskLevel === 'MEDIUM RISK') plainState = 'BE CAREFUL';
        else if (r.riskLevel === 'UNKNOWN / UNVERIFIED') plainState = 'NOT ENOUGH INFORMATION';

        setRiskResult({
          riskState: plainState,
          headline:
            plainState === 'HIGH RISK'
              ? 'High Warning: Deceptive or Phishing Link'
              : plainState === 'BE CAREFUL'
              ? 'Be Careful: Shortened or Obscured Destination'
              : 'Link Syntax Looks Normal',
          summaryWhatHappened: r.explanation,
          reasonsWhyItMatters: r.evidence,
          whatWasChecked: [
            'Domain name spelling & brand typosquatting',
            'High-abuse disposable web extensions',
            'APK executable download parameters',
          ],
          whatCouldNotBeConfirmed: [
            'We did not execute unknown server-side code inside this link.',
          ],
          whatShouldUserDo: r.recommendedSteps,
          technicalDetails: {
            rawIdentifier: r.identifier,
            source: r.source,
            confidence: r.confidence,
          },
        });
      }
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Message Checker
  const handleCheckMessage = async (msg: string) => {
    if (!msg.trim()) return;
    setLoading(true);
    setRiskResult(null);

    try {
      const res = await fetch('/api/analyze-scam', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: msg.trim() }),
      });
      const data = await res.json();
      if (data.success && data.result) {
        const r = data.result;
        let plainState: PlainRiskState = 'LOOKS OK';
        if (r.riskLevel === 'HIGH RISK') plainState = 'HIGH RISK';
        else if (r.riskLevel === 'MEDIUM RISK') plainState = 'BE CAREFUL';
        else if (r.riskLevel === 'UNKNOWN / UNVERIFIED') plainState = 'NOT ENOUGH INFORMATION';

        setRiskResult({
          riskState: plainState,
          headline:
            plainState === 'HIGH RISK'
              ? 'Warning: Strong Scam or Coercion Patterns Detected'
              : 'No Obvious Fraud Phrasing Detected',
          summaryWhatHappened: r.explanation,
          reasonsWhyItMatters: r.evidence,
          whatWasChecked: [
            'Guaranteed return promises (strictly prohibited by SEBI)',
            'Emotional urgency and fake authority claims ("Digital Arrest")',
            'Requests for money transfers or remote-control apps',
          ],
          whatCouldNotBeConfirmed: [
            'The real physical identity of the sender cannot be verified from message text alone.',
          ],
          whatShouldUserDo: r.recommendedSteps,
          technicalDetails: {
            rawIdentifier: 'Message text analysis',
            source: r.source,
            confidence: r.confidence,
          },
        });
      }
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-100">{t('is_this_safe', 'Is this safe?')}</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {t('protect_subtitle', 'Check something before you send money or invest.')}
          </p>
        </div>
        {activeTool !== 'hub' && (
          <button
            onClick={() => {
              setActiveTool('hub');
              setRiskResult(null);
            }}
            className="text-xs bg-[#16254A] hover:bg-[#1C2F5E] text-slate-200 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Tools
          </button>
        )}
      </div>

      {/* Main Hub: 6 Large Action Cards */}
      {activeTool === 'hub' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <button
                key={card.id}
                onClick={() => {
                  setActiveTool(card.id);
                  setRiskResult(null);
                }}
                className="bg-[#101C38] hover:bg-[#16274D] border border-[#1E2F5B] rounded-2xl p-4 text-left transition-all group flex items-start gap-3.5"
              >
                <div
                  className={`w-10 h-10 rounded-xl bg-[#081022] border border-[#203159] flex items-center justify-center shrink-0 ${card.color} group-hover:scale-105 transition-transform`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-bold text-slate-100">{card.title}</div>
                  <div className="text-xs text-slate-400 leading-relaxed">{card.subtitle}</div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Tool 1: QR Scanner */}
      {activeTool === 'qr' && (
        <div className="space-y-3">
          <QRLinkSecurityView />
        </div>
      )}

      {/* Tool 2: Check a Link */}
      {activeTool === 'link' && (
        <div className="space-y-3">
          <div className="bg-[#101C38] border border-[#1E2F59] rounded-2xl p-4 space-y-3">
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                <Link2 className="w-4 h-4 text-sky-400" /> Check a Link
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Paste any payment, bank, or investment link to inspect whether it conceals its destination or imitates an authentic institution.
              </p>
            </div>

            <div className="space-y-2">
              <input
                type="text"
                value={linkInput}
                onChange={(e) => setLinkInput(e.target.value)}
                placeholder="e.g. https://sbi-card-rewards.net/login or bit.ly/3x..."
                className="w-full bg-[#0A1226] border border-[#203159] focus:border-[#E0A96D] text-slate-100 text-xs rounded-xl p-3 outline-none font-mono"
              />

              <div className="flex flex-wrap gap-1.5 items-center pt-1 text-[10px]">
                <span className="text-slate-400">Samples:</span>
                <button
                  onClick={() => {
                    setLinkInput('https://sbi-card-rewards.net/login');
                    handleCheckLink('https://sbi-card-rewards.net/login');
                  }}
                  className="bg-[#16254A] text-rose-300 px-2 py-0.5 rounded border border-[#233868]"
                >
                  Fake SBI Phish
                </button>
                <button
                  onClick={() => {
                    setLinkInput('https://bit.ly/3xSpecialOffer');
                    handleCheckLink('https://bit.ly/3xSpecialOffer');
                  }}
                  className="bg-[#16254A] text-amber-300 px-2 py-0.5 rounded border border-[#233868]"
                >
                  Obfuscated Shortener
                </button>
                <button
                  onClick={() => {
                    setLinkInput('https://www.onlinesbi.sbi');
                    handleCheckLink('https://www.onlinesbi.sbi');
                  }}
                  className="bg-[#16254A] text-emerald-300 px-2 py-0.5 rounded border border-[#233868]"
                >
                  Official SBI
                </button>
              </div>

              <button
                onClick={() => handleCheckLink(linkInput)}
                disabled={!linkInput.trim() || loading}
                className="w-full mt-2 bg-[#E0A96D] hover:bg-[#F4A261] disabled:opacity-50 text-[#0A1128] font-bold text-xs py-2.5 rounded-xl flex items-center justify-center gap-2 transition-colors"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Inspect Link
              </button>
            </div>
          </div>

          {riskResult && (
            <PlainLanguageRiskCard
              {...riskResult}
              onReset={() => {
                setRiskResult(null);
                setLinkInput('');
              }}
              onReport={() => setActiveTool('report')}
            />
          )}
        </div>
      )}

      {/* Tool 3: Check a UPI ID */}
      {activeTool === 'upi' && (
        <div className="space-y-3">
          <div className="bg-[#101C38] border border-[#1E2F59] rounded-2xl p-4 space-y-3">
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-emerald-400" /> Check a UPI ID
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Paste any UPI ID (VPA) or payment link to verify that the banking provider is authorized and that it does not impersonate customer care.
              </p>
            </div>

            <div className="space-y-2">
              <input
                type="text"
                value={upiInput}
                onChange={(e) => setUpiInput(e.target.value)}
                placeholder="e.g. customer-care-refund@okhdfcbank or upi://pay?..."
                className="w-full bg-[#0A1226] border border-[#203159] focus:border-[#E0A96D] text-slate-100 text-xs rounded-xl p-3 outline-none font-mono"
              />

              <div className="flex flex-wrap gap-1.5 items-center pt-1 text-[10px]">
                <span className="text-slate-400">Samples:</span>
                <button
                  onClick={() => {
                    setUpiInput('customer-care-refund@okhdfcbank');
                    handleCheckUpi('customer-care-refund@okhdfcbank');
                  }}
                  className="bg-[#16254A] text-rose-300 px-2 py-0.5 rounded border border-[#233868]"
                >
                  Fake Customer Support
                </button>
                <button
                  onClick={() => {
                    const collect = 'upi://pay?pa=collect-request@axl&pn=BillDesk&am=49999&mode=02';
                    setUpiInput(collect);
                    handleCheckUpi(collect);
                  }}
                  className="bg-[#16254A] text-rose-300 px-2 py-0.5 rounded border border-[#233868]"
                >
                  ₹49,999 Collect Request
                </button>
                <button
                  onClick={() => {
                    setUpiInput('store-payment@okaxis');
                    handleCheckUpi('store-payment@okaxis');
                  }}
                  className="bg-[#16254A] text-emerald-300 px-2 py-0.5 rounded border border-[#233868]"
                >
                  Valid Merchant
                </button>
              </div>

              <button
                onClick={() => handleCheckUpi(upiInput)}
                disabled={!upiInput.trim() || loading}
                className="w-full mt-2 bg-[#E0A96D] hover:bg-[#F4A261] disabled:opacity-50 text-[#0A1128] font-bold text-xs py-2.5 rounded-xl flex items-center justify-center gap-2 transition-colors"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Verify UPI Recipient
              </button>
            </div>
          </div>

          {riskResult && (
            <PlainLanguageRiskCard
              {...riskResult}
              onReset={() => {
                setRiskResult(null);
                setUpiInput('');
              }}
              onReport={() => setActiveTool('report')}
            />
          )}
        </div>
      )}

      {/* Tool 4: Check a Message */}
      {activeTool === 'message' && (
        <div className="space-y-3">
          <div className="bg-[#101C38] border border-[#1E2F59] rounded-2xl p-4 space-y-3">
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                <MessageSquareWarning className="w-4 h-4 text-amber-400" /> Check a Message
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Paste any WhatsApp, SMS, or Telegram text claiming electricity disconnection, police arrest, part-time jobs, or guaranteed profits.
              </p>
            </div>

            <div className="space-y-2">
              <textarea
                rows={3}
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                placeholder="Paste message text here..."
                className="w-full bg-[#0A1226] border border-[#203159] focus:border-[#E0A96D] text-slate-100 text-xs rounded-xl p-3 outline-none"
              />

              <div className="flex flex-wrap gap-1.5 items-center pt-1 text-[10px]">
                <span className="text-slate-400">Samples:</span>
                <button
                  onClick={() => {
                    const sample =
                      'Dear consumer, your electricity power will be disconnected tonight at 9:30 PM because bill was not updated. Call electricity officer immediately at 9876543210.';
                    setMessageInput(sample);
                    handleCheckMessage(sample);
                  }}
                  className="bg-[#16254A] text-amber-300 px-2 py-0.5 rounded border border-[#233868]"
                >
                  Power Disconnection SMS
                </button>
                <button
                  onClick={() => {
                    const sample =
                      'You are under Digital Arrest by CBI Cyber Crime unit for illegal parcels. Transfer ₹50,000 security deposit to avoid immediate arrest.';
                    setMessageInput(sample);
                    handleCheckMessage(sample);
                  }}
                  className="bg-[#16254A] text-rose-300 px-2 py-0.5 rounded border border-[#233868]"
                >
                  Digital Arrest Threat
                </button>
              </div>

              <button
                onClick={() => handleCheckMessage(messageInput)}
                disabled={!messageInput.trim() || loading}
                className="w-full mt-2 bg-[#E0A96D] hover:bg-[#F4A261] disabled:opacity-50 text-[#0A1128] font-bold text-xs py-2.5 rounded-xl flex items-center justify-center gap-2 transition-colors"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Analyze Message
              </button>
            </div>
          </div>

          {riskResult && (
            <PlainLanguageRiskCard
              {...riskResult}
              onReset={() => {
                setRiskResult(null);
                setMessageInput('');
              }}
              onReport={() => setActiveTool('report')}
            />
          )}
        </div>
      )}

      {/* Tool 5: Check an Investment */}
      {activeTool === 'investment' && (
        <div className="space-y-3">
          <InvestmentScamView />
        </div>
      )}

      {/* Tool 6: Report a Scam */}
      {activeTool === 'report' && (
        <div className="space-y-3">
          <ReportsScreenView />
        </div>
      )}
    </div>
  );
};
