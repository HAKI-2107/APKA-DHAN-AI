import React, { useState, useEffect } from 'react';
import {
  X,
  Database,
  RefreshCw,
  Trash2,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Play,
  Layers,
  Server,
  Globe,
  Radio,
  FileCode,
} from 'lucide-react';
import { ProviderDiagnostic } from '../../engine/dataSource/DeveloperDataCenterService';

interface DataCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DataCenterModal: React.FC<DataCenterModalProps> = ({ isOpen, onClose }) => {
  const [diagnostics, setDiagnostics] = useState<ProviderDiagnostic[]>([]);
  const [activeDomain, setActiveDomain] = useState<string>('Market Data');
  const [loading, setLoading] = useState(false);
  const [inspectMode, setInspectMode] = useState<'normalized' | 'raw'>('normalized');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadDiagnostics();
    }
  }, [isOpen]);

  const loadDiagnostics = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/data-center/diagnostics');
      const data = await res.json();
      if (data.success && data.diagnostics) {
        setDiagnostics(data.diagnostics);
      }
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleClearCache = async () => {
    try {
      const res = await fetch('/api/data-center/clear-cache', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setStatusMessage('Cache cleared successfully.');
        setTimeout(() => setStatusMessage(null), 3000);
        loadDiagnostics();
      }
    } catch (e: any) {
      console.error(e);
    }
  };

  const handleSimulateEvent = async (eventType: string, payload: any) => {
    try {
      const res = await fetch('/api/data-center/simulate-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventType, payload }),
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage(`Event ${eventType} simulated through production pipeline.`);
        setTimeout(() => setStatusMessage(null), 3500);
        loadDiagnostics();
      }
    } catch (e: any) {
      console.error(e);
    }
  };

  if (!isOpen) return null;

  const currentDiag = diagnostics.find((d) => d.domain === activeDomain);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-[#0A1128] border border-[#233562] w-full max-w-4xl rounded-3xl shadow-2xl flex flex-col h-[700px] overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-[#0E1A38] border-b border-[#1E2E59] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#E0A96D]/15 border border-[#E0A96D]/40 flex items-center justify-center text-[#E0A96D]">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-slate-100 text-sm flex items-center gap-2">
                <span>Developer Data Center & Diagnostics</span>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-600/40">
                  Telemetry Active
                </span>
              </div>
              <div className="text-[10px] text-slate-400">
                Data freshness, latency, provenance, and real-time simulator
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleClearCache}
              className="px-2.5 py-1.5 rounded-lg bg-[#142345] hover:bg-[#1A2C55] text-slate-300 text-xs flex items-center gap-1.5 transition-colors"
              title="Clear cache across all providers"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Clear Cache</span>
            </button>
            <button
              onClick={loadDiagnostics}
              className="p-1.5 rounded-lg bg-[#142345] hover:bg-[#1A2C55] text-slate-300 transition-colors"
              title="Refresh Telemetry"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-[#1A2C55] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Status Toast */}
        {statusMessage && (
          <div className="bg-[#122A4E] text-[#E0A96D] text-xs px-4 py-1.5 border-b border-[#233B6B] flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* Main Body */}
        <div className="flex-1 flex flex-col sm:flex-row overflow-hidden">
          {/* Domain Sidebar */}
          <div className="w-full sm:w-60 bg-[#0C1633] border-b sm:border-b-0 sm:border-r border-[#1C2C55] p-2 space-y-1 overflow-y-auto">
            {diagnostics.map((diag) => {
              const isSelected = activeDomain === diag.domain;
              return (
                <button
                  key={diag.domain}
                  onClick={() => setActiveDomain(diag.domain)}
                  className={`w-full text-left p-2.5 rounded-xl transition-all flex items-center justify-between text-xs ${
                    isSelected
                      ? 'bg-[#E0A96D] text-[#0A1128] font-bold shadow-md'
                      : 'text-slate-300 hover:bg-[#132247]'
                  }`}
                >
                  <span className="truncate">{diag.domain}</span>
                  <span
                    className={`w-2 h-2 rounded-full ${
                      diag.connectionStatus === 'CONNECTED' ? 'bg-emerald-400' : 'bg-amber-400'
                    }`}
                  />
                </button>
              );
            })}

            {/* Quick Simulator Triggers */}
            <div className="pt-3 mt-3 border-t border-[#1C2C55] space-y-1.5">
              <span className="text-[10px] text-slate-400 uppercase font-mono px-2 block">
                Simulation Injector
              </span>
              <button
                onClick={() =>
                  handleSimulateEvent('NEW_STOCK_TICK', {
                    symbol: 'RELIANCE.NS',
                    price: 3050.00,
                  })
                }
                className="w-full text-left text-[11px] p-2 rounded-lg bg-[#070E22] hover:bg-[#122247] text-slate-300 border border-[#18274B] flex items-center gap-1.5"
              >
                <Play className="w-3 h-3 text-[#E0A96D]" /> Stock Tick (+₹3050)
              </button>
              <button
                onClick={() =>
                  handleSimulateEvent('NEW_CRYPTO_TICK', {
                    symbol: 'BTC',
                    priceInr: 5650000,
                  })
                }
                className="w-full text-left text-[11px] p-2 rounded-lg bg-[#070E22] hover:bg-[#122247] text-slate-300 border border-[#18274B] flex items-center gap-1.5"
              >
                <Play className="w-3 h-3 text-[#E0A96D]" /> BTC Tick (₹56.5L)
              </button>
              <button
                onClick={() =>
                  handleSimulateEvent('INVESTMENT_SCAM_SIGNAL', {
                    text: 'Guaranteed 30% weekly profit on VIP WhatsApp group.',
                  })
                }
                className="w-full text-left text-[11px] p-2 rounded-lg bg-[#070E22] hover:bg-[#122247] text-rose-300 border border-[#18274B] flex items-center gap-1.5"
              >
                <Play className="w-3 h-3 text-rose-400" /> Scam Signal Trigger
              </button>
            </div>
          </div>

          {/* Details & Telemetry Console */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            {currentDiag ? (
              <div className="space-y-4">
                {/* Status Bar */}
                <div className="bg-[#101C38] p-3.5 rounded-2xl border border-[#1E2F59] flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase">Provider</div>
                    <div className="font-bold text-slate-100">{currentDiag.providerName}</div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">{currentDiag.sourceUrl}</div>
                  </div>

                  <div className="flex items-center gap-4 text-right font-mono">
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase">Latency</div>
                      <div className="font-bold text-[#E0A96D]">{currentDiag.latencyMs} ms</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase">HTTP Status</div>
                      <div className="font-bold text-emerald-400">{currentDiag.httpStatus} OK</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase">Auth State</div>
                      <div className="font-bold text-slate-200">{currentDiag.authenticationStatus}</div>
                    </div>
                  </div>
                </div>

                {/* Inspect Toggle */}
                <div className="flex items-center justify-between border-b border-[#1E2F59] pb-2 text-xs">
                  <span className="font-bold text-slate-200 uppercase tracking-wide">
                    Live Response Inspection
                  </span>
                  <div className="flex bg-[#0A1226] p-0.5 rounded-lg border border-[#1C2C55]">
                    <button
                      onClick={() => setInspectMode('normalized')}
                      className={`px-2.5 py-1 rounded text-[11px] transition-colors ${
                        inspectMode === 'normalized'
                          ? 'bg-[#E0A96D] text-[#0A1128] font-bold'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Normalized
                    </button>
                    <button
                      onClick={() => setInspectMode('raw')}
                      className={`px-2.5 py-1 rounded text-[11px] transition-colors ${
                        inspectMode === 'raw'
                          ? 'bg-[#E0A96D] text-[#0A1128] font-bold'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Raw Response
                    </button>
                  </div>
                </div>

                {/* JSON Display */}
                <div className="bg-[#070D1F] p-3 rounded-2xl border border-[#162547] text-[11px] font-mono text-emerald-300 max-h-80 overflow-y-auto scrollbar-thin">
                  <pre>
                    {JSON.stringify(
                      inspectMode === 'normalized'
                        ? currentDiag.sampleNormalizedResponse
                        : currentDiag.sampleRawResponse,
                      null,
                      2
                    )}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-400 text-xs">
                Select a data domain from the sidebar to inspect telemetry.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
