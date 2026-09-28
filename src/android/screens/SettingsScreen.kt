package com.apkadhan.ai.feature.settings

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Shield
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.apkadhan.ai.core.designsystem.components.DhanTopBar
import com.apkadhan.ai.core.designsystem.theme.*

@Composable
fun SettingsScreen() {
    var biometricLockEnabled by remember { mutableStateOf(true) }
    var strictPiiMaskingEnabled by remember { mutableStateOf(true) }
    var zeroKnowledgeModeEnabled by remember { mutableStateOf(false) }

    Scaffold(
        topBar = {
            DhanTopBar(
                title = "SECURITY & PRIVACY VAULT",
                subtitle = "Hardware Keystore & Zero-Credential Controls"
            )
        },
        containerColor = NavyPrimary
    ) { paddingValues ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .padding(horizontal = 16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            item { Spacer(modifier = Modifier.height(4.dp)) }

            // Cryptographic Status Card
            item {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(12.dp))
                        .background(NavySurfaceElevated)
                        .border(1.dp, NavyBorder, RoundedCornerShape(12.dp))
                        .padding(16.dp)
                ) {
                    Column {
                        Text(
                            text = "ON-DEVICE CRYPTOGRAPHY STATUS",
                            color = SaffronPrimary,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            letterSpacing = 1.sp
                        )
                        Spacer(modifier = Modifier.height(6.dp))
                        Text(
                            text = "Room DB Encrypted with SQLCipher (AES-256-GCM)",
                            color = RiskLowGreen,
                            fontSize = 13.sp,
                            fontWeight = FontWeight.SemiBold
                        )
                        Text(
                            text = "Master keys anchored in Android Hardware-Backed Keystore (StrongBox TEE).",
                            color = TextSecondary,
                            fontSize = 11.sp,
                            modifier = Modifier.padding(top = 2.dp)
                        )
                    }
                }
            }

            // Security Preferences
            item {
                Text(
                    text = "DEFENSE & ACCESS CONTROLS",
                    color = SaffronPrimary,
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 1.sp
                )
                Spacer(modifier = Modifier.height(8.dp))
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(12.dp))
                        .background(NavySurfaceElevated)
                        .border(1.dp, NavyBorder, RoundedCornerShape(12.dp))
                        .padding(14.dp),
                    verticalArrangement = Arrangement.spacedBy(14.dp)
                ) {
                    SettingToggleRow(
                        title = "Biometric / App Pin Lock",
                        description = "Require fingerprint/face auth upon returning to the app",
                        checked = biometricLockEnabled,
                        onCheckedChange = { biometricLockEnabled = it }
                    )
                    Divider(color = NavyBorder, thickness = 0.5.dp)
                    SettingToggleRow(
                        title = "Strict On-Device PII Masking",
                        description = "Automatically redact PAN, Aadhaar, and account numbers prior to analysis",
                        checked = strictPiiMaskingEnabled,
                        onCheckedChange = { strictPiiMaskingEnabled = it }
                    )
                    Divider(color = NavyBorder, thickness = 0.5.dp)
                    SettingToggleRow(
                        title = "Zero-Knowledge Mode",
                        description = "Do not persist scanned payloads or reports in the local database",
                        checked = zeroKnowledgeModeEnabled,
                        onCheckedChange = { zeroKnowledgeModeEnabled = it }
                    )
                }
            }

            // Registry Sync Info
            item {
                Text(
                    text = "REGULATORY REGISTRY STATUS",
                    color = SaffronPrimary,
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 1.sp
                )
                Spacer(modifier = Modifier.height(8.dp))
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(12.dp))
                        .background(NavySurfaceElevated)
                        .border(1.dp, NavyBorder, RoundedCornerShape(12.dp))
                        .padding(14.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    RegistryStatusItem(name = "SEBI Registered Advisors", status = "Synced Today, 05:30 AM")
                    RegistryStatusItem(name = "RBI Caution List (Unauthorized Forex)", status = "Synced Today, 05:30 AM")
                    RegistryStatusItem(name = "NPCI Whitelisted PSP Handles", status = "Active Bloom Filter v2.4")
                }
            }

            // Reset Data Action
            item {
                Button(
                    onClick = {},
                    colors = ButtonDefaults.buttonColors(
                        containerColor = RiskHighRedBg,
                        contentColor = RiskHighRed
                    ),
                    shape = RoundedCornerShape(8.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text(text = "Purge Local Scan History & Cache", fontWeight = FontWeight.SemiBold, fontSize = 12.sp)
                }
            }

            item { Spacer(modifier = Modifier.height(24.dp)) }
        }
    }
}

@Composable
fun SettingToggleRow(
    title: String,
    description: String,
    checked: Boolean,
    onCheckedChange: (Boolean) -> Unit
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Column(modifier = Modifier.weight(1f)) {
            Text(text = title, color = TextPrimary, fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
            Text(text = description, color = TextSecondary, fontSize = 11.sp)
        }
        Switch(
            checked = checked,
            onCheckedChange = onCheckedChange,
            colors = SwitchDefaults.colors(
                checkedThumbColor = NavyPrimary,
                checkedTrackColor = SaffronPrimary,
                uncheckedThumbColor = TextMuted,
                uncheckedTrackColor = NavySurface
            )
        )
    }
}

@Composable
fun RegistryStatusItem(name: String, status: String) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(text = name, color = TextPrimary, fontSize = 12.sp)
        Text(text = status, color = SaffronPrimary, fontSize = 11.sp, fontWeight = FontWeight.Medium)
    }
}
