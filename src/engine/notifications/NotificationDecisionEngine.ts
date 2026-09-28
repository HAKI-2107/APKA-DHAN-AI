import {
  AlertEvent,
  NotificationDecisionType,
  NotificationSettings,
  DEFAULT_NOTIFICATION_SETTINGS,
} from './types';

/**
 * APKA DHAN AI - NOTIFICATION DECISION ENGINE
 * 
 * Determines whether an incoming alert event should be:
 * - SEND_NOW: High/Critical severity, immediate actionable security warning.
 * - DELAY: Non-urgent events held for quiet hours or aggregation window.
 * - GROUP: Multiple similar events (e.g. 3 stock movements in 10 minutes) bundled.
 * - SUPPRESS: User disabled category, duplicate alertId, minor noise, or excessive frequency.
 */
export class NotificationDecisionEngine {
  private sentAlertIds: Set<string> = new Set();
  private recentEventsByType: Map<string, { count: number; lastTimestamp: number }> = new Map();
  private groupingBuffer: Map<string, AlertEvent[]> = new Map();

  /**
   * Evaluates the alert event against policy, user preferences, and rate limits
   */
  public evaluate(
    event: AlertEvent,
    settings: NotificationSettings = DEFAULT_NOTIFICATION_SETTINGS,
    currentTimeEpochMs: number = Date.now()
  ): {
    decision: NotificationDecisionType;
    reason: string;
    groupedEvents?: AlertEvent[];
  } {
    // 1. Primary Deduplication: By alertId
    if (this.sentAlertIds.has(event.id)) {
      return {
        decision: 'SUPPRESS',
        reason: `Deduplicated: Alert ID "${event.id}" has already been processed and delivered.`,
      };
    }

    // 2. User Category Preferences
    if (!this.isCategoryEnabled(event.type, settings)) {
      return {
        decision: 'SUPPRESS',
        reason: `User preference: Notifications for category "${event.type}" are disabled.`,
      };
    }

    // 3. Test Alerts: If category is enabled, allow immediate test dispatch
    if (event.isTest) {
      this.sentAlertIds.add(event.id);
      return {
        decision: 'SEND_NOW',
        reason: 'Developer Test Alert: Delivered immediately with test markings.',
      };
    }

    // 4. CRITICAL & HIGH Severity Security/Payment/Scam events:
    // ALWAYS SEND IMMEDIATELY (Bypasses quiet hours because user funds or credentials are at risk)
    if (event.severity === 'CRITICAL' || event.severity === 'HIGH') {
      this.sentAlertIds.add(event.id);
      this.recordEvent(event.type, currentTimeEpochMs);
      return {
        decision: 'SEND_NOW',
        reason: `Immediate delivery: High/Critical priority financial security alert (${event.severity}).`,
      };
    }

    // 5. Quiet Hours Check for Non-Critical Alerts (MEDIUM / LOW / INFO)
    if (settings.quietHoursEnabled && this.isQuietHour(settings, currentTimeEpochMs)) {
      return {
        decision: 'DELAY',
        reason: 'Quiet hours active: Non-critical alert held until morning.',
      };
    }

    // 6. Rate Limiting & Grouping for Stock, Crypto, and Portfolio Ticks
    if (event.type === 'STOCK' || event.type === 'CRYPTO') {
      const typeKey = event.type;
      const history = this.recentEventsByType.get(typeKey);

      // If more than 2 stock/crypto events occurred within 5 minutes, group them!
      const FIVE_MINUTES_MS = 5 * 60 * 1000;
      if (history && currentTimeEpochMs - history.lastTimestamp < FIVE_MINUTES_MS && history.count >= 2) {
        let buffer = this.groupingBuffer.get(typeKey) || [];
        buffer.push(event);
        this.groupingBuffer.set(typeKey, buffer);
        this.sentAlertIds.add(event.id);

        if (buffer.length >= 3) {
          // Flush the group
          const eventsToGroup = [...buffer];
          this.groupingBuffer.set(typeKey, []);
          this.recordEvent(event.type, currentTimeEpochMs);
          return {
            decision: 'GROUP',
            reason: `Aggregated ${eventsToGroup.length} ${event.type} alerts into single digestible notification.`,
            groupedEvents: eventsToGroup,
          };
        }

        return {
          decision: 'DELAY',
          reason: `Holding ${event.type} notification to group with subsequent market movements.`,
        };
      }
    }

    // 7. Low-Value Noise Suppression
    if (event.severity === 'INFO' && event.type === 'STOCK' && !event.requiresAction) {
      // Suppress minor stock noise (<0.5% ticks)
      const move = Math.abs(event.metadata?.changePercent || 0);
      if (move > 0 && move < 0.5) {
        return {
          decision: 'SUPPRESS',
          reason: `Suppressed: Sub-threshold market noise (${move}% change).`,
        };
      }
    }

    // 8. Standard Notification: Send Now
    this.sentAlertIds.add(event.id);
    this.recordEvent(event.type, currentTimeEpochMs);
    return {
      decision: 'SEND_NOW',
      reason: 'Standard delivery: Passed frequency, category, and severity criteria.',
    };
  }

  private isCategoryEnabled(type: AlertEvent['type'], settings: NotificationSettings): boolean {
    switch (type) {
      case 'SECURITY':
        return settings.securityEnabled;
      case 'PAYMENT':
        return settings.paymentEnabled;
      case 'INVESTMENT':
        return settings.investmentEnabled;
      case 'PORTFOLIO':
        return settings.portfolioEnabled;
      case 'STOCK':
        return settings.stockEnabled;
      case 'CRYPTO':
        return settings.cryptoEnabled;
      case 'SYSTEM':
      case 'GENERAL':
      default:
        return settings.generalEnabled;
    }
  }

  private isQuietHour(settings: NotificationSettings, currentTimeEpochMs: number): boolean {
    const date = new Date(currentTimeEpochMs);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const currentMins = hours * 60 + minutes;

    const [startH, startM] = settings.quietHoursStart.split(':').map(Number);
    const [endH, endM] = settings.quietHoursEnd.split(':').map(Number);
    const startMins = startH * 60 + startM;
    const endMins = endH * 60 + endM;

    if (startMins > endMins) {
      // Over midnight (e.g. 22:00 to 07:00)
      return currentMins >= startMins || currentMins < endMins;
    }
    return currentMins >= startMins && currentMins < endMins;
  }

  private recordEvent(type: string, timestamp: number) {
    const existing = this.recentEventsByType.get(type);
    if (!existing || timestamp - existing.lastTimestamp > 10 * 60 * 1000) {
      this.recentEventsByType.set(type, { count: 1, lastTimestamp: timestamp });
    } else {
      this.recentEventsByType.set(type, { count: existing.count + 1, lastTimestamp: timestamp });
    }
  }

  /**
   * Reset tracking state (useful for automated testing)
   */
  public reset() {
    this.sentAlertIds.clear();
    this.recentEventsByType.clear();
    this.groupingBuffer.clear();
  }
}
