import React, { useState, useEffect } from 'react';
import { SecurityAlert, AlertCategory } from '../../types';
import { RiskBadgeView } from '../RiskBadgeView';
import { EvidenceCardView } from '../EvidenceCardView';
import { globalAlertEngine } from '../../engine/notifications/AlertEngine';
import { AlertEvent } from '../../engine/notifications/types';
import {
  Bell,
  ChevronDown,
  ChevronUp,
  Settings,
  ShieldAlert,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Radio,
} from 'lucide-react';

interface AlertsScreenViewProps {
  alerts?: SecurityAlert[];
  initialAlertId?: string | null;
  onOpenSettings?: () => void;
  onOpenTestHarness?: () => void;
}

export const AlertsScreenView: React.FC<AlertsScreenViewProps> = ({
  alerts: propAlerts,
  initialAlertId,
  onOpenSettings,
  onOpenTestHarness,
}) => {
  const [engineAlerts, setEngineAlerts] = useState<AlertEvent[]>(globalAlertEngine.getAllAlerts());
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [expandedAlertId, setExpandedAlertId] = useState<string | null>(initialAlertId || engineAlerts[0]?.id || null);
  const [invalidDeepLinkNotice, setInvalidDeepLinkNotice] = useState(false);

  // Sync with globalAlertEngine updates
  useEffect(() => {
    const unsubscribe = globalAlertEngine.subscribeDelivery(() => {
      setEngineAlerts(globalAlertEngine.getAllAlerts());
    });
    setEngineAlerts(globalAlertEngine.getAllAlerts());
    return () => unsubscribe();
  }, []);

  // Handle incoming deep link
  useEffect(() => {
    if (initialAlertId) {
      const exists = engineAlerts.some((a) => a.id === initialAlertId);
      if (exists) {
        setExpandedAlertId(initialAlertId);
        globalAlertEngine.markAsRead(initialAlertId);
        setInvalidDeepLinkNotice(false);
      } else {
        setInvalidDeepLinkNotice(true);
      }
    }
  }, [initialAlertId, engineAlerts]);

  const categories = [
    'All',
    'SECURITY',
    'PAYMENT',
    'INVESTMENT',
    'PORTFOLIO',
    'STOCK',
    'CRYPTO',
  ];

  const filteredAlerts =
    selectedCategory === 'All'
      ? engineAlerts
      : engineAlerts.filter((a) => a.type === selectedCategory);

  const handleToggleExpand = (alertId: string) => {
    if (expandedAlertId === alertId) {
      setExpandedAlertId(null);
    } else {
      setExpandedAlertId(alertId);
      globalAlertEngine.markAsRead(alertId);
      setEngineAlerts(globalAlertEngine.getAllAlerts());
    }
  };

  const mapSeverityToRiskLevel = (sev: AlertEvent['severity']) => {
    switch (sev) {
      case 'CRITICAL':
      case 'HIGH':
        return 'HIGH RISK';
      case 'MEDIUM':
        return 'MEDIUM RISK';
      case 'LOW':
      case 'INFO':
      default:
        return 'LOW RISK';
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Top Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-1.5">
            <Bell className="w-4 h-4 text-[#E0A96D]" /> Security & Financial Alerts
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Objective risk signals from regulatory bodies, market feeds, and on-device heuristics.
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          {onOpenTestHarness && (
            <button
              onClick={onOpenTestHarness}
              className="px-2.5 py-1.5 rounded-lg bg-[#142345] hover:bg-[#1A2C55] text-[#E0A96D] text-xs font-semibold flex items-center gap-1 transition-colors border border-[#233562]"
            >
              <Radio className="w-3.5 h-3.5 animate-pulse" />
              <span>Test Alerts</span>
            </button>
          )}

          {onOpenSettings && (
            <button
              onClick={onOpenSettings}
              className="px-2.5 py-1.5 rounded-lg bg-[#142345] hover:bg-[#1A2C55] text-slate-200 text-xs font-semibold flex items-center gap-1 transition-colors border border-[#233562]"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Settings</span>
            </button>
          )}
        </div>
      </div>

      {/* Invalid Deep Link Notice */}
      {invalidDeepLinkNotice && (
        <div className="p-3 bg-amber-950/40 border border-amber-600/40 rounded-xl text-xs text-amber-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>This alert is no longer available or was cleared.</span>
          </div>
          <button
            onClick={() => setInvalidDeepLinkNotice(false)}
            className="text-[10px] uppercase font-bold text-amber-400 underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Category Filter Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              selectedCategory === cat
                ? 'bg-[#E0A96D] text-[#0A1128] shadow-sm'
                : 'bg-[#101C38] border border-[#1E2F59] text-slate-300 hover:bg-[#162548]'
            }`}
          >
            {cat === 'All' ? 'All Alerts' : cat}
          </button>
        ))}
      </div>

      {/* Alerts Count Bar */}
      <div className="flex items-center justify-between text-xs text-slate-400 px-1">
        <span>Showing {filteredAlerts.length} verified security advisories</span>
        <span className="font-mono text-emerald-400">SEBI / RBI / CERT-In Synced</span>
      </div>

      {/* Empty State */}
      {filteredAlerts.length === 0 && (
        <div className="bg-[#101C38] border border-[#1E2F59] rounded-2xl p-8 text-center space-y-2">
          <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
          <div className="text-sm font-bold text-slate-100">You're all caught up.</div>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            No active alerts in this category. Apka Dhan will notify you if unusual activity is detected.
          </p>
        </div>
      )}

      {/* Alerts List */}
      <div className="space-y-3">
        {filteredAlerts.map((alert) => {
          const isExpanded = expandedAlertId === alert.id;

          return (
            <div
              key={alert.id}
              className={`bg-[#101C38] border rounded-2xl overflow-hidden transition-all shadow-md ${
                alert.isRead ? 'border-[#1E2F59]' : 'border-[#E0A96D]/60 ring-1 ring-[#E0A96D]/30'
              }`}
            >
              {/* Card Header */}
              <div
                onClick={() => handleToggleExpand(alert.id)}
                className="p-4 cursor-pointer hover:bg-[#132244] transition-colors space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-[#E0A96D] uppercase tracking-wider font-mono">
                      {alert.type}
                    </span>
                    {alert.isTest && (
                      <span className="text-[9px] bg-[#E0A96D]/15 text-[#E0A96D] px-1.5 py-0.2 rounded font-mono border border-[#E0A96D]/30">
                        TEST
                      </span>
                    )}
                    {!alert.isRead && (
                      <span className="w-2 h-2 rounded-full bg-rose-500" />
                    )}
                  </div>
                  <RiskBadgeView level={mapSeverityToRiskLevel(alert.severity)} size="sm" />
                </div>

                <div className="text-sm font-bold text-slate-100 leading-snug">
                  {alert.title}
                </div>

                <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">
                  {alert.summary}
                </p>

                <div className="flex items-center justify-between pt-1 text-[10px] text-slate-400 border-t border-[#1C2C55]">
                  <span>Source: {alert.source}</span>
                  <div className="flex items-center gap-1 text-[#E0A96D] font-medium">
                    {isExpanded ? (
                      <>
                        <span>Hide Evidence Dossier</span>
                        <ChevronUp className="w-3.5 h-3.5" />
                      </>
                    ) : (
                      <>
                        <span>View Evidence Dossier</span>
                        <ChevronDown className="w-3.5 h-3.5" />
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Expanded Detailed Dossier */}
              {isExpanded && (
                <div className="p-4 pt-0 border-t border-[#1E2F59] bg-[#0C152B] animate-in fade-in duration-200">
                  <EvidenceCardView
                    dossier={{
                      identifier: alert.title,
                      riskLevel: mapSeverityToRiskLevel(alert.severity),
                      evidence: alert.details ? [alert.details] : [alert.summary],
                      explanation: alert.summary,
                      source: alert.source,
                      confidence: 'High (Confirmed Regulatory Directive)',
                      recommendedSteps: [
                        'Verify recipient information independently using authorized channels.',
                        'Never enter your UPI PIN to receive money or refunds.',
                        'Avoid clicking on shortened or unknown web links.',
                      ],
                    }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
