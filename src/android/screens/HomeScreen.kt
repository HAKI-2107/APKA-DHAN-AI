package com.apkadhan.ai.feature.home

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.apkadhan.ai.core.designsystem.components.DhanTopBar
import com.apkadhan.ai.core.designsystem.components.RiskBadge
import com.apkadhan.ai.core.designsystem.theme.*
import com.apkadhan.ai.core.model.RiskLevel
import com.apkadhan.ai.core.model.SecurityAlertItem

@Composable
fun HomeScreen(
    onNavigateToProtect: (initialTool: String?) -> Unit,
    onNavigateToInvestments: () -> Unit,
    onNavigateToCrypto: () -> Unit,
    onNavigateToAlerts: () -> Unit,
    recentAlerts: List<SecurityAlertItem>
) {
    Scaffold(
        topBar = {
            DhanTopBar(
                title = "APKA DHAN AI",
                subtitle = "Financial Security & Intelligence Shield"
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

            // 1. Protection Status Shield Card
            item {
                ProtectionStatusCard()
            }

            // 2. Quick Security Checks Grid
            item {
                Text(
                    text = "QUICK VERIFICATION ACTIONS",
                    color = SaffronPrimary,
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 1.sp
                )
                Spacer(modifier = Modifier.height(8.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    QuickActionTile(
                        icon = Icons.Default.QrCodeScanner,
                        title = "Quick QR Scan",
                        modifier = Modifier.weight(1f),
                        onClick = { onNavigateToProtect("qr_scan") }
                    )
                    QuickActionTile(
                        icon = Icons.Default.Payment,
                        title = "Check UPI ID",
                        modifier = Modifier.weight(1f),
                        onClick = { onNavigateToProtect("upi_check") }
                    )
                }
                Spacer(modifier = Modifier.height(8.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    QuickActionTile(
                        icon = Icons.Default.Link,
                        title = "Check Link",
                        modifier = Modifier.weight(1f),
                        onClick = { onNavigateToProtect("link_check") }
                    )
                    QuickActionTile(
                        icon = Icons.Default.TrendingUp,
                        title = "Check Investment",
                        modifier = Modifier.weight(1f),
                        onClick = { onNavigateToProtect("investment_check") }
                    )
                }
            }

            // 3. Recent Security Alerts Preview
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "RECENT SECURITY ALERTS",
                        color = SaffronPrimary,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 1.sp
                    )
                    Text(
                        text = "View All →",
                        color = TextSecondary,
                        fontSize = 12.sp,
                        modifier = Modifier.clickable { onNavigateToAlerts() }
                    )
                }
            }

            items(recentAlerts.take(2)) { alert ->
                AlertPreviewCard(alert = alert, onClick = onNavigateToAlerts)
            }

            // 4. Portfolio Snapshot Card
            item {
                PortfolioSnapshotCard(onClick = onNavigateToInvestments)
            }

            // 5. Crypto Snapshot Card
            item {
                CryptoSnapshotCard(onClick = onNavigateToCrypto)
            }

            item { Spacer(modifier = Modifier.height(16.dp)) }
        }
    }
}

@Composable
fun ProtectionStatusCard() {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(14.dp))
            .background(NavySurfaceElevated)
            .border(1.dp, NavyBorder, RoundedCornerShape(14.dp))
            .padding(16.dp)
    ) {
        Column {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        modifier = Modifier
                            .size(10.dp)
                            .clip(RoundedCornerShape(5.dp))
                            .background(RiskLowGreen)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = "PROTECTION ACTIVE",
                        color = RiskLowGreen,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 0.5.sp
                    )
                }
                Text(
                    text = "SEBI / RBI Registry Synced",
                    color = TextMuted,
                    fontSize = 10.sp
                )
            }
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = "On-Device Transaction & Threat Shield",
                color = TextPrimary,
                fontSize = 17.sp,
                fontWeight = FontWeight.SemiBold
            )
            Text(
                text = "Heuristics and local threat filters active. Zero sensitive credentials collected.",
                color = TextSecondary,
                fontSize = 12.sp,
                modifier = Modifier.padding(top = 4.dp)
            )
        }
    }
}

@Composable
fun QuickActionTile(
    icon: ImageVector,
    title: String,
    modifier: Modifier = Modifier,
    onClick: () -> Unit
) {
    Box(
        modifier = modifier
            .clip(RoundedCornerShape(10.dp))
            .background(NavySurface)
            .border(1.dp, NavyBorder, RoundedCornerShape(10.dp))
            .clickable { onClick() }
            .padding(12.dp)
    ) {
        Column {
            Box(
                modifier = Modifier
                    .size(28.dp)
                    .clip(RoundedCornerShape(6.dp))
                    .background(SaffronPrimary.copy(alpha = 0.15f)),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = icon,
                    contentDescription = title,
                    tint = SaffronPrimary,
                    modifier = Modifier.size(16.dp)
                )
            }
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = title,
                color = TextPrimary,
                fontSize = 13.sp,
                fontWeight = FontWeight.Medium
            )
        }
    }
}

@Composable
fun AlertPreviewCard(alert: SecurityAlertItem, onClick: () -> Unit) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(10.dp))
            .background(NavySurface)
            .border(1.dp, NavyBorder, RoundedCornerShape(10.dp))
            .clickable { onClick() }
            .padding(12.dp)
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
                    fontWeight = FontWeight.SemiBold
                )
                RiskBadge(riskLevel = alert.severity)
            }
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = alert.title,
                color = TextPrimary,
                fontSize = 13.sp,
                fontWeight = FontWeight.SemiBold
            )
            Text(
                text = alert.summary,
                color = TextSecondary,
                fontSize = 11.sp,
                maxLines = 2,
                modifier = Modifier.padding(top = 2.dp)
            )
        }
    }
}

@Composable
fun PortfolioSnapshotCard(onClick: () -> Unit) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp))
            .background(NavySurfaceElevated)
            .border(1.dp, NavyBorder, RoundedCornerShape(12.dp))
            .clickable { onClick() }
            .padding(14.dp)
    ) {
        Column {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "PORTFOLIO SAFETY SNAPSHOT",
                    color = SaffronPrimary,
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 0.5.sp
                )
                RiskBadge(riskLevel = RiskLevel.MEDIUM_RISK)
            }
            Spacer(modifier = Modifier.height(8.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Column {
                    Text(text = "Total Portfolio Value", color = TextMuted, fontSize = 11.sp)
                    Text(text = "₹18,45,200", color = TextPrimary, fontSize = 18.sp, fontWeight = FontWeight.Bold)
                }
                Column(horizontalAlignment = Alignment.End) {
                    Text(text = "Unrealized P/L", color = TextMuted, fontSize = 11.sp)
                    Text(text = "+₹4,25,200 (+29.9%)", color = RiskLowGreen, fontSize = 14.sp, fontWeight = FontWeight.SemiBold)
                }
            }
            Spacer(modifier = Modifier.height(6.dp))
            Text(
                text = "Notice: 1 stock has promoter pledge > 60%. Concentration in single asset is 28.5%.",
                color = RiskMediumAmber,
                fontSize = 11.sp
            )
        }
    }
}

@Composable
fun CryptoSnapshotCard(onClick: () -> Unit) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp))
            .background(NavySurfaceElevated)
            .border(1.dp, NavyBorder, RoundedCornerShape(12.dp))
            .clickable { onClick() }
            .padding(14.dp)
    ) {
        Column {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "CRYPTO RISK RADAR",
                    color = SaffronPrimary,
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 0.5.sp
                )
                RiskBadge(riskLevel = RiskLevel.LOW_RISK)
            }
            Spacer(modifier = Modifier.height(8.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Column {
                    Text(text = "Crypto Allocation", color = TextMuted, fontSize = 11.sp)
                    Text(text = "6.5% of Net Assets", color = TextPrimary, fontSize = 16.sp, fontWeight = FontWeight.Bold)
                }
                Column(horizontalAlignment = Alignment.End) {
                    Text(text = "Honeypot Checks", color = TextMuted, fontSize = 11.sp)
                    Text(text = "0 Contracts Flagged", color = RiskLowGreen, fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
                }
            }
        }
    }
}
