package com.apkadhan.ai.core.database.entity

import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.Index
import androidx.room.PrimaryKey

/**
 * 13. INVESTMENT OFFER ENTITY
 * Storage Domain: LOCAL-ONLY (User submitted pitches / WhatsApp / Telegram messages).
 * Retention: 90 days.
 * Encryption: SQLCipher AES-256-GCM.
 */
@Entity(
    tableName = "investment_offers",
    indices = [
        Index(value = ["offer_hash"], unique = true),
        Index(value = ["analyzed_at_epoch_ms"])
    ]
)
data class InvestmentOfferEntity(
    @PrimaryKey
    @ColumnInfo(name = "offer_id")
    val offerId: String,

    @ColumnInfo(name = "offer_hash")
    val offerHash: String, // SHA-256 of sanitized text

    @ColumnInfo(name = "source_platform")
    val sourcePlatform: String, // "WHATSAPP", "TELEGRAM", "SMS", "INSTAGRAM", "WEB"

    @ColumnInfo(name = "claimed_roi_percentage")
    val claimedRoiPercentage: Double?,

    @ColumnInfo(name = "promised_period_days")
    val promisedPeriodDays: Int?,

    @ColumnInfo(name = "is_guaranteed_return_promised")
    val isGuaranteedReturnPromised: Boolean,

    @ColumnInfo(name = "claimed_sebi_registration_no")
    val claimedSebiRegistrationNo: String?,

    @ColumnInfo(name = "urgency_tactics_json")
    val urgencyTacticsJson: String, // JSON array e.g. ["LIMITED_SLOTS", "VIP_GROUP"]

    @ColumnInfo(name = "risk_level")
    val riskLevel: String,

    @ColumnInfo(name = "analyzed_at_epoch_ms")
    val analyzedAtEpochMs: Long
)

/**
 * 14. INVESTMENT ENTITY (ADVISOR / BROKER / SCHEME)
 * Storage Domain: PUBLIC REGULATORY (SEBI Registry Mirror).
 * Retention: Synced daily, retained indefinitely.
 * Encryption: Standard Room indexing.
 */
@Entity(
    tableName = "investment_entities",
    indices = [
        Index(value = ["registration_number"], unique = true),
        Index(value = ["entity_name"])
    ]
)
data class InvestmentEntityEntity(
    @PrimaryKey
    @ColumnInfo(name = "entity_id")
    val entityId: String,

    @ColumnInfo(name = "registration_number")
    val registrationNumber: String, // e.g. "INH000001234"

    @ColumnInfo(name = "entity_name")
    val entityName: String,

    @ColumnInfo(name = "entity_type")
    val entityType: String, // "RESEARCH_ANALYST", "INVESTMENT_ADVISER", "STOCK_BROKER", "PORTFOLIO_MANAGER"

    @ColumnInfo(name = "valid_until_epoch_ms")
    val validUntilEpochMs: Long?,

    @ColumnInfo(name = "registration_status")
    val registrationStatus: String, // "ACTIVE", "SUSPENDED", "CANCELLED", "SURRENDERED"

    @ColumnInfo(name = "known_clones_json")
    val knownClonesJson: String? // Cloned domains/channels identified by SEBI orders
)

/**
 * 15. STOCK ENTITY
 * Storage Domain: PUBLIC MARKET (NSE / BSE).
 * Retention: Active stock universe.
 * Encryption: Standard Room indexing.
 */
@Entity(
    tableName = "stocks",
    indices = [
        Index(value = ["ticker_symbol"], unique = true),
        Index(value = ["isin"], unique = true)
    ]
)
data class StockEntity(
    @PrimaryKey
    @ColumnInfo(name = "stock_id")
    val stockId: String,

    @ColumnInfo(name = "ticker_symbol")
    val tickerSymbol: String, // e.g. "RELIANCE.NS"

    @ColumnInfo(name = "isin")
    val isin: String,

    @ColumnInfo(name = "company_name")
    val companyName: String,

    @ColumnInfo(name = "exchange")
    val exchange: String = "NSE", // "NSE", "BSE"

    @ColumnInfo(name = "sector")
    val sector: String,

    @ColumnInfo(name = "market_cap_category")
    val marketCapCategory: String, // "LARGE_CAP", "MID_CAP", "SMALL_CAP", "MICRO_CAP"

    @ColumnInfo(name = "pe_ratio")
    val peRatio: Double,

    @ColumnInfo(name = "debt_to_equity")
    val debtToEquity: Double,

    @ColumnInfo(name = "promoter_pledge_percentage")
    val promoterPledgePercentage: Double,

    @ColumnInfo(name = "is_asm_gsm_surveillance")
    val isAsmGsmSurveillance: Boolean,

    @ColumnInfo(name = "surveillance_stage")
    val surveillanceStage: Int = 0
)

/**
 * 16. MUTUAL FUND ENTITY
 * Storage Domain: PUBLIC MARKET (AMFI).
 * Retention: Active mutual fund universe.
 * Encryption: Standard Room indexing.
 */
@Entity(
    tableName = "mutual_funds",
    indices = [
        Index(value = ["amfi_code"], unique = true),
        Index(value = ["isin"])
    ]
)
data class MutualFundEntity(
    @PrimaryKey
    @ColumnInfo(name = "fund_id")
    val fundId: String,

    @ColumnInfo(name = "amfi_code")
    val amfiCode: String,

    @ColumnInfo(name = "isin")
    val isin: String,

    @ColumnInfo(name = "scheme_name")
    val schemeName: String,

    @ColumnInfo(name = "amc_name")
    val amcName: String,

    @ColumnInfo(name = "category")
    val category: String, // "Equity: Flexi Cap", "Debt: Liquid", etc.

    @ColumnInfo(name = "expense_ratio")
    val expenseRatio: Double,

    @ColumnInfo(name = "latest_nav")
    val latestNav: Double,

    @ColumnInfo(name = "sebi_risk_o_meter")
    val sebiRiskOMeter: String // "Low", "Moderate", "Very High"
)

/**
 * 17. ETF ENTITY
 * Storage Domain: PUBLIC MARKET.
 * Retention: Active ETF universe.
 * Encryption: Standard Room indexing.
 */
@Entity(
    tableName = "etfs",
    indices = [
        Index(value = ["ticker_symbol"], unique = true),
        Index(value = ["benchmark_index"])
    ]
)
data class ETFEntity(
    @PrimaryKey
    @ColumnInfo(name = "etf_id")
    val etfId: String,

    @ColumnInfo(name = "ticker_symbol")
    val tickerSymbol: String, // e.g. "NIFTYBEES"

    @ColumnInfo(name = "fund_name")
    val fundName: String,

    @ColumnInfo(name = "benchmark_index")
    val benchmarkIndex: String, // "Nifty 50", "Domestic Gold"

    @ColumnInfo(name = "underlying_asset_class")
    val underlyingAssetClass: String, // "EQUITY", "COMMODITY_GOLD", "DEBT"

    @ColumnInfo(name = "tracking_error_percentage")
    val trackingErrorPercentage: Double,

    @ColumnInfo(name = "expense_ratio")
    val expenseRatio: Double
)

/**
 * 18. CRYPTO ASSET ENTITY
 * Storage Domain: PUBLIC & CONTRACT AUDIT FEEDS.
 * Prohibited: Private keys, seed phrases, wallet credentials.
 * Retention: Continuous refresh.
 * Encryption: Standard Room indexing.
 */
@Entity(
    tableName = "crypto_assets",
    indices = [
        Index(value = ["symbol"]),
        Index(value = ["contract_address"], unique = true)
    ]
)
data class CryptoAssetEntity(
    @PrimaryKey
    @ColumnInfo(name = "crypto_id")
    val cryptoId: String,

    @ColumnInfo(name = "symbol")
    val symbol: String, // e.g. "BTC", "ETH", "SOL"

    @ColumnInfo(name = "name")
    val name: String,

    @ColumnInfo(name = "blockchain_network")
    val blockchainNetwork: String, // "BITCOIN", "ETHEREUM", "SOLANA", "BINANCE_SMART_CHAIN"

    @ColumnInfo(name = "contract_address")
    val contractAddress: String?, // Null for native L1s (BTC/ETH)

    @ColumnInfo(name = "market_cap_rank")
    val marketCapRank: Int,

    @ColumnInfo(name = "is_honeypot_detected")
    val isHoneypotDetected: Boolean = false,

    @ColumnInfo(name = "buy_tax_percentage")
    val buyTaxPercentage: Double = 0.0,

    @ColumnInfo(name = "sell_tax_percentage")
    val sellTaxPercentage: Double = 0.0,

    @ColumnInfo(name = "liquidity_locked_percentage")
    val liquidityLockedPercentage: Double?
)

/**
 * 19. PORTFOLIO ENTITY
 * Storage Domain: LOCAL-ONLY (User's private portfolio container).
 * Retention: User controlled; purged on request.
 * Encryption: SQLCipher AES-256-GCM.
 */
@Entity(
    tableName = "portfolios",
    indices = [
        Index(value = ["user_id"])
    ]
)
data class PortfolioEntity(
    @PrimaryKey
    @ColumnInfo(name = "portfolio_id")
    val portfolioId: String,

    @ColumnInfo(name = "user_id")
    val userId: String,

    @ColumnInfo(name = "portfolio_name")
    val portfolioName: String = "Primary Wealth Portfolio",

    @ColumnInfo(name = "total_cost_basis")
    val totalCostBasis: Double,

    @ColumnInfo(name = "total_current_value")
    val totalCurrentValue: Double,

    @ColumnInfo(name = "last_rebalanced_epoch_ms")
    val lastRebalancedEpochMs: Long
)

/**
 * 20. PORTFOLIO HOLDING ENTITY
 * Storage Domain: LOCAL-ONLY (User private holdings).
 * Sensitive Fields: Quantity, Average Buy Price, Calculated Value.
 * Retention: User controlled.
 * Encryption: SQLCipher AES-256-GCM.
 */
@Entity(
    tableName = "portfolio_holdings",
    indices = [
        Index(value = ["portfolio_id"]),
        Index(value = ["asset_id"]),
        Index(value = ["asset_class"])
    ]
)
data class PortfolioHoldingEntity(
    @PrimaryKey
    @ColumnInfo(name = "holding_id")
    val holdingId: String,

    @ColumnInfo(name = "portfolio_id")
    val portfolioId: String,

    @ColumnInfo(name = "asset_id")
    val assetId: String, // FK to Stock, MF, ETF, or Crypto

    @ColumnInfo(name = "asset_class")
    val assetClass: String, // "STOCK", "MUTUAL_FUND", "ETF", "CRYPTO", "GOLD_SGB"

    @ColumnInfo(name = "quantity")
    val quantity: Double,

    @ColumnInfo(name = "average_buy_price")
    val averageBuyPrice: Double,

    @ColumnInfo(name = "current_unit_price")
    val currentUnitPrice: Double,

    @ColumnInfo(name = "allocation_percentage")
    val allocationPercentage: Double, // Computed derived weight

    @ColumnInfo(name = "concentration_warning")
    val concentrationWarning: Boolean = false
)

/**
 * 21. PRICE SNAPSHOT ENTITY
 * Storage Domain: DERIVED / CACHE (Market pricing ticks).
 * Retention: 30 days rolling cache.
 * Encryption: Standard Room indexing.
 */
@Entity(
    tableName = "price_snapshots",
    indices = [
        Index(value = ["asset_id", "snapshot_timestamp_epoch_ms"]),
        Index(value = ["asset_symbol"])
    ]
)
data class PriceSnapshotEntity(
    @PrimaryKey
    @ColumnInfo(name = "snapshot_id")
    val snapshotId: String,

    @ColumnInfo(name = "asset_id")
    val assetId: String,

    @ColumnInfo(name = "asset_symbol")
    val assetSymbol: String,

    @ColumnInfo(name = "price_inr")
    val priceInr: Double,

    @ColumnInfo(name = "change_24h_percentage")
    val change24hPercentage: Double,

    @ColumnInfo(name = "snapshot_timestamp_epoch_ms")
    val snapshotTimestampEpochMs: Long
)
