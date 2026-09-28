import { SecurityAlert, StockItem, CryptoItem, TransactionAnomaly } from '../types';

export const INITIAL_ALERTS: SecurityAlert[] = [
  {
    id: 'ADV-2026-089',
    category: 'Investment Scam',
    title: 'Fake "SEBI Registered" Institutional Trading Groups on WhatsApp',
    source: 'SEBI Advisory & Cyber Crime Cell',
    severity: 'HIGH RISK',
    timestamp: '2 hours ago',
    summary: 'Fraudulent syndicates impersonating registered Asset Management Companies solicit funds for "Institutional IPO allotments" promising 25% weekly returns via malicious third-party APKs.',
    evidence: [
      'Unregistered offshore domain hosting APK download links',
      'Use of cloned SEBI registration certificates with forged signatures',
      'Funds routed to individual mule savings accounts rather than registered clearing houses'
    ],
    recommendedSteps: [
      'Verify SEBI registration independently on sebi.gov.in',
      'Never transfer investment capital into personal savings/current bank accounts',
      'Never install financial applications outside the official Google Play Store'
    ]
  },
  {
    id: 'ADV-2026-090',
    category: 'Payment Risk',
    title: 'UPI "Electricity Bill Pending / Power Disconnection" SMS Wave',
    source: 'NPCI & National Cyber Crime Reporting Portal',
    severity: 'HIGH RISK',
    timestamp: '5 hours ago',
    summary: 'Threat actors send SMS claiming electricity supply will be terminated tonight unless user calls a personal 10-digit number or authorizes a ₹10 bill verification collect request.',
    evidence: [
      'Sender header dispatched from unauthorized non-utility routing',
      'High-pressure tactic demanding screen-sharing software (AnyDesk/TeamViewer/RustDesk)',
      'UPI collect requests configured for ₹49,999 disguised as "Verification token"'
    ],
    recommendedSteps: [
      'Power distribution utilities never dispatch bill termination notices from personal 10-digit mobile numbers',
      'Pay bills exclusively through authorized BBPS (Bharat BillPay) channels',
      'Entering your UPI PIN always DEBITS money; you never need a PIN to receive a payment or refund'
    ]
  },
  {
    id: 'ADV-2026-091',
    category: 'Portfolio Alert',
    title: 'High Promoter Share Pledge in Secondary Holdings',
    source: 'BSE/NSE Disclosures Audit',
    severity: 'MEDIUM RISK',
    timestamp: '1 day ago',
    summary: 'Promoter pledge for Vedanta Ltd exceeds 62%. In volatile markets, margin calls on pledged promoter shares can trigger sharp forced-selling drops.',
    evidence: [
      'Promoter pledged shares stand at 62.4% of total promoter holding',
      'High debt-to-equity ratio of 2.15x'
    ],
    recommendedSteps: [
      'Review overall portfolio exposure to high-pledge companies',
      'Check company quarterly conference call transcripts for debt deleveraging roadmaps'
    ]
  },
  {
    id: 'ADV-2026-092',
    category: 'Crypto Alert',
    title: 'Decentralized Honeypot Token Spreading on Social Media',
    source: 'Threat Intelligence Matrix',
    severity: 'HIGH RISK',
    timestamp: '1 day ago',
    summary: 'A new decentralized token "AI-YIELD-PRO" contains smart contract logic that blocks sell transactions while artificially inflating display market value.',
    evidence: [
      'Sell tax coded at 99% in contract transferFrom function',
      'Contract creator retains unilateral minting and blacklist authority',
      'Liquidity pool unlockable by developer at any time'
    ],
    recommendedSteps: [
      'Inspect token contract audit status on public blockchain scanners',
      'Reject tokens guaranteeing automated daily trading arbitrage returns'
    ]
  },
  {
    id: 'ADV-2026-093',
    category: 'Security Alert',
    title: 'Banking Malware "Hydra-V3" Targeting Indian Financial Apps',
    source: 'CERT-In Advisory',
    severity: 'MEDIUM RISK',
    timestamp: '3 days ago',
    summary: 'Trojanized APKs disguised as PDF viewers or KYC checkers request Android Accessibility permissions to overlay deceptive credential login screens.',
    evidence: [
      'Requests BIND_ACCESSIBILITY_SERVICE permission without genuine accessibility necessity',
      'Monitors foreground package activity for 28 Indian banking applications'
    ],
    recommendedSteps: [
      'Audit your device Settings > Accessibility for any third-party app permissions',
      'Ensure Google Play Protect is enabled and active'
    ]
  }
];

export const INITIAL_STOCKS: StockItem[] = [
  {
    symbol: 'RELIANCE.NS',
    name: 'Reliance Industries Ltd',
    shares: 120,
    avgPrice: 2450.00,
    currentPrice: 2980.50,
    peRatio: 27.4,
    debtToEquity: 0.38,
    promoterPledgePercentage: 0.0,
    isAsmGsmSurveillance: false,
    riskAlert: 'Constitutes 28.5% of overall equity holding (high single-asset concentration).'
  },
  {
    symbol: 'TCS.NS',
    name: 'Tata Consultancy Services',
    shares: 60,
    avgPrice: 3500.00,
    currentPrice: 4210.00,
    peRatio: 31.2,
    debtToEquity: 0.04,
    promoterPledgePercentage: 0.45,
    isAsmGsmSurveillance: false
  },
  {
    symbol: 'HDFCBANK.NS',
    name: 'HDFC Bank Ltd',
    shares: 150,
    avgPrice: 1520.00,
    currentPrice: 1680.00,
    peRatio: 18.9,
    debtToEquity: 0.85,
    promoterPledgePercentage: 0.0,
    isAsmGsmSurveillance: false
  },
  {
    symbol: 'VEDL.NS',
    name: 'Vedanta Ltd',
    shares: 300,
    avgPrice: 380.00,
    currentPrice: 465.00,
    peRatio: 14.8,
    debtToEquity: 2.15,
    promoterPledgePercentage: 62.4,
    isAsmGsmSurveillance: false,
    riskAlert: 'Promoter pledge at 62.4% poses collateral risk during market corrections.'
  }
];

export const INITIAL_CRYPTO: CryptoItem[] = [
  {
    symbol: 'BTC',
    name: 'Bitcoin',
    balance: 0.018,
    currentPriceUsd: 64200,
    change24h: 1.8,
    volatility: 'Moderate',
    marketCapRank: 1,
    honeypotRisk: false,
    unverifiedCreator: false,
    riskSignals: []
  },
  {
    symbol: 'ETH',
    name: 'Ethereum',
    balance: 0.25,
    currentPriceUsd: 3450,
    change24h: -0.6,
    volatility: 'Moderate',
    marketCapRank: 2,
    honeypotRisk: false,
    unverifiedCreator: false,
    riskSignals: []
  },
  {
    symbol: 'SOL',
    name: 'Solana',
    balance: 3.5,
    currentPriceUsd: 148,
    change24h: 4.2,
    volatility: 'High',
    marketCapRank: 5,
    honeypotRisk: false,
    unverifiedCreator: false,
    riskSignals: ['High network volatility coefficient']
  },
  {
    symbol: 'MOONX',
    name: 'MoonYield Token (Tracked Contract)',
    balance: 50000,
    currentPriceUsd: 0.0042,
    change24h: 34.0,
    volatility: 'Extreme',
    marketCapRank: 2840,
    honeypotRisk: true,
    unverifiedCreator: true,
    riskSignals: [
      'Smart contract contains 95% sell tax',
      'Liquidity pool not locked in time-lock contract',
      'Extreme price slippage detected on decentralized DEX'
    ]
  }
];

export const SAMPLE_TRANSACTION_ANOMALIES: TransactionAnomaly[] = [
  {
    id: 'TXN-9081',
    timestamp: 'Today, 01:42 AM',
    payeeName: 'Unknown Merchant Services',
    payeeVpa: 'collect-bill-desk@axl',
    amount: 95000,
    type: 'COLLECT_REQUEST',
    riskLevel: 'HIGH RISK',
    flagReason: 'Incoming collect request received at off-hours (01:42 AM) for unusually high amount (₹95,000) from an unverified beneficiary.'
  },
  {
    id: 'TXN-9082',
    timestamp: 'Yesterday, 07:15 PM',
    payeeName: 'Nature Basket Supermarket',
    payeeVpa: 'naturebasket@okicici',
    amount: 1420,
    type: 'DEBIT',
    riskLevel: 'LOW RISK',
    flagReason: 'Verified merchant terminal with consistent payment history.'
  },
  {
    id: 'TXN-9083',
    timestamp: '2 days ago, 03:10 PM',
    payeeName: 'Rapid Cash Desk',
    payeeVpa: 'instant-loan-emi@paytm',
    amount: 12500,
    type: 'COLLECT_REQUEST',
    riskLevel: 'MEDIUM RISK',
    flagReason: 'Collect request referencing "Loan Foreclosure" not matching any recognized bank loan account in user records.'
  }
];
