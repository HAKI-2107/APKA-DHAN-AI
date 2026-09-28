import React from 'react';
import { EvidenceDossier } from '../types';
import { RiskBadgeView } from './RiskBadgeView';
import { ShieldAlert, CheckCircle2, Info, ExternalLink } from 'lucide-react';

interface EvidenceCardViewProps {
  dossier: EvidenceDossier;
}

export const EvidenceCardView: React.FC<EvidenceCardViewProps> = ({ dossier }) => {
  return (
    <div className="bg-[#131F3D] border border-[#233560] rounded-xl p-4 sm:p-5 shadow-lg space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#233560]/70 pb-3">
        <div>
          <div className="text-[10px] font-bold tracking-widest text-[#E0A96D] uppercase">
            TARGET IDENTIFIER
          </div>
          <div className="text-base sm:text-lg font-semibold text-slate-100 break-all font-mono">
            {dossier.identifier}
          </div>
        </div>
        <div className="self-start sm:self-center">
          <RiskBadgeView level={dossier.riskLevel} size="md" />
        </div>
      </div>

      {/* Explanation */}
      <div className="space-y-1">
        <div className="text-xs font-semibold text-slate-300">Analysis Summary:</div>
        <p className="text-sm text-slate-200 leading-relaxed bg-[#0E172E] p-3 rounded-lg border border-[#1E2D52]">
          {dossier.explanation}
        </p>
      </div>

      {/* Metadata Row: Source & Confidence */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
        <div className="bg-[#0B1328] p-2.5 rounded-lg border border-[#1C2A50] flex items-center justify-between">
          <span className="text-slate-400">Provenance / Source:</span>
          <span className="font-mono text-[#E0A96D] font-semibold">{dossier.source}</span>
        </div>
        <div className="bg-[#0B1328] p-2.5 rounded-lg border border-[#1C2A50] flex items-center justify-between">
          <span className="text-slate-400">Model Confidence:</span>
          <span className="font-medium text-slate-200">{dossier.confidence}</span>
        </div>
      </div>

      {/* Evidence Signals */}
      <div className="space-y-2">
        <div className="text-xs font-bold tracking-wider text-[#E0A96D] flex items-center gap-1.5 uppercase">
          <ShieldAlert className="w-4 h-4 text-[#E0A96D]" />
          Observed Evidence Signals ({dossier.evidence.length})
        </div>
        <div className="space-y-2">
          {dossier.evidence.map((item, index) => (
            <div
              key={index}
              className="flex items-start gap-2.5 text-xs text-slate-200 bg-[#162347] p-2.5 rounded-lg border border-[#263765]"
            >
              <span className="text-[#F4A261] font-bold text-sm leading-none">•</span>
              <span className="leading-snug">{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recommended Verification Steps */}
      <div className="bg-[#0E1830] border border-[#243660] rounded-lg p-3.5 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold tracking-wider text-[#E0A96D] uppercase flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            Recommended Verification Steps
          </span>
          <span className="text-[10px] text-slate-400 font-medium">User Discretion Advised</span>
        </div>
        <p className="text-[11px] text-slate-400">
          The system provides factual risk indicators. You remain the final decision-maker:
        </p>
        <div className="space-y-2 pt-1">
          {dossier.recommendedSteps.map((step, idx) => (
            <div key={idx} className="flex items-start gap-2 text-xs text-slate-200">
              <span className="w-4 h-4 rounded bg-[#203056] text-[#E0A96D] flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                {idx + 1}
              </span>
              <span className="leading-relaxed">{step}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
