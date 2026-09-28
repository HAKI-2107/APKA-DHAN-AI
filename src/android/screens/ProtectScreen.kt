package com.apkadhan.ai.feature.protect

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.apkadhan.ai.core.designsystem.components.DhanTopBar
import com.apkadhan.ai.core.designsystem.components.EvidenceCard
import com.apkadhan.ai.core.designsystem.components.RiskBadge
import com.apkadhan.ai.core.designsystem.theme.*
import com.apkadhan.ai.core.model.RiskDossier
import com.apkadhan.ai.core.model.RiskLevel

enum class ProtectTool(val label: String, val icon: ImageVector) {
    UPI_CHECKER("UPI ID Check", Icons.Default.Payment),
    LINK_CHECKER("Link Scanner", Icons.Default.Link),
    QR_SCANNER("QR Code", Icons.Default.QrCodeScanner),
    SCAM_ANALYZER("Message Check", Icons.Default.Chat),
    SCREENSHOT_ANALYZER("Screenshot", Icons.Default.DocumentScanner),
    TRANSACTION_ANOMALIES("Anomaly Alerts", Icons.Default.NotificationsActive)
}

@Composable
fun ProtectScreen(
    initialTool: ProtectTool = ProtectTool.UPI_CHECKER,
    onEvaluateUpi: suspend (String) -> RiskDossier,
    onEvaluateLink: suspend (String) -> RiskDossier,
    onEvaluateMessage: suspend (String) -> RiskDossier
) {
    var selectedTool by remember { mutableStateOf(initialTool) }
    var inputText by remember { mutableStateOf("") }
    var isLoading by remember { mutableStateOf(false) }
    var currentResult by remember { mutableStateOf<RiskDossier?>(null) }

    Scaffold(
        topBar = {
            DhanTopBar(
                title = "PROTECT & VERIFY",
                subtitle = "Deterministic Heuristics + Threat Intelligence"
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

            // Tool selector tabs
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    ProtectTool.values().take(3).forEach { tool ->
                        ToolTabButton(
                            tool = tool,
                            isSelected = selectedTool == tool,
                            modifier = Modifier.weight(1f),
                            onClick = {
                                selectedTool = tool
                                currentResult = null
                                inputText = ""
                            }
                        )
                    }
                }
                Spacer(modifier = Modifier.height(8.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    ProtectTool.values().drop(3).forEach { tool ->
                        ToolTabButton(
                            tool = tool,
                            isSelected = selectedTool == tool,
                            modifier = Modifier.weight(1f),
                            onClick = {
                                selectedTool = tool
                                currentResult = null
                                inputText = ""
                            }
                        )
                    }
                }
            }

            // Input card based on selected tool
            item {
                when (selectedTool) {
                    ProtectTool.UPI_CHECKER -> {
                        VerificationInputCard(
                            title = "UPI VPA & Intent URI Inspector",
                            placeholder = "e.g. refund-care@okhdfcbank or upi://pay?pa=...",
                            value = inputText,
                            onValueChange = { inputText = it },
                            buttonLabel = "Verify UPI Handle",
                            isLoading = isLoading,
                            onAction = {
                                // Calls domain use case
                            }
                        )
                    }
                    ProtectTool.LINK_CHECKER -> {
                        VerificationInputCard(
                            title = "Suspicious Link & Phishing Checker",
                            placeholder = "e.g. sbi-kyc-update.top or bit.ly/wealth-vip",
                            value = inputText,
                            onValueChange = { inputText = it },
                            buttonLabel = "Inspect Domain",
                            isLoading = isLoading,
                            onAction = {}
                        )
                    }
                    ProtectTool.QR_SCANNER -> {
                        QrScannerCard()
                    }
                    ProtectTool.SCAM_ANALYZER -> {
                        VerificationInputCard(
                            title = "Financial Scam & Message Deconstructor",
                            placeholder = "Paste suspicious WhatsApp/Telegram text, task offers, or investment claims...",
                            value = inputText,
                            onValueChange = { inputText = it },
                            buttonLabel = "Deconstruct Message",
                            isMultiline = true,
                            isLoading = isLoading,
                            onAction = {}
                        )
                    }
                    ProtectTool.SCREENSHOT_ANALYZER -> {
                        ScreenshotAnalyzerCard()
                    }
                    ProtectTool.TRANSACTION_ANOMALIES -> {
                        TransactionAnomalyFeedCard()
                    }
                }
            }

            // Evidence Card Result
            if (currentResult != null) {
                item {
                    EvidenceCard(dossier = currentResult!!)
                }
            }

            item { Spacer(modifier = Modifier.height(24.dp)) }
        }
    }
}

@Composable
fun ToolTabButton(
    tool: ProtectTool,
    isSelected: Boolean,
    modifier: Modifier = Modifier,
    onClick: () -> Unit
) {
    Box(
        modifier = modifier
            .clip(RoundedCornerShape(8.dp))
            .background(if (isSelected) SaffronPrimary.copy(alpha = 0.2f) else NavySurfaceElevated)
            .border(1.dp, if (isSelected) SaffronPrimary else NavyBorder, RoundedCornerShape(8.dp))
            .clickable { onClick() }
            .padding(vertical = 10.dp, horizontal = 4.dp),
        contentAlignment = Alignment.Center
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Icon(
                imageVector = tool.icon,
                contentDescription = tool.label,
                tint = if (isSelected) SaffronPrimary else TextSecondary,
                modifier = Modifier.size(18.dp)
            )
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = tool.label,
                color = if (isSelected) TextPrimary else TextSecondary,
                fontSize = 11.sp,
                fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal
            )
        }
    }
}

@Composable
fun VerificationInputCard(
    title: String,
    placeholder: String,
    value: String,
    onValueChange: (String) -> Unit,
    buttonLabel: String,
    isLoading: Boolean,
    isMultiline: Boolean = false,
    onAction: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp))
            .background(NavySurfaceElevated)
            .border(1.dp, NavyBorder, RoundedCornerShape(12.dp))
            .padding(16.dp)
    ) {
        Text(
            text = title,
            color = TextPrimary,
            fontSize = 15.sp,
            fontWeight = FontWeight.SemiBold
        )
        Spacer(modifier = Modifier.height(8.dp))
        OutlinedTextField(
            value = value,
            onValueChange = onValueChange,
            placeholder = { Text(placeholder, color = TextMuted, fontSize = 12.sp) },
            modifier = Modifier
                .fillMaxWidth()
                .then(if (isMultiline) Modifier.height(110.dp) else Modifier),
            colors = OutlinedTextFieldDefaults.colors(
                focusedContainerColor = NavySurface,
                unfocusedContainerColor = NavySurface,
                focusedBorderColor = SaffronPrimary,
                unfocusedBorderColor = NavyBorder,
                focusedTextColor = TextPrimary,
                unfocusedTextColor = TextPrimary
            ),
            shape = RoundedCornerShape(8.dp)
        )
        Spacer(modifier = Modifier.height(12.dp))
        Button(
            onClick = onAction,
            enabled = value.isNotBlank() && !isLoading,
            modifier = Modifier.fillMaxWidth(),
            colors = ButtonDefaults.buttonColors(
                containerColor = SaffronPrimary,
                contentColor = NavyPrimary
            ),
            shape = RoundedCornerShape(8.dp)
        ) {
            if (isLoading) {
                CircularProgressIndicator(modifier = Modifier.size(18.dp), color = NavyPrimary)
            } else {
                Text(text = buttonLabel, fontWeight = FontWeight.Bold, fontSize = 13.sp)
            }
        }
    }
}

@Composable
fun QrScannerCard() {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp))
            .background(NavySurfaceElevated)
            .border(1.dp, NavyBorder, RoundedCornerShape(12.dp))
            .padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text(
            text = "Safe QR Code Scanner",
            color = TextPrimary,
            fontSize = 15.sp,
            fontWeight = FontWeight.SemiBold
        )
        Text(
            text = "CameraX Optical Reader. Scans and quarantines QR payload before any payment intent executes.",
            color = TextSecondary,
            fontSize = 11.sp,
            modifier = Modifier.padding(vertical = 4.dp)
        )
        Spacer(modifier = Modifier.height(12.dp))
        Box(
            modifier = Modifier
                .size(160.dp)
                .clip(RoundedCornerShape(12.dp))
                .background(NavySurface)
                .border(2.dp, SaffronPrimary.copy(alpha = 0.5f), RoundedCornerShape(12.dp)),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = Icons.Default.QrCodeScanner,
                contentDescription = "Scanner Viewfinder",
                tint = SaffronPrimary,
                modifier = Modifier.size(64.dp)
            )
        }
    }
}

@Composable
fun ScreenshotAnalyzerCard() {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp))
            .background(NavySurfaceElevated)
            .border(1.dp, NavyBorder, RoundedCornerShape(12.dp))
            .padding(16.dp)
    ) {
        Text(
            text = "Screenshot OCR & Document Analyzer",
            color = TextPrimary,
            fontSize = 15.sp,
            fontWeight = FontWeight.SemiBold
        )
        Text(
            text = "Upload chats, fake certificates, or payment receipts. Local redaction runs before AI reasoning.",
            color = TextSecondary,
            fontSize = 11.sp,
            modifier = Modifier.padding(vertical = 4.dp)
        )
    }
}

@Composable
fun TransactionAnomalyFeedCard() {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp))
            .background(NavySurfaceElevated)
            .border(1.dp, NavyBorder, RoundedCornerShape(12.dp))
            .padding(16.dp)
    ) {
        Text(
            text = "Transaction Anomaly Interceptor",
            color = TextPrimary,
            fontSize = 15.sp,
            fontWeight = FontWeight.SemiBold
        )
        Text(
            text = "Local statistical baseline monitors for collect-request surges, off-hour transfers, and unverified payees.",
            color = TextSecondary,
            fontSize = 11.sp,
            modifier = Modifier.padding(vertical = 4.dp)
        )
    }
}
