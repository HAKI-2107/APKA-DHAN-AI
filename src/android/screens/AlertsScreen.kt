package com.apkadhan.ai.feature.alerts

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
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
import com.apkadhan.ai.core.designsystem.components.EvidenceCard
import com.apkadhan.ai.core.designsystem.components.RiskBadge
import com.apkadhan.ai.core.designsystem.theme.*
import com.apkadhan.ai.core.model.AlertCategory
import com.apkadhan.ai.core.model.RiskDossier
import com.apkadhan.ai.core.model.SecurityAlertItem

@Composable
fun AlertsScreen(
    alerts: List<SecurityAlertItem>
) {
    var selectedCategory by remember { mutableStateOf<AlertCategory?>(null) }
    var expandedAlertId by remember { mutableStateOf<String?>(null) }

    val filteredAlerts = if (selectedCategory == null) {
        alerts
    } else {
        alerts.filter { it.category == selectedCategory }
    }

    Scaffold(
        topBar = {
            DhanTopBar(
                title = "THREAT ALERTS & ADVISORIES",
                subtitle = "RBI, SEBI & NPCI Security Circulars"
            )
        },
        containerColor = NavyPrimary
    ) { paddingValues ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .padding(horizontal = 16.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            item { Spacer(modifier = Modifier.height(4.dp)) }

            // Category filter chips
            item {
                LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    item {
                        FilterChip(
                            label = "All Categories",
                            isSelected = selectedCategory == null,
                            onClick = { selectedCategory = null }
                        )
                    }
                    items(AlertCategory.values()) { category ->
                        FilterChip(
                            label = category.displayName,
                            isSelected = selectedCategory == category,
                            onClick = { selectedCategory = category }
                        )
                    }
                }
            }

            // Alerts list
            items(filteredAlerts) { alert ->
                val isExpanded = expandedAlertId == alert.id

                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(12.dp))
                        .background(NavySurfaceElevated)
                        .border(1.dp, NavyBorder, RoundedCornerShape(12.dp))
                        .clickable {
                            expandedAlertId = if (isExpanded) null else alert.id
                        }
                        .padding(14.dp)
                ) {
                    Column {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = alert.category.displayName,
                                color = SaffronPrimary,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold
                            )
                            RiskBadge(riskLevel = alert.severity)
                        }
                        Spacer(modifier = Modifier.height(6.dp))
                        Text(
                            text = alert.title,
                            color = TextPrimary,
                            fontSize = 14.sp,
                            fontWeight = FontWeight.SemiBold
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = alert.summary,
                            color = TextSecondary,
                            fontSize = 12.sp,
                            lineHeight = 17.sp
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text(text = "Source: ${alert.source}", color = TextMuted, fontSize = 10.sp)
                            Text(text = alert.timeAgo, color = TextMuted, fontSize = 10.sp)
                        }

                        // Detailed expanded dossier
                        if (isExpanded) {
                            Spacer(modifier = Modifier.height(14.dp))
                            val dossier = RiskDossier(
                                identifier = alert.title,
                                riskLevel = alert.severity,
                                evidence = alert.evidence,
                                explanation = alert.summary,
                                source = alert.source,
                                confidence = "High (Confirmed Regulatory Directive)",
                                recommendedSteps = alert.recommendedSteps
                            )
                            EvidenceCard(dossier = dossier)
                        }
                    }
                }
            }

            item { Spacer(modifier = Modifier.height(24.dp)) }
        }
    }
}

@Composable
fun FilterChip(
    label: String,
    isSelected: Boolean,
    onClick: () -> Unit
) {
    Box(
        modifier = Modifier
            .clip(RoundedCornerShape(8.dp))
            .background(if (isSelected) SaffronPrimary else NavySurfaceCard)
            .border(1.dp, if (isSelected) SaffronPrimary else NavyBorder, RoundedCornerShape(8.dp))
            .clickable { onClick() }
            .padding(horizontal = 12.dp, vertical = 6.dp)
    ) {
        Text(
            text = label,
            color = if (isSelected) NavyPrimary else TextSecondary,
            fontSize = 11.sp,
            fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal
        )
    }
}
