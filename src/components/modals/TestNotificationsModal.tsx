import React, { useState } from 'react';
import {
  X,
  Bell,
  ShieldAlert,
  CreditCard,
  TrendingUp,
  PieChart,
  BarChart2,
  Coins,
  AlertOctagon,
  CheckCircle2,
  AlertTriangle,
  Send,
  Lock,
} from 'lucide-react';
import { globalAlertEngine } from '../../engine/notifications/AlertEngine';
import { AlertEvent } from '../../engine/notifications/types';

interface TestNotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAlertTriggered?: (alert: AlertEvent) => void;
}

export const TestNotificationsModal: React.FC<TestNotificationsModalProps> = ({
  isOpen,
  onClose,
  onAlertTriggered,
}) => {
  const [lastDelivered, setLastDelivered] = useState<string | null>(null);
  const [permissionState, setPermissionState] = useState<NotificationPermission | 'unsupported'>(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'unsupported'
  );

  if (!isOpen) return null;

  const handleRequestPermission = async () => {
    const granted = await globalAlertEngine.requestNotificationPermission();
    setPermissionState(granted ? 'granted' : 'denied');
  };

  const dispatchTest = (
    type: AlertEvent['type'],
    severity: AlertEvent['severity'],
    title: string,
    summary: string,
    deepLink: string = 'apkaDhan://alerts'
  ) => {
    const testId = `test_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const event: AlertEvent = {
      id: testId,
      type,
      severity,
      title,
      summary,
      details: 'This is a synthetic developer test event to verify notification channels and privacy rendering.',
      createdAt: new Date().toISOString(),
      source: 'Apka Dhan Developer Notification Test Harness',
      deepLink: `${deepLink}/${testId}`,
      requiresAction: severity === 'HIGH' || severity === 'CRITICAL',
      isRead: false,
      isTest: true,
      metadata: { simulated: true },
    };

    const res = globalAlertEngine.processEvent(event);
    if (res.delivered && res.content) {
      setLastDelivered(`Dispatched [${type} - ${severity}]: "${res.content.title}"`);
    } else {
      setLastDelivered(`Result: ${res.decision} (Event stored in Alert Engine)`);
    }

    if (onAlertTriggered) {
      onAlertTriggered(event);
    }

    setTimeout(() => setLastDelivered(null), 4000);
  };

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
              <div className="font-bold text-slate-100 text-sm flex items-center gap-2">
                <span>Developer Test Notifications</span>
                <span className="text-[10px] font-mono text-[#E0A96D] bg-[#E0A96D]/15 px-1.5 py-0.2 rounded border border-[#E0A96D]/30">
                  TEST HARNESS
                </span>
              </div>
              <div className="text-[10px] text-slate-400">
                Dispatches real local notifications with `isTest: true`
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

        {/* Permission Status Notice */}
        <div className="p-3 bg-[#081022] border-b border-[#1A294E] flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                permissionState === 'granted' ? 'bg-emerald-400' : 'bg-amber-400'
              }`}
            />
            <span className="text-slate-300">
              System Permission: <strong className="font-mono">{permissionState}</strong>
            </span>
          </div>
          {permissionState !== 'granted' && (
            <button
              onClick={handleRequestPermission}
              className="text-[11px] bg-[#E0A96D] hover:bg-[#F4A261] text-[#0A1128] font-bold px-2.5 py-1 rounded-lg transition-colors"
            >
              Grant Permission
            </button>
          )}
        </div>

        {/* Status Toast */}
        {lastDelivered && (
          <div className="p-2.5 bg-[#122A4E] text-[#E0A96D] text-xs border-b border-[#233B6B] flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{lastDelivered}</span>
          </div>
        )}

        {/* Body Buttons List */}
        <div className="p-4 overflow-y-auto space-y-2.5">
          <p className="text-xs text-slate-300">
            Select an alert type to test channel assignment, personality copy rules, and deep links:
          </p>

          {/* 1. Test Security Alert */}
          <button
            onClick={() =>
              dispatchTest(
                'SECURITY',
                'HIGH',
                'That link deserves a second look',
                'Suspicious typosquatted banking link detected in clipboard or scan.'
              )
            }
            className="w-full bg-[#101C38] hover:bg-[#16274D] border border-[#1E2F59] rounded-xl p-3 text-left transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-sky-950/80 text-sky-400 flex items-center justify-center border border-sky-600/30">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-100 group-hover:text-[#E0A96D]">
                  Test Security Alert (HIGH)
                </div>
                <div className="text-[11px] text-slate-400">
                  Channel: SECURITY_ALERTS • Serious, cautionary tone
                </div>
              </div>
            </div>
            <Send className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#E0A96D]" />
          </button>

          {/* 2. Test Payment Alert */}
          <button
            onClick={() =>
              dispatchTest(
                'PAYMENT',
                'HIGH',
                'Before you confirm payment...',
                '₹49,999 collect-request detected from unverified VPA customer-care@axl.'
              )
            }
            className="w-full bg-[#101C38] hover:bg-[#16274D] border border-[#1E2F59] rounded-xl p-3 text-left transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-950/80 text-emerald-400 flex items-center justify-center border border-emerald-600/30">
                <CreditCard className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-100 group-hover:text-[#E0A96D]">
                  Test Payment Alert (HIGH)
                </div>
                <div className="text-[11px] text-slate-400">
                  Channel: PAYMENT_ALERTS • Collect-request trap check
                </div>
              </div>
            </div>
            <Send className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#E0A96D]" />
          </button>

          {/* 3. Test Investment Alert */}
          <button
            onClick={() =>
              dispatchTest(
                'INVESTMENT',
                'MEDIUM',
                'Quick check on investment offer',
                'We found a few warning signs in this 25% monthly return scheme.'
              )
            }
            className="w-full bg-[#101C38] hover:bg-[#16274D] border border-[#1E2F59] rounded-xl p-3 text-left transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-950/80 text-amber-400 flex items-center justify-center border border-amber-600/30">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-100 group-hover:text-[#E0A96D]">
                  Test Investment Alert (MEDIUM)
                </div>
                <div className="text-[11px] text-slate-400">
                  Channel: INVESTMENT_ALERTS • Curiosity & caution, no advice
                </div>
              </div>
            </div>
            <Send className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#E0A96D]" />
          </button>

          {/* 4. Test Portfolio Alert */}
          <button
            onClick={() =>
              dispatchTest(
                'PORTFOLIO',
                'MEDIUM',
                'Portfolio concentration notice',
                'Your portfolio has high concentration in a single stock (Reliance > 35%).'
              )
            }
            className="w-full bg-[#101C38] hover:bg-[#16274D] border border-[#1E2F59] rounded-xl p-3 text-left transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-950/80 text-indigo-400 flex items-center justify-center border border-indigo-600/30">
                <PieChart className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-100 group-hover:text-[#E0A96D]">
                  Test Portfolio Alert (MEDIUM)
                </div>
                <div className="text-[11px] text-slate-400">
                  Channel: PORTFOLIO_ALERTS • HHI concentration summary
                </div>
              </div>
            </div>
            <Send className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#E0A96D]" />
          </button>

          {/* 5. Test Stock Alert */}
          <button
            onClick={() =>
              dispatchTest(
                'STOCK',
                'LOW',
                '📈 Watchlist is active today',
                'Reliance and TCS moved noticeably today. Tap to check your holdings.'
              )
            }
            className="w-full bg-[#101C38] hover:bg-[#16274D] border border-[#1E2F59] rounded-xl p-3 text-left transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-950/80 text-emerald-400 flex items-center justify-center border border-emerald-600/30">
                <BarChart2 className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-100 group-hover:text-[#E0A96D]">
                  Test Stock Alert (LOW)
                </div>
                <div className="text-[11px] text-slate-400">
                  Channel: STOCK_ALERTS • Informative, anti-spam grouped
                </div>
              </div>
            </div>
            <Send className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#E0A96D]" />
          </button>

          {/* 6. Test Crypto Alert */}
          <button
            onClick={() =>
              dispatchTest(
                'CRYPTO',
                'LOW',
                '🪙 Crypto got a little noisy',
                'Bitcoin moved sharply over the past few hours. Tap to view your radar.'
              )
            }
            className="w-full bg-[#101C38] hover:bg-[#16274D] border border-[#1E2F59] rounded-xl p-3 text-left transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-orange-950/80 text-orange-400 flex items-center justify-center border border-orange-600/30">
                <Coins className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-100 group-hover:text-[#E0A96D]">
                  Test Crypto Alert (LOW)
                </div>
                <div className="text-[11px] text-slate-400">
                  Channel: CRYPTO_ALERTS • Calm, zero-FOMO tone
                </div>
              </div>
            </div>
            <Send className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#E0A96D]" />
          </button>

          {/* 7. Test High Risk / Critical Security Alert */}
          <button
            onClick={() =>
              dispatchTest(
                'SECURITY',
                'CRITICAL',
                '⚠️ Stop and verify before paying',
                'Digital Arrest extortion campaign impersonating CBI / SEBI detected.'
              )
            }
            className="w-full bg-rose-950/40 hover:bg-rose-950/60 border border-rose-600/50 rounded-xl p-3 text-left transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-rose-950 text-rose-400 flex items-center justify-center border border-rose-600">
                <AlertOctagon className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-rose-300 group-hover:text-rose-200">
                  Test High Risk / Critical Alert (CRITICAL)
                </div>
                <div className="text-[11px] text-slate-300">
                  Immediate delivery • Strict, direct, no-joke urgent tone
                </div>
              </div>
            </div>
            <Send className="w-3.5 h-3.5 text-rose-400 group-hover:text-rose-200" />
          </button>
        </div>

        {/* Footer */}
        <div className="p-3 bg-[#0A1128] border-t border-[#1C2C55] text-[10px] text-slate-400 flex items-center justify-between">
          <span className="flex items-center gap-1">
            <Lock className="w-3 h-3 text-[#E0A96D]" /> Privacy Sanitized
          </span>
          <span>Deduplication key: alertId</span>
        </div>
      </div>
    </div>
  );
};
