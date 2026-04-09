package e2etests

import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import org.minesweeper.GameConsole
import org.minesweeper.engine.Point

internal class MineSweeperTests {

    @Test
    fun `Test game flow - Win scenario all non-mine cells selected`() {
        val game = GameConsole()
        game.initialize(4, listOf(Point(0, 0), Point(1, 1), Point(2, 2), Point(3, 3)))
        val nonMineCells = listOf(Point(0, 1), Point(0, 2), Point(0, 3), Point(1, 0), Point(1, 2), Point(1, 3), Point(2, 0), Point(2, 1), Point(2, 3), Point(3, 0), Point(3, 1), Point(3, 2))
        nonMineCells.forEach { game.selectCell(it) }
        assertTrue(game.isGameWon(), "The game should be won when all non-mine cells are uncovered.")
    }

    @Test
    fun `Test game flow - Win scenario revealing adjacent cells`() {
        val game = GameConsole()
        game.initialize(4, listOf(Point(3, 3)))
        game.selectCell(0, 0)  // Safe, will reveal adjacent cells with no adjacent mines

        assertAll("Check if adjacent cells are revealed",
            { assertTrue(game.grid.getCell(0, 1).isRevealed) },
            { assertTrue(game.grid.getCell(1, 0).isRevealed) },
            { assertTrue(game.grid.getCell(1, 1).isRevealed) },
            { assertTrue(game.isGameWon()) }
        )
    }

    @Test
    fun `Test game flow - Loss scenario`() {
        val game = GameConsole()
        game.initialize(4, listOf(Point(0, 1), Point(1, 3)))
        game.selectCell(0, 1)
        assertTrue(game.isGameLost(), "The game should be over after a mine is uncovered.")
    }

    @Test
    fun `Test game flow - Invalid cell selection`() {
        val game = GameConsole()
        game.initialize(4, listOf(Point(1, 1)))
        assertThrows<IndexOutOfBoundsException> { game.selectCell(5, 5) }
    }

    @Test
    fun `Test game flow - Reveal mine cell`() {
        val game = GameConsole()
        game.initialize(4, listOf(Point(2, 2)))
        game.selectCell(2, 2)
        assertTrue(game.isGameLost(), "The game should be lost after selecting a mine cell.")
    }

    @Test
    fun `Test game flow - Uninitialized game`() {
        val game = GameConsole()
        assertThrows<IllegalStateException> { game.start() }
    }
}
