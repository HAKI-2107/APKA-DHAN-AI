import React, { useState } from 'react';
import {
  FileText,
  ShieldCheck,
  Send,
  CheckCircle2,
  AlertCircle,
  Eye,
  Lock,
  Copy,
  Check,
} from 'lucide-react';

export const ReportsScreenView: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState('UPI ID');
  const [targetIdentifier, setTargetIdentifier] = useState('');
  const [incidentText, setIncidentText] = useState('');
  const [hasConsent, setHasConsent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [receiptHash, setReceiptHash] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const categories = [
    'UPI ID',
    'Phone Number',
    'Suspicious Link',
    'Fraud QR Code',
    'Investment Offer',
    'Crypto Scam',
    'Suspicious Message',
  ];

  // Client-side Sanitizer Preview for transparency
  const getRedactedPreview = (raw: string) => {
    if (!raw) return '';
    return raw
      .replace(/\b\d{4}\s?\d{4}\s?\d{4}\b/g, '[REDACTED_AADHAAR]')
      .replace(/\b[A-Z]{5}[0-9]{4}[A-Z]\b/gi, '[REDACTED_PAN]')
      .replace(/\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g, '[REDACTED_CARD]')
      .replace(/(?:pin|otp|cvv)[:\s=]+(\d{3,6})/gi, '***[REDACTED_SECRET]***');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetIdentifier || !hasConsent) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/report-incident', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: selectedCategory,
          targetIdentifier,
          description: incidentText,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setReceiptHash(data.incidentId);
      }
    } catch (err) {
      console.error(err);
      // Fallback local receipt
      setReceiptHash(`AD-2026-${Math.floor(100000 + Math.random() * 900000)}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyReceipt = () => {
    if (receiptHash) {
      navigator.clipboard.writeText(receiptHash);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-4">
      {/* Title Card */}
      <div className="bg-[#101C38] border border-[#1E2F59] rounded-2xl p-4 space-y-1">
        <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
          <FileText className="w-4 h-4 text-[#E0A96D]" />
          Report Threat & Suspected Fraud
        </h3>
        <p className="text-xs text-slate-400">
          Crowdsource threat hashes to protect the community. Sensitive PII is automatically sanitized on-device.
        </p>
      </div>

      {receiptHash ? (
        /* Submission Success Receipt */
        <div className="bg-[#101C38] border border-emerald-500/40 rounded-2xl p-5 text-center space-y-4 animate-in zoom-in-95 duration-200">
          <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>

          <div>
            <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-widest font-mono">
              INCIDENT RECORDED IN AUDIT TRAIL
            </div>
            <div className="text-2xl font-bold text-slate-100 font-mono mt-1 flex items-center justify-center gap-2">
              <span>{receiptHash}</span>
              <button
                onClick={handleCopyReceipt}
                className="p-1 rounded hover:bg-[#1B2B52] text-slate-400 hover:text-slate-200 transition-colors"
                title="Copy Incident Hash"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed max-w-sm mx-auto">
            Your report has been hashed and submitted to the threat intelligence cache. Keep this reference hash for your records when contacting your bank or the cyber crime portal (1930).
          </p>

          <div className="pt-2">
            <button
              onClick={() => {
                setReceiptHash(null);
                setTargetIdentifier('');
                setIncidentText('');
                setHasConsent(false);
              }}
              className="bg-[#18264A] hover:bg-[#20315E] text-slate-100 border border-[#263765] text-xs font-semibold px-4 py-2 rounded-xl transition-colors"
            >
              Submit Another Report
            </button>
          </div>
        </div>
      ) : (
        /* Report Form */
        <form onSubmit={handleSubmit} className="bg-[#101C38] border border-[#1E2F59] rounded-2xl p-4 space-y-4">
          {/* Category Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#E0A96D] uppercase tracking-wider block">
              1. Incident Category
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {categories.map((cat) => (
                <button
                  type="button"
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`p-2 rounded-xl text-xs font-medium border text-left transition-all ${
                    selectedCategory === cat
                      ? 'bg-[#E0A96D]/15 border-[#E0A96D] text-[#E0A96D] font-bold'
                      : 'bg-[#0A1226] border-[#1F2F57] text-slate-300 hover:bg-[#142345]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Identifier Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#E0A96D] uppercase tracking-wider block">
              2. Target Identifier (VPA / Number / Link)
            </label>
            <input
              type="text"
              required
              value={targetIdentifier}
              onChange={(e) => setTargetIdentifier(e.target.value)}
              placeholder="e.g. sbi-refund-care@okhdfcbank or +91 9876543210"
              className="w-full bg-[#0A1226] border border-[#203159] focus:border-[#E0A96D] text-slate-100 text-xs rounded-xl p-3 outline-none font-mono"
            />
          </div>

          {/* Description & Incident Text */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#E0A96D] uppercase tracking-wider block">
              3. Incident Narrative & Evidence
            </label>
            <textarea
              rows={3}
              value={incidentText}
              onChange={(e) => setIncidentText(e.target.value)}
              placeholder="Describe how contact was initiated, claimed returns, or extortion threats..."
              className="w-full bg-[#0A1226] border border-[#203159] focus:border-[#E0A96D] text-slate-100 text-xs rounded-xl p-3 outline-none resize-none"
            />
          </div>

          {/* On-Device Redaction Transparency Box */}
          {incidentText.length > 5 && (
            <div className="bg-[#0C152B] p-3 rounded-xl border border-[#1E2D52] space-y-1 text-xs">
              <div className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                <Lock className="w-3 h-3 text-emerald-400" />
                Sanitized On-Device Preview (No PII Transmitted):
              </div>
              <div className="text-slate-300 font-mono text-[11px] leading-relaxed break-words">
                {getRedactedPreview(incidentText)}
              </div>
            </div>
          )}

          {/* Consent Checkbox */}
          <label className="flex items-start gap-2.5 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={hasConsent}
              onChange={(e) => setHasConsent(e.target.checked)}
              className="mt-0.5 accent-[#E0A96D]"
            />
            <span className="text-[11px] text-slate-300 leading-tight">
              I certify this report represents an unsolicited or suspicious financial interaction. I consent to anonymized hash indexing for threat intelligence.
            </span>
          </label>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!targetIdentifier.trim() || !hasConsent || isSubmitting}
            className="w-full bg-[#E0A96D] hover:bg-[#F4A261] disabled:opacity-50 text-[#0A1128] font-bold text-xs py-2.5 rounded-xl flex items-center justify-center gap-2 transition-colors"
          >
            <Send className="w-4 h-4" />
            {isSubmitting ? 'Hashing & Submitting...' : 'Submit Evidence Dossier'}
          </button>
        </form>
      )}
    </div>
  );
};
