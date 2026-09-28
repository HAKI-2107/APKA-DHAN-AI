package com.apkadhan.ai.notification

import android.Manifest
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat

/**
 * APKA DHAN AI - ANDROID LOCAL NOTIFICATION MANAGER
 * 
 * Manages native notification dispatch, deep-link routing, and privacy controls.
 * 
 * STRICT PRIVACY INVARIANTS:
 * 1. Lock screen privacy: Uses NotificationCompat.VISIBILITY_PRIVATE to prevent credential leakage.
 * 2. Never prints or includes UPI PINs, passwords, or full bank account numbers.
 * 3. Checks Manifest.permission.POST_NOTIFICATIONS on Android 13+ (API 33+).
 */
class LocalNotificationManager(private val context: Context) {

    init {
        ApkaDhanNotificationChannels.createChannels(context)
    }

    /**
     * Checks if notification permission is granted on Android 13+
     */
    fun hasNotificationPermission(): Boolean {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            ContextCompat.checkSelfPermission(
                context,
                Manifest.permission.POST_NOTIFICATIONS
            ) == PackageManager.PERMISSION_GRANTED
        } else {
            NotificationManagerCompat.from(context).areNotificationsEnabled()
        }
    }

    /**
     * Dispatches a real Android local notification
     */
    fun showNotification(
        id: Int,
        channelId: String,
        title: String,
        body: String,
        alertId: String,
        isCritical: Boolean = false,
        isTest: Boolean = false
    ): Boolean {
        if (!hasNotificationPermission()) {
            return false
        }

        // Deep-link intent: apkaDhan://alerts/{alertId}
        val deepLinkUri = Uri.parse("apkaDhan://alerts/$alertId")
        val intent = Intent(Intent.ACTION_VIEW, deepLinkUri).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }

        val pendingIntent = PendingIntent.getActivity(
            context,
            id,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        // Action button for immediate verification
        val reviewAction = NotificationCompat.Action.Builder(
            android.R.drawable.ic_menu_view,
            if (isCritical) "Stop & Verify" else "Review",
            pendingIntent
        ).build()

        val displayTitle = if (isTest) "[TEST] $title" else title

        val builder = NotificationCompat.Builder(context, channelId)
            .setSmallIcon(android.R.drawable.ic_lock_idle_lock)
            .setContentTitle(displayTitle)
            .setContentText(body)
            .setStyle(NotificationCompat.BigTextStyle().bigText(body))
            .setContentIntent(pendingIntent)
            .setAutoCancel(true)
            .addAction(reviewAction)
            // Lock screen privacy protection: Masks sensitive content when locked
            .setVisibility(NotificationCompat.VISIBILITY_PRIVATE)
            .setPriority(
                if (isCritical) NotificationCompat.PRIORITY_HIGH
                else NotificationCompat.PRIORITY_DEFAULT
            )

        try {
            val notificationManager = NotificationManagerCompat.from(context)
            notificationManager.notify(id, builder.build())
            return true
        } catch (e: SecurityException) {
            // Permission revoked
            return false
        }
    }

    /**
     * Cancels an active notification by ID
     */
    fun cancelNotification(id: Int) {
        NotificationManagerCompat.from(context).cancel(id)
    }
}
