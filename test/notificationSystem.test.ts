import test, { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { AlertEngine } from '../src/engine/notifications/AlertEngine';
import { NotificationDecisionEngine } from '../src/engine/notifications/NotificationDecisionEngine';
import { NotificationContentEngine } from '../src/engine/notifications/NotificationContentEngine';
import {
  AlertEvent,
  NotificationSettings,
  DEFAULT_NOTIFICATION_SETTINGS,
} from '../src/engine/notifications/types';

describe('Apka Dhan AI - Notification & Alert System Test Suite', () => {
  let decisionEngine: NotificationDecisionEngine;
  let alertEngine: AlertEngine;

  beforeEach(() => {
    decisionEngine = new NotificationDecisionEngine();
    alertEngine = new AlertEngine();
  });

  describe('1. AlertEvent Model & Invariants', () => {
    it('creates an AlertEvent with all required fields', () => {
      const event: AlertEvent = {
        id: 'test_event_01',
        type: 'PAYMENT',
        severity: 'HIGH',
        title: 'UPI Collect-Request Deception',
        summary: 'Deceptive power bill collection request detected.',
        details: 'Mode 02 intent requesting ₹49,999.',
        createdAt: new Date().toISOString(),
        source: 'PaymentSecurityEngine',
        deepLink: 'apkaDhan://alerts/test_event_01',
        requiresAction: true,
        isRead: false,
        isTest: false,
        metadata: { payeeVpa: 'collect@axl', amount: 49999 },
      };

      assert.strictEqual(event.id, 'test_event_01');
      assert.strictEqual(event.type, 'PAYMENT');
      assert.strictEqual(event.severity, 'HIGH');
      assert.strictEqual(event.requiresAction, true);
      assert.strictEqual(event.isTest, false);
    });
  });

  describe('2. NotificationDecisionEngine', () => {
    it('always outputs SEND_NOW for CRITICAL and HIGH severity alerts', () => {
      const criticalEvent: AlertEvent = {
        id: 'crit_sec_01',
        type: 'SECURITY',
        severity: 'CRITICAL',
        title: 'Digital Arrest Cyber Extortion',
        summary: 'Impersonators posing as CBI / SEBI officials.',
        createdAt: new Date().toISOString(),
        source: 'CERT-In Advisory',
        deepLink: 'apkaDhan://alerts/crit_sec_01',
        requiresAction: true,
        isRead: false,
        isTest: false,
      };

      const result = decisionEngine.evaluate(criticalEvent);
      assert.strictEqual(result.decision, 'SEND_NOW');
      assert.ok(result.reason.includes('High/Critical'));
    });

    it('suppresses duplicate alerts with the same alertId', () => {
      const event: AlertEvent = {
        id: 'dup_test_01',
        type: 'PAYMENT',
        severity: 'HIGH',
        title: 'Unverified Payee Alert',
        summary: 'Unlisted PSP handle detected.',
        createdAt: new Date().toISOString(),
        source: 'PaymentSecurityEngine',
        deepLink: 'apkaDhan://alerts',
        requiresAction: true,
        isRead: false,
        isTest: false,
      };

      const firstEval = decisionEngine.evaluate(event);
      assert.strictEqual(firstEval.decision, 'SEND_NOW');

      const secondEval = decisionEngine.evaluate(event);
      assert.strictEqual(secondEval.decision, 'SUPPRESS');
      assert.ok(secondEval.reason.includes('Deduplicated'));
    });

    it('suppresses alerts when category is disabled by user', () => {
      const settings: NotificationSettings = {
        ...DEFAULT_NOTIFICATION_SETTINGS,
        cryptoEnabled: false,
      };

      const cryptoEvent: AlertEvent = {
        id: 'crypto_mute_01',
        type: 'CRYPTO',
        severity: 'MEDIUM',
        title: 'Solana High Volatility',
        summary: 'Solana price moved 8.2% in 2 hours.',
        createdAt: new Date().toISOString(),
        source: 'LiveCryptoDataProvider',
        deepLink: 'apkaDhan://alerts',
        requiresAction: false,
        isRead: false,
        isTest: false,
      };

      const result = decisionEngine.evaluate(cryptoEvent, settings);
      assert.strictEqual(result.decision, 'SUPPRESS');
      assert.ok(result.reason.includes('User preference'));
    });

    it('delays non-critical alerts during quiet hours', () => {
      const settings: NotificationSettings = {
        ...DEFAULT_NOTIFICATION_SETTINGS,
        quietHoursEnabled: true,
        quietHoursStart: '22:00',
        quietHoursEnd: '07:00',
      };

      // Construct a date at 23:30 (11:30 PM local)
      const testDate = new Date();
      testDate.setHours(23, 30, 0, 0);
      const midnightTime = testDate.getTime();

      const mediumEvent: AlertEvent = {
        id: 'portfolio_quiet_01',
        type: 'PORTFOLIO',
        severity: 'MEDIUM',
        title: 'Portfolio Rebalance Observation',
        summary: 'Asset weight shift detected.',
        createdAt: new Date(midnightTime).toISOString(),
        source: 'UnifiedPortfolioEngine',
        deepLink: 'apkaDhan://alerts',
        requiresAction: false,
        isRead: false,
        isTest: false,
      };

      const result = decisionEngine.evaluate(mediumEvent, settings, midnightTime);
      assert.strictEqual(result.decision, 'DELAY');
      assert.ok(result.reason.includes('Quiet hours'));
    });

    it('allows CRITICAL alerts to bypass quiet hours', () => {
      const settings: NotificationSettings = {
        ...DEFAULT_NOTIFICATION_SETTINGS,
        quietHoursEnabled: true,
        quietHoursStart: '22:00',
        quietHoursEnd: '07:00',
      };

      const testDate = new Date();
      testDate.setHours(23, 30, 0, 0);
      const midnightTime = testDate.getTime();

      const criticalEvent: AlertEvent = {
        id: 'crit_bypass_01',
        type: 'SECURITY',
        severity: 'CRITICAL',
        title: 'Credential Harvesting Link',
        summary: 'Malicious domain targeted at netbanking login.',
        createdAt: new Date(midnightTime).toISOString(),
        source: 'LinkSecurityAnalyzer',
        deepLink: 'apkaDhan://alerts',
        requiresAction: true,
        isRead: false,
        isTest: false,
      };

      const result = decisionEngine.evaluate(criticalEvent, settings, midnightTime);
      assert.strictEqual(result.decision, 'SEND_NOW');
    });

    it('suppresses minor sub-threshold stock noise (< 0.5%)', () => {
      const noiseEvent: AlertEvent = {
        id: 'stock_noise_01',
        type: 'STOCK',
        severity: 'INFO',
        title: 'TCS Sub-threshold tick',
        summary: 'TCS shifted 0.12%.',
        createdAt: new Date().toISOString(),
        source: 'LiveMarketDataProvider',
        deepLink: 'apkaDhan://alerts',
        requiresAction: false,
        isRead: false,
        isTest: false,
        metadata: { changePercent: 0.12 },
      };

      const result = decisionEngine.evaluate(noiseEvent);
      assert.strictEqual(result.decision, 'SUPPRESS');
      assert.ok(result.reason.includes('Sub-threshold'));
    });

    it('aggregates and groups multiple rapid stock movements', () => {
      const now = Date.now();
      const createStockEvent = (id: string, sym: string, pct: number) => ({
        id,
        type: 'STOCK' as const,
        severity: 'MEDIUM' as const,
        title: `${sym} Movement`,
        summary: `${sym} shifted ${pct}%.`,
        createdAt: new Date().toISOString(),
        source: 'LiveMarketDataProvider',
        deepLink: 'apkaDhan://alerts',
        requiresAction: false,
        isRead: false,
        isTest: false,
      });

      // Event 1
      const e1 = decisionEngine.evaluate(createStockEvent('stk_1', 'RELIANCE', 3.5), DEFAULT_NOTIFICATION_SETTINGS, now);
      assert.strictEqual(e1.decision, 'SEND_NOW');

      // Event 2 within 1 min
      const e2 = decisionEngine.evaluate(createStockEvent('stk_2', 'TCS', 4.1), DEFAULT_NOTIFICATION_SETTINGS, now + 30000);
      assert.strictEqual(e2.decision, 'SEND_NOW');

      // Subsequent events within 5 mins trigger GROUPING
      const e3 = decisionEngine.evaluate(createStockEvent('stk_3', 'INFY', 3.8), DEFAULT_NOTIFICATION_SETTINGS, now + 60000);
      assert.ok(['DELAY', 'GROUP'].includes(e3.decision));

      const e4 = decisionEngine.evaluate(createStockEvent('stk_4', 'HDFC', 3.2), DEFAULT_NOTIFICATION_SETTINGS, now + 90000);
      assert.ok(['DELAY', 'GROUP'].includes(e4.decision));

      const e5 = decisionEngine.evaluate(createStockEvent('stk_5', 'ICICI', 4.5), DEFAULT_NOTIFICATION_SETTINGS, now + 120000);
      assert.strictEqual(e5.decision, 'GROUP');
      assert.ok(e5.groupedEvents);
      assert.ok(e5.groupedEvents.length >= 3);
    });
  });

  describe('3. NotificationContentEngine & Personality', () => {
    it('enforces character limits on title (<= 45) and body (<= 110)', () => {
      const event: AlertEvent = {
        id: 'len_test_01',
        type: 'INVESTMENT',
        severity: 'HIGH',
        title: 'Unbelievably Long Extravagant Title That Should Definitely Be Truncated Cleanly By The Notification Content Engine',
        summary: 'This is an exceedingly long notification summary body that contains dozens and dozens of extraneous words designed to overflow any mobile phone lock screen notification drawer without appropriate ellipsis clamping mechanisms.',
        createdAt: new Date().toISOString(),
        source: 'InvestmentScamDetector',
        deepLink: 'apkaDhan://alerts',
        requiresAction: true,
        isRead: false,
        isTest: false,
      };

      const content = NotificationContentEngine.format(event);
      assert.ok(content.title.length <= 45, `Title length ${content.title.length} exceeds 45`);
      assert.ok(content.body.length <= 110, `Body length ${content.body.length} exceeds 110`);
    });

    it('masks sensitive account numbers and UPI PIN mentions for lock-screen privacy', () => {
      const event: AlertEvent = {
        id: 'privacy_01',
        type: 'PAYMENT',
        severity: 'HIGH',
        title: 'Suspicious Request',
        summary: 'Request asks for PIN 1234 on account 987654321098 immediately.',
        createdAt: new Date().toISOString(),
        source: 'PaymentSecurityEngine',
        deepLink: 'apkaDhan://alerts',
        requiresAction: true,
        isRead: false,
        isTest: false,
      };

      const content = NotificationContentEngine.format(event, {
        userPreferences: { ...DEFAULT_NOTIFICATION_SETTINGS, lockScreenPrivacy: true },
      });

      assert.strictEqual(content.body.includes('987654321098'), false);
      assert.ok(content.body.includes('•••masked•••'));
      assert.ok(content.body.includes('PIN: ••••'));
    });

    it('flags test notifications with [TEST] prefix and isTest=true', () => {
      const event: AlertEvent = {
        id: 'test_flag_01',
        type: 'STOCK',
        severity: 'MEDIUM',
        title: 'Reliance is moving today',
        summary: 'Reliance moved 4.2% today.',
        createdAt: new Date().toISOString(),
        source: 'TestHarness',
        deepLink: 'apkaDhan://alerts',
        requiresAction: false,
        isRead: false,
        isTest: true,
      };

      const content = NotificationContentEngine.format(event);
      assert.strictEqual(content.isTest, true);
      assert.ok(content.title.includes('[TEST]'));
    });

    it('maps alert types to the correct Android Notification Channel', () => {
      assert.strictEqual(NotificationContentEngine.getChannelForType('SECURITY'), 'SECURITY_ALERTS');
      assert.strictEqual(NotificationContentEngine.getChannelForType('PAYMENT'), 'PAYMENT_ALERTS');
      assert.strictEqual(NotificationContentEngine.getChannelForType('INVESTMENT'), 'INVESTMENT_ALERTS');
      assert.strictEqual(NotificationContentEngine.getChannelForType('PORTFOLIO'), 'PORTFOLIO_ALERTS');
      assert.strictEqual(NotificationContentEngine.getChannelForType('STOCK'), 'STOCK_ALERTS');
      assert.strictEqual(NotificationContentEngine.getChannelForType('CRYPTO'), 'CRYPTO_ALERTS');
      assert.strictEqual(NotificationContentEngine.getChannelForType('SYSTEM'), 'GENERAL_ALERTS');
    });

    it('creates appropriate grouped copy for stock updates', () => {
      const events: AlertEvent[] = [
        { id: '1', type: 'STOCK', severity: 'LOW', title: 'TCS', summary: 'TCS +1.5%', createdAt: '', source: '', deepLink: '', requiresAction: false, isRead: false, isTest: false },
        { id: '2', type: 'STOCK', severity: 'LOW', title: 'INFY', summary: 'INFY +2.0%', createdAt: '', source: '', deepLink: '', requiresAction: false, isRead: false, isTest: false },
        { id: '3', type: 'STOCK', severity: 'LOW', title: 'WIPRO', summary: 'WIPRO +1.8%', createdAt: '', source: '', deepLink: '', requiresAction: false, isRead: false, isTest: false },
      ];

      const grouped = NotificationContentEngine.formatGrouped(events, 'STOCK', 'STOCK_ALERTS');
      assert.ok(grouped.title.includes('watchlist'));
      assert.ok(grouped.body.includes('3 tracked stocks'));
    });
  });

  describe('4. Central AlertEngine Pipeline', () => {
    it('seeds with default regulatory advisories (RBI, SEBI, Portfolio)', () => {
      const allAlerts = alertEngine.getAllAlerts();
      assert.ok(allAlerts.length >= 3);
      assert.ok(allAlerts.some((a) => a.source.includes('RBI')));
    });

    it('marks alerts as read and counts unreads properly', () => {
      const initialUnread = alertEngine.getUnreadCount();
      assert.ok(initialUnread > 0);

      const unreadAlert = alertEngine.getAllAlerts().find((a) => !a.isRead)!;
      const success = alertEngine.markAsRead(unreadAlert.id);
      assert.strictEqual(success, true);
      assert.strictEqual(alertEngine.getUnreadCount(), initialUnread - 1);
    });

    it('processes an end-to-end event and notifies subscribers', () => {
      let receivedDelivery = false;
      const unsubscribe = alertEngine.subscribeDelivery((content, event) => {
        receivedDelivery = true;
        assert.strictEqual(event.id, 'e2e_sec_01');
        assert.strictEqual(content.severity, 'HIGH');
      });

      const res = alertEngine.processEvent({
        id: 'e2e_sec_01',
        type: 'SECURITY',
        severity: 'HIGH',
        title: 'Deceptive Phishing Domain',
        summary: 'Fake banking portal detected via homoglyph scan.',
        source: 'SafeAnalysisPipeline',
        deepLink: 'apkaDhan://alerts/e2e_sec_01',
        requiresAction: true,
      });

      assert.strictEqual(res.decision, 'SEND_NOW');
      assert.strictEqual(res.delivered, true);
      assert.strictEqual(receivedDelivery, true);
      unsubscribe();
    });
  });
});
