import { DataFreshnessState, DataProvenance } from './types';

/**
 * APKA DHAN AI - DATA FRESHNESS SERVICE
 * 
 * Implements transparent age calculation and health status determination:
 * - LIVE: Streaming or updated within the last 15 seconds.
 * - FRESH: Recent response within normal expected poll window (< 2 minutes).
 * - DELAYED: Data older than expected (2 to 15 minutes).
 * - STALE: Data exceeding maximum tolerable live age (> 15 minutes).
 * - HISTORICAL: Static dataset by design (e.g. data.gov.in annual audits).
 * - UNAVAILABLE: Provider request failed or disconnected.
 */
export class DataFreshnessService {
  /**
   * Determine freshness state for a time-sensitive live feed (e.g., market quotes)
   */
  static evaluateLiveFeedFreshness(
    receivedTimestampEpochMs: number,
    providerTimestampEpochMs?: number
  ): {
    state: DataFreshnessState;
    ageSeconds: number;
    displayLabel: string;
  } {
    const now = Date.now();
    const referenceTime = providerTimestampEpochMs || receivedTimestampEpochMs;
    const ageMs = Math.max(0, now - referenceTime);
    const ageSeconds = Math.round(ageMs / 1000);

    if (ageSeconds <= 15) {
      return {
        state: 'LIVE',
        ageSeconds,
        displayLabel: '🟢 Live (Updated a few seconds ago)',
      };
    }
    if (ageSeconds <= 120) {
      return {
        state: 'FRESH',
        ageSeconds,
        displayLabel: `🟢 Fresh (Updated ${ageSeconds}s ago)`,
      };
    }
    if (ageSeconds <= 900) {
      const mins = Math.round(ageSeconds / 60);
      return {
        state: 'DELAYED',
        ageSeconds,
        displayLabel: `🟡 Delayed (Last updated ${mins} min ago)`,
      };
    }
    return {
      state: 'STALE',
      ageSeconds,
      displayLabel: '🔴 Stale (Data may be outdated)',
    };
  }

  /**
   * Determine freshness state for a government or open-data resource
   */
  static evaluateGovernmentFreshness(
    underlyingDataDate: string,
    isApiLive: boolean
  ): {
    state: DataFreshnessState;
    displayLabel: string;
  } {
    if (!isApiLive) {
      return {
        state: 'HISTORICAL',
        displayLabel: `Historical Record (Underlying Date: ${underlyingDataDate})`,
      };
    }
    return {
      state: 'CURRENT',
      displayLabel: `Current Registry (As of ${underlyingDataDate})`,
    };
  }

  /**
   * Format human readable relative time
   */
  static formatRelativeAge(epochMs: number): string {
    const diffSec = Math.round((Date.now() - epochMs) / 1000);
    if (diffSec < 5) return 'just now';
    if (diffSec < 60) return `${diffSec}s ago`;
    const diffMin = Math.round(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.round(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.round(diffHours / 24)}d ago`;
  }
}

/**
 * APKA DHAN AI - DATA PROVENANCE SERVICE
 * Creates canonical provenance metadata objects for every externally sourced fact.
 */
export class DataProvenanceService {
  static create(
    sourceOrg: string,
    datasetTitle: string,
    sourceUrl: string,
    options: {
      underlyingDataDate?: string;
      license?: string;
      isHistorical?: boolean;
    } = {}
  ): DataProvenance {
    return {
      sourceOrganization: sourceOrg,
      datasetTitle,
      sourceUrl,
      retrievedAt: new Date().toISOString(),
      underlyingDataDate: options.underlyingDataDate,
      license: options.license || 'Government Open Data License - India (GODL)',
      isHistorical: options.isHistorical ?? true,
    };
  }
}
