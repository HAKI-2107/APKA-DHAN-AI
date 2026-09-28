/**
 * APKA DHAN AI - CENTRAL NOTIFICATION & ALERT TYPES
 * 
 * Formal models for Alert Events, Channels, Decisions, Content, and Settings.
 */

export type AlertType =
  | 'SECURITY'
  | 'PAYMENT'
  | 'INVESTMENT'
  | 'PORTFOLIO'
  | 'STOCK'
  | 'CRYPTO'
  | 'SYSTEM'
  | 'GENERAL';

export type AlertSeverity = 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type NotificationDecisionType = 'SEND_NOW' | 'DELAY' | 'GROUP' | 'SUPPRESS';

export type NotificationChannelId =
  | 'SECURITY_ALERTS'
  | 'PAYMENT_ALERTS'
  | 'INVESTMENT_ALERTS'
  | 'PORTFOLIO_ALERTS'
  | 'STOCK_ALERTS'
  | 'CRYPTO_ALERTS'
  | 'GENERAL_ALERTS';

export type CopyStyleVariant = 'DIRECT' | 'CONVERSATIONAL' | 'CURIOUS' | 'EDUCATIONAL' | 'PERSONALIZED';

export interface AlertEvent {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  summary: string;
  details?: string;
  createdAt: string; // ISO 8601
  source: string;
  deepLink: string;  // e.g. apkaDhan://alerts/{alertId}
  requiresAction: boolean;
  isRead: boolean;
  isTest: boolean;
  metadata?: Record<string, any>;
}

export interface NotificationCopyContext {
  userName?: string;
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
  dayOfWeek?: string;
  assetName?: string;
  assetType?: 'STOCK' | 'MUTUAL_FUND' | 'ETF' | 'CRYPTO';
  portfolioState?: string;
  watchlistState?: string;
  riskLevel?: string;
  marketMovement?: number; // e.g. +3.2 or -4.5%
  transactionContext?: {
    payee?: string;
    amount?: number;
    mode?: string;
  };
  recentAlertCount?: number;
  notificationHistory?: AlertEvent[];
  userPreferences?: NotificationSettings;
}

export interface NotificationContent {
  title: string;       // 20-45 chars target
  body: string;        // 40-110 chars target
  channelId: NotificationChannelId;
  severity: AlertSeverity;
  deepLink: string;
  actionLabel?: string;
  isPrivacyMasked: boolean;
  isTest: boolean;
  tags?: string[];
}

export interface NotificationSettings {
  securityEnabled: boolean;
  paymentEnabled: boolean;
  investmentEnabled: boolean;
  portfolioEnabled: boolean;
  stockEnabled: boolean;
  cryptoEnabled: boolean;
  generalEnabled: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string; // e.g. "22:00"
  quietHoursEnd: string;   // e.g. "07:00"
  lockScreenPrivacy: boolean;
}

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  securityEnabled: true,
  paymentEnabled: true,
  investmentEnabled: true,
  portfolioEnabled: true,
  stockEnabled: true,
  cryptoEnabled: true,
  generalEnabled: true,
  quietHoursEnabled: false,
  quietHoursStart: '22:00',
  quietHoursEnd: '07:00',
  lockScreenPrivacy: true,
};
