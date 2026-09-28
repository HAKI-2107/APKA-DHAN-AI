/**
 * APKA DHAN AI - PAYMENT LINK SECURITY ANALYZER
 *
 * FUNCTION 2:
 * Analyzes payment links in a secure, sandboxed pipeline.
 * Extracts:
 * - Domain
 * - Subdomain
 * - Path
 * - Query Parameters
 * - Redirects (where legally and technically appropriate)
 * - Suspicious Patterns
 *
 * CRITICAL SAFETY REQUIREMENT:
 * The system should NEVER automatically open suspicious links in an unsafe context.
 */

export interface LinkExtractedFields {
  rawUrl: string;
  normalizedUrl: string;
  protocol: string;
  hostname: string;
  domain: string;
  subdomain: string;
  path: string;
  queryParameters: Record<string, string>;
  hashFragment: string;
  redirects: {
    isShortener: boolean;
    shortenerService?: string;
    openRedirectParameters: Array<{ parameterName: string; targetUrl: string }>;
    tracedHopCount?: number;
    tracedRedirectChain?: string[];
    finalDestinationUrl?: string;
    traceError?: string;
  };
  suspiciousPatterns: SuspiciousPatternFinding[];
}

export interface SuspiciousPatternFinding {
  code: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  description: string;
  detectedToken: string;
}

const HIGH_ABUSE_TLDS: ReadonlySet<string> = new Set([
  '.top',
  '.xyz',
  '.cfd',
  '.icu',
  '.click',
  '.buzz',
  '.vip',
  '.rest',
  '.fit',
  '.sbs',
  '.monster',
  '.gq',
  '.ml',
  '.cf',
  '.tk',
  '.ga',
]);

const KNOWN_URL_SHORTENERS: ReadonlySet<string> = new Set([
  'bit.ly',
  'tinyurl.com',
  'is.gd',
  't.me',
  'cutt.ly',
  'rb.gy',
  'ow.ly',
  'buff.ly',
  'goo.gl',
  'rebrand.ly',
  'qr.ae',
]);

const FINANCIAL_BRAND_PATTERNS = [
  'sbi',
  'onlinesbi',
  'hdfc',
  'icici',
  'axis',
  'kotak',
  'pnb',
  'bankofbaroda',
  'paytm',
  'phonepe',
  'googlepay',
  'gpay',
  'bhim',
  'zerodha',
  'groww',
  'angelone',
];

const REDIRECT_PARAM_KEYS = new Set([
  'redirect',
  'redirect_url',
  'redirect_to',
  'url',
  'target',
  'dest',
  'destination',
  'next',
  'goto',
  'r',
  'link',
  'return_to',
  'callback_url',
]);

const SENSITIVE_CREDENTIAL_PARAM_KEYS = new Set([
  'pin',
  'upipin',
  'mpin',
  'otp',
  'password',
  'passwd',
  'cvv',
  'cardnumber',
  'pan',
  'aadhaar',
  'account_number',
]);

export class LinkSecurityAnalyzer {
  /**
   * Safely parses and decomposes a URL without network execution
   */
  static analyzeLink(rawUrl: string): LinkExtractedFields {
    const trimmed = (rawUrl || '').trim();
    const withProto = trimmed.startsWith('http://') || trimmed.startsWith('https://')
      ? trimmed
      : `https://${trimmed}`;

    let parsed: URL;
    try {
      parsed = new URL(withProto);
    } catch {
      // Malformed fallback
      return {
        rawUrl: trimmed,
        normalizedUrl: trimmed,
        protocol: 'unknown',
        hostname: 'invalid-url',
        domain: 'invalid-url',
        subdomain: '',
        path: '',
        queryParameters: {},
        hashFragment: '',
        redirects: {
          isShortener: false,
          openRedirectParameters: [],
        },
        suspiciousPatterns: [
          {
            code: 'MALFORMED_URL_SYNTAX',
            severity: 'HIGH',
            title: 'Malformed URL Syntax',
            description: 'The supplied string could not be parsed into a RFC-compliant URL structure.',
            detectedToken: trimmed,
          },
        ],
      };
    }

    const hostname = parsed.hostname.toLowerCase();
    const { domain, subdomain } = this.decomposeHostname(hostname);
    const queryParams: Record<string, string> = {};
    parsed.searchParams.forEach((v, k) => {
      queryParams[k] = v;
    });

    const openRedirects = this.extractOpenRedirectParameters(queryParams);
    const isShortener = KNOWN_URL_SHORTENERS.has(hostname) || Array.from(KNOWN_URL_SHORTENERS).some((s) => hostname.endsWith(`.${s}`));
    const shortenerService = isShortener ? hostname : undefined;

    const suspiciousPatterns = this.detectSuspiciousPatterns(
      hostname,
      domain,
      subdomain,
      parsed.pathname,
      queryParams
    );

    return {
      rawUrl: trimmed,
      normalizedUrl: parsed.toString(),
      protocol: parsed.protocol,
      hostname,
      domain,
      subdomain,
      path: parsed.pathname,
      queryParameters: queryParams,
      hashFragment: parsed.hash,
      redirects: {
        isShortener,
        shortenerService,
        openRedirectParameters: openRedirects,
      },
      suspiciousPatterns,
    };
  }

  /**
   * Decomposes hostname into subdomain and registered base domain
   */
  private static decomposeHostname(hostname: string): { domain: string; subdomain: string } {
    // Check if raw IP
    if (/^(\d{1,3}\.){3}\d{1,3}$/.test(hostname) || hostname.includes(':')) {
      return { domain: hostname, subdomain: '' };
    }

    const parts = hostname.split('.');
    if (parts.length <= 2) {
      return { domain: hostname, subdomain: '' };
    }

    // Handles second-level ccTLDs like .co.in, .gov.in, .ac.in, .org.in, .net.in
    const secondLevelTlds = new Set(['co.in', 'gov.in', 'net.in', 'org.in', 'ac.in', 'res.in', 'nic.in', 'com.au', 'co.uk']);
    const lastTwo = `${parts[parts.length - 2]}.${parts[parts.length - 1]}`;

    if (secondLevelTlds.has(lastTwo) && parts.length >= 3) {
      const baseDomain = `${parts[parts.length - 3]}.${lastTwo}`;
      const sub = parts.slice(0, parts.length - 3).join('.');
      return { domain: baseDomain, subdomain: sub };
    }

    const baseDomain = `${parts[parts.length - 2]}.${parts[parts.length - 1]}`;
    const sub = parts.slice(0, parts.length - 2).join('.');
    return { domain: baseDomain, subdomain: sub };
  }

  /**
   * Checks query parameters for open redirect targets
   */
  private static extractOpenRedirectParameters(
    params: Record<string, string>
  ): Array<{ parameterName: string; targetUrl: string }> {
    const list: Array<{ parameterName: string; targetUrl: string }> = [];

    for (const [key, value] of Object.entries(params)) {
      if (REDIRECT_PARAM_KEYS.has(key.toLowerCase())) {
        if (value.startsWith('http://') || value.startsWith('https://') || value.startsWith('//')) {
          list.push({ parameterName: key, targetUrl: value });
        }
      }
    }

    return list;
  }

  /**
   * Detects deceptive, malicious, or non-compliant patterns in URL components
   */
  private static detectSuspiciousPatterns(
    hostname: string,
    domain: string,
    subdomain: string,
    path: string,
    queryParams: Record<string, string>
  ): SuspiciousPatternFinding[] {
    const findings: SuspiciousPatternFinding[] = [];

    // 1. Raw Numerical IP Hostname
    if (/^(\d{1,3}\.){3}\d{1,3}$/.test(hostname)) {
      findings.push({
        code: 'RAW_IP_ADDRESS_HOST',
        severity: 'CRITICAL',
        title: 'Raw Numerical IP Address Used as Hostname',
        description: `Legitimate financial services operate on verified registered domains, not direct IP addresses (${hostname}).`,
        detectedToken: hostname,
      });
    }

    // 2. High Abuse TLD Detection
    for (const tld of HIGH_ABUSE_TLDS) {
      if (domain.endsWith(tld)) {
        findings.push({
          code: 'HIGH_ABUSE_TLD',
          severity: 'HIGH',
          title: `Disposable High-Abuse TLD (${tld})`,
          description: `Domain is registered on '${tld}', a top-level domain frequently utilized in bulk automated phishing.`,
          detectedToken: tld,
        });
        break;
      }
    }

    // 3. Brand Typosquatting / Homoglyph in Domain or Subdomain
    for (const brand of FINANCIAL_BRAND_PATTERNS) {
      const inDomain = domain.includes(brand);
      const inSubdomain = subdomain.includes(brand);

      if (inDomain || inSubdomain) {
        // Exclude legitimate registered domains
        const isOfficial =
          domain === `${brand}.com` ||
          domain === `${brand}.co.in` ||
          domain === `${brand}.in` ||
          domain === `online${brand}.sbi` ||
          domain === `${brand}bank.com` ||
          domain === `idfcfirstbank.com`;

        if (!isOfficial) {
          findings.push({
            code: 'FINANCIAL_BRAND_SPOOF',
            severity: 'CRITICAL',
            title: `Unverified Financial Brand Reference (${brand.toUpperCase()})`,
            description: `Domain or subdomain embeds institution name '${brand}', but does not resolve to the institution's official registrar.`,
            detectedToken: inDomain ? domain : `${subdomain}.${domain}`,
          });
        }
      }
    }

    // 4. Executable / APK Download in Path
    const lowerPath = path.toLowerCase();
    const dangerousExtensions = ['.apk', '.exe', '.dex', '.vbs', '.bat', '.sh', '.msi'];
    for (const ext of dangerousExtensions) {
      if (lowerPath.endsWith(ext) || lowerPath.includes(`${ext}/`) || lowerPath.includes(`${ext}?`)) {
        findings.push({
          code: 'DANGEROUS_PAYLOAD_EXTENSION',
          severity: 'CRITICAL',
          title: `Direct Software Payload Path (${ext.toUpperCase()})`,
          description: `Link path directly targets an executable or Android Package (${ext}), a primary delivery mechanism for banking trojans.`,
          detectedToken: path,
        });
        break;
      }
    }

    // 5. Sensitive Parameter Harvesting
    for (const [key] of Object.entries(queryParams)) {
      if (SENSITIVE_CREDENTIAL_PARAM_KEYS.has(key.toLowerCase())) {
        findings.push({
          code: 'SENSITIVE_CREDENTIAL_HARVESTING_PARAM',
          severity: 'CRITICAL',
          title: `Sensitive Credential Parameter Detected ('${key}')`,
          description: `URL contains query parameters requesting confidential authentication secrets (PIN, OTP, CVV, Password).`,
          detectedToken: key,
        });
      }
    }

    // 6. Excessive Subdomain Masking
    if (subdomain.split('.').length >= 3) {
      findings.push({
        code: 'EXCESSIVE_SUBDOMAIN_DECEPTION',
        severity: 'MEDIUM',
        title: 'Deep Multi-Level Subdomain Structure',
        description: 'Multiple nested subdomain levels detected, commonly used on mobile displays to hide the true base domain.',
        detectedToken: subdomain,
      });
    }

    return findings;
  }

  /**
   * SSRF-safe Redirection Trace Check
   * Strictly prevents connecting to loopback or private RFC1918 subnets.
   */
  static isSafePublicDestination(hostname: string): boolean {
    const clean = hostname.toLowerCase().trim();

    // Block localhost, link-local, loopback
    if (
      clean === 'localhost' ||
      clean === '127.0.0.1' ||
      clean === '::1' ||
      clean === '0.0.0.0' ||
      clean.endsWith('.local') ||
      clean.endsWith('.internal') ||
      clean === '169.254.169.254' // Cloud metadata service
    ) {
      return false;
    }

    // Block private IPv4 ranges: 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16
    const ipMatch = clean.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
    if (ipMatch) {
      const octet1 = parseInt(ipMatch[1], 10);
      const octet2 = parseInt(ipMatch[2], 10);

      if (octet1 === 10) return false;
      if (octet1 === 172 && octet2 >= 16 && octet2 <= 31) return false;
      if (octet1 === 192 && octet2 === 168) return false;
      if (octet1 === 127) return false;
      if (octet1 === 169 && octet2 === 254) return false;
      if (octet1 === 0) return false;
    }

    return true;
  }
}
