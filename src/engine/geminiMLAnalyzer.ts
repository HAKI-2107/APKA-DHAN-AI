import { GoogleGenAI } from '@google/genai';
import { MLAnalyzer, NormalizedPaymentEntities, RiskSignal } from './types';

/**
 * GeminiMLAnalyzer
 * Pluggable AI / ML model that deconstructs complex social engineering and novel scam messages
 * using Gemini 3.8 Flash with structured JSON output.
 */
export class GeminiMLAnalyzer implements MLAnalyzer {
  public name = 'Gemini-3.8-Flash-Reasoner';
  private ai: GoogleGenAI | null = null;

  constructor(apiKey?: string) {
    const key = apiKey || process.env.GEMINI_API_KEY;
    if (key) {
      this.ai = new GoogleGenAI({
        apiKey: key,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    }
  }

  async analyze(
    entities: NormalizedPaymentEntities,
    existingRuleSignals: RiskSignal[]
  ): Promise<RiskSignal[]> {
    if (!this.ai) {
      return [];
    }

    // Only invoke LLM when there is text context to semantically evaluate
    if (!entities.rawCombinedText || entities.rawCombinedText.length < 15) {
      return [];
    }

    try {
      const prompt = `You are Apka Dhan AI's Financial Fraud Evidence Analyst.
Analyze the following financial interaction text or payment context.

Input:
"""
${entities.rawCombinedText}
"""

Identified Context:
- Extracted VPA: ${entities.vpa || 'None'}
- Extracted Domain: ${entities.domain || 'None'}
- Extracted Amount: ${entities.amount !== undefined ? '₹' + entities.amount : 'None'}
- Is Collect Request: ${entities.isCollectRequest}

Determine if this interaction exhibits indicators of:
1. Ponzi / Task Scams (e.g. YouTube like, Telegram review jobs)
2. Authority Impersonation (e.g. CBI, Police, Customercare, Digital Arrest)
3. Social Engineering Coercion or Screen-sharing demands

Return a JSON array of signals. If no specific signals are found, return empty array [].
Schema for each signal:
{
  "code": "STRING_IDENTIFIER",
  "category": "suspicious_domain" | "typosquatting" | "unexpected_redirect" | "unusual_recipient" | "unusual_transaction_amount" | "unusual_transaction_time" | "repeated_rapid_transactions" | "suspicious_wording" | "impersonation_indicators" | "guaranteed_return_claims" | "urgency_manipulation_language" | "known_reported_indicator",
  "title": "Short title",
  "description": "Factual description of the risk signal",
  "source": "[MODEL_PREDICTION]",
  "weight": 0.8,
  "isCritical": true or false
}`;

      const response = await this.ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.1,
        },
      });

      const responseText = response.text?.trim();
      if (!responseText) return [];

      const parsed = JSON.parse(responseText);
      if (Array.isArray(parsed)) {
        return parsed.map((item) => ({
          code: item.code || 'AI_DETECTED_ANOMALY',
          category: item.category || 'suspicious_wording',
          title: item.title || 'AI Semantic Risk Indicator',
          description: item.description || 'Semantic pattern matches known social engineering tactics.',
          source: '[MODEL_PREDICTION]',
          weight: typeof item.weight === 'number' ? item.weight : 0.7,
          isCritical: Boolean(item.isCritical),
        }));
      }
    } catch (err: any) {
      console.warn('GeminiMLAnalyzer execution error:', err.message);
    }

    return [];
  }
}
