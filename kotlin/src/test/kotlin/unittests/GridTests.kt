package unittests

import org.minesweeper.engine.Grid
import org.minesweeper.engine.Point

import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.Test

internal class GridTests {

    @Test
    fun `Grid initialization - Correct size and cells`() {
        val size = 4
        val grid = Grid(size)
        assertAll("Checking grid initialization",
            { assertEquals(size, grid.size) },
            { assertNotNull(grid.cells) }
        )
    }

    @Test
    fun `Grid initialization - All cells not mined and not revealed`() {
        val grid = Grid(4)  // Example size of 4x4
        val allCellsCorrect = grid.cells.all { row -> row.all { cell -> !cell.isMine && !cell.isRevealed } }
        assertTrue(allCellsCorrect, "All cells should be initialized without mines and not revealed.")
    }

    @Test
    fun `Place mines - Correct number of mines placed`() {
        val grid = Grid(5)  // 5x5 grid
        val numberOfMines = 5
        grid.placeMines(numberOfMines)
        val mineCount = grid.cells.flatten().count { it.isMine }
        assertEquals(numberOfMines, mineCount, "The number of mines placed should match the specified amount.")
    }

    @Test
    fun `Uncover cell - No adjacent mines, uncover surrounding cells`() {
        val grid = Grid(3)
        grid.placeMinesManually(listOf(Point(2, 2)))  // Only mine at the bottom-right corner
        grid.uncoverCell(0, 0)  // Uncover the top-left corner, which should have no adjacent mines

        // Check surrounding cells are uncovered
        assertTrue(grid.cells[0][0].isRevealed && grid.cells[0][1].isRevealed && grid.cells[1][0].isRevealed,
            "Surrounding cells should be automatically uncovered if no adjacent mines.")
    }

    @Test
    fun `Initialize cells - Should create cells of correct size`() {
        val size = 5
        val grid = Grid(size)
        assertAll("Checking cell array dimensions",
            { assertEquals(size, grid.cells.size) },
            { assertTrue(grid.cells.all { it.size == size }) }
        )
    }

    @Test
    fun `Place mines manually - Should place mines at specified positions`() {
        val size = 5
        val minePositions = listOf(Point(0, 0), Point(1, 1), Point(2, 2))
        val grid = Grid(size)
        grid.placeMinesManually(minePositions)

        minePositions.forEach { position ->
            assertTrue(grid.cells[position.row][position.col].isMine, "Mine should be placed at (${position.row}, ${position.col})")
        }
    }

    @Test
    fun `Uncover cell - Should uncover cell and return correct cell`() {
        val size = 5
        val grid = Grid(size)
        val row = 2
        val col = 2

        val uncoveredCell = grid.uncoverCell(row, col)
        assertAll("Checking uncovered cell properties",
            { assertTrue(uncoveredCell.isRevealed) },
            { assertEquals(0, uncoveredCell.adjacentMines) }
        )
    }

    @Test
    fun `Uncover adjacent cells - Should uncover adjacent cells`() {
        val size = 5
        val grid = Grid(size)
        val row = 2
        val col = 2

        grid.uncoverAdjacentCells(row, col)
        for (i in row - 1..row + 1) {
            for (j in col - 1..col + 1) {
                if (i in 0 until size && j in 0 until size) {
                    assertTrue(grid.cells[i][j].isRevealed, "Cell at ($i, $j) should be uncovered")
                }
            }
        }
    }

    @Test
    fun `Count adjacent mines - Should return correct count`() {
        val size = 5
        val grid = Grid(size)
        val row = 2
        val col = 2

        val adjacentMines = grid.countAdjacentMines(row, col)
        assertEquals(0, adjacentMines, "Should count zero adjacent mines for cell at (2, 2)")
    }

    @Test
    fun `Uncover adjacent cells - Point overload - Should uncover adjacent cells`() {
        val size = 5
        val grid = Grid(size)
        val point = Point(2, 2)

        grid.uncoverAdjacentCells(point)
        for (i in point.row - 1..point.row + 1) {
            for (j in point.col - 1..point.col + 1) {
                if (i in 0 until size && j in 0 until size) {
                    assertTrue(grid.cells[i][j].isRevealed, "Cell at ($i, $j) should be uncovered")
                }
            }
        }
    }

    @Test
    fun `Uncover cell - Point overload - Should uncover cell and return correct cell`() {
        val size = 5
        val grid = Grid(size)
        val point = Point(2, 2)

        val uncoveredCell = grid.uncoverCell(point)
        assertAll("Checking uncovered cell properties using Point overload",
            { assertTrue(uncoveredCell.isRevealed) },
            { assertEquals(0, uncoveredCell.adjacentMines) }
        )
    }

    @Test
    fun `Count adjacent mines - Point overload - Should return correct count`() {
        val size = 5
        val grid = Grid(size)
        val point = Point(2, 2)

        val adjacentMines = grid.countAdjacentMines(point)
        assertEquals(0, adjacentMines, "Should count zero adjacent mines for cell at (2, 2) using Point overload")
    }

    @Test
    fun `Get cell - Should return correct cell`() {
        val size = 5
        val grid = Grid(size)
        val row = 2
        val col = 2

        val cell = grid.getCell(row, col)
        assertEquals(grid.cells[row][col], cell, "Should return the correct cell at (2, 2)")
    }

    @Test
    fun `Get cell - Point overload - Should return correct cell`() {
        val size = 5
        val grid = Grid(size)
        val point = Point(2, 2)

        val cell = grid.getCell(point)
        assertEquals(grid.cells[point.row][point.col], cell, "Should return the correct cell at (2, 2) using Point overload")
    }
}
