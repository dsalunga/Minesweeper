package org.minesweeper.engine

abstract class BaseGame : Game {
    companion object {
        const val MIN_GRID_SIZE = 4 // Set the minimum grid size to 4x4 as lower sizes are not practical
        const val MAX_GRID_SIZE = 26 // Set the maximum grid size to 26x26 as it's the maximum for the English alphabet
        const val MAX_MINES_PCT = 0.35 // Maximum 35% of mines in the grid, in decimal equivalent
    }

    override lateinit var grid: Grid
    var initialized = false
    override var completed = false
    private var gameWon = false

    abstract override fun renderGrid()
    abstract override fun initialize()
    protected abstract fun runGameRoutine()

    // Initialize the game with a specified grid size and number of mines
    override fun initialize(gridSize: Int, numberOfMines: Int) {
        grid = Grid(gridSize)
        grid.placeMines(numberOfMines)
        initialized = true
    }

    // Initialize the game with a specific grid size and predefined mine positions
    override fun initialize(size: Int, minePositions: List<Point>) {
        grid = Grid(size)
        grid.placeMinesManually(minePositions)
        initialized = true
    }

    override fun start() {
        if (!initialized)
            throw IllegalStateException("Game has not been initialized.")
        if (completed)
            throw IllegalStateException("Game has already been completed.")

        runGameRoutine()
    }

    override fun reset() {
        initialized = false
        completed = false
        gameWon = false
    }

    override fun selectCell(row: Int, col: Int): Cell {
        val cell = grid.uncoverCell(row, col)
        if (cell.isMine) {
            completed = true // The game ends as the player hit a mine
            gameWon = false
        }
        return cell
    }

    // Checks if all non-mine cells have been revealed
    override fun isGameWon(): Boolean {
        if (completed)
            return gameWon // Return the cached value to avoid re-evaluating all cells

        for (i in 0 until grid.size) {
            for (j in 0 until grid.size) {
                val cell = grid.cells[i][j]
                if (!cell.isMine && !cell.isRevealed) {
                    return false // If there's any non-mine cell not revealed, the game is not yet won
                }
            }
        }

        completed = true
        gameWon = true
        return true // All non-mine cells are revealed, player wins
    }

    override fun isGameLost(): Boolean {
        if (!completed)
            return false

        return !gameWon
    }

    // Helper method to simplify selecting a cell based on user input

    override fun selectCell(cell: Point): Cell = selectCell(cell.row, cell.col)
}
