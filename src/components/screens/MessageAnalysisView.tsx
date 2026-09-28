import React, { useState } from 'react';
import {
  MessageSquare,
  ShieldCheck,
  Lock,
  Database,
  CheckCircle2,
  AlertTriangle,
  CreditCard,
  Building2,
  Calendar,
  Tag,
  Hash,
  ArrowDownRight,
  ArrowUpRight,
  RotateCcw,
  Sparkles,
  Info,
  Check,
  Copy,
  Trash2,
} from 'lucide-react';
import { globalParserRegistry } from '../../engine/sms/ParserRegistry';
import { globalTransactionRepository } from '../../engine/sms/TransactionRepository';
import {
  NormalizedTransactionRecord,
  ParseResult,
  RawMessageInput,
} from '../../engine/sms/types';

// 100% Synthetic Fictitious Test Messages (Zero real user financial data)
const SYNTHETIC_PRESETS: Array<{
  id: string;
  bankName: string;
  senderId: string;
  body: string;
  description: string;
}> = [
  {
    id: 'hdfc_debit',
    bankName: 'HDFC Bank',
    senderId: 'VK-HDFCBK',
    body: 'Sent Rs. 1,500.00 from HDFC Bank A/C **1234 to SWIGGY on 25-SEP-24 via UPI. Ref 426811223344. Bal Rs 45,210.00',
    description: 'Debit ₹1,500 for Swiggy via UPI',
  },
  {
    id: 'sbi_debit',
    bankName: 'State Bank of India',
    senderId: 'AD-SBIINB',
    body: 'Your A/C XXXXX123456 debited by Rs 2,450.00 on 24Sep24 transfer to ZOMATO Ref No 426800112233. Avl Bal Rs 45,210.00 - SBI',
    description: 'Debit ₹2,450 for Zomato food delivery',
  },
  {
    id: 'icici_debit',
    bankName: 'ICICI Bank',
    senderId: 'AX-ICICIB',
    body: 'Acct XX9012 debited for Rs 899.00 on 25-Sep-24. UPI:AMAZON.UPI:426877665544. Call 1800... if not you.',
    description: 'Debit ₹899 for Amazon purchase',
  },
  {
    id: 'axis_debit',
    bankName: 'Axis Bank',
    senderId: 'BZ-AXISBK',
    body: 'INR 3,200.00 debited from Axis Bank A/C no. XX3456 on 25-09-2024 14:32:10 towards UPI/BLINKIT/426855443322. Avl Bal INR 12,890.00',
    description: 'Debit ₹3,200 for Blinkit groceries',
  },
  {
    id: 'kotak_debit',
    bankName: 'Kotak Bank',
    senderId: 'DZ-KOTAKB',
    body: 'Sent Rs. 450.00 from Kotak Bank AC X1234 to UBER on 25-09-2024. UPI Ref 426866778899. Bal: Rs 8,920.00',
    description: 'Debit ₹450 for Uber ride',
  },
  {
    id: 'phonepe_debit',
    bankName: 'PhonePe UPI',
    senderId: 'VM-PHONEPE',
    body: 'You paid ₹320.00 to Chai Point on PhonePe using Bank of Baroda **4321. UPI Ref: 426844556677.',
    description: 'Debit ₹320 Chai Point via PhonePe',
  },
  {
    id: 'collect_request',
    bankName: 'Collect Vector',
    senderId: 'AX-UPIALERT',
    body: 'Incoming collect request of Rs 49,999.00 from electricity-refund@axl on UPI. Approve only if you are paying.',
    description: 'Deceptive collect request detection',
  },
  {
    id: 'otp_filter',
    bankName: 'OTP Pre-filter',
    senderId: 'VK-HDFCBK',
    body: '123456 is your Secret OTP for NetBanking login. Valid for 10 mins. Do not share OTP with anyone.',
    description: 'Non-transactional message (Safe filter)',
  },
];

export const MessageAnalysisView: React.FC = () => {
  const [senderId, setSenderId] = useState('VK-HDFCBK');
  const [messageBody, setMessageBody] = useState(SYNTHETIC_PRESETS[0].body);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [repositoryRecords, setRepositoryRecords] = useState<NormalizedTransactionRecord[]>(() =>
    globalTransactionRepository.getAll()
  );
  const [spendingSummary, setSpendingSummary] = useState(() =>
    globalTransactionRepository.getSpendingSummary(0)
  );

  const refreshRepo = () => {
    setRepositoryRecords(globalTransactionRepository.getAll());
    setSpendingSummary(globalTransactionRepository.getSpendingSummary(0));
  };

  const handleParseMessage = () => {
    const input: RawMessageInput = {
      senderId: senderId.trim(),
      body: messageBody.trim(),
      timestampEpochMs: Date.now(),
    };

    // Client-side offline parsing (Zero network transmission!)
    const result = globalParserRegistry.parseMessage(input);
    setParseResult(result);

    if (result.success && result.record) {
      const saveRes = globalTransactionRepository.save(result.record);
      if (saveRes.saved) {
        setSaveStatus('Record normalized & saved locally on-device. (Raw SMS discarded)');
      } else if (saveRes.isDuplicate) {
        setSaveStatus('Duplicate transaction recognized (UTR matched). Duplicate ignored.');
      }
      refreshRepo();
    } else {
      setSaveStatus(null);
    }
  };

  const handleClearRepository = () => {
    globalTransactionRepository.clear();
    refreshRepo();
    setSaveStatus('Local repository wiped.');
  };

  const privacyAudit = globalTransactionRepository.getPrivacyAudit();

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {/* 1. Header Banner & Privacy Shield */}
      <div className="bg-[#101C38] border border-[#1E2F59] rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-[#E0A96D]" />
              On-Device Transaction-Message Analysis
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Parses financial SMS notifications locally with bank-specific regex patterns.
            </p>
          </div>
          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/30 shrink-0">
            Offline Runtime
          </span>
        </div>

        {/* Strict Privacy Directives Callout */}
        <div className="bg-[#0C152B] p-3 rounded-xl border border-[#1C2B52] grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <span className="text-[10px] text-slate-500 block font-mono">CLIENT COMPUTATION:</span>
              <span className="text-slate-200 font-semibold">100% Offline Parsing</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-[#E0A96D] shrink-0" />
            <div>
              <span className="text-[10px] text-slate-500 block font-mono">NETWORK TRANSMISSION:</span>
              <span className="text-slate-200 font-semibold">Zero Raw SMS Sent</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-sky-400 shrink-0" />
            <div>
              <span className="text-[10px] text-slate-500 block font-mono">DATABASE STORAGE:</span>
              <span className="text-slate-200 font-semibold">0 Raw Messages Saved</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Synthetic Test Vectors Preset Bar */}
      <div className="space-y-1.5">
        <div className="text-[11px] font-semibold text-slate-300 flex items-center justify-between">
          <span>Select 100% Synthetic Test Message:</span>
          <span className="text-[10px] text-slate-500 font-mono italic">
            *No real user data is ever used in tests
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-xs">
          {SYNTHETIC_PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => {
                setSenderId(preset.senderId);
                setMessageBody(preset.body);
                setParseResult(null);
                setSaveStatus(null);
              }}
              className={`p-2 rounded-xl border text-left transition-all ${
                messageBody === preset.body
                  ? 'bg-[#E0A96D]/15 border-[#E0A96D] text-[#E0A96D] font-bold'
                  : 'bg-[#101C38] border-[#1E2F59] text-slate-400 hover:text-slate-200 hover:bg-[#142345]'
              }`}
            >
              <div className="text-[11px] truncate">{preset.bankName}</div>
              <div className="text-[9px] text-slate-500 truncate font-mono">{preset.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* 3. Input Console */}
      <div className="bg-[#101C38] border border-[#1E2F59] rounded-2xl p-4 space-y-3">
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold text-slate-300">Sender ID (SMS Header):</label>
          <input
            type="text"
            value={senderId}
            onChange={(e) => setSenderId(e.target.value)}
            placeholder="e.g. VK-HDFCBK, AD-SBIINB, AX-ICICIB"
            className="w-full bg-[#0A1226] border border-[#203159] focus:border-[#E0A96D] text-slate-100 text-xs rounded-xl p-2.5 outline-none font-mono"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold text-slate-300">Financial Message Body:</label>
          <textarea
            rows={3}
            value={messageBody}
            onChange={(e) => setMessageBody(e.target.value)}
            placeholder="Paste or type synthetic financial notification message..."
            className="w-full bg-[#0A1226] border border-[#203159] focus:border-[#E0A96D] text-slate-100 text-xs rounded-xl p-3 outline-none font-mono resize-none"
          />
        </div>

        <button
          onClick={handleParseMessage}
          disabled={!messageBody.trim()}
          className="w-full bg-[#E0A96D] hover:bg-[#F4A261] disabled:opacity-50 text-[#0A1128] font-bold text-xs py-2.5 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm"
        >
          <Sparkles className="w-4 h-4" />
          <span>Execute On-Device Message Parser</span>
        </button>

        {saveStatus && (
          <div className="bg-emerald-950/30 border border-emerald-500/40 rounded-xl p-2.5 flex items-center gap-2 text-emerald-300 text-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{saveStatus}</span>
          </div>
        )}
      </div>

      {/* 4. Parsed Record Display with Granular Confidence Ratings */}
      {parseResult && (
        <div className="bg-[#101C38] border border-[#1E2F59] rounded-2xl p-4 space-y-3 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-200">PARSED TRANSACTION RECORD</span>
              <span className="text-[10px] font-mono text-[#E0A96D] bg-[#E0A96D]/15 px-2 py-0.5 rounded border border-[#E0A96D]/30">
                {parseResult.matchedParserName || 'Parser Engine'}
              </span>
            </div>
            {parseResult.record && (
              <span
                className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                  parseResult.record.overallConfidence === 'HIGH'
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-600'
                    : parseResult.record.overallConfidence === 'MEDIUM'
                    ? 'bg-amber-950 text-amber-400 border border-amber-600'
                    : 'bg-rose-950 text-rose-400 border border-rose-600'
                }`}
              >
                OVERALL CONFIDENCE: {parseResult.record.overallConfidence}
              </span>
            )}
          </div>

          {parseResult.success && parseResult.record ? (
            <div className="space-y-2">
              {/* Key Value Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                {/* 1. Transaction Type */}
                <div className="bg-[#0A1226] p-2.5 rounded-xl border border-[#1C2C55] space-y-1">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-slate-500">TYPE</span>
                    <span className="text-emerald-400">{parseResult.record.transactionType.confidence}</span>
                  </div>
                  <div className="flex items-center gap-1 font-bold">
                    {parseResult.record.transactionType.value === 'DEBIT' ? (
                      <ArrowDownRight className="w-4 h-4 text-rose-400" />
                    ) : parseResult.record.transactionType.value === 'CREDIT' ? (
                      <ArrowUpRight className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                    )}
                    <span
                      className={
                        parseResult.record.transactionType.value === 'DEBIT'
                          ? 'text-rose-400'
                          : parseResult.record.transactionType.value === 'CREDIT'
                          ? 'text-emerald-400'
                          : 'text-amber-400'
                      }
                    >
                      {parseResult.record.transactionType.value}
                    </span>
                  </div>
                </div>

                {/* 2. Amount */}
                <div className="bg-[#0A1226] p-2.5 rounded-xl border border-[#1C2C55] space-y-1">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-slate-500">AMOUNT</span>
                    <span className="text-emerald-400">{parseResult.record.amount.confidence}</span>
                  </div>
                  <div className="text-base font-bold text-slate-100">
                    ₹{parseResult.record.amount.value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                </div>

                {/* 3. Masked Account */}
                <div className="bg-[#0A1226] p-2.5 rounded-xl border border-[#1C2C55] space-y-1">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-slate-500">ACCOUNT</span>
                    <span className="text-emerald-400">{parseResult.record.maskedAccount.confidence}</span>
                  </div>
                  <div className="text-xs font-bold text-slate-200">
                    {parseResult.record.maskedAccount.value || 'Not Disclosed'}
                  </div>
                </div>

                {/* 4. Merchant / Counterparty */}
                <div className="bg-[#0A1226] p-2.5 rounded-xl border border-[#1C2C55] space-y-1">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-slate-500">COUNTERPARTY</span>
                    <span className="text-emerald-400">{parseResult.record.merchant.confidence}</span>
                  </div>
                  <div className="text-xs font-bold text-slate-200 truncate">
                    {parseResult.record.merchant.value || 'Unknown'}
                  </div>
                </div>
              </div>

              {/* Secondary Details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-[#0A1226] p-3 rounded-xl border border-[#1C2C55] text-xs font-mono">
                <div>
                  <span className="text-[10px] text-slate-500 block">UPI IDENTIFIER (VPA):</span>
                  <span className="text-slate-200 block truncate">
                    {parseResult.record.upiIdentifier.value || 'None'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">BANK REF (UTR):</span>
                  <span className="text-slate-200 font-bold block truncate">
                    {parseResult.record.referenceId.value || 'Missing UTR'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">PARSED DATE (ISO 8601):</span>
                  <span className="text-slate-200 block truncate">
                    {parseResult.record.isoDateString.split('T')[0]}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-rose-950/20 border border-rose-500/40 p-3 rounded-xl space-y-1 text-xs text-rose-200">
              <span className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                Parsing Handled Gracefully: {parseResult.errorReason}
              </span>
              <p className="text-[11px] text-slate-300 leading-relaxed">{parseResult.details}</p>
            </div>
          )}
        </div>
      )}

      {/* 5. On-Device Transaction Repository View */}
      <div className="bg-[#101C38] border border-[#1E2F59] rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-[#E0A96D]" />
            <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wide">
              On-Device Transaction Repository
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-slate-400 bg-[#0C152B] px-2 py-0.5 rounded border border-[#1E2F59]">
              {repositoryRecords.length} Records Stored
            </span>
            {repositoryRecords.length > 0 && (
              <button
                onClick={handleClearRepository}
                className="text-[10px] text-rose-400 hover:text-rose-300 flex items-center gap-1 bg-rose-950/40 px-2 py-0.5 rounded border border-rose-600/40 transition-colors"
              >
                <Trash2 className="w-3 h-3" />
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Spending Summary Card */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs font-mono">
          <div className="bg-[#091021] p-2.5 rounded-xl border border-[#172547]">
            <span className="text-[9px] text-slate-500 block">TOTAL DEBITS</span>
            <span className="font-bold text-rose-400">
              ₹{spendingSummary.totalDebits.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="bg-[#091021] p-2.5 rounded-xl border border-[#172547]">
            <span className="text-[9px] text-slate-500 block">TOTAL CREDITS</span>
            <span className="font-bold text-emerald-400">
              ₹{spendingSummary.totalCredits.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="bg-[#091021] p-2.5 rounded-xl border border-[#172547]">
            <span className="text-[9px] text-slate-500 block">DEBIT COUNT</span>
            <span className="font-bold text-slate-200">{spendingSummary.debitCount}</span>
          </div>
          <div className="bg-[#091021] p-2.5 rounded-xl border border-[#172547]">
            <span className="text-[9px] text-slate-500 block">MERCHANT TYPES</span>
            <span className="font-bold text-[#E0A96D]">
              {Object.keys(spendingSummary.merchantTotals).length}
            </span>
          </div>
        </div>

        {/* Transactions Table / List */}
        {repositoryRecords.length > 0 ? (
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {repositoryRecords.map((item) => (
              <div
                key={item.id}
                className="bg-[#0A1226] p-3 rounded-xl border border-[#1C2C55] flex items-center justify-between text-xs"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 font-bold text-slate-200">
                    <span className="text-[#E0A96D]">{item.bankOrProvider}</span>
                    <span className="text-slate-500">•</span>
                    <span>{item.merchant.value || 'General Payee'}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono flex items-center gap-2">
                    <span>A/C: {item.maskedAccount.value || 'None'}</span>
                    <span>Ref: {item.referenceId.value || 'None'}</span>
                    <span>{item.isoDateString.split('T')[0]}</span>
                  </div>
                </div>

                <div className="text-right">
                  <span
                    className={`font-mono font-bold block ${
                      item.transactionType.value === 'DEBIT' ? 'text-rose-400' : 'text-emerald-400'
                    }`}
                  >
                    {item.transactionType.value === 'DEBIT' ? '-' : '+'}₹{item.amount.value.toLocaleString('en-IN')}
                  </span>
                  <span className="text-[9px] text-slate-500 font-mono">{item.transactionType.value}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-xs text-slate-500 bg-[#091021] rounded-xl border border-dashed border-[#172547]">
            No normalized transactions in local repository yet. Parse a synthetic message above to populate.
          </div>
        )}

        {/* Privacy Audit Certification */}
        <div className="pt-2 border-t border-[#1C2B52] flex items-center justify-between text-[10px] font-mono text-slate-500">
          <span>STORAGE MODE: {privacyAudit.storageMechanism}</span>
          <span className="text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Raw SMS Retained: 0
          </span>
        </div>
      </div>
    </div>
  );
};
