package com.apkadhan.ai.navigation

import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.apkadhan.ai.core.designsystem.theme.*

sealed class Screen(val route: String, val title: String, val icon: ImageVector) {
    object Home : Screen("home", "Home", Icons.Default.Home)
    object Protect : Screen("protect", "Protect", Icons.Default.Shield)
    object Investments : Screen("investments", "Investments", Icons.Default.TrendingUp)
    object Crypto : Screen("crypto", "Crypto", Icons.Default.CurrencyBitcoin)
    object Alerts : Screen("alerts", "Alerts", Icons.Default.Notifications)
    object Reports : Screen("reports", "Reports", Icons.Default.Report)
    object Settings : Screen("settings", "Settings", Icons.Default.Settings)
}

val BottomNavigationItems = listOf(
    Screen.Home,
    Screen.Protect,
    Screen.Investments,
    Screen.Crypto,
    Screen.Alerts,
    Screen.Reports,
    Screen.Settings
)

@Composable
fun ApkaDhanBottomNavigation(
    currentRoute: String,
    onNavigate: (String) -> Unit
) {
    NavigationBar(
        containerColor = NavySurface,
        contentColor = TextPrimary,
        tonalElevation = 8.dp
    ) {
        BottomNavigationItems.forEach { screen ->
            val isSelected = currentRoute == screen.route
            NavigationBarItem(
                selected = isSelected,
                onClick = { onNavigate(screen.route) },
                icon = {
                    Icon(
                        imageVector = screen.icon,
                        contentDescription = screen.title,
                        tint = if (isSelected) SaffronPrimary else TextSecondary
                    )
                },
                label = {
                    Text(
                        text = screen.title,
                        fontSize = 10.sp,
                        color = if (isSelected) SaffronPrimary else TextSecondary
                    )
                },
                colors = NavigationBarItemDefaults.colors(
                    indicatorColor = NavySurfaceElevated
                )
            )
        }
    }
}
