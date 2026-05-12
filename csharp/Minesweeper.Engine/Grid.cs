namespace MineSweeper.Engine
{
    public class Grid
    {
        public int Size { get; private set; }
        public int Rows { get; private set; }
        public int Cols { get; private set; }
        public Cell[,] Cells { get; private set; }
        public int FlagsPlaced { get; private set; } = 0;

        public Grid(int size) : this(size, size) { }

        public Grid(int rows, int cols)
        {
            Rows = rows;
            Cols = cols;
            Size = rows; // legacy: rows for square grids
            Cells = new Cell[rows, cols];
            InitializeCells();
        }

        private void InitializeCells()
        {
            for (int i = 0; i < Rows; i++)
                for (int j = 0; j < Cols; j++)
                    Cells[i, j] = new Cell();
        }

        public void PlaceMines(int numberOfMines)
        {
            var rand = new Random();
            int placed = 0;
            while (placed < numberOfMines)
            {
                int row = rand.Next(Rows);
                int col = rand.Next(Cols);
                if (!Cells[row, col].IsMine)
                {
                    Cells[row, col].IsMine = true;
                    placed++;
                }
            }
            ComputeAdjacency();
        }

        // First-click-safe placement: avoid a 3x3 block around (safeRow, safeCol).
        public void PlaceMinesSafe(int numberOfMines, int safeRow, int safeCol)
        {
            var rand = new Random();
            var safe = new HashSet<(int, int)>();
            for (int dr = -1; dr <= 1; dr++)
                for (int dc = -1; dc <= 1; dc++)
                {
                    int rr = safeRow + dr, cc = safeCol + dc;
                    if (rr >= 0 && rr < Rows && cc >= 0 && cc < Cols)
                        safe.Add((rr, cc));
                }
            var candidates = new List<(int, int)>();
            for (int r = 0; r < Rows; r++)
                for (int c = 0; c < Cols; c++)
                    if (!safe.Contains((r, c)))
                        candidates.Add((r, c));
            for (int i = candidates.Count - 1; i > 0; i--)
            {
                int j = rand.Next(i + 1);
                (candidates[i], candidates[j]) = (candidates[j], candidates[i]);
            }
            int n = Math.Min(numberOfMines, candidates.Count);
            for (int i = 0; i < n; i++)
            {
                var (r, c) = candidates[i];
                Cells[r, c].IsMine = true;
            }
            ComputeAdjacency();
        }

        public void PlaceMinesManually(List<Point> minePositions)
        {
            foreach (var position in minePositions)
            {
                int row = position.Row;
                int col = position.Col;
                if (row >= 0 && row < Rows && col >= 0 && col < Cols)
                    Cells[row, col].IsMine = true;
                else
                    throw new ArgumentOutOfRangeException("Position out of grid bounds");
            }
            ComputeAdjacency();
        }

        private void ComputeAdjacency()
        {
            for (int r = 0; r < Rows; r++)
                for (int c = 0; c < Cols; c++)
                    if (!Cells[r, c].IsMine)
                        Cells[r, c].AdjacentMines = CountAdjacentMines(r, c);
        }

        public Cell UncoverCell(int row, int col)
        {
            if (row < 0 || row >= Rows || col < 0 || col >= Cols)
                throw new ArgumentOutOfRangeException("Selected cell is out of the grid bounds.");

            var cell = Cells[row, col];
            if (cell.IsRevealed || cell.IsFlagged) return cell;

            cell.IsRevealed = true;
            if (cell.IsMine) return cell;

            int adjacentMines = CountAdjacentMines(row, col);
            cell.AdjacentMines = adjacentMines;
            if (adjacentMines == 0)
                UncoverAdjacentCells(row, col);
            return cell;
        }

        public void UncoverAdjacentCells(int row, int col)
        {
            for (int i = row - 1; i <= row + 1; i++)
                for (int j = col - 1; j <= col + 1; j++)
                    if (i >= 0 && i < Rows && j >= 0 && j < Cols && !Cells[i, j].IsRevealed)
                        UncoverCell(i, j);
        }

        public int CountAdjacentMines(int row, int col)
        {
            int mineCount = 0;
            for (int i = -1; i <= 1; i++)
                for (int j = -1; j <= 1; j++)
                {
                    if (i == 0 && j == 0) continue;
                    int newRow = row + i, newCol = col + j;
                    if (newRow >= 0 && newRow < Rows && newCol >= 0 && newCol < Cols && Cells[newRow, newCol].IsMine)
                        mineCount++;
                }
            return mineCount;
        }

        public void ToggleFlag(int row, int col)
        {
            var cell = Cells[row, col];
            if (cell.IsRevealed) return;
            if (!cell.IsFlagged && !cell.IsQuestioned)
            {
                cell.IsFlagged = true;
                FlagsPlaced++;
            }
            else if (cell.IsFlagged)
            {
                cell.IsFlagged = false;
                cell.IsQuestioned = true;
                FlagsPlaced--;
            }
            else
            {
                cell.IsQuestioned = false;
            }
        }

        public List<Cell> ChordReveal(int row, int col)
        {
            var cell = Cells[row, col];
            var revealed = new List<Cell>();
            if (!cell.IsRevealed || cell.AdjacentMines == 0) return revealed;

            int flagged = 0;
            var hidden = new List<(int, int)>();
            for (int i = -1; i <= 1; i++)
                for (int j = -1; j <= 1; j++)
                {
                    if (i == 0 && j == 0) continue;
                    int nr = row + i, nc = col + j;
                    if (nr < 0 || nr >= Rows || nc < 0 || nc >= Cols) continue;
                    var n = Cells[nr, nc];
                    if (n.IsFlagged) flagged++;
                    else if (!n.IsRevealed) hidden.Add((nr, nc));
                }
            if (flagged != cell.AdjacentMines) return revealed;
            foreach (var (hr, hc) in hidden)
                revealed.Add(UncoverCell(hr, hc));
            return revealed;
        }

        public void RevealAllMines()
        {
            for (int r = 0; r < Rows; r++)
                for (int c = 0; c < Cols; c++)
                {
                    var cell = Cells[r, c];
                    if (cell.IsMine && !cell.IsFlagged) cell.IsRevealed = true;
                    if (!cell.IsMine && cell.IsFlagged)
                    {
                        cell.WrongFlag = true;
                        cell.IsRevealed = true;
                    }
                }
        }

        public void UncoverAdjacentCells(Point point) => UncoverAdjacentCells(point.Row, point.Col);
        public Cell UncoverCell(Point point) => UncoverCell(point.Row, point.Col);
        public int CountAdjacentMines(Point point) => CountAdjacentMines(point.Row, point.Col);
        public Cell GetCell(int row, int col) => Cells[row, col];
        public Cell GetCell(Point cell) => GetCell(cell.Row, cell.Col);
    }
}
