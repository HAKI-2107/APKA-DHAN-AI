package com.apkadhan.ai.feature.investments

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
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
import com.apkadhan.ai.core.designsystem.components.RiskBadge
import com.apkadhan.ai.core.designsystem.theme.*
import com.apkadhan.ai.core.model.RiskLevel
import com.apkadhan.ai.core.model.StockHolding

@Composable
fun InvestmentsScreen(
    stocksList: List<StockHolding>
) {
    var selectedTab by remember { mutableStateOf("Stocks") }

    Scaffold(
        topBar = {
            DhanTopBar(
                title = "INVESTMENT INTELLIGENCE",
                subtitle = "Portfolio Health & Concentration Audit"
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

            // 1. Portfolio Value Summary Card
            item {
                PortfolioValueOverviewCard()
            }

            // 2. Investment Risk Alerts Banner
            item {
                InvestmentRiskAlertsBanner()
            }

            // 3. Asset Allocation Breakdown
            item {
                AssetAllocationSection()
            }

            // 4. Tab Selector (Stocks / Mutual Funds / ETFs)
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    listOf("Stocks", "Mutual Funds", "ETFs").forEach { tab ->
                        val isSelected = selectedTab == tab
                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .clip(RoundedCornerShape(8.dp))
                                .background(if (isSelected) SaffronPrimary else NavySurfaceElevated)
                                .clickable { selectedTab = tab }
                                .padding(vertical = 10.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = tab,
                                color = if (isSelected) NavyPrimary else TextSecondary,
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }
                }
            }

            // 5. Holdings List
            items(stocksList) { stock ->
                StockHoldingCard(stock = stock)
            }

            item { Spacer(modifier = Modifier.height(24.dp)) }
        }
    }
}

@Composable
fun PortfolioValueOverviewCard() {
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
                text = "PORTFOLIO TOTAL NET VALUE",
                color = SaffronPrimary,
                fontSize = 11.sp,
                fontWeight = FontWeight.Bold,
                letterSpacing = 1.sp
            )
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = "₹18,45,200.00",
                color = TextPrimary,
                fontSize = 26.sp,
                fontWeight = FontWeight.Bold
            )
            Spacer(modifier = Modifier.height(12.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Column {
                    Text(text = "Invested Capital", color = TextMuted, fontSize = 11.sp)
                    Text(text = "₹14,20,000.00", color = TextPrimary, fontSize = 14.sp, fontWeight = FontWeight.SemiBold)
                }
                Column {
                    Text(text = "Unrealized P/L", color = TextMuted, fontSize = 11.sp)
                    Text(text = "+₹4,25,200.00 (+29.9%)", color = RiskLowGreen, fontSize = 14.sp, fontWeight = FontWeight.SemiBold)
                }
            }
        }
    }
}

@Composable
fun InvestmentRiskAlertsBanner() {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(10.dp))
            .background(RiskMediumAmberBg)
            .border(1.dp, RiskMediumAmber.copy(alpha = 0.5f), RoundedCornerShape(10.dp))
            .padding(12.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = "INVESTMENT RISK ALERTS (2)",
                color = RiskMediumAmber,
                fontSize = 11.sp,
                fontWeight = FontWeight.Bold,
                letterSpacing = 0.5.sp
            )
            RiskBadge(riskLevel = RiskLevel.MEDIUM_RISK)
        }
        Spacer(modifier = Modifier.height(6.dp))
        Text(
            text = "• High Promoter Pledge: VEDL (Vedanta Ltd) has 62.4% promoter shareholding pledged as loan collateral.",
            color = TextPrimary,
            fontSize = 11.sp,
            lineHeight = 16.sp
        )
        Spacer(modifier = Modifier.height(4.dp))
        Text(
            text = "• Concentration Warning: RELIANCE accounts for 28.5% of total equity holdings. Consider rebalancing.",
            color = TextPrimary,
            fontSize = 11.sp,
            lineHeight = 16.sp
        )
    }
}

@Composable
fun AssetAllocationSection() {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp))
            .background(NavySurfaceElevated)
            .border(1.dp, NavyBorder, RoundedCornerShape(12.dp))
            .padding(14.dp)
    ) {
        Text(
            text = "ASSET ALLOCATION SNAPSHOT",
            color = SaffronPrimary,
            fontSize = 11.sp,
            fontWeight = FontWeight.Bold,
            letterSpacing = 0.5.sp
        )
        Spacer(modifier = Modifier.height(10.dp))
        // Progress bar visual
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .height(8.dp)
                .clip(RoundedCornerShape(4.dp))
        ) {
            Box(modifier = Modifier.weight(0.58f).fillMaxHeight().background(SaffronPrimary))
            Box(modifier = Modifier.weight(0.24f).fillMaxHeight().background(RiskLowGreen))
            Box(modifier = Modifier.weight(0.10f).fillMaxHeight().background(GoldAccent))
            Box(modifier = Modifier.weight(0.08f).fillMaxHeight().background(RiskUnknownSlate))
        }
        Spacer(modifier = Modifier.height(8.dp))
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Text(text = "Equity (58%)", color = SaffronPrimary, fontSize = 11.sp)
            Text(text = "Mutual Funds (24%)", color = RiskLowGreen, fontSize = 11.sp)
            Text(text = "Gold SGB (10%)", color = GoldAccent, fontSize = 11.sp)
            Text(text = "Debt/FD (8%)", color = RiskUnknownSlate, fontSize = 11.sp)
        }
    }
}

@Composable
fun StockHoldingCard(stock: StockHolding) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(10.dp))
            .background(NavySurfaceElevated)
            .border(1.dp, NavyBorder, RoundedCornerShape(10.dp))
            .padding(12.dp)
    ) {
        Column {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(text = stock.symbol, color = TextPrimary, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                    Text(text = stock.name, color = TextMuted, fontSize = 11.sp)
                }
                Column(horizontalAlignment = Alignment.End) {
                    Text(text = "₹${stock.currentPrice}", color = TextPrimary, fontSize = 14.sp, fontWeight = FontWeight.SemiBold)
                    val pnl = (stock.currentPrice - stock.avgPrice) * stock.shares
                    Text(
                        text = if (pnl >= 0) "+₹${String.format("%.2f", pnl)}" else "-₹${String.format("%.2f", -pnl)}",
                        color = if (pnl >= 0) RiskLowGreen else RiskHighRed,
                        fontSize = 11.sp
                    )
                }
            }
            Spacer(modifier = Modifier.height(8.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(text = "P/E: ${stock.peRatio}", color = TextSecondary, fontSize = 11.sp)
                Text(text = "Debt/Eq: ${stock.debtToEquity}", color = TextSecondary, fontSize = 11.sp)
                Text(
                    text = "Pledge: ${stock.promoterPledgePercentage}%",
                    color = if (stock.promoterPledgePercentage > 50) RiskHighRed else TextSecondary,
                    fontSize = 11.sp,
                    fontWeight = if (stock.promoterPledgePercentage > 50) FontWeight.Bold else FontWeight.Normal
                )
            }
            if (stock.riskAlert != null) {
                Spacer(modifier = Modifier.height(6.dp))
                Text(
                    text = "Risk Signal: ${stock.riskAlert}",
                    color = RiskMediumAmber,
                    fontSize = 11.sp
                )
            }
        }
    }
}
