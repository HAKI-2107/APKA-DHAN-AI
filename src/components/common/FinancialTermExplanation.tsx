import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';

interface FinancialTermExplanationProps {
  term: string;
  simpleExplanation: string;
  details?: string;
  className?: string;
}

export const FINANCIAL_GLOSSARY: Record<string, { simple: string; details: string }> = {
  volatility: {
    simple: 'How sharply and quickly the price moves up and down.',
    details: 'Higher volatility means prices swing dramatically over short periods, increasing both potential upside and downside risk.',
  },
  'market cap': {
    simple: 'The approximate total market value of all the company\'s shares.',
    details: 'Calculated as Total Shares × Current Share Price. Large-cap companies are generally more stable than small-cap companies.',
  },
  'pe ratio': {
    simple: 'How much investors are currently paying for each ₹1 of the company\'s annual profit.',
    details: 'Price-to-Earnings Ratio. A high P/E may indicate high growth expectations or overvaluation, while a low P/E may indicate value or trouble.',
  },
  dividend: {
    simple: 'A portion of company profits distributed directly to shareholders as cash.',
    details: 'Regular dividends provide steady passive cash flow independent of daily stock price fluctuations.',
  },
  hhi: {
    simple: 'A measure of whether your wealth is spread out or concentrated in too few holdings.',
    details: 'Herfindahl-Hirschman Index. An HHI score below 1,800 is considered well-diversified. Above 2,500 means heavy concentration risk.',
  },
  'collect request': {
    simple: 'A request asking your bank to DEBIT money from your account.',
    details: 'Scammers frequently send collect requests pretending you are receiving a prize or refund. Remember: Entering your UPI PIN ALWAYS debits money.',
  },
  vpa: {
    simple: 'Virtual Payment Address (your unique UPI ID like name@bank).',
    details: 'A financial routing alias regulated by NPCI that connects directly to your verified bank account without revealing your account number.',
  },
  'unrealized pnl': {
    simple: 'Paper profit or loss on investments you currently hold and haven\'t sold yet.',
    details: 'Until an asset is actually sold, gains and losses fluctuate with daily market prices.',
  },
};

export const FinancialTermExplanation: React.FC<FinancialTermExplanationProps> = ({
  term,
  simpleExplanation,
  details,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`inline-flex flex-col text-left ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-1 text-[11px] text-slate-300 hover:text-[#E0A96D] transition-colors focus:outline-none"
      >
        <HelpCircle className="w-3 h-3 text-[#E0A96D]" />
        <span className="font-medium underline decoration-dotted decoration-slate-500 underline-offset-2">
          {term}
        </span>
        {isOpen ? <ChevronUp className="w-2.5 h-2.5 text-slate-400" /> : <ChevronDown className="w-2.5 h-2.5 text-slate-400" />}
      </button>

      {isOpen && (
        <div className="mt-1.5 p-2.5 bg-[#0C152B] border border-[#233562] rounded-xl text-[11px] text-slate-200 shadow-lg space-y-1 z-20">
          <div className="font-semibold text-[#E0A96D]">{simpleExplanation}</div>
          {details && <div className="text-[10px] text-slate-400 leading-relaxed">{details}</div>}
        </div>
      )}
    </div>
  );
};
