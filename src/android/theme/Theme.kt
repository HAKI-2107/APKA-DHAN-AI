package com.apkadhan.ai.core.designsystem.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable

private val DarkColorScheme = darkColorScheme(
    primary = SaffronPrimary,
    onPrimary = NavyPrimary,
    primaryContainer = NavySurfaceCard,
    onPrimaryContainer = SaffronPrimary,
    secondary = SaffronVariant,
    onSecondary = NavyPrimary,
    background = NavyPrimary,
    onBackground = TextPrimary,
    surface = NavySurface,
    onSurface = TextPrimary,
    surfaceVariant = NavySurfaceElevated,
    onSurfaceVariant = TextSecondary,
    outline = NavyBorder,
    error = RiskHighRed,
    onError = TextPrimary
)

@Composable
fun ApkaDhanTheme(
    darkTheme: Boolean = true, // Navy-first design system
    content: @Composable () -> Unit
) {
    MaterialTheme(
        colorScheme = DarkColorScheme,
        typography = Typography,
        content = content
    )
}
