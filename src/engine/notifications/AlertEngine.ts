import {
  AlertEvent,
  NotificationContent,
  NotificationSettings,
  DEFAULT_NOTIFICATION_SETTINGS,
} from './types';
import { NotificationContentEngine } from './NotificationContentEngine';
import { NotificationDecisionEngine } from './NotificationDecisionEngine';

export type NotificationDeliveryListener = (content: NotificationContent, event: AlertEvent) => void;

/**
 * APKA DHAN AI - CENTRAL ALERT ENGINE
 * 
 * Orchestrates the full pipeline:
 * EVENT -> ALERT ENGINE -> ALERT EVENT -> NOTIFICATION DECISION -> NOTIFICATION CONTENT -> NOTIFICATION DELIVERY
 */
export class AlertEngine {
  private events: AlertEvent[] = [];
  private settings: NotificationSettings = { ...DEFAULT_NOTIFICATION_SETTINGS };
  private decisionEngine: NotificationDecisionEngine = new NotificationDecisionEngine();
  private deliveryListeners: Set<NotificationDeliveryListener> = new Set();
  private hasNotificationPermission: boolean = false;

  constructor() {
    this.seedDefaultAlerts();
    this.checkClientPermission();
  }

  private seedDefaultAlerts() {
    this.events = [
      {
        id: 'alt_001',
        type: 'PAYMENT',
        severity: 'HIGH',
        title: 'UPI Collect-Request Fraud Campaign',
        summary: 'Deceptive "Electricity Bill Disconnection" collect requests targeting users.',
        details: 'Attackers send collect requests with mode=02 claiming power disconnection unless ₹49,999 is authorized.',
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        source: 'Reserve Bank of India (RBI Banking Ombudsman Advisory)',
        deepLink: 'apkaDhan://alerts/alt_001',
        requiresAction: true,
        isRead: false,
        isTest: false,
        metadata: { payeeVpa: 'collect-request@axl', flaggedAmount: 49999 },
      },
      {
        id: 'alt_002',
        type: 'INVESTMENT',
        severity: 'CRITICAL',
        title: 'Digital Arrest & Forged SEBI Certificates',
        summary: 'Impersonators posing as CBI / SEBI officers demanding instant deposits.',
        details: 'Scammers utilize forged letterheads of SEBI Chairman demanding ₹2,00,000 security bail deposits.',
        createdAt: new Date(Date.now() - 7200000).toISOString(),
        source: 'CERT-In Vulnerability Advisory & MeitY Directive',
        deepLink: 'apkaDhan://alerts/alt_002',
        requiresAction: true,
        isRead: false,
        isTest: false,
      },
      {
        id: 'alt_003',
        type: 'PORTFOLIO',
        severity: 'MEDIUM',
        title: 'High Single-Asset Concentration Detected',
        summary: 'Reliance Industries comprises 38.4% of your total liquid holdings.',
        details: 'Portfolio diversification analysis indicates elevated concentration risk in a single security.',
        createdAt: new Date(Date.now() - 14400000).toISOString(),
        source: 'On-Device Unified Portfolio Engine',
        deepLink: 'apkaDhan://alerts/alt_003',
        requiresAction: false,
        isRead: true,
        isTest: false,
      },
    ];
  }

  private checkClientPermission() {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      this.hasNotificationPermission = Notification.permission === 'granted';
    }
  }

  public subscribeDelivery(listener: NotificationDeliveryListener): () => void {
    this.deliveryListeners.add(listener);
    return () => this.deliveryListeners.delete(listener);
  }

  public getSettings(): NotificationSettings {
    return { ...this.settings };
  }

  public updateSettings(newSettings: Partial<NotificationSettings>): NotificationSettings {
    this.settings = { ...this.settings, ...newSettings };
    return this.getSettings();
  }

  public getAllAlerts(): AlertEvent[] {
    return [...this.events];
  }

  public getAlertById(id: string): AlertEvent | undefined {
    return this.events.find((e) => e.id === id);
  }

  public getUnreadCount(): number {
    return this.events.filter((e) => !e.isRead).length;
  }

  public markAsRead(id: string): boolean {
    const alert = this.events.find((e) => e.id === id);
    if (alert) {
      alert.isRead = true;
      return true;
    }
    return false;
  }

  public markAllAsRead() {
    for (const a of this.events) {
      a.isRead = true;
    }
  }

  /**
   * Request system notification permission (Web Notification & Android equivalent)
   */
  public async requestNotificationPermission(): Promise<boolean> {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const result = await Notification.requestPermission();
        this.hasNotificationPermission = result === 'granted';
        return this.hasNotificationPermission;
      } catch (e) {
        console.warn('Error requesting notification permission:', e);
        return false;
      }
    }
    return false;
  }

  public isPermissionGranted(): boolean {
    return this.hasNotificationPermission;
  }

  /**
   * Core Alert Engine pipeline entrypoint
   */
  public processEvent(
    rawEvent: Omit<AlertEvent, 'createdAt' | 'isRead' | 'isTest'> & {
      createdAt?: string;
      isRead?: boolean;
      isTest?: boolean;
    }
  ): {
    event: AlertEvent;
    decision: string;
    delivered: boolean;
    content?: NotificationContent;
  } {
    const alertEvent: AlertEvent = {
      ...rawEvent,
      createdAt: rawEvent.createdAt || new Date().toISOString(),
      isRead: rawEvent.isRead ?? false,
      isTest: rawEvent.isTest ?? false,
    };

    // 1. Evaluate via Decision Engine
    const evalResult = this.decisionEngine.evaluate(alertEvent, this.settings);

    // 2. Persist in in-memory event log if not duplicate
    if (!this.events.some((e) => e.id === alertEvent.id)) {
      this.events.unshift(alertEvent);
    }

    if (evalResult.decision === 'SUPPRESS') {
      return {
        event: alertEvent,
        decision: evalResult.decision,
        delivered: false,
      };
    }

    if (evalResult.decision === 'GROUP' && evalResult.groupedEvents) {
      const channelId = NotificationContentEngine.getChannelForType(alertEvent.type);
      const groupedContent = NotificationContentEngine.formatGrouped(
        evalResult.groupedEvents,
        alertEvent.type,
        channelId
      );
      this.dispatchDelivery(groupedContent, alertEvent);
      return {
        event: alertEvent,
        decision: evalResult.decision,
        delivered: true,
        content: groupedContent,
      };
    }

    if (evalResult.decision === 'SEND_NOW') {
      const content = NotificationContentEngine.format(alertEvent, {
        userPreferences: this.settings,
      });
      this.dispatchDelivery(content, alertEvent);
      return {
        event: alertEvent,
        decision: evalResult.decision,
        delivered: true,
        content,
      };
    }

    return {
      event: alertEvent,
      decision: evalResult.decision,
      delivered: false,
    };
  }

  /**
   * Dispatches to registered delivery bridges (Web Notification API, Android Bridge, UI Toast)
   */
  private dispatchDelivery(content: NotificationContent, event: AlertEvent) {
    // 1. Notify TypeScript/React UI Listeners
    for (const listener of this.deliveryListeners) {
      try {
        listener(content, event);
      } catch (err) {
        console.error('Error in notification delivery listener:', err);
      }
    }

    // 2. Browser Web Notification API (Real system notification on desktop & mobile browser)
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(content.title, {
          body: content.body,
          icon: '/favicon.ico',
          tag: event.id, // Enforces system deduplication
          data: { deepLink: content.deepLink },
        });
      } catch (e) {
        // Fallback or permission blocked in cross-origin iframe
      }
    }
  }

  public resetDecisionEngine() {
    this.decisionEngine.reset();
  }
}

export const globalAlertEngine = new AlertEngine();
