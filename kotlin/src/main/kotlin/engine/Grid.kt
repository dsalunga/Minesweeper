package org.minesweeper.engine

import kotlin.random.Random

class Grid(val rows: Int, val cols: Int) {
    constructor(size: Int) : this(size, size)

    val size: Int get() = rows
    val cells: Array<Array<Cell>> = Array(rows) { Array(cols) { Cell() } }
    var flagsPlaced: Int = 0
        private set

    fun placeMines(numberOfMines: Int) {
        var placed = 0
        while (placed < numberOfMines) {
            val row = Random.nextInt(rows)
            val col = Random.nextInt(cols)
            if (!cells[row][col].isMine) {
                cells[row][col].isMine = true
                placed++
            }
        }
        computeAdjacency()
    }

    // First-click safe: avoid 3x3 area around (safeRow, safeCol).
    fun placeMinesSafe(numberOfMines: Int, safeRow: Int, safeCol: Int) {
        val safe = mutableSetOf<Pair<Int, Int>>()
        for (dr in -1..1) for (dc in -1..1) {
            val r = safeRow + dr; val c = safeCol + dc
            if (r in 0 until rows && c in 0 until cols) safe.add(r to c)
        }
        val candidates = mutableListOf<Pair<Int, Int>>()
        for (r in 0 until rows) for (c in 0 until cols)
            if ((r to c) !in safe) candidates.add(r to c)
        candidates.shuffle(Random)
        val n = minOf(numberOfMines, candidates.size)
        for (i in 0 until n) {
            val (r, c) = candidates[i]
            cells[r][c].isMine = true
        }
        computeAdjacency()
    }

    fun placeMinesManually(minePositions: List<Point>) {
        minePositions.forEach { p ->
            if (p.row in 0 until rows && p.col in 0 until cols) cells[p.row][p.col].isMine = true
            else throw IndexOutOfBoundsException("Position out of grid bounds")
        }
        computeAdjacency()
    }

    private fun computeAdjacency() {
        for (r in 0 until rows) for (c in 0 until cols)
            if (!cells[r][c].isMine) cells[r][c].adjacentMines = countAdjacentMines(r, c)
    }

    fun uncoverCell(row: Int, col: Int): Cell {
        if (row !in 0 until rows || col !in 0 until cols)
            throw IndexOutOfBoundsException("Selected cell is out of the grid bounds")
        val cell = cells[row][col]
        if (cell.isRevealed || cell.isFlagged) return cell
        cell.isRevealed = true
        if (cell.isMine) return cell
        cell.adjacentMines = countAdjacentMines(row, col)
        if (cell.adjacentMines == 0) uncoverAdjacentCells(row, col)
        return cell
    }

    fun uncoverAdjacentCells(row: Int, col: Int) {
        for (i in row - 1..row + 1)
            for (j in col - 1..col + 1)
                if (i in 0 until rows && j in 0 until cols && !cells[i][j].isRevealed)
                    uncoverCell(i, j)
    }

    fun countAdjacentMines(row: Int, col: Int): Int {
        var count = 0
        for (i in -1..1) for (j in -1..1) {
            if (i == 0 && j == 0) continue
            val nr = row + i; val nc = col + j
            if (nr in 0 until rows && nc in 0 until cols && cells[nr][nc].isMine) count++
        }
        return count
    }

    fun toggleFlag(row: Int, col: Int) {
        val cell = cells[row][col]
        if (cell.isRevealed) return
        when {
            !cell.isFlagged && !cell.isQuestioned -> { cell.isFlagged = true; flagsPlaced++ }
            cell.isFlagged -> { cell.isFlagged = false; cell.isQuestioned = true; flagsPlaced-- }
            else -> { cell.isQuestioned = false }
        }
    }

    fun chordReveal(row: Int, col: Int): List<Cell> {
        val cell = cells[row][col]
        val revealed = mutableListOf<Cell>()
        if (!cell.isRevealed || cell.adjacentMines == 0) return revealed
        var flagged = 0
        val hidden = mutableListOf<Pair<Int, Int>>()
        for (i in -1..1) for (j in -1..1) {
            if (i == 0 && j == 0) continue
            val nr = row + i; val nc = col + j
            if (nr !in 0 until rows || nc !in 0 until cols) continue
            val n = cells[nr][nc]
            if (n.isFlagged) flagged++
            else if (!n.isRevealed) hidden.add(nr to nc)
        }
        if (flagged != cell.adjacentMines) return revealed
        for ((hr, hc) in hidden) revealed.add(uncoverCell(hr, hc))
        return revealed
    }

    fun revealAllMines() {
        for (r in 0 until rows) for (c in 0 until cols) {
            val cell = cells[r][c]
            if (cell.isMine && !cell.isFlagged) cell.isRevealed = true
            if (!cell.isMine && cell.isFlagged) { cell.wrongFlag = true; cell.isRevealed = true }
        }
    }

    fun uncoverAdjacentCells(point: Point) = uncoverAdjacentCells(point.row, point.col)
    fun uncoverCell(point: Point): Cell = uncoverCell(point.row, point.col)
    fun countAdjacentMines(point: Point): Int = countAdjacentMines(point.row, point.col)
    fun getCell(row: Int, col: Int): Cell = cells[row][col]
    fun getCell(point: Point): Cell = getCell(point.row, point.col)
}
