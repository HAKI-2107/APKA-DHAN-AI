import React, { useState, useEffect } from 'react';
import { AndroidFrame } from './components/AndroidFrame';
import { HomeScreenView } from './components/screens/HomeScreenView';
import { ProtectScreenView } from './components/screens/ProtectScreenView';
import { InvestmentsScreenView } from './components/screens/InvestmentsScreenView';
import { CryptoScreenView } from './components/screens/CryptoScreenView';
import { AlertsScreenView } from './components/screens/AlertsScreenView';
import { ReportsScreenView } from './components/screens/ReportsScreenView';
import { SettingsScreenView } from './components/screens/SettingsScreenView';
import { CodeViewerModal } from './components/CodeViewerModal';
import { INITIAL_ALERTS, INITIAL_STOCKS, INITIAL_CRYPTO, SAMPLE_TRANSACTION_ANOMALIES } from './data/mockData';
import { SecurityAlert } from './types';
import {
  Smartphone,
  Maximize2,
  Code2,
  Shield,
  ShieldAlert,
  AlertTriangle,
  Lock,
} from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>('home');
  const [activeProtectTool, setActiveProtectTool] = useState<string>('upi_checker');
  const [viewMode, setViewMode] = useState<'mobile' | 'expanded'>('mobile');
  const [alerts, setAlerts] = useState<SecurityAlert[]>(INITIAL_ALERTS);
  const [isCodeViewerOpen, setIsCodeViewerOpen] = useState(false);

  // Fetch live threats if available from backend
  useEffect(() => {
    fetch('/api/threats')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.threats?.length > 0) {
          setAlerts(data.threats);
        }
      })
      .catch((e) => console.log('Using local threat intelligence cache:', e));
  }, []);

  const handleNavigateFromHome = (tab: string, tool?: string) => {
    setCurrentTab(tab);
    if (tool) {
      setActiveProtectTool(tool);
    }
  };

  return (
    <div className="min-h-screen bg-[#050B1A] text-slate-100 flex flex-col font-sans selection:bg-[#E0A96D]/30 selection:text-white">
      {/* Top Engineering & Environment Control Bar */}
      <header className="bg-[#0B1428] border-b border-[#1A2A4E] px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs z-30">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#E0A96D]/15 border border-[#E0A96D]/40 flex items-center justify-center text-[#E0A96D]">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-slate-100 tracking-wider">APKA DHAN AI</div>
              <div className="text-[10px] text-slate-400">Financial Security & Threat Intelligence Platform</div>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-2 pl-4 border-l border-[#1E2E54]">
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-600/30 px-2 py-0.5 rounded-full flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              SEBI / RBI Registry Connected
            </span>
            <span className="text-[10px] font-mono text-[#E0A96D] bg-[#E0A96D]/10 border border-[#E0A96D]/30 px-2 py-0.5 rounded-full flex items-center gap-1">
              <Lock className="w-3 h-3 text-[#E0A96D]" /> Zero-Credential Policy
            </span>
          </div>
        </div>

        {/* View Controls & Kotlin Code Button */}
        <div className="flex items-center gap-2">
          {/* Kotlin Code Inspector Button */}
          <button
            onClick={() => setIsCodeViewerOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#142244] hover:bg-[#1A2C58] border border-[#233868] text-slate-200 text-xs font-medium transition-all"
            title="Inspect Jetpack Compose Kotlin code"
          >
            <Code2 className="w-3.5 h-3.5 text-[#E0A96D]" />
            <span className="hidden sm:inline">Inspect Compose Code</span>
            <span className="sm:hidden">Compose Code</span>
          </button>

          {/* View Mode Toggle */}
          <div className="flex bg-[#081022] p-0.5 rounded-lg border border-[#1A284D]">
            <button
              onClick={() => setViewMode('mobile')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors ${
                viewMode === 'mobile'
                  ? 'bg-[#E0A96D] text-[#0A1128] font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Pixel 8 Pro</span>
            </button>
            <button
              onClick={() => setViewMode('expanded')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors ${
                viewMode === 'expanded'
                  ? 'bg-[#E0A96D] text-[#0A1128] font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Expanded</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center p-2 sm:p-6 overflow-y-auto">
        <AndroidFrame
          currentTab={currentTab}
          onTabChange={setCurrentTab}
          alertCount={alerts.filter((a) => a.severity === 'HIGH RISK').length}
          viewMode={viewMode}
        >
          {currentTab === 'home' && (
            <HomeScreenView
              onNavigate={handleNavigateFromHome}
              recentAlerts={alerts}
              stocks={INITIAL_STOCKS}
              crypto={INITIAL_CRYPTO}
            />
          )}

          {currentTab === 'protect' && (
            <ProtectScreenView
              initialTool={activeProtectTool}
              transactionAnomalies={SAMPLE_TRANSACTION_ANOMALIES}
            />
          )}

          {currentTab === 'investments' && (
            <InvestmentsScreenView stocks={INITIAL_STOCKS} />
          )}

          {currentTab === 'crypto' && (
            <CryptoScreenView cryptoList={INITIAL_CRYPTO} />
          )}

          {currentTab === 'alerts' && (
            <AlertsScreenView alerts={alerts} />
          )}

          {currentTab === 'reports' && (
            <ReportsScreenView />
          )}

          {currentTab === 'settings' && (
            <SettingsScreenView onOpenCodeViewer={() => setIsCodeViewerOpen(true)} />
          )}
        </AndroidFrame>
      </main>

      {/* Code Viewer Modal */}
      <CodeViewerModal
        isOpen={isCodeViewerOpen}
        onClose={() => setIsCodeViewerOpen(false)}
      />
    </div>
  );
}
