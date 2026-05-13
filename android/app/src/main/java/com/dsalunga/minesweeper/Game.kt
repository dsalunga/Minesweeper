package com.dsalunga.minesweeper

enum class CellState { Hidden, Revealed, Flagged, Questioned }
enum class GameStatus { Idle, Playing, Won, Lost }

class Cell(val row: Int, val col: Int) {
    var mine: Boolean = false
    var adjacent: Int = 0
    var state: CellState = CellState.Hidden
    var exploded: Boolean = false
    var wrongFlag: Boolean = false
}

data class Preset(val name: String, val rows: Int, val cols: Int, val mines: Int) {
    companion object {
        val Beginner = Preset("Beginner", 9, 9, 10)
        val Intermediate = Preset("Intermediate", 16, 16, 40)
        val Expert = Preset("Expert", 16, 30, 99)
        val All = listOf(Beginner, Intermediate, Expert)
    }
}

class Game(val preset: Preset) {
    val rows = preset.rows
    val cols = preset.cols
    val mines = preset.mines
    val cells: Array<Array<Cell>> = Array(rows) { r -> Array(cols) { c -> Cell(r, c) } }
    var flags = 0; private set
    var firstClick = true; private set
    var status: GameStatus = GameStatus.Idle; private set
    var startedAt: Long? = null; private set
    var endedAt: Long? = null; private set

    val minesRemaining get() = (mines - flags).coerceAtLeast(0)

    fun elapsedSeconds(now: Long): Int {
        val s = startedAt ?: return 0
        val end = if (status == GameStatus.Won || status == GameStatus.Lost) endedAt ?: now else now
        return ((end - s) / 1000L).coerceIn(0L, 999L).toInt()
    }

    private fun inB(r: Int, c: Int) = r in 0 until rows && c in 0 until cols

    private fun placeMines(sr: Int, sc: Int) {
        val safe = HashSet<Int>()
        for (dr in -1..1) for (dc in -1..1) if (inB(sr + dr, sc + dc)) safe.add((sr + dr) * cols + (sc + dc))
        val cands = ArrayList<Int>(rows * cols)
        for (r in 0 until rows) for (c in 0 until cols) {
            val k = r * cols + c
            if (k !in safe) cands.add(k)
        }
        cands.shuffle()
        for (i in 0 until minOf(mines, cands.size)) {
            val k = cands[i]
            cells[k / cols][k % cols].mine = true
        }
        for (r in 0 until rows) for (c in 0 until cols) {
            if (cells[r][c].mine) continue
            var n = 0
            for (dr in -1..1) for (dc in -1..1)
                if ((dr or dc) != 0 && inB(r + dr, c + dc) && cells[r + dr][c + dc].mine) n++
            cells[r][c].adjacent = n
        }
    }

    fun reveal(r: Int, c: Int) {
        if (status == GameStatus.Won || status == GameStatus.Lost) return
        val cell = cells[r][c]
        if (cell.state == CellState.Revealed || cell.state == CellState.Flagged) return
        if (firstClick) {
            placeMines(r, c)
            firstClick = false
            status = GameStatus.Playing
            startedAt = System.currentTimeMillis()
        }
        if (cell.mine) {
            cell.state = CellState.Revealed; cell.exploded = true
            revealAll(); status = GameStatus.Lost; endedAt = System.currentTimeMillis(); return
        }
        flood(r, c)
        if (checkWin()) { status = GameStatus.Won; endedAt = System.currentTimeMillis() }
    }

    private fun flood(r0: Int, c0: Int) {
        val stack = ArrayDeque<Int>()
        stack.addLast(r0 * cols + c0)
        while (stack.isNotEmpty()) {
            val k = stack.removeLast()
            val r = k / cols; val c = k % cols
            val cell = cells[r][c]
            if (cell.state == CellState.Revealed || cell.state == CellState.Flagged || cell.mine) continue
            cell.state = CellState.Revealed
            if (cell.adjacent > 0) continue
            for (dr in -1..1) for (dc in -1..1)
                if ((dr or dc) != 0 && inB(r + dr, c + dc))
                    stack.addLast((r + dr) * cols + (c + dc))
        }
    }

    fun toggleFlag(r: Int, c: Int) {
        if (status == GameStatus.Won || status == GameStatus.Lost) return
        val cell = cells[r][c]
        if (cell.state == CellState.Revealed) return
        when (cell.state) {
            CellState.Hidden -> { cell.state = CellState.Flagged; flags++ }
            CellState.Flagged -> { cell.state = CellState.Questioned; flags-- }
            CellState.Questioned -> cell.state = CellState.Hidden
            else -> Unit
        }
    }

    fun chord(r: Int, c: Int) {
        if (status != GameStatus.Playing) return
        val cell = cells[r][c]
        if (cell.state != CellState.Revealed || cell.adjacent == 0) return
        var flagged = 0
        val hidden = ArrayList<Pair<Int, Int>>()
        for (dr in -1..1) for (dc in -1..1) {
            if ((dr or dc) == 0) continue
            val nr = r + dr; val nc = c + dc
            if (!inB(nr, nc)) continue
            val n = cells[nr][nc]
            if (n.state == CellState.Flagged) flagged++
            else if (n.state != CellState.Revealed) hidden.add(nr to nc)
        }
        if (flagged != cell.adjacent) return
        for ((hr, hc) in hidden) { reveal(hr, hc); if (status == GameStatus.Lost) return }
    }

    private fun revealAll() {
        for (row in cells) for (c in row) {
            if (c.mine && c.state != CellState.Flagged) c.state = CellState.Revealed
            if (!c.mine && c.state == CellState.Flagged) { c.wrongFlag = true; c.state = CellState.Revealed }
        }
    }

    private fun checkWin(): Boolean {
        for (row in cells) for (c in row) if (!c.mine && c.state != CellState.Revealed) return false
        for (row in cells) for (c in row) if (c.mine && c.state != CellState.Flagged) {
            c.state = CellState.Flagged; flags++
        }
        return true
    }
}
