using MineSweeper.Engine;

namespace MineSweeper.Tests.UnitTests
{
    public class PointTests
    {
        [TestCase("A1", 5, 0, 0)]
        [TestCase("B2", 5, 1, 1)]
        [TestCase("E5", 5, 4, 4)]
        public void TryParse_ValidInput_ReturnsPoint(string? input, int gridSize, int expectedRow, int expectedCol)
        {
            // Arrange

            // Act
            var result = Point.TryParse(input, gridSize);

            // Assert
            Assert.That(result, Is.Not.Null);
            Assert.Multiple(() =>
            {
                Assert.That(result.Row, Is.EqualTo(expectedRow));
                Assert.That(result.Col, Is.EqualTo(expectedCol));
            });
        }

        [TestCase(null, 5)]
        [TestCase("", 5)]
        [TestCase("A", 5)]
        [TestCase("A11", 5)]
        [TestCase("F1", 5)]
        [TestCase("A6", 5)]
        public void TryParse_InvalidInput_ReturnsNull(string? input, int gridSize)
        {
            // Arrange

            // Act
            var result = Point.TryParse(input, gridSize);

            // Assert
            Assert.That(result, Is.Null);
        }
    }
}
