package com.apkadhan.ai.notification

import android.app.Activity
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.Settings
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.Shield
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.apkadhan.ai.core.designsystem.theme.*

/**
 * APKA DHAN AI - ANDROID 13+ NOTIFICATION PERMISSION HANDLER
 * 
 * Manages POST_NOTIFICATIONS permission with respectful, contextual in-app explanation.
 * Does NOT prompt blindly on first launch.
 */
@Composable
fun NotificationPermissionCard(
    onEnableClicked: () -> Unit,
    onDismissClicked: () -> Unit
) {
    Card(
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = NavySurface),
        modifier = Modifier
            .fillMaxWidth()
            .padding(16.dp)
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Icon(
                    imageVector = Icons.Default.Notifications,
                    contentDescription = "Alerts",
                    tint = SaffronPrimary
                )
                Text(
                    text = "Stay Informed with Timely Alerts",
                    color = TextPrimary,
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Bold
                )
            }

            Text(
                text = "Get alerts when something important needs your attention — such as unverified collect requests, suspicious links, or rapid portfolio concentration.",
                color = TextSecondary,
                fontSize = 12.sp,
                lineHeight = 16.sp
            )

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.End,
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                TextButton(onClick = onDismissClicked) {
                    Text("Maybe Later", color = TextSecondary, fontSize = 12.sp)
                }

                Button(
                    onClick = onEnableClicked,
                    colors = ButtonDefaults.buttonColors(containerColor = SaffronPrimary)
                ) {
                    Text("Enable Notifications", color = NavyDeep, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}

object NotificationSettingsHelper {
    /**
     * Directs the user to the system app notification settings screen if permission was previously denied
     */
    fun openAppNotificationSettings(context: Context) {
        val intent = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS).apply {
                putExtra(Settings.EXTRA_APP_PACKAGE, context.packageName)
            }
        } else {
            Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
                data = Uri.fromParts("package", context.packageName, null)
            }
        }
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        context.startActivity(intent)
    }
}
