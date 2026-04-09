package org.minesweeper.engine

interface Game {
    val completed: Boolean
    val grid: Grid

    fun initialize()
    fun initialize(gridSize: Int, numberOfMines: Int)
    fun initialize(size: Int, minePositions: List<Point>)
    fun isGameLost(): Boolean
    fun isGameWon(): Boolean
    fun start()
    fun renderGrid()
    fun reset()
    fun selectCell(row: Int, col: Int): Cell
    fun selectCell(cell: Point): Cell
}