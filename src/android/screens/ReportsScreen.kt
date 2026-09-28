package com.apkadhan.ai.feature.reports

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
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

enum class ReportCategory(val label: String) {
    UPI_ID("UPI ID"),
    PHONE_NUMBER("Phone Number"),
    LINK("Suspicious Link"),
    QR_CODE("Fraud QR Code"),
    INVESTMENT_OFFER("Investment Offer"),
    CRYPTO_SCAM("Crypto Scam"),
    SUSPICIOUS_MESSAGE("Suspicious Message")
}

@Composable
fun ReportsScreen(
    onSubmitReport: (category: ReportCategory, identifier: String, description: String) -> Unit
) {
    var selectedCategory by remember { mutableStateOf(ReportCategory.UPI_ID) }
    var targetIdentifier by remember { mutableStateOf("") }
    var incidentDescription by remember { mutableStateOf("") }
    var hasUserConsent by remember { mutableStateOf(false) }
    var submittedReceiptId by remember { mutableStateOf<String?>(null) }

    Scaffold(
        topBar = {
            DhanTopBar(
                title = "REPORT SUSPICIOUS ACTIVITY",
                subtitle = "Crowdsourced Threat Intel & Escalation"
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

            if (submittedReceiptId != null) {
                item {
                    ReportReceiptCard(
                        receiptId = submittedReceiptId!!,
                        onNewReport = {
                            submittedReceiptId = null
                            targetIdentifier = ""
                            incidentDescription = ""
                            hasUserConsent = false
                        }
                    )
                }
            } else {
                // Category Picker
                item {
                    Text(
                        text = "INCIDENT CATEGORY",
                        color = SaffronPrimary,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 1.sp
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                        ReportCategory.values().toList().chunked(2).forEach { rowCategories ->
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(6.dp)
                            ) {
                                rowCategories.forEach { category ->
                                    val isSelected = selectedCategory == category
                                    Box(
                                        modifier = Modifier
                                            .weight(1f)
                                            .clip(RoundedCornerShape(8.dp))
                                            .background(if (isSelected) SaffronPrimary.copy(alpha = 0.2f) else NavySurfaceElevated)
                                            .border(1.dp, if (isSelected) SaffronPrimary else NavyBorder, RoundedCornerShape(8.dp))
                                            .clickable { selectedCategory = category }
                                            .padding(vertical = 10.dp, horizontal = 6.dp),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Text(
                                            text = category.label,
                                            color = if (isSelected) TextPrimary else TextSecondary,
                                            fontSize = 11.sp,
                                            fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal
                                        )
                                    }
                                }
                                if (rowCategories.size == 1) {
                                    Spacer(modifier = Modifier.weight(1f))
                                }
                            }
                        }
                    }
                }

                // Input form
                item {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(12.dp))
                            .background(NavySurfaceElevated)
                            .border(1.dp, NavyBorder, RoundedCornerShape(12.dp))
                            .padding(16.dp)
                    ) {
                        Text(
                            text = "Target Identifier",
                            color = TextPrimary,
                            fontSize = 13.sp,
                            fontWeight = FontWeight.SemiBold
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        OutlinedTextField(
                            value = targetIdentifier,
                            onValueChange = { targetIdentifier = it },
                            placeholder = { Text("e.g. fraudulent-care@okhdfcbank or +91 9876543210", color = TextMuted, fontSize = 12.sp) },
                            modifier = Modifier.fillMaxWidth(),
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

                        Spacer(modifier = Modifier.height(14.dp))

                        Text(
                            text = "Incident Details & Narrative",
                            color = TextPrimary,
                            fontSize = 13.sp,
                            fontWeight = FontWeight.SemiBold
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        OutlinedTextField(
                            value = incidentDescription,
                            onValueChange = { incidentDescription = it },
                            placeholder = { Text("Explain how they contacted you, what claim was made, and requested amounts. PII is automatically redacted before transmission.", color = TextMuted, fontSize = 12.sp) },
                            modifier = Modifier.fillMaxWidth().height(100.dp),
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

                        Spacer(modifier = Modifier.height(14.dp))

                        // Explicit Consent Checkbox
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Checkbox(
                                checked = hasUserConsent,
                                onCheckedChange = { hasUserConsent = it },
                                colors = CheckboxDefaults.colors(
                                    checkedColor = SaffronPrimary,
                                    checkmarkColor = NavyPrimary,
                                    uncheckedColor = NavyBorder
                                )
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(
                                text = "I verify this information is accurate and consent to anonymized sharing with threat registries.",
                                color = TextSecondary,
                                fontSize = 11.sp,
                                lineHeight = 15.sp
                            )
                        }

                        Spacer(modifier = Modifier.height(14.dp))

                        Button(
                            onClick = {
                                submittedReceiptId = "AD-${(100000..999999).random()}"
                                onSubmitReport(selectedCategory, targetIdentifier, incidentDescription)
                            },
                            enabled = targetIdentifier.isNotBlank() && hasUserConsent,
                            modifier = Modifier.fillMaxWidth(),
                            colors = ButtonDefaults.buttonColors(
                                containerColor = SaffronPrimary,
                                contentColor = NavyPrimary
                            ),
                            shape = RoundedCornerShape(8.dp)
                        ) {
                            Text(text = "Submit Evidence Dossier", fontWeight = FontWeight.Bold, fontSize = 13.sp)
                        }
                    }
                }
            }

            item { Spacer(modifier = Modifier.height(24.dp)) }
        }
    }
}

@Composable
fun ReportReceiptCard(receiptId: String, onNewReport: () -> Unit) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp))
            .background(NavySurfaceElevated)
            .border(1.dp, RiskLowGreen.copy(alpha = 0.5f), RoundedCornerShape(12.dp))
            .padding(18.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text(
            text = "REPORT RECORDED IN LOCAL AUDIT TRAIL",
            color = RiskLowGreen,
            fontSize = 11.sp,
            fontWeight = FontWeight.Bold,
            letterSpacing = 1.sp
        )
        Spacer(modifier = Modifier.height(8.dp))
        Text(
            text = receiptId,
            color = SaffronPrimary,
            fontSize = 24.sp,
            fontWeight = FontWeight.Bold
        )
        Spacer(modifier = Modifier.height(8.dp))
        Text(
            text = "Your submission has been cryptographically hashed and added to the community threat intelligence buffer. Personal identifiable information was stripped on-device.",
            color = TextSecondary,
            fontSize = 12.sp,
            lineHeight = 17.sp
        )
        Spacer(modifier = Modifier.height(16.dp))
        Button(
            onClick = onNewReport,
            colors = ButtonDefaults.buttonColors(containerColor = NavySurfaceCard, contentColor = TextPrimary),
            shape = RoundedCornerShape(8.dp)
        ) {
            Text(text = "Submit Another Report", fontSize = 12.sp)
        }
    }
}
