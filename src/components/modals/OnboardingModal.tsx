import React, { useState } from 'react';
import {
  ShieldCheck,
  TrendingUp,
  BellRing,
  Award,
  ChevronRight,
  ArrowRight,
  Lock,
  EyeOff,
  CheckCircle2,
} from 'lucide-react';

interface OnboardingModalProps {
  isOpen: boolean;
  onComplete: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, onComplete }) => {
  const [step, setStep] = useState(0);

  if (!isOpen) return null;

  const slides = [
    {
      icon: ShieldCheck,
      iconColor: 'text-[#E0A96D]',
      title: 'Protect your money',
      subtitle: 'Check suspicious payments, links and investment offers before acting.',
      details: 'Inspect UPI handles, QR codes, and suspicious WhatsApp investment messages with on-device heuristics before sending money.',
    },
    {
      icon: TrendingUp,
      iconColor: 'text-emerald-400',
      title: 'Understand your finances',
      subtitle: 'Track investments and see what\'s changing.',
      details: 'Monitor stocks, mutual funds, ETFs, and crypto in unified INR denomination with step-by-step math and clear concentration alerts.',
    },
    {
      icon: BellRing,
      iconColor: 'text-amber-400',
      title: 'Get useful alerts',
      subtitle: 'Know when something unusual needs your attention.',
      details: 'Receive objective risk signals if an unexpected collect request or high single-asset portfolio concentration is detected.',
    },
    {
      icon: Award,
      iconColor: 'text-sky-400',
      title: 'You stay in control',
      subtitle: 'Apka Dhan explains risks. You make the final decision.',
      details: 'We never give automated buy/sell advice and we never execute transactions or transfer money. You are always the final decision maker.',
    },
  ];

  const currentSlide = slides[step];
  const Icon = currentSlide.icon;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-[#0C152B] border border-[#233562] w-full max-w-md rounded-3xl shadow-2xl p-6 flex flex-col justify-between min-h-[460px]">
        {/* Top Progress Indicator */}
        <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
          <span>STEP {step + 1} OF 4</span>
          <div className="flex gap-1.5">
            {slides.map((_, i) => (
              <div
                key={i}
                className={`w-6 h-1.5 rounded-full transition-all ${
                  i === step ? 'bg-[#E0A96D]' : 'bg-[#1C2C55]'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Slide Content */}
        <div className="my-auto py-6 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-[#121F42] border border-[#233562] flex items-center justify-center mx-auto shadow-inner">
            <Icon className={`w-8 h-8 ${currentSlide.iconColor}`} />
          </div>

          <div className="space-y-1.5">
            <h2 className="text-xl font-bold text-slate-100">{currentSlide.title}</h2>
            <p className="text-sm font-medium text-[#E0A96D]">{currentSlide.subtitle}</p>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed max-w-sm mx-auto">
            {currentSlide.details}
          </p>

          {step === 3 && (
            <div className="mt-4 p-3 bg-[#070D1E] rounded-xl border border-[#162547] text-[11px] text-slate-400 text-left space-y-1">
              <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                <Lock className="w-3.5 h-3.5" /> Privacy & Zero-Credential Promise:
              </div>
              <div>• Zero UPI PINs, passwords, or seed phrases ever requested.</div>
              <div>• Local offline processing with client-side credential redaction.</div>
            </div>
          )}
        </div>

        {/* Bottom Actions */}
        <div className="flex items-center justify-between gap-3 pt-4 border-t border-[#1C2C55]">
          {step < 3 ? (
            <>
              <button
                onClick={onComplete}
                className="text-xs text-slate-400 hover:text-slate-200 px-3 py-2"
              >
                Skip Tour
              </button>
              <button
                onClick={() => setStep(step + 1)}
                className="bg-[#E0A96D] hover:bg-[#F4A261] text-[#0A1128] font-bold text-xs px-5 py-2.5 rounded-xl flex items-center gap-1.5 transition-colors shadow-md"
              >
                <span>Continue</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </>
          ) : (
            <button
              onClick={onComplete}
              className="w-full bg-[#E0A96D] hover:bg-[#F4A261] text-[#0A1128] font-bold text-xs py-3 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-md"
            >
              <span>Get Started with Apka Dhan</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
