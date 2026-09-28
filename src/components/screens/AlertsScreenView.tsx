import React, { useState } from 'react';
import { SecurityAlert, AlertCategory } from '../../types';
import { RiskBadgeView } from '../RiskBadgeView';
import { EvidenceCardView } from '../EvidenceCardView';
import {
  Bell,
  ChevronDown,
  ChevronUp,
  Filter,
  ShieldAlert,
} from 'lucide-react';

interface AlertsScreenViewProps {
  alerts: SecurityAlert[];
}

export const AlertsScreenView: React.FC<AlertsScreenViewProps> = ({ alerts }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [expandedAlertId, setExpandedAlertId] = useState<string | null>(alerts[0]?.id || null);

  const categories = [
    'All',
    'Payment Risk',
    'Investment Scam',
    'Portfolio Alert',
    'Crypto Alert',
    'Security Alert',
  ];

  const filteredAlerts =
    selectedCategory === 'All'
      ? alerts
      : alerts.filter((a) => a.category === selectedCategory);

  return (
    <div className="space-y-4">
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
            {cat}
          </button>
        ))}
      </div>

      {/* Alerts Count Bar */}
      <div className="flex items-center justify-between text-xs text-slate-400 px-1">
        <span>Showing {filteredAlerts.length} verified security advisories</span>
        <span className="font-mono text-emerald-400">SEBI / RBI Synced</span>
      </div>

      {/* Alerts List */}
      <div className="space-y-3">
        {filteredAlerts.map((alert) => {
          const isExpanded = expandedAlertId === alert.id;

          return (
            <div
              key={alert.id}
              className="bg-[#101C38] border border-[#1E2F59] rounded-2xl overflow-hidden transition-all shadow-md"
            >
              {/* Card Header (clickable to expand) */}
              <div
                onClick={() => setExpandedAlertId(isExpanded ? null : alert.id)}
                className="p-4 cursor-pointer hover:bg-[#132244] transition-colors space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[#E0A96D] uppercase tracking-wider font-mono">
                    {alert.category}
                  </span>
                  <RiskBadgeView level={alert.severity} size="sm" />
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
                      riskLevel: alert.severity,
                      evidence: alert.evidence,
                      explanation: alert.summary,
                      source: alert.source,
                      confidence: 'High (Confirmed Regulatory Directive)',
                      recommendedSteps: alert.recommendedSteps,
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
