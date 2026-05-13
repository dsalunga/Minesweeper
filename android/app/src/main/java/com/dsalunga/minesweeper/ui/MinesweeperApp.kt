package com.dsalunga.minesweeper.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.verticalScroll
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.dsalunga.minesweeper.Cell
import com.dsalunga.minesweeper.CellState
import com.dsalunga.minesweeper.Game
import com.dsalunga.minesweeper.GameStatus
import com.dsalunga.minesweeper.Preset
import kotlinx.coroutines.delay

private val Bg = Color(0xFF0C1024)
private val Panel = Color(0xFF161A3A)
private val Panel2 = Color(0xFF1F2452)
private val Ink = Color(0xFFE9ECFF)
private val Muted = Color(0xFF8D92C7)
private val Accent = Color(0xFF4CC9F0)
private val Accent2 = Color(0xFFB388FF)
private val Danger = Color(0xFFFF5C8D)
private val Good = Color(0xFF6EF0A3)
private val Hidden = Color(0xFF353A78)
private val Revealed = Color(0xFF0F1330)
private val Mine = Color(0xFF2A0F1C)
private val Exploded = Color(0xFF6B0E2A)

private fun numberColor(n: Int): Color = when (n) {
    1 -> Accent
    2 -> Good
    3 -> Danger
    4 -> Accent2
    5 -> Color(0xFFFFB454)
    6 -> Color(0xFF4AD7D1)
    7 -> Ink
    else -> Muted
}

private val DarkScheme = darkColorScheme(
    primary = Accent, secondary = Accent2, background = Bg, surface = Panel
)

@Composable
fun MinesweeperApp() {
    MaterialTheme(colorScheme = DarkScheme) {
        Surface(color = Bg, modifier = Modifier.fillMaxSize()) {
            GameScreen()
        }
    }
}

@Composable
private fun GameScreen() {
    var preset by remember { mutableStateOf(Preset.Beginner) }
    var game by remember { mutableStateOf(Game(preset)) }
    var version by remember { mutableStateOf(0) }
    var flagMode by remember { mutableStateOf(false) }
    var now by remember { mutableStateOf(System.currentTimeMillis()) }

    LaunchedEffect(Unit) {
        while (true) { now = System.currentTimeMillis(); delay(250) }
    }

    fun bump() { version++ }
    fun reset(p: Preset) { preset = p; game = Game(p); bump() }

    Column(
        Modifier.fillMaxSize().padding(12.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(10.dp)
    ) {
        Text("MINE·SWEEPER · ANDROID", color = Accent, fontWeight = FontWeight.Bold, fontSize = 12.sp)

        Hud(game = game, now = now, version = version, onFace = { reset(preset) })

        PresetBar(current = preset, onSelect = { reset(it) })

        FilterChip(
            selected = flagMode,
            onClick = { flagMode = !flagMode },
            label = { Text(if (flagMode) "Flag mode (on)" else "Flag mode") },
            leadingIcon = { Text("⚑") }
        )

        Box(
            Modifier
                .weight(1f)
                .fillMaxWidth()
                .clip(RoundedCornerShape(12.dp))
                .background(Color(0xFF1B2050))
                .padding(8.dp),
            contentAlignment = Alignment.Center
        ) {
            Box(
                Modifier
                    .horizontalScroll(rememberScrollState())
                    .verticalScroll(rememberScrollState())
            ) {
                Board(game = game, version = version, flagMode = flagMode, onChange = { bump() })
            }

            if (game.status == GameStatus.Won || game.status == GameStatus.Lost) {
                Banner(game.status) { reset(preset) }
            }
        }

        Text(
            "Tap reveal · Long-press flag · Tap a number to chord",
            color = Muted, fontSize = 11.sp, textAlign = TextAlign.Center
        )
    }
}

@Composable
private fun Hud(game: Game, now: Long, version: Int, onFace: () -> Unit) {
    @Suppress("UNUSED_EXPRESSION") version  // recompose key
    Row(
        Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(14.dp))
            .background(Panel)
            .padding(12.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Counter(game.minesRemaining, Danger)
        Spacer(Modifier.weight(1f))
        Box(
            Modifier
                .size(56.dp)
                .clip(CircleShape)
                .background(Color(0xFFF5C518))
                .pointerInput(Unit) {
                    detectTapGestures(onTap = { onFace() })
                },
            contentAlignment = Alignment.Center
        ) {
            Text(
                when (game.status) {
                    GameStatus.Lost -> "X("
                    GameStatus.Won -> "B)"
                    else -> ":)"
                },
                fontWeight = FontWeight.Black, color = Color.Black, fontSize = 20.sp
            )
        }
        Spacer(Modifier.weight(1f))
        Counter(game.elapsedSeconds(now), Accent)
    }
}

@Composable
private fun Counter(value: Int, color: Color) {
    Box(
        Modifier
            .clip(RoundedCornerShape(8.dp))
            .background(Color(0xFF100020))
            .padding(horizontal = 12.dp, vertical = 6.dp)
    ) {
        Text(
            value.toString().padStart(3, '0'),
            color = color,
            fontFamily = FontFamily.Monospace,
            fontWeight = FontWeight.Black,
            fontSize = 22.sp
        )
    }
}

@Composable
private fun PresetBar(current: Preset, onSelect: (Preset) -> Unit) {
    Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
        Preset.All.forEach { p ->
            val active = p == current
            FilterChip(
                selected = active,
                onClick = { onSelect(p) },
                label = { Text(p.name) },
                colors = FilterChipDefaults.filterChipColors(
                    containerColor = Panel2,
                    selectedContainerColor = Accent,
                    selectedLabelColor = Color.Black
                )
            )
        }
    }
}

@Composable
private fun Board(game: Game, version: Int, flagMode: Boolean, onChange: () -> Unit) {
    @Suppress("UNUSED_EXPRESSION") version
    val size = if (game.cols > 16) 26 else 32
    Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
        for (r in 0 until game.rows) {
            Row(horizontalArrangement = Arrangement.spacedBy(2.dp)) {
                for (c in 0 until game.cols) {
                    CellView(
                        cell = game.cells[r][c], sizeDp = size,
                        onTap = {
                            if (flagMode) game.toggleFlag(r, c)
                            else {
                                val cell = game.cells[r][c]
                                if (cell.state == CellState.Revealed && cell.adjacent > 0) game.chord(r, c)
                                else game.reveal(r, c)
                            }
                            onChange()
                        },
                        onLong = { game.toggleFlag(r, c); onChange() }
                    )
                }
            }
        }
    }
}

@Composable
private fun CellView(cell: Cell, sizeDp: Int, onTap: () -> Unit, onLong: () -> Unit) {
    val bg = when {
        cell.state != CellState.Revealed -> Hidden
        cell.exploded -> Exploded
        cell.mine -> Mine
        else -> Revealed
    }
    val (label, color) = when {
        cell.wrongFlag -> "X" to Danger
        cell.state == CellState.Flagged -> "⚑" to Accent2
        cell.state == CellState.Questioned -> "?" to Color(0xFFFFB454)
        cell.state == CellState.Revealed && cell.mine -> "✱" to Danger
        cell.state == CellState.Revealed && cell.adjacent > 0 -> cell.adjacent.toString() to numberColor(cell.adjacent)
        else -> "" to Ink
    }
    Box(
        Modifier
            .size(sizeDp.dp)
            .clip(RoundedCornerShape(4.dp))
            .background(bg)
            .border(1.dp, Color(0x33000000), RoundedCornerShape(4.dp))
            .pointerInput(cell, label) {
                detectTapGestures(onTap = { onTap() }, onLongPress = { onLong() })
            },
        contentAlignment = Alignment.Center
    ) {
        if (label.isNotEmpty()) {
            Text(
                label, color = color, fontWeight = FontWeight.Black,
                fontFamily = FontFamily.Monospace,
                fontSize = (sizeDp * 0.55).sp
            )
        }
    }
}

@Composable
private fun Banner(status: GameStatus, onAgain: () -> Unit) {
    Box(
        Modifier
            .fillMaxSize()
            .background(Color(0xCC07091F)),
        contentAlignment = Alignment.Center
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Text(
                if (status == GameStatus.Won) "✨ VICTORY ✨" else "💥 BOOM 💥",
                color = if (status == GameStatus.Won) Good else Danger,
                fontWeight = FontWeight.Black, fontSize = 32.sp
            )
            Button(onClick = onAgain, colors = ButtonDefaults.buttonColors(containerColor = Accent, contentColor = Color.Black)) {
                Text("Play again", fontWeight = FontWeight.Bold)
            }
        }
    }
}
