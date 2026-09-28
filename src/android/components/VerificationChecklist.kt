package com.apkadhan.ai.core.designsystem.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.apkadhan.ai.core.designsystem.theme.*

@Composable
fun VerificationChecklist(
    steps: List<String>,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(8.dp))
            .background(NavySurfaceCard)
            .border(1.dp, NavyBorder, RoundedCornerShape(8.dp))
            .padding(12.dp)
    ) {
        Text(
            text = "RECOMMENDED VERIFICATION STEPS",
            color = SaffronPrimary,
            fontSize = 10.sp,
            fontWeight = FontWeight.Bold,
            letterSpacing = 0.5.sp
        )
        Text(
            text = "You remain the final decision-maker. Complete these checks before acting:",
            color = TextSecondary,
            fontSize = 11.sp,
            modifier = Modifier.padding(top = 2.dp, bottom = 8.dp)
        )

        steps.forEachIndexed { index, step ->
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 4.dp),
                verticalAlignment = Alignment.Top
            ) {
                Box(
                    modifier = Modifier
                        .size(16.dp)
                        .clip(RoundedCornerShape(4.dp))
                        .background(NavyBorder),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = "${index + 1}",
                        color = SaffronPrimary,
                        fontSize = 9.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = step,
                    color = TextPrimary,
                    fontSize = 12.sp,
                    lineHeight = 16.sp
                )
            }
        }
    }
}
