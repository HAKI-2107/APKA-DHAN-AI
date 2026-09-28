package com.apkadhan.ai.feature.crypto

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.apkadhan.ai.core.designsystem.components.DhanTopBar
import com.apkadhan.ai.core.designsystem.components.RiskBadge
import com.apkadhan.ai.core.designsystem.theme.*
import com.apkadhan.ai.core.model.CryptoHolding
import com.apkadhan.ai.core.model.RiskLevel

@Composable
fun CryptoScreen(
    cryptoHoldings: List<CryptoHolding>
) {
    Scaffold(
        topBar = {
            DhanTopBar(
                title = "CRYPTO ASSET RADAR",
                subtitle = "Contract Integrity & Liquidity Risk Engine"
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

            // 1. Crypto Allocation & Prudence Warning
            item {
                CryptoAllocationCard()
            }

            // 2. Active Crypto Threat Alert
            item {
                CryptoThreatBanner()
            }

            // 3. Tracked Assets Header
            item {
                Text(
                    text = "TRACKED CRYPTO ASSETS & CONTRACT INTEGRITY",
                    color = SaffronPrimary,
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 1.sp
                )
            }

            // 4. Crypto Holdings list
            items(cryptoHoldings) { crypto ->
                CryptoHoldingCard(crypto = crypto)
            }

            item { Spacer(modifier = Modifier.height(24.dp)) }
        }
    }
}

@Composable
fun CryptoAllocationCard() {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp))
            .background(NavySurfaceElevated)
            .border(1.dp, NavyBorder, RoundedCornerShape(12.dp))
            .padding(16.dp)
    ) {
        Column {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "TOTAL CRYPTO EXPOSURE",
                    color = SaffronPrimary,
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 0.5.sp
                )
                RiskBadge(riskLevel = RiskLevel.LOW_RISK)
            }
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = "₹1,28,400.00 (~$1,540)",
                color = TextPrimary,
                fontSize = 22.sp,
                fontWeight = FontWeight.Bold
            )
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = "Allocation: 6.5% of overall wealth. Within conservative risk boundaries (recommending < 10%).",
                color = TextSecondary,
                fontSize = 11.sp
            )
        }
    }
}

@Composable
fun CryptoThreatBanner() {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(10.dp))
            .background(NavySurfaceCard)
            .border(1.dp, NavyBorder, RoundedCornerShape(10.dp))
            .padding(12.dp)
    ) {
        Column {
            Text(
                text = "SECURITY NOTICE: DECENTRALIZED SCHEMES",
                color = SaffronPrimary,
                fontSize = 10.sp,
                fontWeight = FontWeight.Bold,
                letterSpacing = 0.5.sp
            )
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = "Smart contracts promising guaranteed daily returns or automated arbitrage bots carry extreme counterparty and honeypot risks. Apka Dhan AI does not execute crypto trades.",
                color = TextSecondary,
                fontSize = 11.sp,
                lineHeight = 16.sp
            )
        }
    }
}

@Composable
fun CryptoHoldingCard(crypto: CryptoHolding) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(10.dp))
            .background(NavySurfaceElevated)
            .border(1.dp, NavyBorder, RoundedCornerShape(10.dp))
            .padding(14.dp)
    ) {
        Column {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(text = crypto.symbol, color = TextPrimary, fontSize = 15.sp, fontWeight = FontWeight.Bold)
                    Text(text = crypto.name, color = TextMuted, fontSize = 11.sp)
                }
                Column(horizontalAlignment = Alignment.End) {
                    Text(text = "$${crypto.currentPriceUsd}", color = TextPrimary, fontSize = 14.sp, fontWeight = FontWeight.SemiBold)
                    Text(
                        text = if (crypto.change24h >= 0) "+${crypto.change24h}%" else "${crypto.change24h}%",
                        color = if (crypto.change24h >= 0) RiskLowGreen else RiskHighRed,
                        fontSize = 11.sp
                    )
                }
            }
            Spacer(modifier = Modifier.height(8.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(text = "Volatility: ${crypto.volatility}", color = TextSecondary, fontSize = 11.sp)
                Text(text = "Rank: #${crypto.marketCapRank}", color = TextSecondary, fontSize = 11.sp)
                Text(
                    text = if (crypto.honeypotRisk) "Honeypot: DANGER" else "Honeypot: Passed",
                    color = if (crypto.honeypotRisk) RiskHighRed else RiskLowGreen,
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Medium
                )
            }
            if (crypto.riskSignals.isNotEmpty()) {
                Spacer(modifier = Modifier.height(6.dp))
                crypto.riskSignals.forEach { signal ->
                    Text(
                        text = "• $signal",
                        color = RiskMediumAmber,
                        fontSize = 11.sp
                    )
                }
            }
        }
    }
}
