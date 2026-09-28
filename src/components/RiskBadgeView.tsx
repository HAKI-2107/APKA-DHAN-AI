import React from 'react';
import { RiskLevel } from '../types';

interface RiskBadgeProps {
  level: RiskLevel;
  size?: 'sm' | 'md' | 'lg';
}

export const RiskBadgeView: React.FC<RiskBadgeProps> = ({ level, size = 'md' }) => {
  const getBadgeStyle = () => {
    switch (level) {
      case 'LOW RISK':
        return {
          bg: 'bg-emerald-950/70',
          text: 'text-emerald-400',
          border: 'border-emerald-600/40',
          dot: 'bg-emerald-400',
        };
      case 'MEDIUM RISK':
        return {
          bg: 'bg-amber-950/70',
          text: 'text-amber-400',
          border: 'border-amber-600/40',
          dot: 'bg-amber-400',
        };
      case 'HIGH RISK':
        return {
          bg: 'bg-rose-950/80',
          text: 'text-rose-400',
          border: 'border-rose-600/50',
          dot: 'bg-rose-400 animate-pulse',
        };
      case 'UNKNOWN / UNVERIFIED':
      default:
        return {
          bg: 'bg-slate-900/80',
          text: 'text-slate-400',
          border: 'border-slate-700/60',
          dot: 'bg-slate-400',
        };
    }
  };

  const style = getBadgeStyle();
  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5 gap-1.5',
    md: 'text-xs px-2.5 py-1 gap-2',
    lg: 'text-sm px-3.5 py-1.5 gap-2.5',
  }[size];

  return (
    <span
      className={`inline-flex items-center font-bold tracking-wider rounded-md border font-mono ${style.bg} ${style.text} ${style.border} ${sizeClasses}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
      {level}
    </span>
  );
};
