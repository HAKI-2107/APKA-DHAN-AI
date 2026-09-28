package com.apkadhan.ai.core.designsystem.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.apkadhan.ai.core.designsystem.theme.*
import com.apkadhan.ai.core.model.RiskLevel

@Composable
fun RiskBadge(
    riskLevel: RiskLevel,
    modifier: Modifier = Modifier
) {
    val (bgColor, textColor, borderColor) = when (riskLevel) {
        RiskLevel.LOW_RISK -> Triple(RiskLowGreenBg, RiskLowGreen, RiskLowGreen.copy(alpha = 0.5f))
        RiskLevel.MEDIUM_RISK -> Triple(RiskMediumAmberBg, RiskMediumAmber, RiskMediumAmber.copy(alpha = 0.5f))
        RiskLevel.HIGH_RISK -> Triple(RiskHighRedBg, RiskHighRed, RiskHighRed.copy(alpha = 0.5f))
        RiskLevel.UNKNOWN_UNVERIFIED -> Triple(RiskUnknownSlateBg, RiskUnknownSlate, RiskUnknownSlate.copy(alpha = 0.5f))
    }

    Box(
        modifier = modifier
            .clip(RoundedCornerShape(6.dp))
            .background(bgColor)
            .border(1.dp, borderColor, RoundedCornerShape(6.dp))
            .padding(horizontal = 8.dp, vertical = 4.dp)
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Box(
                modifier = Modifier
                    .size(6.dp)
                    .clip(RoundedCornerShape(3.dp))
                    .background(textColor)
            )
            Spacer(modifier = Modifier.width(6.dp))
            Text(
                text = riskLevel.label,
                color = textColor,
                fontSize = 11.sp,
                fontWeight = FontWeight.Bold,
                letterSpacing = 0.5.sp
            )
        }
    }
}
