package unittests

import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import org.minesweeper.engine.BaseGame
import org.minesweeper.engine.Point

internal class GameTests {

    @Test
    fun `Initialize with grid size and number of mines - Should initialize grid and set initialized to true`() {
        val game = TestGame()
        game.initialize(10, 20)

        assertAll("Initialization checks",
            { assertNotNull(game.grid) },
            { assertEquals(10, game.grid.size) },
            { assertTrue(game.initialized) }
        )
    }

    @Test
    fun `Initialize with size and mine positions - Should initialize grid and set initialized to true`() {
        val game = TestGame()
        val minePositions = listOf(Point(0, 0), Point(1, 1), Point(2, 2))
        game.initialize(5, minePositions)

        assertAll("Initialization checks",
            { assertNotNull(game.grid) },
            { assertEquals(5, game.grid.size) },
            { assertTrue(game.initialized) }
        )
    }

    @Test
    fun `Start when game not initialized - Should throw IllegalStateException`() {
        val game = TestGame()
        val exception = assertThrows<IllegalStateException> { game.start() }
        assertNotNull(exception)
    }

    @Test
    fun `Select cell when cell is mine - Should set completed to true and game won to false`() {
        val game = TestGame()
        val minePositions = listOf(Point(0, 0))
        game.initialize(10, minePositions)
        val cell = game.selectCell(0, 0)

        assertAll("Checking game state after mine trigger",
            { assertTrue(game.completed) },
            { assertFalse(game.isGameWon()) },
            { assertTrue(cell.isMine) }
        )
    }

    @Test
    fun `Is game lost when game not completed - Should return false`() {
        val game = TestGame()
        val isGameLost = game.isGameLost()

        assertFalse(isGameLost)
    }

    private class TestGame : BaseGame() {
        override fun renderGrid() {}
        override fun initialize() {}
        override fun runGameRoutine() {}
    }
}
