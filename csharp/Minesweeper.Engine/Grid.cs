namespace MineSweeper.Engine
{
    public class Grid
    {
        public int Size { get; private set; }
        public Cell[,] Cells { get; private set; }

        public Grid(int size)
        {
            Size = size;
            Cells = new Cell[size, size];
            InitializeCells();
        }

        private void InitializeCells()
        {
            for (int i = 0; i < Size; i++)
            {
                for (int j = 0; j < Size; j++)
                {
                    Cells[i, j] = new Cell();
                }
            }
        }

        public void PlaceMines(int numberOfMines)
        {
            var rand = new Random();
            for (int i = 0; i < numberOfMines; i++)
            {
                int row, col;
                do
                {
                    row = rand.Next(Size);
                    col = rand.Next(Size);
                } while (Cells[row, col].IsMine);
                Cells[row, col].IsMine = true;
            }
        }

        // Manually place mines at specified positions
        public void PlaceMinesManually(List<Point> minePositions)
        {
            foreach (var position in minePositions)
            {
                int row = position.Row;
                int col = position.Col;
                if (row >= 0 && row < Size && col >= 0 && col < Size)
                {
                    Cells[row, col].IsMine = true;
                }
                else
                {
                    throw new ArgumentOutOfRangeException("Position out of grid bounds");
                }
            }
        }

        public Cell UncoverCell(int row, int col)
        {
            if (row < 0 || row >= Size || col < 0 || col >= Size)
                throw new ArgumentOutOfRangeException("Selected cell is out of the grid bounds.");

            var cell = Cells[row, col];
            
            if (cell.IsRevealed)
                return cell; // If the cell is already revealed, do nothing

            cell.IsRevealed = true;

            if (cell.IsMine) return cell;
            
            int adjacentMines = CountAdjacentMines(row, col);
            cell.AdjacentMines = adjacentMines;
            if (adjacentMines == 0)
            {
                // Automatically uncover all adjacent cells recursively if no adjacent mines
                UncoverAdjacentCells(row, col);
            }

            return cell;
        }

        public void UncoverAdjacentCells(int row, int col)
        {
            for (int i = row - 1; i <= row + 1; i++)
            {
                for (int j = col - 1; j <= col + 1; j++)
                {
                    if (i >= 0 && i < Size && j >= 0 && j < Size && !Cells[i, j].IsRevealed)
                    {
                        UncoverCell(i, j);
                    }
                }
            }
        }

        public int CountAdjacentMines(int row, int col)
        {
            int mineCount = 0;

            // Check all eight possible directions around the cell
            for (int i = -1; i <= 1; i++)
            {
                for (int j = -1; j <= 1; j++)
                {
                    if (i == 0 && j == 0)
                        continue; // Skip the current cell itself

                    int newRow = row + i;
                    int newCol = col + j;

                    // Make sure the new row and column are within the grid bounds
                    if (newRow >= 0 && newRow < Size && newCol >= 0 && newCol < Size)
                    {
                        if (Cells[newRow, newCol].IsMine)
                        {
                            mineCount++;
                        }
                    }
                }
            }

            return mineCount;
        }


        // Helper methods to simplify the API

        public void UncoverAdjacentCells(Point point)
        {
            UncoverAdjacentCells(point.Row, point.Col);
        }

        public Cell UncoverCell(Point point)
        {
            return UncoverCell(point.Row, point.Col);
        }

        public int CountAdjacentMines(Point point)
        {
            return CountAdjacentMines(point.Row, point.Col);
        }


        public Cell GetCell(int row, int col)
        {
            return Cells[row, col];
        }

        public Cell GetCell(Point cell)
        {
            return GetCell(cell.Row, cell.Col);
        }
    }

}
