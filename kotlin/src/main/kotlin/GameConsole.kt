package org.minesweeper

import org.minesweeper.engine.BaseGame
import org.minesweeper.engine.Cell

class GameConsole : BaseGame() {
    private companion object {
        const val RESET = "\u001B[0m"
        const val BOLD = "\u001B[1m"
        const val RED = "\u001B[91m"
        const val GREEN = "\u001B[92m"
        const val YELLOW = "\u001B[93m"
        const val CYAN = "\u001B[96m"
        const val WHITE = "\u001B[97m"
        const val GRAY = "\u001B[90m"
        const val PURPLE = "\u001B[95m"
        const val ORANGE = "\u001B[38;5;208m"
        const val TEAL = "\u001B[38;5;44m"
        const val VIOLET = "\u001B[38;5;141m"
        const val BG_RED = "\u001B[48;5;124m"
        val NUM_COLOR = arrayOf("", CYAN, GREEN, RED, VIOLET, ORANGE, TEAL, WHITE, GRAY)
    }

    private var rowsCfg: Int = 9
    private var colsCfg: Int = 9
    private var minesCfg: Int = 10
    private var firstClick: Boolean = true
    private var startNanos: Long = 0L
    private var endNanos: Long = 0L

    override fun initialize() {
        println()
        println(c("   ╔══════════════════════════════════════════════╗", CYAN, BOLD))
        println(c("   ║   M I N E S W E E P E R   ·   K O T L I N    ║", CYAN, BOLD))
        println(c("   ╚══════════════════════════════════════════════╝", CYAN, BOLD))

        val (r, k, m) = askDifficulty()
        rowsCfg = r; colsCfg = k; minesCfg = m
        firstClick = true
        startNanos = 0L
        endNanos = 0L
        grid = org.minesweeper.engine.Grid(r, k)
        initialized = true
        completed = false
    }

    override fun runGameRoutine() {
        printHelp()
        while (true) {
            render()
            if (completed) {
                printOutcome()
                informReplay()
                return
            }
            print(c("\n› ", CYAN, BOLD))
            val line = readlnOrNull() ?: return
            val cmd = parseCommand(line)
            if (cmd == null) { println(c("Unknown command. Type 'h' for help.", RED)); continue }
            when (cmd.action) {
                "quit" -> return
                "help" -> printHelp()
                "new"  -> { reset(); initialize(); return }
                "flag" -> grid.toggleFlag(cmd.row, cmd.col)
                "chord" -> doChord(cmd.row, cmd.col)
                else   -> doReveal(cmd.row, cmd.col)
            }
        }
    }

    private fun doReveal(row: Int, col: Int) {
        val cell = grid.cells[row][col]
        if (cell.isRevealed || cell.isFlagged) return
        if (firstClick) {
            grid.placeMinesSafe(minesCfg, row, col)
            firstClick = false
            startNanos = System.nanoTime()
        }
        val c = grid.uncoverCell(row, col)
        if (c.isMine) {
            c.exploded = true
            grid.revealAllMines()
            completed = true
            endNanos = System.nanoTime()
            return
        }
        if (checkWin()) { completed = true; endNanos = System.nanoTime() }
    }

    private fun doChord(row: Int, col: Int) {
        if (firstClick) return
        val revealed = grid.chordReveal(row, col)
        for (c in revealed) {
            if (c.isMine) {
                c.exploded = true
                grid.revealAllMines()
                completed = true
                endNanos = System.nanoTime()
                return
            }
        }
        if (checkWin()) { completed = true; endNanos = System.nanoTime() }
    }

    private fun checkWin(): Boolean {
        for (r in 0 until grid.rows) for (c in 0 until grid.cols) {
            val cell = grid.cells[r][c]
            if (!cell.isMine && !cell.isRevealed) return false
        }
        for (r in 0 until grid.rows) for (c in 0 until grid.cols) {
            val cell = grid.cells[r][c]
            if (cell.isMine && !cell.isFlagged) cell.isFlagged = true
        }
        return true
    }

    override fun renderGrid() = render()

    private fun render() {
        val minesRemaining = maxOf(minesCfg - grid.flagsPlaced, 0)
        val elapsed = if (startNanos == 0L) 0
            else if (completed) ((endNanos - startNanos) / 1_000_000_000L).toInt()
            else ((System.nanoTime() - startNanos) / 1_000_000_000L).toInt()
        val face = if (completed) (if (isLost()) "(x_x)" else "(\u25D5\u203F\u25D5)") else "(\u2022_\u2022)"

        println()
        println(
            c("  \u2691 ${"%03d".format(minesRemaining)}", PURPLE, BOLD) + "   " +
            c(face, YELLOW, BOLD) + "   " +
            c("\u23F1 ${"%03d".format(elapsed.coerceAtMost(999))}", CYAN, BOLD)
        )

        print("    ")
        for (j in 0 until grid.cols) print(c(" ${'A' + j} ", YELLOW, BOLD))
        println()
        val border = "─".repeat(grid.cols * 3)
        println("   " + c("┌${border}┐", GRAY))
        for (r in 0 until grid.rows) {
            print(c("%2d ".format(r + 1), YELLOW, BOLD) + c("│", GRAY))
            for (col in 0 until grid.cols) print(renderCell(grid.cells[r][col]))
            println(c("│", GRAY))
        }
        println("   " + c("└${border}┘", GRAY))
    }

    private fun renderCell(cell: Cell): String = when {
        cell.wrongFlag -> c(" ✕ ", RED, BOLD)
        cell.isFlagged -> c(" ⚑ ", PURPLE, BOLD)
        cell.isQuestioned -> c(" ? ", YELLOW, BOLD)
        !cell.isRevealed -> c(" · ", GRAY)
        cell.isMine -> c(" ✱ ", if (cell.exploded) "$BG_RED$WHITE" else RED, BOLD)
        cell.adjacentMines == 0 -> "   "
        else -> c(" ${cell.adjacentMines} ", NUM_COLOR[cell.adjacentMines], BOLD)
    }

    private fun isLost(): Boolean {
        for (r in 0 until grid.rows) for (col in 0 until grid.cols)
            if (grid.cells[r][col].isMine && grid.cells[r][col].exploded) return true
        return false
    }

    private fun printOutcome() {
        if (isLost()) println(c("\n  💥  B O O M  💥", RED, BOLD))
        else {
            val s = ((endNanos - startNanos) / 1_000_000_000L).toInt()
            println(c("\n  ✨  V I C T O R Y  ✨", GREEN, BOLD))
            println(c("  Cleared in ${s}s", GREEN))
        }
    }

    private data class Difficulty(val rows: Int, val cols: Int, val mines: Int)

    private fun askDifficulty(): Difficulty {
        println(c("\nChoose difficulty:", BOLD, CYAN))
        println("  ${c("1", YELLOW, BOLD)}) Beginner       9 × 9    10 mines")
        println("  ${c("2", YELLOW, BOLD)}) Intermediate  16 × 16   40 mines")
        println("  ${c("3", YELLOW, BOLD)}) Expert        16 × 30   99 mines")
        println("  ${c("4", YELLOW, BOLD)}) Custom")
        while (true) {
            print(c("\nSelection: ", GREEN))
            when (readlnOrNull()?.trim()?.lowercase()) {
                "1", "b", "beginner" -> return Difficulty(9, 9, 10)
                "2", "i", "intermediate" -> return Difficulty(16, 16, 40)
                "3", "e", "expert" -> return Difficulty(16, 30, 99)
                "4", "c", "custom" -> return askCustom()
                else -> println(c("Please choose 1-4.", RED))
            }
        }
    }

    private fun askCustom(): Difficulty {
        val r = readInt("Rows (5-26): ", 5, 26)
        val k = readInt("Cols (5-26): ", 5, 26)
        val maxMines = r * k - 9
        val m = readInt("Mines (1-$maxMines): ", 1, maxMines)
        return Difficulty(r, k, m)
    }

    private fun readInt(prompt: String, min: Int, max: Int): Int {
        while (true) {
            print(c(prompt, GREEN))
            val v = readlnOrNull()?.trim()?.toIntOrNull()
            if (v != null && v in min..max) return v
            println(c("Please enter a number between $min and $max.", RED))
        }
    }

    private data class Command(val action: String, val row: Int, val col: Int)

    private fun parseCommand(text: String): Command? {
        var t = text.trim().lowercase()
        if (t.isEmpty()) return null
        if (t == "q" || t == "quit" || t == "exit") return Command("quit", 0, 0)
        if (t == "h" || t == "?" || t == "help") return Command("help", 0, 0)
        if (t == "n" || t == "new") return Command("new", 0, 0)

        var action = "reveal"
        if (t.length > 1 && t[0] == 'f') { action = "flag"; t = t.substring(1).trim() }
        else if (t.length > 1 && t[0] == 'c') { action = "chord"; t = t.substring(1).trim() }

        if (t.length < 2) return null
        val ch = t[0].uppercaseChar()
        if (ch < 'A' || ch > 'Z') return null
        val col = ch - 'A'
        val row = (t.substring(1).toIntOrNull() ?: return null) - 1
        if (row !in 0 until grid.rows || col !in 0 until grid.cols) return null
        return Command(action, row, col)
    }

    private fun printHelp() {
        println(c("\nCommands:", BOLD, CYAN))
        println("  A1, B5      reveal cell at column-letter row-number")
        println("  f A1        toggle flag on cell A1")
        println("  c A1        chord-reveal around a numbered cell")
        println("  n           new game · q quit · h help")
    }

    private fun informReplay() {
        print(c("\nPlay again? [Y/n] ", GREEN))
        val v = readlnOrNull()?.trim()?.lowercase()
        if (v == "n" || v == "no" || v == "q" || v == "quit") {
            println(c("\nThanks for playing!\n", CYAN, BOLD))
            kotlin.system.exitProcess(0)
        }
        reset()
        initialize()
        start()
    }

    private fun c(text: String, vararg codes: String): String =
        codes.joinToString("") + text + RESET
}
