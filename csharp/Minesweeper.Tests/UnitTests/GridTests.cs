using MineSweeper.Engine;

namespace MineSweeper.Tests.UnitTests
{
    [TestFixture]
    public class GridTests
    {
        [Test]
        public void GridInitialization_CorrectSizeAndCells()
        {
            int size = 4;
            var grid = new Grid(size);
            Assert.Multiple(() =>
            {
                Assert.That(grid.Size, Is.EqualTo(size));
                Assert.That(grid.Cells, Is.Not.Null);
            });
        }

        [Test]
        public void GridInitialization_AllCellsNotMinedAndNotRevealed()
        {
            var grid = new Grid(4); // Example size of 4x4
            bool allCellsCorrect = true;
            for (int i = 0; i < grid.Size; i++)
            {
                for (int j = 0; j < grid.Size; j++)
                {
                    if (grid.Cells[i, j].IsMine || grid.Cells[i, j].IsRevealed)
                    {
                        allCellsCorrect = false;
                        break;
                    }
                }
                if (!allCellsCorrect) break;
            }
            Assert.That(allCellsCorrect, "All cells should be initialized without mines and not revealed.");
        }


        [Test]
        public void PlaceMines_CorrectNumberOfMinesPlaced()
        {
            var grid = new Grid(5); // 5x5 grid
            int numberOfMines = 5;
            grid.PlaceMines(numberOfMines);
            int mineCount = 0;

            foreach (var cell in grid.Cells)
            {
                if (cell.IsMine)
                    mineCount++;
            }

            Assert.That(mineCount, Is.EqualTo(numberOfMines), "The number of mines placed should match the specified amount.");
        }


        [Test]
        public void UncoverCell_NoAdjacentMines_UncoverSurroundingCells()
        {
            var grid = new Grid(3);
            grid.PlaceMinesManually([new(2, 2)]);
            grid.UncoverCell(0, 0); // Uncover the top-left corner, which should have no adjacent mines

            // Check surrounding cells are uncovered
            Assert.That(grid.Cells[0, 0].IsRevealed && grid.Cells[0, 1].IsRevealed && grid.Cells[1, 0].IsRevealed,
                "Surrounding cells should be automatically uncovered if no adjacent mines.");
        }
        
        [Test]
        public void InitializeCells_ShouldCreateCellsOfCorrectSize()
        {
            // Arrange
            int size = 5;
            var grid = new Grid(size);

            Assert.Multiple(() =>
            {
                // Act & Assert
                Assert.That(grid.Cells.GetLength(0), Is.EqualTo(size));
                Assert.That(grid.Cells.GetLength(1), Is.EqualTo(size));
            });
        }

        [Test]
        public void PlaceMines_ShouldPlaceCorrectNumberOfMines()
        {
            // Arrange
            int size = 5;
            int numberOfMines = 5;
            var grid = new Grid(size);

            // Act
            grid.PlaceMines(numberOfMines);

            int mineCount = 0;
            for (int i = 0; i < size; i++)
            {
                for (int j = 0; j < size; j++)
                {
                    if (grid.Cells[i, j].IsMine)
                    {
                        mineCount++;
                    }
                }
            }

            // Assert
            Assert.That(mineCount, Is.EqualTo(numberOfMines));
        }

        [Test]
        public void PlaceMinesManually_ShouldPlaceMinesAtSpecifiedPositions()
        {
            // Arrange
            int size = 5;
            var minePositions = new List<Point> { new(0, 0), new(1, 1), new(2, 2) };
            var grid = new Grid(size);

            // Act
            grid.PlaceMinesManually(minePositions);

            // Assert
            foreach (var position in minePositions)
            {
                Assert.That(grid.Cells[position.Row, position.Col].IsMine);
            }
        }

        [Test]
        public void UncoverCell_ShouldUncoverCellAndReturnCorrectCell()
        {
            // Arrange
            int size = 5;
            var grid = new Grid(size);
            int row = 2;
            int col = 2;

            // Act
            var uncoveredCell = grid.UncoverCell(row, col);

            Assert.Multiple(() =>
            {
                // Assert
                Assert.That(uncoveredCell.IsRevealed);
                Assert.That(uncoveredCell.AdjacentMines, Is.EqualTo(0));
            });
        }

        [Test]
        public void UncoverAdjacentCells_ShouldUncoverAdjacentCells()
        {
            // Arrange
            int size = 5;
            var grid = new Grid(size);
            int row = 2;
            int col = 2;

            // Act
            grid.UncoverAdjacentCells(row, col);

            // Assert
            for (int i = row - 1; i <= row + 1; i++)
            {
                for (int j = col - 1; j <= col + 1; j++)
                {
                    if (i >= 0 && i < size && j >= 0 && j < size)
                    {
                        Assert.That(grid.Cells[i, j].IsRevealed);
                    }
                }
            }
        }

        [Test]
        public void CountAdjacentMines_ShouldReturnCorrectCount()
        {
            // Arrange
            int size = 5;
            var grid = new Grid(size);
            int row = 2;
            int col = 2;

            // Act
            int adjacentMines = grid.CountAdjacentMines(row, col);

            // Assert
            Assert.That(adjacentMines, Is.EqualTo(0));
        }

        [Test]
        public void UncoverAdjacentCells_PointOverload_ShouldUncoverAdjacentCells()
        {
            // Arrange
            int size = 5;
            var grid = new Grid(size);
            var point = new Point(2, 2);

            // Act
            grid.UncoverAdjacentCells(point);

            // Assert
            for (int i = point.Row - 1; i <= point.Row + 1; i++)
            {
                for (int j = point.Col - 1; j <= point.Col + 1; j++)
                {
                    if (i >= 0 && i < size && j >= 0 && j < size)
                    {
                        Assert.That(grid.Cells[i, j].IsRevealed);
                    }
                }
            }
        }

        [Test]
        public void UncoverCell_PointOverload_ShouldUncoverCellAndReturnCorrectCell()
        {
            // Arrange
            int size = 5;
            var grid = new Grid(size);
            var point = new Point(2, 2);

            // Act
            var uncoveredCell = grid.UncoverCell(point);

            Assert.Multiple(() =>
            {
                // Assert
                Assert.That(uncoveredCell.IsRevealed);
                Assert.That(uncoveredCell.AdjacentMines, Is.EqualTo(0));
            });
        }

        [Test]
        public void CountAdjacentMines_PointOverload_ShouldReturnCorrectCount()
        {
            // Arrange
            int size = 5;
            var grid = new Grid(size);
            var point = new Point(2, 2);

            // Act
            int adjacentMines = grid.CountAdjacentMines(point);

            // Assert
            Assert.That(adjacentMines, Is.EqualTo(0));
        }

        [Test]
        public void GetCell_ShouldReturnCorrectCell()
        {
            // Arrange
            int size = 5;
            var grid = new Grid(size);
            int row = 2;
            int col = 2;

            // Act
            var cell = grid.GetCell(row, col);

            // Assert
            Assert.That(cell, Is.EqualTo(grid.Cells[row, col]));
        }

        [Test]
        public void GetCell_PointOverload_ShouldReturnCorrectCell()
        {
            // Arrange
            int size = 5;
            var grid = new Grid(size);
            var point = new Point(2, 2);

            // Act
            var cell = grid.GetCell(point);

            // Assert
            Assert.That(cell, Is.EqualTo(grid.Cells[point.Row, point.Col]));
        }
    }

}

