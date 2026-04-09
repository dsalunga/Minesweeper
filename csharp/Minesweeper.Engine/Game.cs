namespace MineSweeper.Engine
{
    public abstract class Game : IGame
    {
        protected const int MIN_GRID_SIZE = 4; // Set the minimum grid size to 4x4 as lower sizes are not practical
        protected const int MAX_GRID_SIZE = 26; // Set the maximum grid size to 26x26 as it's the maximum for the English alphabet
        protected const double MAX_MINES_PCT = 0.35; // Maximum 35% of mines in the grid, in decimal equivalent

        public Grid Grid { get; private set; }
        public bool Initialized { get; private set; }
        public bool Completed { get; private set; }
        private bool GameWon { get; set; }

        public abstract void RenderGrid();
        public abstract void Initialize();
        protected abstract void StartGameRoutine();

        // Initialize the game with a specified grid size and number of mines
        public void Initialize(int gridSize, int numberOfMines)
        {
            Grid = new Grid(gridSize);
            Grid.PlaceMines(numberOfMines);
            Initialized = true;
        }

        // Initialize the game with a specific grid size and predefined mine positions
        public void Initialize(int size, List<Point> minePositions)
        {
            Grid = new Grid(size);
            Grid.PlaceMinesManually(minePositions);
            Initialized = true;
        }

        public void Start()
        {
            if (!Initialized)
                throw new InvalidOperationException("Game has not been initialized.");

            if (Grid == null)
                throw new InvalidOperationException("Grid has not been initialized.");

            if (Completed)
                throw new InvalidOperationException("Game has already been completed.");

            StartGameRoutine();
        }

        public void Reset()
        {
            Initialized = false;
            Completed = false;
            GameWon = false;
        }

        public Cell SelectCell(int row, int col)
        {
            var cell = Grid.UncoverCell(row, col);
            if (cell.IsMine)
            {
                Completed = true; // The game ends as the player hit a mine
                GameWon = false;
            }
            return cell;
        }

        // Checks if all non-mine cells have been revealed
        public bool IsGameWon()
        {
            if (Completed)
                return GameWon; // Return the cached value to avoid re-evaluating all cells

            for (int i = 0; i < Grid.Size; i++)
            {
                for (int j = 0; j < Grid.Size; j++)
                {
                    var cell = Grid.Cells[i, j];
                    if (!cell.IsMine && !cell.IsRevealed)
                    {
                        return false; // If there's any non-mine cell not revealed, the game is not yet won
                    }
                }
            }

            Completed = true;
            GameWon = true;
            return true; // All non-mine cells are revealed, player wins
        }


        public bool IsGameLost()
        {
            if (!Completed)
                return false;

            return !GameWon;
        }


        // Helper method to simplify selecting a cell based on user input

        public Cell SelectCell(Point cell)
        {
            return SelectCell(cell.Row, cell.Col);
        }
    }
}
