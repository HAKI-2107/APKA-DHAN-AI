import jsQR from 'jsqr';

export interface QRExtractedFields {
  rawPayload: string;
  payloadType: 'UPI_PAYMENT' | 'WEB_URL' | 'APP_SCHEME' | 'PLAIN_TEXT' | 'MALFORMED';
  upiUri?: string;
  upiId?: string;
  merchantName?: string;
  amount?: number;
  transactionNote?: string;
  url?: string;
  otherEncodedInfo: {
    mode?: string;
    merchantCategoryCode?: string;
    transactionRef?: string;
    referenceUrl?: string;
    currency?: string;
    signature?: string;
    orgId?: string;
    minAmount?: number;
    extraParameters: Record<string, string>;
  };
}

export interface QRScanResult {
  success: boolean;
  fields: QRExtractedFields;
  decodeSource: 'optical_camera_image' | 'optical_canvas_buffer' | 'raw_text_payload';
  scanWarnings: string[];
}

/**
 * QR Security Scanner - Core Extractor
 * Extracts all standard NPCI UPI parameters, Web URLs, and metadata.
 */
export class QRSecurityScanner {
  /**
   * Scans an optical image buffer (ImageData or RGBA byte array)
   */
  static decodeFromImageData(
    data: Uint8ClampedArray,
    width: number,
    height: number
  ): QRScanResult | null {
    try {
      const code = jsQR(data, width, height, {
        inversionAttempts: 'attemptBoth',
      });
      if (!code || !code.data) {
        return null;
      }
      return this.parseScannedPayload(code.data, 'optical_camera_image');
    } catch (err: any) {
      console.warn('QR decode error from image data:', err);
      return null;
    }
  }

  /**
   * Parses raw scanned QR string payload (from camera hardware, barcode scanners, or text input)
   */
  static parseScannedPayload(
    rawText: string,
    source: 'optical_camera_image' | 'optical_canvas_buffer' | 'raw_text_payload' = 'raw_text_payload'
  ): QRScanResult {
    const trimmed = (rawText || '').trim();
    const warnings: string[] = [];

    if (!trimmed) {
      return {
        success: false,
        fields: {
          rawPayload: '',
          payloadType: 'MALFORMED',
          otherEncodedInfo: { extraParameters: {} },
        },
        decodeSource: source,
        scanWarnings: ['QR code payload was completely empty.'],
      };
    }

    // 1. UPI Payment URI Check (upi://pay?...)
    if (trimmed.toLowerCase().startsWith('upi://pay') || trimmed.toLowerCase().includes('upi://pay?')) {
      const parsedUpi = this.extractUpiParameters(trimmed);
      return {
        success: true,
        fields: parsedUpi,
        decodeSource: source,
        scanWarnings: warnings,
      };
    }

    // 2. Web URL Check (http://, https://)
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      const parsedUrl = this.extractUrlParameters(trimmed);
      return {
        success: true,
        fields: parsedUrl,
        decodeSource: source,
        scanWarnings: warnings,
      };
    }

    // 3. Custom App Scheme (e.g. phonepe://, paytmmp://, gpay://)
    if (trimmed.includes('://')) {
      return {
        success: true,
        fields: {
          rawPayload: trimmed,
          payloadType: 'APP_SCHEME',
          url: trimmed,
          otherEncodedInfo: {
            extraParameters: this.parseGenericQueryString(trimmed),
          },
        },
        decodeSource: source,
        scanWarnings: ['Non-standard mobile deep link schema detected in QR payload.'],
      };
    }

    // 4. Fallback Plain Text or Embedded VPA
    const vpaRegex = /\b[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}\b/;
    const vpaMatch = trimmed.match(vpaRegex);

    return {
      success: true,
      fields: {
        rawPayload: trimmed,
        payloadType: 'PLAIN_TEXT',
        upiId: vpaMatch ? vpaMatch[0] : undefined,
        otherEncodedInfo: {
          extraParameters: {},
        },
      },
      decodeSource: source,
      scanWarnings: vpaMatch
        ? ['Found standalone UPI address in plain text payload.']
        : ['QR code contains plain text without standard payment protocol identifiers.'],
    };
  }

  /**
   * Extracts UPI standard specification parameters
   * Reference: NPCI UPI Specification (pa, pn, am, tn, mc, tr, refUrl, mode, cu, sign, orgid)
   */
  private static extractUpiParameters(rawUri: string): QRExtractedFields {
    const extraParams: Record<string, string> = {};
    let upiId: string | undefined;
    let merchantName: string | undefined;
    let amount: number | undefined;
    let transactionNote: string | undefined;
    let mode: string | undefined;
    let mc: string | undefined;
    let tr: string | undefined;
    let refUrl: string | undefined;
    let cu: string | undefined = 'INR';
    let sign: string | undefined;
    let orgId: string | undefined;
    let minAmount: number | undefined;

    try {
      // Find query string index
      const queryStart = rawUri.indexOf('?');
      if (queryStart !== -1) {
        const queryStr = rawUri.substring(queryStart + 1);
        const pairs = queryStr.split('&');

        for (const pair of pairs) {
          const eqIdx = pair.indexOf('=');
          if (eqIdx !== -1) {
            const key = decodeURIComponent(pair.substring(0, eqIdx)).trim();
            const val = decodeURIComponent(pair.substring(eqIdx + 1)).trim();

            switch (key.toLowerCase()) {
              case 'pa': // Payee VPA / UPI ID
                upiId = val;
                break;
              case 'pn': // Payee Name / Merchant Name
                merchantName = val;
                break;
              case 'am': // Amount
                {
                  const parsed = parseFloat(val);
                  if (!isNaN(parsed) && parsed >= 0) {
                    amount = parsed;
                  }
                }
                break;
              case 'tn': // Transaction Note
                transactionNote = val;
                break;
              case 'mode': // Mode: 02 = Collect / Mandate, 00 = Default, 01 = Static QR
                mode = val;
                break;
              case 'mc': // Merchant Category Code
                mc = val;
                break;
              case 'tr': // Transaction Reference ID
                tr = val;
                break;
              case 'refurl': // Reference URL
                refUrl = val;
                break;
              case 'cu': // Currency
                cu = val;
                break;
              case 'sign': // Digital Signature
                sign = val;
                break;
              case 'orgid': // Organization ID
                orgId = val;
                break;
              case 'mam': // Minimum Amount
                {
                  const parsedMam = parseFloat(val);
                  if (!isNaN(parsedMam)) minAmount = parsedMam;
                }
                break;
              default:
                extraParams[key] = val;
                break;
            }
          }
        }
      }
    } catch (e) {
      console.warn('Error parsing UPI URI query parameters:', e);
    }

    return {
      rawPayload: rawUri,
      payloadType: 'UPI_PAYMENT',
      upiUri: rawUri,
      upiId,
      merchantName,
      amount,
      transactionNote,
      url: refUrl,
      otherEncodedInfo: {
        mode,
        merchantCategoryCode: mc,
        transactionRef: tr,
        referenceUrl: refUrl,
        currency: cu,
        signature: sign,
        orgId,
        minAmount,
        extraParameters: extraParams,
      },
    };
  }

  /**
   * Extracts URL fields and embedded parameters from a Web QR code
   */
  private static extractUrlParameters(rawUrl: string): QRExtractedFields {
    const extraParams: Record<string, string> = {};
    let embeddedUpiId: string | undefined;
    let embeddedAmount: number | undefined;
    let embeddedMerchant: string | undefined;

    try {
      const parsed = new URL(rawUrl);
      parsed.searchParams.forEach((val, key) => {
        extraParams[key] = val;
        if (key.toLowerCase() === 'pa' || key.toLowerCase() === 'vpa') {
          embeddedUpiId = val;
        }
        if (key.toLowerCase() === 'am' || key.toLowerCase() === 'amount') {
          const parsedAm = parseFloat(val);
          if (!isNaN(parsedAm)) embeddedAmount = parsedAm;
        }
        if (key.toLowerCase() === 'pn' || key.toLowerCase() === 'merchant') {
          embeddedMerchant = val;
        }
      });
    } catch {
      // Malformed URL string
    }

    return {
      rawPayload: rawUrl,
      payloadType: 'WEB_URL',
      url: rawUrl,
      upiId: embeddedUpiId,
      amount: embeddedAmount,
      merchantName: embeddedMerchant,
      otherEncodedInfo: {
        extraParameters: extraParams,
      },
    };
  }

  private static parseGenericQueryString(uri: string): Record<string, string> {
    const params: Record<string, string> = {};
    const qIdx = uri.indexOf('?');
    if (qIdx === -1) return params;

    const query = uri.substring(qIdx + 1);
    for (const pair of query.split('&')) {
      const [k, v] = pair.split('=');
      if (k) {
        try {
          params[decodeURIComponent(k)] = decodeURIComponent(v || '');
        } catch {
          params[k] = v || '';
        }
      }
    }
    return params;
  }
}
