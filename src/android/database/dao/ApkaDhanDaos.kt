package com.apkadhan.ai.core.database.dao

import androidx.room.*
import com.apkadhan.ai.core.database.entity.*
import kotlinx.coroutines.flow.Flow

@Dao
interface UserDao {
    @Query("SELECT * FROM users LIMIT 1")
    fun getUserFlow(): Flow<UserEntity?>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertOrUpdateUser(user: UserEntity)

    @Query("UPDATE users SET last_active_epoch_ms = :timestamp WHERE user_id = :userId")
    suspend fun updateLastActive(userId: String, timestamp: Long = System.currentTimeMillis())

    @Query("DELETE FROM users")
    suspend fun purgeUserData()
}

@Dao
interface ConsentDao {
    @Query("SELECT * FROM consents WHERE user_id = :userId")
    suspend fun getConsentsForUser(userId: String): List<ConsentEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun recordConsent(consent: ConsentEntity)
}

@Dao
interface TransactionDao {
    @Query("SELECT * FROM transactions ORDER BY txn_timestamp_epoch_ms DESC LIMIT :limit")
    fun getRecentTransactions(limit: Int = 50): Flow<List<TransactionEntity>>

    @Query("SELECT * FROM transactions WHERE is_anomaly = 1 ORDER BY txn_timestamp_epoch_ms DESC")
    fun getAnomalousTransactions(): Flow<List<TransactionEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertTransaction(txn: TransactionEntity)

    @Query("SELECT AVG(amount) FROM transactions WHERE counterparty_vpa = :vpa")
    suspend fun getAverageAmountForPayee(vpa: String): Double?
}

@Dao
interface UPIIdentifierDao {
    @Query("SELECT * FROM upi_identifiers WHERE vpa_address = :vpa LIMIT 1")
    suspend fun findUpiIdentifier(vpa: String): UPIIdentifierEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun cacheUpiIdentifier(entity: UPIIdentifierEntity)
}

@Dao
interface LinkDao {
    @Query("SELECT * FROM links WHERE normalized_url_hash = :urlHash LIMIT 1")
    suspend fun findLinkByHash(urlHash: String): LinkEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun cacheLink(entity: LinkEntity)
}

@Dao
interface ThreatIndicatorDao {
    @Query("SELECT * FROM threat_indicators WHERE indicator_hash = :hash AND is_active = 1 LIMIT 1")
    suspend fun lookupThreat(hash: String): ThreatIndicatorEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertThreatIndicators(indicators: List<ThreatIndicatorEntity>)
}

@Dao
interface UserReportDao {
    @Query("SELECT * FROM user_reports ORDER BY submitted_at_epoch_ms DESC")
    fun getAllUserReports(): Flow<List<UserReportEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertUserReport(report: UserReportEntity)
}

@Dao
interface PortfolioDao {
    @Query("SELECT * FROM portfolios LIMIT 1")
    fun getPrimaryPortfolio(): Flow<PortfolioEntity?>

    @Query("SELECT * FROM portfolio_holdings WHERE portfolio_id = :portfolioId")
    fun getHoldingsForPortfolio(portfolioId: String): Flow<List<PortfolioHoldingEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertHolding(holding: PortfolioHoldingEntity)

    @Query("DELETE FROM portfolio_holdings WHERE holding_id = :holdingId")
    suspend fun removeHolding(holdingId: String)
}

@Dao
interface AlertDao {
    @Query("SELECT * FROM alerts ORDER BY created_at_epoch_ms DESC")
    fun getAllAlertsFlow(): Flow<List<AlertEntity>>

    @Query("SELECT * FROM alerts WHERE category = :category ORDER BY created_at_epoch_ms DESC")
    fun getAlertsByCategory(category: String): Flow<List<AlertEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAlert(alert: AlertEntity)

    @Query("UPDATE alerts SET is_read = 1 WHERE alert_id = :alertId")
    suspend fun markAlertAsRead(alertId: String)
}

@Dao
interface AuditEventDao {
    @Query("SELECT * FROM audit_events ORDER BY timestamp_epoch_ms DESC LIMIT :limit")
    fun getAuditTrail(limit: Int = 100): Flow<List<AuditEventEntity>>

    @Insert
    suspend fun appendAuditEvent(event: AuditEventEntity)
}
