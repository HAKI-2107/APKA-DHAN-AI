import { MessageParser } from './MessageParser';
import { RawMessageInput, ParseResult } from './types';
import { HdfcMessageParser } from './parsers/HdfcMessageParser';
import { SbiMessageParser } from './parsers/SbiMessageParser';
import { IciciMessageParser } from './parsers/IciciMessageParser';
import { AxisMessageParser } from './parsers/AxisMessageParser';
import { KotakMessageParser } from './parsers/KotakMessageParser';
import { GenericUpiMessageParser } from './parsers/GenericUpiMessageParser';

/**
 * APKA DHAN AI - PARSER REGISTRY
 * 
 * Central registry managing bank/provider-specific offline SMS parsers.
 * - Prioritizes bank-specific parsers first (HDFC, SBI, ICICI, Axis, Kotak).
 * - Falls back to Generic UPI / App Notification parser.
 * - Handles unsupported messages and parsing failures safely without exceptions.
 */
export class ParserRegistry {
  private parsers: MessageParser[] = [];

  constructor(defaultParsers: MessageParser[] = []) {
    if (defaultParsers.length > 0) {
      this.parsers.push(...defaultParsers);
    } else {
      // Register standard major Indian bank and UPI parsers by default
      this.registerParser(new HdfcMessageParser());
      this.registerParser(new SbiMessageParser());
      this.registerParser(new IciciMessageParser());
      this.registerParser(new AxisMessageParser());
      this.registerParser(new KotakMessageParser());
      this.registerParser(new GenericUpiMessageParser());
    }
  }

  /**
   * Registers a new bank or provider parser
   */
  registerParser(parser: MessageParser): void {
    const existingIdx = this.parsers.findIndex((p) => p.providerId === parser.providerId);
    if (existingIdx >= 0) {
      this.parsers[existingIdx] = parser;
    } else {
      this.parsers.push(parser);
    }
  }

  /**
   * Returns list of registered parsers
   */
  getRegisteredParsers(): Array<{ name: string; providerId: string }> {
    return this.parsers.map((p) => ({
      name: p.name,
      providerId: p.providerId,
    }));
  }

  /**
   * Parses an incoming raw SMS or notification offline
   */
  parseMessage(input: RawMessageInput): ParseResult {
    const body = (input.body || '').trim();

    if (!body) {
      return {
        success: false,
        errorReason: 'EMPTY_MESSAGE',
        details: 'Supplied message body was empty.',
      };
    }

    // Quick filter: Check for non-transactional messages (OTPs, promotional spam)
    const lower = body.toLowerCase();
    const isOtp =
      (lower.includes('otp') || lower.includes('one time password') || lower.includes('verification code') || lower.includes('secret otp')) &&
      !lower.includes('debited') &&
      !lower.includes('credited') &&
      !lower.includes('paid') &&
      !lower.includes('sent');

    if (isOtp) {
      return {
        success: false,
        errorReason: 'NON_TRANSACTIONAL_MESSAGE',
        details: 'Message contains an authentication OTP or verification code, not a financial transaction.',
      };
    }

    const isPromo =
      (lower.includes('pre-approved loan') ||
        lower.includes('apply for personal loan') ||
        lower.includes('congratulations! you are eligible') ||
        lower.includes('apply now') ||
        lower.includes('you won')) &&
      !lower.includes('debited') &&
      !lower.includes('credited');

    if (isPromo) {
      return {
        success: false,
        errorReason: 'NON_TRANSACTIONAL_MESSAGE',
        details: 'Message is a promotional marketing or loan solicitation offer, not a transaction.',
      };
    }

    // 1. Try to find a matching specific bank parser
    for (const parser of this.parsers) {
      if (parser.providerId !== 'generic_upi' && parser.canParse(input)) {
        const result = parser.parse(input);
        if (result.success || result.errorReason === 'NON_TRANSACTIONAL_MESSAGE') {
          return result;
        }
      }
    }

    // 2. Try Generic UPI / Notification Parser as fallback
    const genericParser = this.parsers.find((p) => p.providerId === 'generic_upi');
    if (genericParser && genericParser.canParse(input)) {
      const result = genericParser.parse(input);
      if (result.success || result.errorReason === 'NON_TRANSACTIONAL_MESSAGE') {
        return result;
      }
    }

    // 3. Safe Failure: Not a supported financial message
    return {
      success: false,
      errorReason: 'UNSUPPORTED_PROVIDER',
      details: 'No registered bank or UPI pattern matched this message structure.',
    };
  }
}

// Global Singleton Registry Instance
export const globalParserRegistry = new ParserRegistry();
