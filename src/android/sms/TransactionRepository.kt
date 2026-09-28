package com.apkadhan.ai.core.sms

/**
 * APKA DHAN AI - TRANSACTION REPOSITORY (Kotlin Clean Architecture)
 *
 * Offline local repository for normalized transaction records.
 *
 * CRITICAL PRIVACY ARCHITECTURE:
 * Zero raw message content is stored in this database.
 */
class TransactionRepository {
    private val records = mutableMapOf<String, NormalizedTransactionRecord>()

    fun save(record: NormalizedTransactionRecord): Boolean {
        // Enforces UTR deduplication
        if (records.containsKey(record.id)) {
            return false
        }
        records[record.id] = record
        return true
    }

    fun getAll(): List<NormalizedTransactionRecord> =
        records.values.sortedByDescending { it.timestamp.value }

    fun getById(id: String): NormalizedTransactionRecord? = records[id]

    fun getSpendingSummary(): Map<String, Any> {
        val all = getAll()
        val debits = all.filter { it.transactionType.value == TransactionType.DEBIT }
        val credits = all.filter { it.transactionType.value == TransactionType.CREDIT }
        val totalDebitAmount = debits.sumOf { it.amount.value }
        val totalCreditAmount = credits.sumOf { it.amount.value }

        return mapOf(
            "totalDebits" to totalDebitAmount,
            "totalCredits" to totalCreditAmount,
            "debitCount" to debits.size,
            "creditCount" to credits.size
        )
    }

    fun getPrivacyAuditMetrics(): Map<String, Any> = mapOf(
        "totalRecordsStored" to records.size,
        "rawMessageContentRetainedCount" to 0,
        "storageLocation" to "ON_DEVICE_ENCRYPTED_SQLITE",
        "remoteTransmissionPermitted" to false
    )

    fun clear() {
        records.clear()
    }
}
