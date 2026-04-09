namespace MineSweeper.Engine
{
    // Represents a point or a position on the game grid
    public class Point(int row, int col)
    {
        public int Row { get; private set; } = row;
        public int Col { get; private set; } = col;

        public override string ToString()
        {
            return $"({Row}, {Col})";
        }

        public static Point? TryParse(string? input, int gridSize)
        {
            if (string.IsNullOrWhiteSpace(input))
                return null; // Input cannot be null or empty.

            input = input.ToUpper().Trim();
            if (input.Length < 2 || input.Length > 3)
                return null; // Invalid input format.

            int row = input[0] - 'A';
            int col = int.Parse(input.Substring(1)) - 1;

            if (row < 0 || row >= gridSize || col < 0 || col >= gridSize)
                return null; // Input out of grid bounds.

            return new Point(row, col);
        }
    }

}
