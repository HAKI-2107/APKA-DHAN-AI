import {
  RawMessageInput,
  ParseResult,
  NormalizedTransactionRecord,
} from './types';

/**
 * APKA DHAN AI - MESSAGE PARSER CONTRACT
 * 
 * Defines standard contract for all bank-specific offline SMS parsers.
 * Guarantees safe parsing, zero network transmission, and graceful error handling.
 */
export interface MessageParser {
  readonly name: string;
  readonly providerId: string;
  readonly supportedSenderPatterns: RegExp[];

  /**
   * Evaluates if this parser can handle the supplied raw message
   */
  canParse(input: RawMessageInput): boolean;

  /**
   * Safely parses the message offline into a normalized transaction record
   */
  parse(input: RawMessageInput): ParseResult;
}

/**
 * Base Message Parser with safety wrappers and non-transactional filters
 */
export abstract class BaseMessageParser implements MessageParser {
  abstract readonly name: string;
  abstract readonly providerId: string;
  abstract readonly supportedSenderPatterns: RegExp[];

  canParse(input: RawMessageInput): boolean {
    const sender = (input.senderId || '').toUpperCase();
    const body = input.body || '';

    // If sender ID matches registered patterns
    if (sender && this.supportedSenderPatterns.some((pattern) => pattern.test(sender))) {
      return true;
    }

    // Secondary fallback: check bank name keywords in message body
    return this.matchesBodyKeywords(body);
  }

  protected abstract matchesBodyKeywords(body: string): boolean;

  /**
   * Protected internal parse implementation for subclasses
   */
  protected abstract internalParse(input: RawMessageInput): ParseResult;

  /**
   * Safe outer parse wrapper: handles parsing failures safely without throwing
   */
  parse(input: RawMessageInput): ParseResult {
    const rawBody = (input.body || '').trim();

    if (!rawBody) {
      return {
        success: false,
        errorReason: 'EMPTY_MESSAGE',
        details: 'Message body was blank.',
        matchedParserName: this.name,
      };
    }

    // Quick filter: Non-transactional messages (OTPs, promotional spam, balance inquiries)
    if (this.isNonTransactionalMessage(rawBody)) {
      return {
        success: false,
        errorReason: 'NON_TRANSACTIONAL_MESSAGE',
        details: 'Message contains an authentication OTP, balance inquiry, or marketing notice, not a financial transaction.',
        matchedParserName: this.name,
      };
    }

    try {
      return this.internalParse(input);
    } catch (err: any) {
      // Safe parsing failure handler: does not crash, does not leak raw SMS
      return {
        success: false,
        errorReason: 'PARSE_FAILED',
        details: `Parser '${this.name}' encountered an error: ${err.message || 'Pattern mismatch'}.`,
        matchedParserName: this.name,
      };
    }
  }

  /**
   * Filters out pure OTPs, security PINs, and promotional messages
   */
  protected isNonTransactionalMessage(body: string): boolean {
    const lower = body.toLowerCase();

    // Check for OTP authentication codes
    const isOtp =
      (lower.includes('otp') || lower.includes('one time password') || lower.includes('verification code')) &&
      !lower.includes('debited') &&
      !lower.includes('credited') &&
      !lower.includes('sent rs') &&
      !lower.includes('paid rs');

    if (isOtp) return true;

    // Check for promotional spam without any financial debit/credit activity
    if (
      (lower.includes('pre-approved loan') || lower.includes('apply for personal loan') || lower.includes('congratulations! you won')) &&
      !lower.includes('debited') &&
      !lower.includes('credited')
    ) {
      return true;
    }

    return false;
  }
}
