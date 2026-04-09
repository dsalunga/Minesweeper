using MineSweeper;
using MineSweeper.Engine;

namespace MineSweeper.Tests.E2ETests
{
    [TestFixture]
    public class MinesweeperTests
    {
        [Test]
        public void TestGameFlow_WinScenario_AllNonMineCellsSelected()
        {
            // Assuming there's a setup or constructor that initializes the game
            var game = new GameConsole();
            game.Initialize(4, [new(0, 0), new(1, 1), new(2, 2), new(3, 3)]);

            // Simulate selecting all non-mine cells
            var nonMineCells = new Point[] { new(0, 1), new(0, 2), new(0, 3), new(1, 0), new(1, 2), new(1, 3), new(2, 0), new(2, 1), new(2, 3), new(3, 0), new(3, 1), new(3, 2) };
            foreach (var cell in nonMineCells)
            {
                game.SelectCell(cell);
            }

            // Assert that the game is won
            Assert.That(game.IsGameWon(), "The game should be won when all non-mine cells are uncovered.");
        }


        [Test]
        public void TestGameFlow_WinScenario_RevealingAdjacentCells()
        {
            // Setup game with predetermined mine locations for repeatability
            var game = new GameConsole();
            game.Initialize(4, [new(3, 3)]);

            // Simulate user interactions
            game.SelectCell(0, 0); // Safe, will reveal adjacent cells with no adjacent mines
            game.SelectCell(2, 3); // Safe
            game.SelectCell(2, 2); // Safe
            game.SelectCell(3, 2); // Safe

            Assert.Multiple(() =>
            {
                // Assert that the adjacent cells are correctly revealed
                Assert.That(game.Grid.GetCell(0, 1).IsRevealed, "The adjacent cell (0, 1) should be revealed.");
                Assert.That(game.Grid.GetCell(1, 0).IsRevealed, "The adjacent cell (1, 0) should be revealed.");
                Assert.That(game.Grid.GetCell(1, 1).IsRevealed, "The adjacent cell (1, 1) should be revealed.");

                // Assert the game is won
                Assert.That(game.IsGameWon());
            });
        }

        [Test]
        public void TestGameFlow_LossScenario()
        {
            // Set up the game with known mine positions
            var game = new GameConsole();
            game.Initialize(4, [new(0, 1), new(1, 3)]);

            // Act by selecting the cell with a mine
            game.SelectCell(0, 1);

            // Assert that the game is over
            Assert.That(game.IsGameLost(), "The game should be over after a mine is uncovered.");
        }

        [Test]
        public void TestGameFlow_InvalidCellSelection()
        {
            // Set up the game with known mine positions
            var game = new GameConsole();
            game.Initialize(4, [new(1, 1)]);

            // Act by selecting an invalid cell & Assert that an exception is thrown
            Assert.Throws<ArgumentOutOfRangeException>(() => game.SelectCell(5, 5), "An invalid cell selection should throw an exception.");
        }

        [Test]
        public void TestGameFlow_RevealMineCell()
        {
            // Set up the game with known mine positions
            var game = new GameConsole();
            game.Initialize(4, [new(2, 2)]);

            // Act by selecting a mine cell
            game.SelectCell(2, 2);

            // Assert that the game is lost
            Assert.That(game.IsGameLost(), "The game should be lost after selecting a mine cell.");
        }

        [Test]
        public void TestGameFlow_UninitializedGame()
        {
            var game = new GameConsole();
            Assert.Throws<InvalidOperationException>(() => game.Start(), "An uninitialized game should throw an exception when started.");
        }
    }
}

