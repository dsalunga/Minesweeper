using MineSweeper.Engine;

namespace MineSweeper
{
    // Implementation of the game logic in a console application
    public class GameConsole : Game
    {
        public override void Initialize()
        {
            int size = AskGridSize();
            int numberOfMines = AskNumberOfMines(size);

            Initialize(size, numberOfMines);
        }

        protected override void StartGameRoutine()
        {
            while (true)
            {
                try
                {
                    RenderGrid();

                    Point? choice;
                    do
                    {
                        Console.Write("Select a square to reveal (e.g., A1): ");
                        string? input = Console.ReadLine();
                        choice = Point.TryParse(input, Grid.Size);
                        if (choice == null)
                            Console.WriteLine("Invalid input.");
                    } while (choice == null);

                    var cell = SelectCell(choice);
                    if (cell.IsMine)
                    {
                        RenderGrid();
                        Console.WriteLine("Oh no, you detonated a mine! Game over.");
                    }
                    else if (IsGameWon())
                    {
                        RenderGrid();
                        Console.ForegroundColor = ConsoleColor.Green;
                        Console.WriteLine("Congratulations, you have won the game!");
                        Console.ResetColor();
                    }
                    else
                    {
                        Console.WriteLine($"This square contains {cell.AdjacentMines} adjacent mine{(cell.AdjacentMines == 1 ? "" : "s")}.");
                    }

                    if (Completed)
                    {
                        InformReplay();
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine(ex.Message);
                }
            }
        }

        private static int AskGridSize()
        {
            int size = 0;
            bool validInput = false;

            while (!validInput)
            {
                Console.Write($"Enter the size of the grid (between {MIN_GRID_SIZE} and {MAX_GRID_SIZE}, e.g., 8 for an 8x8 grid): ");
                string? input = Console.ReadLine();

                if (int.TryParse(input, out size) && size >= MIN_GRID_SIZE && size <= MAX_GRID_SIZE)
                {
                    validInput = true;
                }
                else
                {
                    Console.WriteLine($"Invalid input.");
                }
            }

            return size;
        }

        private static int AskNumberOfMines(int gridSize)
        {
            int numberOfMines = 0;
            int maxMines = (int)(gridSize * gridSize * MAX_MINES_PCT);
            bool validInput = false;

            while (!validInput)
            {
                Console.Write($"Enter the number of mines to place on the grid (maximum is {maxMines}): ");
                string? input = Console.ReadLine();

                if (int.TryParse(input, out numberOfMines) && numberOfMines > 0 && numberOfMines <= maxMines)
                {
                    validInput = true;
                }
                else
                {
                    Console.WriteLine($"Invalid input. Please enter a number between 1 and {maxMines}.");
                }
            }

            return numberOfMines;
        }

        public override void RenderGrid()
        {
            var grid = Grid;
            string pad = grid.Size >= 10 ? " " : ""; // Add padding for single-digit numbers for even grid display when grid size is 10 or more

            Console.Write("\nHere is your updated minefield:\n ");
            Console.ForegroundColor = ConsoleColor.Yellow;

            for (int i = 1; i <= grid.Size; i++)
            {
                Console.Write(" " + i + (i < 10 ? pad : ""));
            }
            Console.WriteLine();

            for (int i = 0; i < grid.Size; i++)
            {
                Console.ForegroundColor = ConsoleColor.Yellow;
                Console.Write((char)('A' + i) + " ");

                Console.ResetColor();
                for (int j = 0; j < grid.Size; j++)
                {
                    var cell = grid.Cells[i, j];
                    if (!cell.IsRevealed)
                    {
                        Console.Write("_ " + pad);
                    }
                    else if (cell.IsMine)
                    {
                        Console.ForegroundColor = ConsoleColor.Red;
                        Console.Write("* " + pad);
                        Console.ResetColor();
                    }
                    else
                    {
                        Console.Write(cell.AdjacentMines + " " + pad);
                    }
                }
                Console.WriteLine();
            }
            Console.WriteLine();
        }


        private void InformReplay()
        {
            Console.Write("Press any key to play again...");
            Console.ReadKey(true);
            Console.WriteLine("\n");

            Reset();
            Initialize();
            Start();
        }
    }
}
