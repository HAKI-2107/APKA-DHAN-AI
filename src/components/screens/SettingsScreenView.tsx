import React, { useState } from 'react';
import {
  Lock,
  ShieldCheck,
  KeyRound,
  EyeOff,
  Trash2,
  RefreshCw,
  Globe,
  Code2,
  Database,
  CheckCircle2,
} from 'lucide-react';

interface SettingsScreenViewProps {
  onOpenCodeViewer: () => void;
}

export const SettingsScreenView: React.FC<SettingsScreenViewProps> = ({ onOpenCodeViewer }) => {
  const [biometricEnabled, setBiometricEnabled] = useState(true);
  const [strictPiiMasking, setStrictPiiMasking] = useState(true);
  const [zeroKnowledgeMode, setZeroKnowledgeMode] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<'en' | 'hi'>('en');
  const [clearedLogs, setClearedLogs] = useState(false);

  const handleClearLogs = () => {
    setClearedLogs(true);
    setTimeout(() => setClearedLogs(false), 2500);
  };

  return (
    <div className="space-y-4">
      {/* 1. Cryptographic Vault Status */}
      <div className="bg-gradient-to-br from-[#121F42] to-[#0D1630] border border-[#233562] rounded-2xl p-4 shadow-md space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold tracking-widest text-[#E0A96D] uppercase flex items-center gap-1.5 font-mono">
            <Lock className="w-3.5 h-3.5" /> HARDWARE KEYSTORE VAULT
          </span>
          <span className="text-[10px] text-emerald-400 font-mono bg-emerald-950/70 border border-emerald-600/40 px-2 py-0.5 rounded-full">
            Active
          </span>
        </div>

        <div className="text-xs font-semibold text-slate-100">
          Room DB + SQLCipher (256-bit AES-GCM)
        </div>
        <p className="text-[11px] text-slate-300 leading-relaxed">
          Master encryption keys are generated and protected by the Android Hardware-Backed Keystore (StrongBox TEE). No encryption keys leave the device.
        </p>
      </div>

      {/* 2. Security & Privacy Toggles */}
      <div className="bg-[#101C38] border border-[#1E2F59] rounded-2xl p-4 space-y-3">
        <div className="text-xs font-bold text-[#E0A96D] uppercase tracking-wider">
          Defense & Access Controls
        </div>

        <div className="space-y-3 divide-y divide-[#1C2C55]">
          <div className="flex items-center justify-between pt-1">
            <div className="pr-4">
              <div className="text-xs font-semibold text-slate-200">Biometric / App Lock</div>
              <div className="text-[11px] text-slate-400">
                Require biometric authentication upon resuming app
              </div>
            </div>
            <button
              onClick={() => setBiometricEnabled(!biometricEnabled)}
              className={`w-11 h-6 rounded-full p-1 transition-colors ${
                biometricEnabled ? 'bg-[#E0A96D]' : 'bg-[#1C2C55]'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-[#0A1128] transition-transform ${
                  biometricEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between pt-3">
            <div className="pr-4">
              <div className="text-xs font-semibold text-slate-200">Strict PII Masking Engine</div>
              <div className="text-[11px] text-slate-400">
                Automatically redact PAN, Aadhaar, and bank account numbers
              </div>
            </div>
            <button
              onClick={() => setStrictPiiMasking(!strictPiiMasking)}
              className={`w-11 h-6 rounded-full p-1 transition-colors ${
                strictPiiMasking ? 'bg-[#E0A96D]' : 'bg-[#1C2C55]'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-[#0A1128] transition-transform ${
                  strictPiiMasking ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between pt-3">
            <div className="pr-4">
              <div className="text-xs font-semibold text-slate-200">Zero-Knowledge Ephemeral Mode</div>
              <div className="text-[11px] text-slate-400">
                Do not save query history or scans into local database
              </div>
            </div>
            <button
              onClick={() => setZeroKnowledgeMode(!zeroKnowledgeMode)}
              className={`w-11 h-6 rounded-full p-1 transition-colors ${
                zeroKnowledgeMode ? 'bg-[#E0A96D]' : 'bg-[#1C2C55]'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-[#0A1128] transition-transform ${
                  zeroKnowledgeMode ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* 3. Regulatory Registries Sync */}
      <div className="bg-[#101C38] border border-[#1E2F59] rounded-2xl p-4 space-y-2.5">
        <div className="text-xs font-bold text-[#E0A96D] uppercase tracking-wider flex items-center justify-between">
          <span>Regulatory Registry Status</span>
          <span className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
            <RefreshCw className="w-3 h-3 text-emerald-400" /> Delta Sync Active
          </span>
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between bg-[#0A1226] p-2.5 rounded-xl border border-[#1E2D52]">
            <span className="text-slate-200">SEBI Registered Intermediaries:</span>
            <span className="text-[#E0A96D] font-mono text-[11px]">Synced Today</span>
          </div>
          <div className="flex items-center justify-between bg-[#0A1226] p-2.5 rounded-xl border border-[#1E2D52]">
            <span className="text-slate-200">RBI Unauthorized Forex Caution List:</span>
            <span className="text-[#E0A96D] font-mono text-[11px]">Synced Today</span>
          </div>
          <div className="flex items-center justify-between bg-[#0A1226] p-2.5 rounded-xl border border-[#1E2D52]">
            <span className="text-slate-200">NPCI Authorized PSP Directory:</span>
            <span className="text-[#E0A96D] font-mono text-[11px]">Bloom Filter v2.4</span>
          </div>
        </div>
      </div>

      {/* 4. Language Selection */}
      <div className="bg-[#101C38] border border-[#1E2F59] rounded-2xl p-4 space-y-2">
        <div className="text-xs font-bold text-[#E0A96D] uppercase tracking-wider flex items-center gap-1.5">
          <Globe className="w-3.5 h-3.5" /> Language Preference
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setSelectedLanguage('en')}
            className={`p-2.5 rounded-xl text-xs font-semibold border transition-all ${
              selectedLanguage === 'en'
                ? 'bg-[#E0A96D]/15 border-[#E0A96D] text-[#E0A96D]'
                : 'bg-[#0A1226] border-[#1F2F57] text-slate-300'
            }`}
          >
            English (Primary)
          </button>
          <button
            onClick={() => setSelectedLanguage('hi')}
            className={`p-2.5 rounded-xl text-xs font-semibold border transition-all ${
              selectedLanguage === 'hi'
                ? 'bg-[#E0A96D]/15 border-[#E0A96D] text-[#E0A96D]'
                : 'bg-[#0A1226] border-[#1F2F57] text-slate-300'
            }`}
          >
            हिन्दी (Hindi)
          </button>
        </div>
      </div>

      {/* 5. View Compose Source Code Button */}
      <div className="bg-[#101C38] border border-[#1E2F59] rounded-2xl p-4 space-y-2">
        <div className="text-xs font-bold text-[#E0A96D] uppercase tracking-wider flex items-center gap-1.5">
          <Code2 className="w-3.5 h-3.5" /> Jetpack Compose Code Inspector
        </div>
        <p className="text-[11px] text-slate-400">
          Inspect or export the raw Kotlin source code for all Jetpack Compose screens and models.
        </p>
        <button
          onClick={onOpenCodeViewer}
          className="w-full bg-[#18264A] hover:bg-[#20315E] border border-[#273868] text-slate-100 font-semibold text-xs py-2 rounded-xl flex items-center justify-center gap-2 transition-colors"
        >
          <Code2 className="w-4 h-4 text-[#E0A96D]" />
          Inspect Android Kotlin Compose Source Files
        </button>
      </div>

      {/* 6. Purge Local Logs Action */}
      <div className="pt-1">
        <button
          onClick={handleClearLogs}
          className="w-full bg-rose-950/30 hover:bg-rose-950/50 border border-rose-600/40 text-rose-300 text-xs font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          {clearedLogs ? 'Local Cache & Audit Logs Purged!' : 'Purge Local Scan Cache & History'}
        </button>
      </div>
    </div>
  );
};
