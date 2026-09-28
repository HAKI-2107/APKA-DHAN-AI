package com.apkadhan.ai.notification

import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.os.Build

/**
 * APKA DHAN AI - ANDROID NOTIFICATION CHANNELS (Android 8.0+ / API 26+)
 * 
 * Formal channels as mandated by the Project Architecture:
 * - SECURITY_ALERTS (IMPORTANCE_HIGH): For malicious links, phishing, digital arrest threats
 * - PAYMENT_ALERTS (IMPORTANCE_HIGH): For collect-request traps, unusual debit surges
 * - INVESTMENT_ALERTS (IMPORTANCE_DEFAULT): Unverified broker claims, Ponzi patterns
 * - PORTFOLIO_ALERTS (IMPORTANCE_DEFAULT): Concentration alerts, daily net worth summaries
 * - STOCK_ALERTS (IMPORTANCE_LOW): Watched stock price movements (no sound spam)
 * - CRYPTO_ALERTS (IMPORTANCE_LOW): Crypto market shifts (no sound spam)
 * - GENERAL_ALERTS (IMPORTANCE_DEFAULT): System status, data provider reconnection
 */
object ApkaDhanNotificationChannels {

    const val CHANNEL_SECURITY = "SECURITY_ALERTS"
    const val CHANNEL_PAYMENT = "PAYMENT_ALERTS"
    const val CHANNEL_INVESTMENT = "INVESTMENT_ALERTS"
    const val CHANNEL_PORTFOLIO = "PORTFOLIO_ALERTS"
    const val CHANNEL_STOCK = "STOCK_ALERTS"
    const val CHANNEL_CRYPTO = "CRYPTO_ALERTS"
    const val CHANNEL_GENERAL = "GENERAL_ALERTS"

    fun createChannels(context: Context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

            val channels = listOf(
                NotificationChannel(
                    CHANNEL_SECURITY,
                    "Security Alerts",
                    NotificationManager.IMPORTANCE_HIGH
                ).apply {
                    description = "Urgent alerts for malicious links, counterfeit certificates, and digital threats"
                    enableVibration(true)
                    setShowBadge(true)
                },
                NotificationChannel(
                    CHANNEL_PAYMENT,
                    "Payment Safety",
                    NotificationManager.IMPORTANCE_HIGH
                ).apply {
                    description = "Warnings for UPI collect requests, unverified VPAs, and transaction anomalies"
                    enableVibration(true)
                    setShowBadge(true)
                },
                NotificationChannel(
                    CHANNEL_INVESTMENT,
                    "Investment Alerts",
                    NotificationManager.IMPORTANCE_DEFAULT
                ).apply {
                    description = "Verifications for unregistered advisories and guaranteed-return pitches"
                    setShowBadge(true)
                },
                NotificationChannel(
                    CHANNEL_PORTFOLIO,
                    "Portfolio Alerts",
                    NotificationManager.IMPORTANCE_DEFAULT
                ).apply {
                    description = "Asset concentration notices and daily net-worth summaries"
                    setShowBadge(false)
                },
                NotificationChannel(
                    CHANNEL_STOCK,
                    "Stock Intelligence",
                    NotificationManager.IMPORTANCE_LOW
                ).apply {
                    description = "Notices for significant price movements in tracked NSE/BSE securities"
                    setShowBadge(false)
                },
                NotificationChannel(
                    CHANNEL_CRYPTO,
                    "Crypto Radar",
                    NotificationManager.IMPORTANCE_LOW
                ).apply {
                    description = "Notices for volatile crypto movements without FOMO alerts"
                    setShowBadge(false)
                },
                NotificationChannel(
                    CHANNEL_GENERAL,
                    "General & System",
                    NotificationManager.IMPORTANCE_DEFAULT
                ).apply {
                    description = "Data provider updates and system notifications"
                    setShowBadge(false)
                }
            )

            notificationManager.createNotificationChannels(channels)
        }
    }
}
