import React, { useState, useRef, useEffect } from 'react';
import {
  QrCode,
  Link2,
  Image,
  Upload,
  Camera,
  ShieldCheck,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Eye,
  Lock,
  ArrowRight,
  Database,
  CheckCircle2,
  FileCheck2,
  HelpCircle,
  Cpu,
  Layers,
} from 'lucide-react';
import { ResultScreenView } from '../ResultScreenView';
import { SafeAnalysisResultScreen } from '../../engine/safeAnalysisPipeline';
import { QRSecurityScanner } from '../../engine/qrSecurityScanner';
import jsQR from 'jsqr';

export const QRLinkSecurityView: React.FC = () => {
  const [subModule, setSubModule] = useState<'qr_scanner' | 'link_analyzer' | 'screenshot_analyzer' | 'threat_intel'>('qr_scanner');
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [traceRedirects, setTraceRedirects] = useState(true);
  const [assessmentResult, setAssessmentResult] = useState<SafeAnalysisResultScreen | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // File upload & Optical QR state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [qrDecodedLocally, setQrDecodedLocally] = useState<string | null>(null);

  // Threat Providers
  const [threatProviders, setThreatProviders] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/security/threat-providers')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.providers) {
          setThreatProviders(data.providers);
        }
      })
      .catch((err) => console.warn('Could not load threat providers:', err));
  }, []);

  // Function 1: Scan QR Code
  const handleScanQr = async (payloadToAnalyze: string) => {
    if (!payloadToAnalyze.trim()) return;
    setLoading(true);
    setErrorMessage(null);
    setAssessmentResult(null);

    try {
      const res = await fetch('/api/security/scan-qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qrPayload: payloadToAnalyze.trim() }),
      });
      const data = await res.json();
      if (data.success && data.assessment) {
        setAssessmentResult(data.assessment);
      } else {
        setErrorMessage(data.error || 'Failed to scan QR code payload.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Network error scanning QR code.');
    } finally {
      setLoading(false);
    }
  };

  // Function 2: Analyze Payment Link
  const handleAnalyzeLink = async (urlToAnalyze: string) => {
    if (!urlToAnalyze.trim()) return;
    setLoading(true);
    setErrorMessage(null);
    setAssessmentResult(null);

    try {
      const res = await fetch('/api/security/analyze-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlToAnalyze.trim(), traceRedirects }),
      });
      const data = await res.json();
      if (data.success && data.assessment) {
        setAssessmentResult(data.assessment);
      } else {
        setErrorMessage(data.error || 'Failed to analyze payment link.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Network error analyzing payment link.');
    } finally {
      setLoading(false);
    }
  };

  // Function 3: Analyze Screenshot Containing Payment Information
  // Uses OCR only where appropriate!
  const handleAnalyzeScreenshot = async (textToAnalyze?: string, base64?: string) => {
    setLoading(true);
    setErrorMessage(null);
    setAssessmentResult(null);

    try {
      const res = await fetch('/api/security/analyze-screenshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: textToAnalyze || inputText,
          base64Image: base64 || imagePreview || undefined,
        }),
      });
      const data = await res.json();
      if (data.success && data.assessment) {
        setAssessmentResult(data.assessment);
      } else {
        setErrorMessage(data.error || 'Failed to analyze screenshot.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Network error analyzing screenshot.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Image File Upload (Runs optical QR check first on client canvas before OCR!)
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setImagePreview(base64);

      // Create an image object to inspect canvas pixels for optical QR code
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, img.width, img.height);
          const decoded = jsQR(imageData.data, imageData.width, imageData.height);

          if (decoded && decoded.data) {
            setQrDecodedLocally(decoded.data);
            setInputText(decoded.data);
            // Route automatically through Function 1 QR pipeline
            handleScanQr(decoded.data);
          } else {
            setQrDecodedLocally(null);
            // No optical QR found, route through Function 3 Screenshot OCR pipeline
            if (subModule === 'screenshot_analyzer') {
              handleAnalyzeScreenshot(undefined, base64);
            }
          }
        }
      };
      img.src = base64;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-4">
      {/* Sub-Module Navigation Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <button
          onClick={() => {
            setSubModule('qr_scanner');
            setAssessmentResult(null);
            setErrorMessage(null);
            setInputText('');
          }}
          className={`p-2.5 rounded-xl border flex flex-col items-center justify-center text-center transition-all ${
            subModule === 'qr_scanner'
              ? 'bg-[#E0A96D]/15 border-[#E0A96D] text-[#E0A96D] font-bold shadow-sm'
              : 'bg-[#101C38] border-[#1E2F59] text-slate-400 hover:text-slate-200 hover:bg-[#142345]'
          }`}
        >
          <QrCode className="w-5 h-5 mb-1" />
          <span className="text-xs">Function 1: Scan QR</span>
        </button>

        <button
          onClick={() => {
            setSubModule('link_analyzer');
            setAssessmentResult(null);
            setErrorMessage(null);
            setInputText('');
          }}
          className={`p-2.5 rounded-xl border flex flex-col items-center justify-center text-center transition-all ${
            subModule === 'link_analyzer'
              ? 'bg-[#E0A96D]/15 border-[#E0A96D] text-[#E0A96D] font-bold shadow-sm'
              : 'bg-[#101C38] border-[#1E2F59] text-slate-400 hover:text-slate-200 hover:bg-[#142345]'
          }`}
        >
          <Link2 className="w-5 h-5 mb-1" />
          <span className="text-xs">Function 2: Payment Link</span>
        </button>

        <button
          onClick={() => {
            setSubModule('screenshot_analyzer');
            setAssessmentResult(null);
            setErrorMessage(null);
            setInputText('');
          }}
          className={`p-2.5 rounded-xl border flex flex-col items-center justify-center text-center transition-all ${
            subModule === 'screenshot_analyzer'
              ? 'bg-[#E0A96D]/15 border-[#E0A96D] text-[#E0A96D] font-bold shadow-sm'
              : 'bg-[#101C38] border-[#1E2F59] text-slate-400 hover:text-slate-200 hover:bg-[#142345]'
          }`}
        >
          <Image className="w-5 h-5 mb-1" />
          <span className="text-xs">Function 3: Screenshots</span>
        </button>

        <button
          onClick={() => {
            setSubModule('threat_intel');
            setAssessmentResult(null);
            setErrorMessage(null);
          }}
          className={`p-2.5 rounded-xl border flex flex-col items-center justify-center text-center transition-all ${
            subModule === 'threat_intel'
              ? 'bg-[#E0A96D]/15 border-[#E0A96D] text-[#E0A96D] font-bold shadow-sm'
              : 'bg-[#101C38] border-[#1E2F59] text-slate-400 hover:text-slate-200 hover:bg-[#142345]'
          }`}
        >
          <Database className="w-5 h-5 mb-1" />
          <span className="text-xs">Threat Intel APIs</span>
        </button>
      </div>

      {/* ERROR MESSAGE DISPLAY */}
      {errorMessage && (
        <div className="bg-rose-950/40 border border-rose-500/40 rounded-xl p-3 flex items-start gap-2 text-rose-200 text-xs">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* FUNCTION 1: SCAN QR CODES */}
      {/* ========================================================================= */}
      {subModule === 'qr_scanner' && !assessmentResult && (
        <div className="bg-[#101C38] border border-[#1E2F59] rounded-2xl p-4 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                <QrCode className="w-4 h-4 text-[#E0A96D]" />
                FUNCTION 1: Optical & Payload QR Code Scanner
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Extracts UPI URI, UPI ID, merchant name, amount, transaction note, URL, and encoded metadata (mode, MCC, ref).
              </p>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/30">
              Safe Quarantine
            </span>
          </div>

          {/* Optical Viewfinder / Image Dropzone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-[#263765] hover:border-[#E0A96D]/60 rounded-2xl p-6 text-center space-y-2 bg-[#0C152B] cursor-pointer transition-all group"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageFileChange}
              accept="image/*"
              className="hidden"
            />
            {imagePreview ? (
              <div className="space-y-2">
                <img
                  src={imagePreview}
                  alt="Scanned QR"
                  className="max-h-40 mx-auto rounded-lg border border-slate-700 object-contain shadow-md"
                />
                <span className="text-[11px] text-emerald-400 font-mono block">
                  {qrDecodedLocally ? '✓ QR Code Extracted on Device' : 'Image loaded. Decoding...'}
                </span>
              </div>
            ) : (
              <>
                <Camera className="w-8 h-8 text-[#E0A96D] mx-auto opacity-80 group-hover:scale-110 transition-transform" />
                <div className="text-xs font-semibold text-slate-200">
                  Click to Upload QR Code Image or Screenshot
                </div>
                <p className="text-[10px] text-slate-400">
                  Decodes optical QR codes directly from camera pixels without unsafe external redirection.
                </p>
              </>
            )}
          </div>

          {/* Raw Payload Input Box */}
          <div className="space-y-2">
            <label className="text-[11px] font-semibold text-slate-300">
              Or Paste Scanned QR Code String / UPI URI:
            </label>
            <textarea
              rows={3}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="e.g. upi://pay?pa=store@okaxis&pn=Merchant&am=1500&mode=00 or https://..."
              className="w-full bg-[#0A1226] border border-[#203159] focus:border-[#E0A96D] text-slate-100 text-xs rounded-xl p-3 outline-none font-mono resize-none"
            />

            {/* Quick Test Vectors for Function 1 */}
            <div className="space-y-1 pt-1">
              <span className="text-[10px] text-slate-400 font-semibold">Test Real-World QR Vectors:</span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => {
                    const qr = 'upi://pay?pa=customer-care-refund@okhdfcbank&pn=HDFCSupport&am=25000&mode=02&tn=RefundProcessing';
                    setInputText(qr);
                    handleScanQr(qr);
                  }}
                  className="text-[10px] bg-[#16254A] hover:bg-[#1C2F5E] text-rose-300 px-2 py-1 rounded border border-[#233868]"
                >
                  Deceptive Collect QR (Mode=02)
                </button>

                <button
                  onClick={() => {
                    const qr = 'https://sbi-kyc-verify.top/portal.apk?ref=kyc992';
                    setInputText(qr);
                    handleScanQr(qr);
                  }}
                  className="text-[10px] bg-[#16254A] hover:bg-[#1C2F5E] text-rose-300 px-2 py-1 rounded border border-[#233868]"
                >
                  Phishing Web QR (.top APK)
                </button>

                <button
                  onClick={() => {
                    const qr = 'upi://pay?pa=electricity-bill-clearance@okaxis&pn=PowerSupply&am=10.00&mode=02&tn=BillUpdate';
                    setInputText(qr);
                    handleScanQr(qr);
                  }}
                  className="text-[10px] bg-[#16254A] hover:bg-[#1C2F5E] text-rose-300 px-2 py-1 rounded border border-[#233868]"
                >
                  Fake Electricity Disconnection QR
                </button>

                <button
                  onClick={() => {
                    const qr = 'upi://pay?pa=supermarket.groceries@okaxis&pn=MetroSupermarket&am=1250.50&tn=Groceries&mc=5411&tr=TXN889922';
                    setInputText(qr);
                    handleScanQr(qr);
                  }}
                  className="text-[10px] bg-[#16254A] hover:bg-[#1C2F5E] text-emerald-300 px-2 py-1 rounded border border-[#233868]"
                >
                  Standard Verified Merchant QR
                </button>
              </div>
            </div>

            <button
              onClick={() => handleScanQr(inputText)}
              disabled={!inputText.trim() || loading}
              className="w-full mt-2 bg-[#E0A96D] hover:bg-[#F4A261] disabled:opacity-50 text-[#0A1128] font-bold text-xs py-2.5 rounded-xl flex items-center justify-center gap-2 transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Scanning & Extracting QR Metadata...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Scan QR & Execute Safe Pipeline</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* FUNCTION 2: ANALYZE PAYMENT LINKS */}
      {/* ========================================================================= */}
      {subModule === 'link_analyzer' && !assessmentResult && (
        <div className="bg-[#101C38] border border-[#1E2F59] rounded-2xl p-4 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                <Link2 className="w-4 h-4 text-[#E0A96D]" />
                FUNCTION 2: Payment Link Security & Redirection Analyzer
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Extracts domain, subdomain, path, query parameters, redirects (SSRF-protected), and suspicious patterns.
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-500/30 font-mono">
              <Lock className="w-3 h-3" />
              <span>Zero Unsafe Auto-Open</span>
            </div>
          </div>

          <div className="space-y-3">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="e.g. https://sbi-kyc-verify.top/app.apk or https://bit.ly/3xPayReward"
              className="w-full bg-[#0A1226] border border-[#203159] focus:border-[#E0A96D] text-slate-100 text-xs rounded-xl p-3 outline-none font-mono"
            />

            {/* Redirection Trace Toggle */}
            <div className="bg-[#0B1327] p-2.5 rounded-xl border border-[#1A294F] flex items-center justify-between text-xs">
              <div className="space-y-0.5">
                <span className="font-semibold text-slate-200">Safe Server-Side Redirection Unfurl</span>
                <p className="text-[10px] text-slate-400">
                  Inspects HTTP HEAD location headers with strict SSRF protection to uncover hidden destinations.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={traceRedirects}
                  onChange={(e) => setTraceRedirects(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-[#1B2749] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#E0A96D]"></div>
              </label>
            </div>

            {/* Test Link Presets */}
            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 font-semibold">Test Link Vectors:</span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => {
                    const l = 'https://sbi-kyc-verify.top/download/update.apk?token=99281&redirect=https://evil.com';
                    setInputText(l);
                    handleAnalyzeLink(l);
                  }}
                  className="text-[10px] bg-[#16254A] hover:bg-[#1C2F5E] text-rose-300 px-2 py-1 rounded border border-[#233868]"
                >
                  SBI Brand Spoof & APK (.top)
                </button>

                <button
                  onClick={() => {
                    const l = 'https://bit.ly/3xSpecialOffer?target=https://phishing-portal.xyz';
                    setInputText(l);
                    handleAnalyzeLink(l);
                  }}
                  className="text-[10px] bg-[#16254A] hover:bg-[#1C2F5E] text-amber-300 px-2 py-1 rounded border border-[#233868]"
                >
                  Bitly Shortener & Open Redirect
                </button>

                <button
                  onClick={() => {
                    const l = 'http://192.168.1.105/collect/pay?pin=1234&otp=9900';
                    setInputText(l);
                    handleAnalyzeLink(l);
                  }}
                  className="text-[10px] bg-[#16254A] hover:bg-[#1C2F5E] text-rose-300 px-2 py-1 rounded border border-[#233868]"
                >
                  Raw IP & Credential Harvest
                </button>

                <button
                  onClick={() => {
                    const l = 'https://www.hdfcbank.com/personal/ways-to-bank/online-banking/net-banking';
                    setInputText(l);
                    handleAnalyzeLink(l);
                  }}
                  className="text-[10px] bg-[#16254A] hover:bg-[#1C2F5E] text-emerald-300 px-2 py-1 rounded border border-[#233868]"
                >
                  Official HDFC Bank Net-Banking
                </button>
              </div>
            </div>

            <button
              onClick={() => handleAnalyzeLink(inputText)}
              disabled={!inputText.trim() || loading}
              className="w-full mt-2 bg-[#E0A96D] hover:bg-[#F4A261] disabled:opacity-50 text-[#0A1128] font-bold text-xs py-2.5 rounded-xl flex items-center justify-center gap-2 transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Analyzing Domain, Subdomain & Parameters...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Analyze Payment Link Safely</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* FUNCTION 3: ANALYZE SCREENSHOTS CONTAINING PAYMENT INFORMATION */}
      {/* ========================================================================= */}
      {subModule === 'screenshot_analyzer' && !assessmentResult && (
        <div className="bg-[#101C38] border border-[#1E2F59] rounded-2xl p-4 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                <Image className="w-4 h-4 text-[#E0A96D]" />
                FUNCTION 3: Screenshot Payment Forensics (OCR Only Where Appropriate)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Inspects payment receipts, fake payment makers, and extortion chats while masking all PII.
              </p>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/30">
              PII Auto-Shield
            </span>
          </div>

          {/* Screenshot Upload Dropzone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-[#263765] hover:border-[#E0A96D]/60 rounded-2xl p-6 text-center space-y-2 bg-[#0C152B] cursor-pointer transition-all group"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageFileChange}
              accept="image/*"
              className="hidden"
            />
            {imagePreview ? (
              <div className="space-y-2">
                <img
                  src={imagePreview}
                  alt="Screenshot Preview"
                  className="max-h-40 mx-auto rounded-lg border border-slate-700 object-contain shadow-md"
                />
                <span className="text-[11px] text-slate-300 font-mono block">
                  Screenshot Loaded. Ready for forensic analysis.
                </span>
              </div>
            ) : (
              <>
                <Upload className="w-8 h-8 text-[#E0A96D] mx-auto opacity-80 group-hover:scale-110 transition-transform" />
                <div className="text-xs font-semibold text-slate-200">
                  Upload Screenshot of Payment Receipt or Chat
                </div>
                <p className="text-[10px] text-slate-400">
                  Optical QR is checked first; OCR is applied only where text extraction is required.
                </p>
              </>
            )}
          </div>

          {/* Or Paste Extracted Screenshot Text */}
          <div className="space-y-2">
            <label className="text-[11px] font-semibold text-slate-300">
              Or Paste Receipt OCR Text / Chat Log:
            </label>
            <textarea
              rows={3}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="e.g. Paid successfully on PhonePe. Amount: ₹5,000. UTR: 409812345678..."
              className="w-full bg-[#0A1226] border border-[#203159] focus:border-[#E0A96D] text-slate-100 text-xs rounded-xl p-3 outline-none resize-none font-mono"
            />

            {/* Test Screenshot Scenarios */}
            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 font-semibold">Test Screenshot Scenarios:</span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => {
                    const text = 'Payment Successful made using Paytm Spoon fake receipt maker. Transferred ₹10,000 to merchant@okaxis on 26-Sep-2024.';
                    setInputText(text);
                    handleAnalyzeScreenshot(text);
                  }}
                  className="text-[10px] bg-[#16254A] hover:bg-[#1C2F5E] text-rose-300 px-2 py-1 rounded border border-[#233868]"
                >
                  Paytm Spoon Fake Receipt
                </button>

                <button
                  onClick={() => {
                    const text = 'Incoming Collect Request from customer-care-refund@okhdfcbank for ₹49,999. Authorize debit to process refund.';
                    setInputText(text);
                    handleAnalyzeScreenshot(text);
                  }}
                  className="text-[10px] bg-[#16254A] hover:bg-[#1C2F5E] text-rose-300 px-2 py-1 rounded border border-[#233868]"
                >
                  Disguised Collect Request Screenshot
                </button>

                <button
                  onClick={() => {
                    const text = 'Transfer from Aadhaar 4912 8812 9901 and PAN ABCDE1234F. My UPI PIN is 123456. Paid ₹4,500 to store@okaxis on Google Pay. UPI Ref No: 409812345678. Status: Successful.';
                    setInputText(text);
                    handleAnalyzeScreenshot(text);
                  }}
                  className="text-[10px] bg-[#16254A] hover:bg-[#1C2F5E] text-emerald-300 px-2 py-1 rounded border border-[#233868]"
                >
                  PII Sanitization Test (Aadhaar/PAN/PIN)
                </button>
              </div>
            </div>

            <button
              onClick={() => handleAnalyzeScreenshot(inputText)}
              disabled={(!inputText.trim() && !imagePreview) || loading}
              className="w-full mt-2 bg-[#E0A96D] hover:bg-[#F4A261] disabled:opacity-50 text-[#0A1128] font-bold text-xs py-2.5 rounded-xl flex items-center justify-center gap-2 transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing Forensics & Redacting PII...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Analyze Screenshot & Receipts</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* THREAT INTELLIGENCE APIS & EXTENSIBILITY */}
      {/* ========================================================================= */}
      {subModule === 'threat_intel' && !assessmentResult && (
        <div className="bg-[#101C38] border border-[#1E2F59] rounded-2xl p-4 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
              <Database className="w-4 h-4 text-[#E0A96D]" />
              Threat Intelligence Providers & Pluggable Architecture
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Strict interface implementation allowing real threat-intelligence APIs (Google Safe Browsing, VirusTotal, CERT-In, PhishTank) to replace mock providers.
            </p>
          </div>

          {/* Zero Invented Reputation Notice */}
          <div className="bg-emerald-950/20 border border-emerald-500/40 p-3 rounded-xl space-y-1 text-xs text-emerald-200">
            <span className="font-bold flex items-center gap-1 text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
              Core Principle: Zero Invented Reputation
            </span>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Apka Dhan AI strictly reports confirmed threat entries or returns UNRATED status. We never fabricate arbitrary safety percentage scores for unrated entities.
            </p>
          </div>

          <div className="space-y-2">
            <span className="text-[11px] font-bold text-slate-300">Registered Threat Providers:</span>
            <div className="space-y-2">
              {threatProviders.map((p, idx) => (
                <div
                  key={idx}
                  className="bg-[#0C152B] p-3 rounded-xl border border-[#1E2F59] flex items-center justify-between"
                >
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-slate-100">{p.name}</span>
                    <div className="text-[10px] text-slate-400 font-mono">
                      ID: {p.id} • v{p.version}
                    </div>
                  </div>
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-600">
                    {p.isAuthoritative ? 'Authoritative Registry' : 'Provider Slot'}
                  </span>
                </div>
              ))}

              <div className="bg-[#091022] p-3 rounded-xl border border-dashed border-[#1E2F59] space-y-1.5 text-xs text-slate-400">
                <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-[#E0A96D]" />
                  ThreatIntelligenceProvider Interface
                </span>
                <p className="text-[11px]">
                  Third-party providers implement <code className="text-[#E0A96D]">lookupUrl</code>, <code className="text-[#E0A96D]">lookupDomain</code>, and <code className="text-[#E0A96D]">lookupVpa</code> returning standardized <code className="text-[#E0A96D]">ThreatIntelligenceResult</code> objects.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* RESULT SCREEN VIEW (5 MANDATORY SECTIONS) */}
      {/* ========================================================================= */}
      {assessmentResult && (
        <ResultScreenView
          assessment={assessmentResult}
          onReset={() => {
            setAssessmentResult(null);
            setInputText('');
            setImagePreview(null);
            setQrDecodedLocally(null);
          }}
        />
      )}
    </div>
  );
};
