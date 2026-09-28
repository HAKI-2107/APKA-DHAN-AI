import React, { useState, useEffect } from 'react';
import {
  X,
  Bell,
  Shield,
  CreditCard,
  TrendingUp,
  PieChart,
  BarChart2,
  Coins,
  Lock,
  Moon,
  CheckCircle2,
  Flame,
} from 'lucide-react';
import { globalAlertEngine } from '../../engine/notifications/AlertEngine';
import { NotificationSettings } from '../../engine/notifications/types';

interface NotificationSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenTestHarness?: () => void;
}

export const NotificationSettingsModal: React.FC<NotificationSettingsModalProps> = ({
  isOpen,
  onClose,
  onOpenTestHarness,
}) => {
  const [settings, setSettings] = useState<NotificationSettings>(globalAlertEngine.getSettings());
  const [permissionGranted, setPermissionGranted] = useState(globalAlertEngine.isPermissionGranted());
  const [savedNotice, setSavedNotice] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSettings(globalAlertEngine.getSettings());
      setPermissionGranted(globalAlertEngine.isPermissionGranted());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleToggle = (key: keyof NotificationSettings) => {
    const updated = { ...settings, [key]: !settings[key] };
    setSettings(updated);
    globalAlertEngine.updateSettings(updated);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2000);
  };

  const handleRequestPermission = async () => {
    const granted = await globalAlertEngine.requestNotificationPermission();
    setPermissionGranted(granted);
  };

  const categories = [
    {
      key: 'securityEnabled' as const,
      label: 'Security & Phishing Alerts',
      desc: 'Critical notices for malicious links, counterfeit certificates, and digital threats.',
      icon: Shield,
      color: 'text-rose-400',
    },
    {
      key: 'paymentEnabled' as const,
      label: 'Payment Safety',
      desc: 'Warnings for unusual collect requests, unverified VPAs, and sudden debit surges.',
      icon: CreditCard,
      color: 'text-emerald-400',
    },
    {
      key: 'investmentEnabled' as const,
      label: 'Investment Scam Verification',
      desc: 'Notices for unregistered entities, high return schemes, and regulatory warnings.',
      icon: TrendingUp,
      color: 'text-[#E0A96D]',
    },
    {
      key: 'portfolioEnabled' as const,
      label: 'Portfolio Concentration',
      desc: 'Objective notices when a single asset exceeds 30% of your total net worth.',
      icon: PieChart,
      color: 'text-indigo-400',
    },
    {
      key: 'stockEnabled' as const,
      label: 'Stock Intelligence',
      desc: 'Anti-spam grouped updates on sharp price moves in tracked securities.',
      icon: BarChart2,
      color: 'text-sky-400',
    },
    {
      key: 'cryptoEnabled' as const,
      label: 'Crypto Radar',
      desc: 'Calm, non-FOMO notices for high volatility on tracked tokens.',
      icon: Coins,
      color: 'text-amber-400',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-[#0C152B] border border-[#233562] w-full max-w-lg rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-[#101C38] border-b border-[#1E2F59] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#E0A96D]/15 border border-[#E0A96D]/40 flex items-center justify-center text-[#E0A96D]">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-slate-100 text-sm">Notification Settings</div>
              <div className="text-[10px] text-slate-400">
                Granular control over alert channels and privacy
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-[#1A2C55] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Permission Banner */}
        <div className="p-3 bg-[#081022] border-b border-[#1A294E] flex items-center justify-between text-xs">
          <div>
            <span className="text-slate-300">
              System Notification Status:{' '}
              <strong className={permissionGranted ? 'text-emerald-400' : 'text-amber-400'}>
                {permissionGranted ? 'Enabled' : 'Disabled / Prompt Needed'}
              </strong>
            </span>
          </div>
          {!permissionGranted && (
            <button
              onClick={handleRequestPermission}
              className="text-[11px] bg-[#E0A96D] hover:bg-[#F4A261] text-[#0A1128] font-bold px-3 py-1 rounded-lg transition-colors"
            >
              Enable Notifications
            </button>
          )}
        </div>

        {savedNotice && (
          <div className="p-2 bg-[#122A4E] text-[#E0A96D] text-[11px] flex items-center gap-1.5 px-4">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Preferences saved and synced with Alert Engine.</span>
          </div>
        )}

        {/* Categories Switches */}
        <div className="p-4 overflow-y-auto space-y-3">
          <div className="text-xs font-bold text-[#E0A96D] uppercase tracking-wider">
            Alert Channels
          </div>

          <div className="space-y-2.5">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isEnabled = settings[cat.key];

              return (
                <div
                  key={cat.key}
                  className="bg-[#101C38] border border-[#1E2F59] rounded-2xl p-3 flex items-start justify-between gap-3"
                >
                  <div className="flex items-start gap-2.5">
                    <div
                      className={`w-7 h-7 rounded-lg bg-[#081022] border border-[#1A2A4E] flex items-center justify-center shrink-0 mt-0.5 ${cat.color}`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-100">{cat.label}</div>
                      <div className="text-[11px] text-slate-400 leading-snug">{cat.desc}</div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleToggle(cat.key)}
                    className={`w-10 h-5 rounded-full p-0.5 transition-colors shrink-0 ${
                      isEnabled ? 'bg-[#E0A96D]' : 'bg-[#1C2C55]'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-[#0A1128] transition-transform ${
                        isEnabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Privacy & Quiet Hours */}
          <div className="pt-3 border-t border-[#1C2C55] space-y-2.5">
            <div className="text-xs font-bold text-[#E0A96D] uppercase tracking-wider">
              Privacy & Timing Controls
            </div>

            {/* Lock Screen Privacy */}
            <div className="bg-[#101C38] border border-[#1E2F59] rounded-2xl p-3 flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-[#081022] border border-[#1A2A4E] flex items-center justify-center shrink-0 mt-0.5 text-emerald-400">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-100">Lock-Screen Privacy Masking</div>
                  <div className="text-[11px] text-slate-400 leading-snug">
                    Hides account numbers and transaction amounts from lock-screen previews.
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleToggle('lockScreenPrivacy')}
                className={`w-10 h-5 rounded-full p-0.5 transition-colors shrink-0 ${
                  settings.lockScreenPrivacy ? 'bg-[#E0A96D]' : 'bg-[#1C2C55]'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-[#0A1128] transition-transform ${
                    settings.lockScreenPrivacy ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Quiet Hours */}
            <div className="bg-[#101C38] border border-[#1E2F59] rounded-2xl p-3 flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-[#081022] border border-[#1A2A4E] flex items-center justify-center shrink-0 mt-0.5 text-indigo-400">
                  <Moon className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-100">Quiet Hours (10 PM – 7 AM)</div>
                  <div className="text-[11px] text-slate-400 leading-snug">
                    Delays non-critical market and portfolio updates until morning. Urgent security alerts still arrive immediately.
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleToggle('quietHoursEnabled')}
                className={`w-10 h-5 rounded-full p-0.5 transition-colors shrink-0 ${
                  settings.quietHoursEnabled ? 'bg-[#E0A96D]' : 'bg-[#1C2C55]'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-[#0A1128] transition-transform ${
                    settings.quietHoursEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Footer with Test Harness Link */}
        <div className="p-3 bg-[#0A1128] border-t border-[#1C2C55] flex items-center justify-between">
          {onOpenTestHarness && (
            <button
              onClick={() => {
                onClose();
                onOpenTestHarness();
              }}
              className="text-xs text-[#E0A96D] hover:underline font-semibold flex items-center gap-1.5"
            >
              <Bell className="w-3.5 h-3.5" /> Open Developer Test Notifications
            </button>
          )}
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#16254A] hover:bg-[#1E2F5A] text-slate-200 text-xs rounded-xl transition-colors ml-auto"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
