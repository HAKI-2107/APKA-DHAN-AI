import {
  AlertEvent,
  NotificationContent,
  NotificationCopyContext,
  NotificationChannelId,
  CopyStyleVariant,
} from './types';

/**
 * APKA DHAN AI - NOTIFICATION CONTENT ENGINE
 * 
 * Generates human, contextual, memorable, and intelligent notification copy.
 * 
 * CONSTITUTIONAL RULES:
 * 1. For HIGH and CRITICAL financial security alerts:
 *    NO jokes, NO sarcasm, NO clickbait, NO playful wording, NO unnecessary panic.
 * 2. Structure: HOOK + WHAT HAPPENED + OPTIONAL ACTION
 * 3. Length targets: Title 20-45 chars, Body 40-110 chars.
 * 4. Lock-screen privacy: Redacts sensitive account numbers or identifiers.
 * 5. Never recommend BUY, SELL, or guarantee returns.
 */
export class NotificationContentEngine {
  /**
   * Determine corresponding Android/System Notification Channel
   */
  static getChannelForType(eventType: AlertEvent['type']): NotificationChannelId {
    switch (eventType) {
      case 'SECURITY':
        return 'SECURITY_ALERTS';
      case 'PAYMENT':
        return 'PAYMENT_ALERTS';
      case 'INVESTMENT':
        return 'INVESTMENT_ALERTS';
      case 'PORTFOLIO':
        return 'PORTFOLIO_ALERTS';
      case 'STOCK':
        return 'STOCK_ALERTS';
      case 'CRYPTO':
        return 'CRYPTO_ALERTS';
      case 'SYSTEM':
      case 'GENERAL':
      default:
        return 'GENERAL_ALERTS';
    }
  }

  /**
   * Generate contextual notification content with appropriate personality and length
   */
  static format(
    event: AlertEvent,
    context: NotificationCopyContext = {},
    preferredStyle: CopyStyleVariant = 'DIRECT'
  ): NotificationContent {
    const channelId = this.getChannelForType(event.type);
    let title = event.title;
    let body = event.summary;
    let actionLabel = 'Tap to review';

    // 1. CRITICAL & HIGH: Direct, Urgent, Serious (NO JOKES, NO PLAYFULNESS)
    if (event.severity === 'CRITICAL') {
      actionLabel = 'Stop and verify';
      if (event.type === 'SECURITY' || event.type === 'PAYMENT') {
        title = event.isTest ? '[TEST] ⚠️ Stop and verify' : '⚠️ Stop and verify before paying';
        body = this.sanitizeBody(
          event.summary || 'Multiple strong fraud risk indicators were detected. Verify recipient before continuing.'
        );
      } else if (event.type === 'INVESTMENT') {
        title = event.isTest ? '[TEST] ⚠️ Critical investment warning' : '⚠️ Investment offer alert';
        body = this.sanitizeBody(
          'Unverified entity with high risk coercive or Ponzi claims detected. Avoid sending funds.'
        );
      } else {
        title = event.isTest ? `[TEST] ⚠️ Critical: ${event.title}` : `⚠️ ${event.title}`;
        body = this.sanitizeBody(event.summary);
      }
    } else if (event.severity === 'HIGH') {
      actionLabel = 'Verify before paying';
      if (event.type === 'SECURITY') {
        title = event.isTest ? '[TEST] ⚠️ Security risk detected' : '⚠️ That link deserves a second look';
        body = this.sanitizeBody(
          event.summary || 'We found several warning signs. Please inspect the details before proceeding.'
        );
      } else if (event.type === 'PAYMENT') {
        title = event.isTest ? '[TEST] ⚠️ Before you pay...' : '⚠️ Before you confirm payment...';
        body = this.sanitizeBody(
          event.summary || 'Unusual payment request or collect-request detected for this recipient.'
        );
      } else if (event.type === 'INVESTMENT') {
        title = event.isTest ? '[TEST] ⚠️ Investment check needed' : '⚠️ Investment claim needs review';
        body = this.sanitizeBody(
          'Guaranteed return scheme or unregistered advisory detected. Review regulatory warnings.'
        );
      } else {
        title = event.isTest ? `[TEST] ${event.title}` : event.title;
        body = this.sanitizeBody(event.summary);
      }
    } 
    // 2. MEDIUM: Conversational and Cautionary
    else if (event.severity === 'MEDIUM') {
      actionLabel = 'Check details';
      if (event.type === 'PAYMENT') {
        title = event.isTest ? '[TEST] Unusual payment notice' : 'Payment notice to consider';
        body = this.sanitizeBody(event.summary || 'This payment pattern looks different from your usual spending baseline.');
      } else if (event.type === 'INVESTMENT') {
        title = event.isTest ? '[TEST] Quick check on offer' : 'Quick check on investment offer';
        body = this.sanitizeBody('We found a few unverified claims in this offer. Let’s verify before sending funds.');
      } else if (event.type === 'STOCK') {
        const asset = context.assetName || 'Tracked stock';
        title = event.isTest ? `[TEST] 📈 ${asset} moved noticeably` : `📈 ${asset} is moving today`;
        body = this.sanitizeBody(event.summary || `${asset} price moved more than usual today. Tap to check your holdings.`);
      } else if (event.type === 'CRYPTO') {
        title = event.isTest ? '[TEST] 🪙 Crypto got a little noisy' : '🪙 Crypto moved sharply today';
        body = this.sanitizeBody(event.summary || 'Tracked crypto assets moved sharply over the past few hours.');
      } else if (event.type === 'PORTFOLIO') {
        title = event.isTest ? '[TEST] 📊 Portfolio concentration note' : '📊 Portfolio balance notice';
        body = this.sanitizeBody(event.summary || 'One holding now drives a higher portion of your total portfolio risk.');
      }
    } 
    // 3. LOW & INFO: Friendly, Useful, Calm
    else {
      actionLabel = 'See what changed';
      if (event.type === 'STOCK') {
        title = event.isTest ? '[TEST] 📈 Watchlist update' : '📈 Your watchlist is active today';
        body = this.sanitizeBody(event.summary || 'Several tracked assets had notable movements today.');
      } else if (event.type === 'PORTFOLIO') {
        title = event.isTest ? '[TEST] 📊 Daily portfolio snapshot' : '📊 Your portfolio changed today';
        body = this.sanitizeBody(event.summary || 'Your total portfolio net worth updated with today’s market closes.');
      } else if (event.type === 'SYSTEM') {
        if (event.title.includes('Live')) {
          title = '🟢 We’re live again';
          body = 'Your real-time market and crypto update feeds have reconnected smoothly.';
        } else {
          title = event.title;
          body = this.sanitizeBody(event.summary);
        }
      } else {
        title = event.isTest ? `[TEST] ${event.title}` : event.title;
        body = this.sanitizeBody(event.summary);
      }
    }

    // Enforce title length target: 20 - 45 chars
    title = this.clampLength(title, 45);

    // Enforce body length target: 40 - 110 chars
    body = this.clampLength(body, 110);

    return {
      title,
      body,
      channelId,
      severity: event.severity,
      deepLink: event.deepLink || `apkaDhan://alerts/${event.id}`,
      actionLabel,
      isPrivacyMasked: Boolean(context.userPreferences?.lockScreenPrivacy ?? true),
      isTest: event.isTest,
    };
  }

  /**
   * Format grouped / aggregated notifications (e.g. multiple stock ticks)
   */
  static formatGrouped(
    events: AlertEvent[],
    type: AlertEvent['type'],
    channelId: NotificationChannelId
  ): NotificationContent {
    const count = events.length;
    let title = '📊 New financial updates';
    let body = `${count} recent updates need your review.`;

    if (type === 'STOCK') {
      title = '📈 Your watchlist is lively today';
      body = `${count} tracked stocks moved more than usual. Tap to review your watchlist.`;
    } else if (type === 'CRYPTO') {
      title = '🪙 Crypto markets are active';
      body = `${count} tracked crypto assets shifted sharply. Tap to check your radar.`;
    } else if (type === 'PORTFOLIO') {
      title = '📊 Portfolio updates today';
      body = `Multiple holdings updated. One asset is driving most of today’s movement.`;
    } else if (type === 'SECURITY' || type === 'PAYMENT') {
      title = '⚠️ Security alerts to review';
      body = `${count} items require verification before paying or continuing.`;
    }

    return {
      title: this.clampLength(title, 45),
      body: this.clampLength(body, 110),
      channelId,
      severity: 'MEDIUM',
      deepLink: 'apkaDhan://alerts',
      actionLabel: 'Review updates',
      isPrivacyMasked: true,
      isTest: events.some((e) => e.isTest),
    };
  }

  /**
   * Sanitizes text to prevent exposing sensitive credentials, UPI PIN, or full account numbers
   */
  private static sanitizeBody(text: string): string {
    if (!text) return '';
    // Mask any 10-16 digit numbers that look like bank accounts or cards
    let sanitized = text.replace(/\b\d{6,16}\b/g, '•••masked•••');
    // Mask UPI PIN mentions
    sanitized = sanitized.replace(/pin[:\s=]+(\d+)/gi, 'PIN: ••••');
    return sanitized.trim();
  }

  private static clampLength(str: string, maxLen: number): string {
    if (str.length <= maxLen) return str;
    return str.substring(0, maxLen - 1).trim() + '…';
  }
}
