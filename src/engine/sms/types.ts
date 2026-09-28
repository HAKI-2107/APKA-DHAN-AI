/**
 * APKA DHAN AI - TRANSACTION MESSAGE ANALYSIS MODULE TYPES
 * 
 * Defines data structures for parsing, normalizing, and storing
 * financial SMS and notification messages locally on-device.
 *
 * CRITICAL PRIVACY DIRECTIVES:
 * 1. Work offline without server transmission.
 * 2. Avoid storing unnecessary raw message content.
 * 3. Expose granular confidence per extracted field.
 * 4. Handle parsing failure safely.
 */

export type TransactionType = 'DEBIT' | 'CREDIT' | 'COLLECT_REQUEST' | 'REFUND' | 'UNKNOWN';

export type ConfidenceLevel = 'HIGH' | 'MEDIUM' | 'LOW';

export interface FieldConfidence<T> {
  value: T;
  confidence: ConfidenceLevel;
  patternMatched?: string;
  sourceToken?: string;
  extractionSource?: string;
}

export interface RawMessageInput {
  senderId?: string;      // e.g. "VK-HDFCBK", "AD-SBIINB", "AX-ICICIB"
  body: string;           // Message text (processed strictly in-memory)
  timestampEpochMs?: number; // Device receipt timestamp fallback
}

export interface NormalizedTransactionRecord {
  id: string; // Unique deterministic identifier (e.g. hash of UTR or timestamp+amount+account)
  bankOrProvider: string;
  transactionType: FieldConfidence<TransactionType>;
  amount: FieldConfidence<number>;
  currency: string; // e.g. "INR"
  merchant: FieldConfidence<string | null>;
  maskedAccount: FieldConfidence<string | null>; // Standardized to "XX1234"
  upiIdentifier: FieldConfidence<string | null>; // e.g. "merchant@okaxis"
  timestamp: FieldConfidence<number>; // Unix Epoch milliseconds
  isoDateString: string;
  referenceId: FieldConfidence<string | null>; // 12-digit UTR or bank reference ID
  balanceAfterTransaction?: number | null;
  overallConfidence: ConfidenceLevel;
  parsedAtEpochMs: number;
  // NOTE: raw SMS text is deliberately omitted to prevent storing unneeded PII
}

export interface ParseResult {
  success: boolean;
  record?: NormalizedTransactionRecord;
  errorReason?: 'UNSUPPORTED_PROVIDER' | 'NON_TRANSACTIONAL_MESSAGE' | 'PARSE_FAILED' | 'EMPTY_MESSAGE';
  details?: string;
  matchedParserName?: string;
}

export interface TransactionFilter {
  type?: TransactionType;
  bank?: string;
  merchantQuery?: string;
  startDateEpochMs?: number;
  endDateEpochMs?: number;
  minAmount?: number;
  maxAmount?: number;
}

export interface SpendingSummary {
  totalDebits: number;
  totalCredits: number;
  debitCount: number;
  creditCount: number;
  merchantTotals: Record<string, number>;
  periodDays: number;
}
