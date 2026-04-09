using MineSweeper.Engine;

namespace MineSweeper.Tests.UnitTests
{
    [TestFixture]
    public class GameTests
    {
        [Test]
        public void Initialize_WithGridSizeAndNumberOfMines_ShouldInitializeGridAndSetInitializedToTrue()
        {
            // Arrange
            var game = new TestGame();

            // Act
            game.Initialize(10, 20);

            // Assert
            Assert.Multiple(() =>
            {
                Assert.That(game.Grid, Is.Not.Null);
                Assert.That(game.Grid.Size, Is.EqualTo(10));
                Assert.That(game.Initialized);
            });
        }

        [Test]
        public void Initialize_WithSizeAndMinePositions_ShouldInitializeGridAndSetInitializedToTrue()
        {
            // Arrange
            var game = new TestGame();
            List<Point> minePositions = [new(0, 0), new(1, 1), new(2, 2)];

            // Act
            game.Initialize(5, minePositions);

            // Assert
            Assert.Multiple(() =>
            {
                Assert.That(game.Grid, Is.Not.Null);
                Assert.That(game.Grid.Size, Is.EqualTo(5));
                Assert.That(game.Initialized);
            });
        }

        [Test]
        public void Start_WhenGameNotInitialized_ShouldThrowInvalidOperationException()
        {
            // Arrange
            var game = new TestGame();

            // Act & Assert
            Assert.Throws<InvalidOperationException>(() => game.Start());
        }

        [Test]
        public void SelectCell_WhenCellIsMine_ShouldSetCompletedToTrueAndGameWonToFalse()
        {
            // Arrange
            var game = new TestGame();
            List<Point> minePositions = [new(0, 0)];

            // Act
            game.Initialize(10, minePositions);

            // Act
            var cell = game.SelectCell(0, 0);

            Assert.Multiple(() =>
            {
                // Assert
                Assert.That(game.Completed);
                Assert.That(game.IsGameWon(), Is.False);
                Assert.That(cell.IsMine);
            });
        }

        [Test]
        public void IsGameLost_WhenGameNotCompleted_ShouldReturnFalse()
        {
            // Arrange
            var game = new TestGame();

            // Act
            bool isGameLost = game.IsGameLost();

            // Assert
            Assert.That(isGameLost, Is.False);
        }

        private class TestGame : Game
        {
            public override void RenderGrid()
            {
                // Not implemented for testing purposes
            }

            public override void Initialize()
            {
                // Not implemented for testing purposes
            }

            protected override void StartGameRoutine()
            {
                // Not implemented for testing purposes
            }
        }
    }
}
