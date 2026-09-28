package com.apkadhan.ai.core.designsystem.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.Icon
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
import com.apkadhan.ai.core.model.RiskDossier

@Composable
fun EvidenceCard(
    dossier: RiskDossier,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp))
            .background(NavySurfaceElevated)
            .border(1.dp, NavyBorder, RoundedCornerShape(12.dp))
            .padding(16.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text(
                    text = "TARGET IDENTIFIER",
                    color = TextMuted,
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 1.sp
                )
                Text(
                    text = dossier.identifier,
                    color = TextPrimary,
                    fontSize = 15.sp,
                    fontWeight = FontWeight.SemiBold
                )
            }
            RiskBadge(riskLevel = dossier.riskLevel)
        }

        Spacer(modifier = Modifier.height(12.dp))

        // Explanation Block
        Text(
            text = dossier.explanation,
            color = TextSecondary,
            fontSize = 13.sp,
            lineHeight = 19.sp
        )

        Spacer(modifier = Modifier.height(14.dp))

        // Metadata: Source & Confidence
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(6.dp))
                .background(NavySurface)
                .padding(8.dp),
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Text(
                text = "Source: ${dossier.source}",
                color = SaffronPrimary,
                fontSize = 11.sp,
                fontWeight = FontWeight.Medium
            )
            Text(
                text = "Confidence: ${dossier.confidence}",
                color = TextMuted,
                fontSize = 11.sp
            )
        }

        Spacer(modifier = Modifier.height(12.dp))

        // Evidence list
        Text(
            text = "EVIDENCE SIGNALS",
            color = SaffronPrimary,
            fontSize = 11.sp,
            fontWeight = FontWeight.Bold,
            letterSpacing = 0.5.sp
        )
        Spacer(modifier = Modifier.height(6.dp))
        dossier.evidence.forEach { signal ->
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 3.dp),
                verticalAlignment = Alignment.Top
            ) {
                Text(
                    text = "•",
                    color = SaffronVariant,
                    fontSize = 14.sp,
                    modifier = Modifier.padding(end = 8.dp)
                )
                Text(
                    text = signal,
                    color = TextPrimary,
                    fontSize = 12.sp,
                    lineHeight = 17.sp
                )
            }
        }

        Spacer(modifier = Modifier.height(14.dp))

        // Recommended Verification Steps
        VerificationChecklist(steps = dossier.recommendedSteps)
    }
}
