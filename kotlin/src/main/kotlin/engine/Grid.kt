package org.minesweeper.engine

import kotlin.random.Random

class Grid(val size: Int) {
    val cells: Array<Array<Cell>> = Array(size) { Array(size) { Cell() } }

    init {
        initializeCells()
    }

    private fun initializeCells() {
        for (i in 0 until size) {
            for (j in 0 until size) {
                cells[i][j] = Cell()
            }
        }
    }

    fun placeMines(numberOfMines: Int) {
        repeat(numberOfMines) {
            var row: Int
            var col: Int
            do {
                row = Random.nextInt(size)
                col = Random.nextInt(size)
            } while (cells[row][col].isMine)
            cells[row][col].isMine = true
        }
    }

    // Manually place mines at specified positions
    fun placeMinesManually(minePositions: List<Point>) {
        minePositions.forEach { position ->
            val (row, col) = position
            if (row in 0 until size && col in 0 until size) {
                cells[row][col].isMine = true
            } else {
                throw IndexOutOfBoundsException("Position out of grid bounds")
            }
        }
    }

    fun uncoverCell(row: Int, col: Int): Cell {
        if (row !in 0 until size || col !in 0 until size) throw IndexOutOfBoundsException("Selected cell is out of the grid bounds")

        val cell = cells[row][col]
        if (cell.isRevealed) return cell // If the cell is already revealed, do nothing

        cell.isRevealed = true

        if (cell.isMine) return cell

        cell.adjacentMines = countAdjacentMines(row, col)
        if (cell.adjacentMines == 0) {
            // Automatically uncover all adjacent cells recursively if no adjacent mines
            uncoverAdjacentCells(row, col)
        }
        return cell
    }

    fun uncoverAdjacentCells(row: Int, col: Int) {
        for (i in row - 1..row + 1) {
            for (j in col - 1..col + 1) {
                if (i in 0 until size && j in 0 until size && !cells[i][j].isRevealed) {
                    uncoverCell(i, j)
                }
            }
        }
    }

    fun countAdjacentMines(row: Int, col: Int): Int {
        var mineCount = 0

        // Check all eight possible directions around the cell
        for (i in -1..1) {
            for (j in -1..1) {
                if (i == 0 && j == 0)
                    continue // Skip the current cell itself

                val newRow = row + i
                val newCol = col + j

                // Check if the new row and column are within the grid bounds
                if (newRow in 0 until size && newCol in 0 until size) {
                    if (cells[newRow][newCol].isMine) // Increment count if the cell is a mine
                    {
                        mineCount++
                    }
                }
            }
        }

        return mineCount
    }

    // Helper methods to simplify the API

    fun uncoverAdjacentCells(point: Point) {
        uncoverAdjacentCells(point.row, point.col)
    }

    fun uncoverCell(point: Point): Cell {
        return uncoverCell(point.row, point.col)
    }

    fun countAdjacentMines(point: Point): Int {
        return countAdjacentMines(point.row, point.col)
    }

    fun getCell(row: Int, col: Int): Cell {
        return cells[row][col]
    }

    fun getCell(point: Point): Cell {
        return getCell(point.row, point.col)
    }
}
