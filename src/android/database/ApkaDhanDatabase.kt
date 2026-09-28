package com.apkadhan.ai.core.database

import androidx.room.Database
import androidx.room.RoomDatabase
import com.apkadhan.ai.core.database.dao.*
import com.apkadhan.ai.core.database.entity.*

/**
 * APKA DHAN AI ROOM DATABASE
 * 
 * Cryptographically secured on-device storage with SQLCipher (256-bit AES-GCM).
 * Master key derived from the Android Hardware-Backed Keystore (StrongBox TEE).
 * Zero credentials (passwords, UPI PINs, CVVs, private keys) are ever stored.
 */
@Database(
    entities = [
        UserEntity::class,
        DeviceEntity::class,
        ConsentEntity::class,
        SecurityEventEntity::class,
        TransactionEntity::class,
        MerchantEntity::class,
        UPIIdentifierEntity::class,
        PhoneNumberEntity::class,
        LinkEntity::class,
        QRAnalysisEntity::class,
        ThreatIndicatorEntity::class,
        UserReportEntity::class,
        InvestmentOfferEntity::class,
        InvestmentEntityEntity::class,
        StockEntity::class,
        MutualFundEntity::class,
        ETFEntity::class,
        CryptoAssetEntity::class,
        PortfolioEntity::class,
        PortfolioHoldingEntity::class,
        PriceSnapshotEntity::class,
        RiskAssessmentEntity::class,
        RiskSignalEntity::class,
        AlertEntity::class,
        NotificationEntity::class,
        AIAnalysisEntity::class,
        AuditEventEntity::class
    ],
    version = 1,
    exportSchema = true
)
abstract class ApkaDhanDatabase : RoomDatabase() {
    abstract fun userDao(): UserDao
    abstract fun consentDao(): ConsentDao
    abstract fun transactionDao(): TransactionDao
    abstract fun upiIdentifierDao(): UPIIdentifierDao
    abstract fun linkDao(): LinkDao
    abstract fun threatIndicatorDao(): ThreatIndicatorDao
    abstract fun userReportDao(): UserReportDao
    abstract fun portfolioDao(): PortfolioDao
    abstract fun alertDao(): AlertDao
    abstract fun auditEventDao(): AuditEventDao
}
