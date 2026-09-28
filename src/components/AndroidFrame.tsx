import React from 'react';
import {
  Shield,
  ShieldAlert,
  Wallet,
  TrendingUp,
  Bell,
  Wifi,
  Battery,
  Signal,
  Bot,
  Database,
  Globe,
} from 'lucide-react';
import { useLanguage, LanguageCode } from '../context/LanguageContext';

interface AndroidFrameProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  children: React.ReactNode;
  alertCount?: number;
  viewMode: 'mobile' | 'expanded';
  onOpenAssistant?: () => void;
  onOpenDataCenter?: () => void;
  isAdvancedMode?: boolean;
  onToggleAdvancedMode?: () => void;
}

export const AndroidFrame: React.FC<AndroidFrameProps> = ({
  currentTab,
  onTabChange,
  children,
  alertCount = 3,
  viewMode,
  onOpenAssistant,
  onOpenDataCenter,
  isAdvancedMode,
  onToggleAdvancedMode,
}) => {
  const { language, setLanguage, t } = useLanguage();
  const currentTime = '09:41';

  // 5 Canonical Primary Sections
  const navItems = [
    { id: 'home', label: t('home', 'Home'), icon: Shield },
    { id: 'protect', label: t('protect', 'Protect'), icon: ShieldAlert },
    { id: 'money', label: t('money', 'Money'), icon: Wallet },
    { id: 'invest', label: t('invest', 'Invest'), icon: TrendingUp },
    { id: 'alerts', label: t('alerts', 'Alerts'), icon: Bell, badge: alertCount },
  ];

  if (viewMode === 'expanded') {
    return (
      <div className="flex flex-col min-h-screen bg-[#070D1F] text-slate-100">
        {/* Top Desktop Navigation Bar */}
        <header className="sticky top-0 z-40 bg-[#0C1631]/95 backdrop-blur border-b border-[#1E2D56] px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#E0A96D]/15 border border-[#E0A96D]/40 flex items-center justify-center text-[#E0A96D]">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold tracking-wider text-slate-100 text-sm">APKA DHAN AI</span>
                <span className="text-[10px] font-mono uppercase bg-emerald-950/80 text-emerald-400 border border-emerald-600/40 px-1.5 py-0.5 rounded">
                  Shield Active
                </span>
              </div>
              <div className="text-[11px] text-slate-400">Financial Safety & Intelligence Companion</div>
            </div>
          </div>

          {/* 5 Primary Navigation Tabs */}
          <nav className="flex items-center gap-1.5 bg-[#081024] p-1 rounded-xl border border-[#1A284D]">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isSelected = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all ${
                    isSelected
                      ? 'bg-[#E0A96D] text-[#0A1128] font-bold shadow-md'
                      : 'text-slate-300 hover:text-slate-100 hover:bg-[#162347]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                  {item.badge && item.badge > 0 ? (
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${
                        isSelected ? 'bg-[#0A1128] text-[#E0A96D]' : 'bg-rose-500 text-white'
                      }`}
                    >
                      {item.badge}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </nav>

          {/* Utilities: Ask Apka Dhan, Data Center, Language, Mode */}
          <div className="flex items-center gap-2">
            {/* Language Selector */}
            <div className="flex bg-[#081022] p-0.5 rounded-lg border border-[#1A284D] text-[11px]">
              {(['en', 'te', 'hi'] as LanguageCode[]).map((l) => (
                <button
                  key={l}
                  onClick={() => setLanguage(l)}
                  className={`px-2 py-0.5 rounded uppercase font-semibold ${
                    language === l ? 'bg-[#E0A96D] text-[#0A1128]' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {l === 'en' ? 'EN' : l === 'te' ? 'తెలుగు' : 'हिन्दी'}
                </button>
              ))}
            </div>

            {/* Assistant Trigger */}
            {onOpenAssistant && (
              <button
                onClick={onOpenAssistant}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#142244] hover:bg-[#1A2C58] border border-[#233868] text-slate-200 text-xs transition-colors"
                title="Ask Apka Dhan Assistant"
              >
                <Bot className="w-3.5 h-3.5 text-[#E0A96D]" />
                <span className="hidden lg:inline">Ask Apka Dhan</span>
              </button>
            )}

            {/* Developer Data Center */}
            {onOpenDataCenter && (
              <button
                onClick={onOpenDataCenter}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#142244] hover:bg-[#1A2C58] border border-[#233868] text-slate-200 text-xs transition-colors"
                title="Open Developer Data Center"
              >
                <Database className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden lg:inline">Data Center</span>
              </button>
            )}
          </div>
        </header>

        {/* Expanded View Content */}
        <main className="flex-1 max-w-7xl w-full mx-auto p-6">{children}</main>
      </div>
    );
  }

  return (
    <div className="relative mx-auto w-full max-w-[420px] h-[860px] bg-[#0A1128] rounded-[44px] border-[8px] border-[#1C2C55] shadow-2xl overflow-hidden flex flex-col font-sans ring-1 ring-white/10">
      {/* Android Top Notch & Camera Pin Hole */}
      <div className="relative z-30 pt-3 px-6 pb-2 flex items-center justify-between text-slate-300 select-none bg-[#0A1128]">
        <span className="text-xs font-semibold tracking-tight">{currentTime}</span>
        <div className="w-3.5 h-3.5 bg-black rounded-full ring-2 ring-[#1F2F59]" />
        <div className="flex items-center gap-1.5 text-slate-400">
          <Signal className="w-3 h-3" />
          <Wifi className="w-3 h-3" />
          <Battery className="w-3.5 h-3.5 text-slate-300" />
        </div>
      </div>

      {/* App Bar Header */}
      <div className="px-4 py-2.5 bg-[#0E1A38] border-b border-[#1E2E59] flex items-center justify-between select-none">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-[#E0A96D]/15 border border-[#E0A96D]/40 flex items-center justify-center text-[#E0A96D]">
            <Shield className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-100 tracking-wider">APKA DHAN AI</div>
            <div className="text-[10px] text-slate-400 leading-none">Safety Companion</div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {onOpenAssistant && (
            <button
              onClick={onOpenAssistant}
              className="p-1 rounded-lg bg-[#142345] hover:bg-[#1A2C55] text-[#E0A96D] transition-colors"
              title="Ask Apka Dhan Assistant"
            >
              <Bot className="w-3.5 h-3.5" />
            </button>
          )}

          {onOpenDataCenter && (
            <button
              onClick={onOpenDataCenter}
              className="p-1 rounded-lg bg-[#142345] hover:bg-[#1A2C55] text-emerald-400 transition-colors"
              title="Developer Data Center"
            >
              <Database className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Android Scrollable Body */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 scrollbar-thin scrollbar-thumb-[#1F2F59]">
        {children}
      </div>

      {/* 5 Primary Material 3 Bottom Navigation Bar */}
      <nav className="bg-[#0C1733] border-t border-[#1C2C55] px-2 py-1.5 flex items-center justify-around z-30">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isSelected = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className="flex flex-col items-center justify-center py-1 px-1.5 rounded-lg transition-colors relative min-w-[56px]"
            >
              <div
                className={`p-1 rounded-full transition-all ${
                  isSelected ? 'bg-[#E0A96D]/20 text-[#E0A96D]' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <span
                className={`text-[10px] mt-0.5 transition-colors ${
                  isSelected ? 'text-[#E0A96D] font-bold' : 'text-slate-400'
                }`}
              >
                {item.label}
              </span>
              {item.badge && item.badge > 0 ? (
                <span className="absolute top-1 right-3 w-2 h-2 rounded-full bg-rose-500" />
              ) : null}
            </button>
          );
        })}
      </nav>

      {/* Android Gesture Handle */}
      <div className="bg-[#0C1733] pb-2 flex justify-center items-center">
        <div className="w-32 h-1 bg-slate-500/40 rounded-full" />
      </div>
    </div>
  );
};
