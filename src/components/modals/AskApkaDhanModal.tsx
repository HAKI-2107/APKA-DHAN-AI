import React, { useState } from 'react';
import { X, Send, Bot, User, Loader2, Sparkles, HelpCircle } from 'lucide-react';

interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

interface AskApkaDhanModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
}

export const AskApkaDhanModal: React.FC<AskApkaDhanModalProps> = ({
  isOpen,
  onClose,
  initialQuery = '',
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'model',
      text: 'Namaste! I am your Apka Dhan safety companion. I can help explain warning signs, financial terms like volatility or P/E ratio, and how to verify recipients safely. What would you like to know?',
    },
  ]);
  const [inputText, setInputText] = useState(initialQuery);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const quickQuestions = [
    'What does high concentration mean?',
    'Why is a collect request risky?',
    'What is volatility in simple words?',
    'How do I check if an advisory is SEBI registered?',
  ];

  const handleSend = async (textToSend: string) => {
    const q = textToSend.trim();
    if (!q || isLoading) return;

    const newMessages: ChatMessage[] = [...messages, { role: 'user', text: q }];
    setMessages(newMessages);
    setInputText('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/ai-assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: q,
          conversationHistory: newMessages,
        }),
      });
      const data = await res.json();
      if (data.success && data.reply) {
        setMessages([...newMessages, { role: 'model', text: data.reply }]);
      } else {
        setMessages([
          ...newMessages,
          {
            role: 'model',
            text: 'I could not process that inquiry right now. Please verify payments independently or ask another question.',
          },
        ]);
      }
    } catch (e: any) {
      setMessages([
        ...newMessages,
        {
          role: 'model',
          text: 'Network issue connecting to Apka Dhan assistant. Please check your connection.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-[#0C152B] border border-[#233562] w-full max-w-lg rounded-3xl shadow-2xl flex flex-col h-[600px] overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-[#101C38] border-b border-[#1E2F59] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#E0A96D]/15 border border-[#E0A96D]/40 flex items-center justify-center text-[#E0A96D]">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-slate-100 text-sm flex items-center gap-1.5">
                <span>Ask Apka Dhan</span>
                <span className="text-[9px] font-mono text-[#E0A96D] bg-[#E0A96D]/15 px-1.5 py-0.2 rounded border border-[#E0A96D]/30">
                  Safety Companion
                </span>
              </div>
              <div className="text-[10px] text-slate-400">
                Objective explanations • Never gives buy/sell advice
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

        {/* Message Thread */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-[#1F2F59]">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex gap-2.5 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {m.role === 'model' && (
                <div className="w-6 h-6 rounded-lg bg-[#E0A96D]/15 text-[#E0A96D] flex items-center justify-center shrink-0 mt-0.5 border border-[#E0A96D]/30">
                  <Bot className="w-3.5 h-3.5" />
                </div>
              )}
              <div
                className={`max-w-[82%] p-3 rounded-2xl text-xs leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-[#E0A96D] text-[#0A1128] font-medium rounded-tr-sm'
                    : 'bg-[#101C38] text-slate-200 border border-[#1E2F59] rounded-tl-sm'
                }`}
              >
                {m.text}
              </div>
              {m.role === 'user' && (
                <div className="w-6 h-6 rounded-lg bg-[#16254A] text-slate-300 flex items-center justify-center shrink-0 mt-0.5">
                  <User className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-2.5 items-center text-xs text-slate-400">
              <div className="w-6 h-6 rounded-lg bg-[#E0A96D]/15 text-[#E0A96D] flex items-center justify-center shrink-0 border border-[#E0A96D]/30">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              </div>
              <span>Formulating clear, evidence-based explanation...</span>
            </div>
          )}
        </div>

        {/* Quick Suggestion Chips */}
        <div className="px-4 py-2 bg-[#091024] border-t border-[#18274B] flex items-center gap-1.5 overflow-x-auto scrollbar-none text-[11px]">
          <span className="text-[10px] text-slate-500 uppercase font-mono shrink-0">Try:</span>
          {quickQuestions.map((q, i) => (
            <button
              key={i}
              onClick={() => handleSend(q)}
              className="shrink-0 bg-[#101C38] hover:bg-[#16274D] text-slate-300 hover:text-[#E0A96D] px-2.5 py-1 rounded-full border border-[#1E2F59] transition-colors"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend(inputText);
          }}
          className="p-3 bg-[#101C38] border-t border-[#1E2F59] flex items-center gap-2"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Ask about a payment warning, term, or investment..."
            className="flex-1 bg-[#0A1226] border border-[#203159] focus:border-[#E0A96D] text-xs text-slate-100 rounded-xl px-3 py-2.5 outline-none"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isLoading}
            className="p-2.5 bg-[#E0A96D] hover:bg-[#F4A261] disabled:opacity-40 text-[#0A1128] rounded-xl font-bold transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
