using System.Diagnostics;
using MineSweeper.Engine;

namespace MineSweeper
{
    // Rich console implementation: presets, ANSI colors, flagging, chord, first-click safety, timer.
    public class GameConsole : Game
    {
        private const string Reset = "\x1b[0m";
        private const string Bold = "\x1b[1m";
        private const string Red = "\x1b[91m";
        private const string Green = "\x1b[92m";
        private const string Yellow = "\x1b[93m";
        private const string Cyan = "\x1b[96m";
        private const string White = "\x1b[97m";
        private const string Gray = "\x1b[90m";
        private const string Purple = "\x1b[95m";
        private const string Orange = "\x1b[38;5;208m";
        private const string Teal = "\x1b[38;5;44m";
        private const string Violet = "\x1b[38;5;141m";
        private const string BgRed = "\x1b[48;5;124m";

        private static readonly string[] NumColor = ["", Cyan, Green, Red, Violet, Orange, Teal, White, Gray];

        private int _rows;
        private int _cols;
        private int _mines;
        private bool _firstClick;
        private Stopwatch _stopwatch = new();

        public override void Initialize()
        {
            EnableAnsi();
            Console.WriteLine();
            Console.WriteLine(Color("   ╔══════════════════════════════════════════════╗", Cyan, Bold));
            Console.WriteLine(Color("   ║   M I N E S W E E P E R    ·    C   #        ║", Cyan, Bold));
            Console.WriteLine(Color("   ╚══════════════════════════════════════════════╝", Cyan, Bold));

            (int rows, int cols, int mines) = AskDifficulty();
            _rows = rows;
            _cols = cols;
            _mines = mines;
            _firstClick = true;
            Grid = new Grid(_rows, _cols);
            Initialized = true;
            Completed = false;
            _stopwatch.Reset();
        }

        protected override void StartGameRoutine()
        {
            PrintHelp();
            while (true)
            {
                Render();
                if (Completed)
                {
                    PrintOutcome();
                    InformReplay();
                    return;
                }

                Console.Write(Color("\n› ", Cyan, Bold));
                string? line = Console.ReadLine();
                if (line == null) return;

                var cmd = ParseCommand(line);
                if (cmd == null)
                {
                    Console.WriteLine(Color("Unknown command. Type 'h' for help.", Red));
                    continue;
                }
                switch (cmd.Action)
                {
                    case "quit":
                        return;
                    case "help":
                        PrintHelp();
                        break;
                    case "new":
                        Reset();
                        Initialize();
                        return;
                    case "flag":
                        Grid.ToggleFlag(cmd.Row, cmd.Col);
                        break;
                    case "chord":
                        DoChord(cmd.Row, cmd.Col);
                        break;
                    default:
                        DoReveal(cmd.Row, cmd.Col);
                        break;
                }
            }
        }

        private void DoReveal(int row, int col)
        {
            var cell = Grid.Cells[row, col];
            if (cell.IsRevealed || cell.IsFlagged) return;
            if (_firstClick)
            {
                Grid.PlaceMinesSafe(_mines, row, col);
                _firstClick = false;
                _stopwatch.Restart();
            }
            var c = Grid.UncoverCell(row, col);
            if (c.IsMine)
            {
                c.Exploded = true;
                Grid.RevealAllMines();
                Completed = true;
                _stopwatch.Stop();
                return;
            }
            if (CheckWin())
            {
                Completed = true;
                _stopwatch.Stop();
            }
        }

        private void DoChord(int row, int col)
        {
            if (_firstClick) return;
            var revealed = Grid.ChordReveal(row, col);
            foreach (var c in revealed)
            {
                if (c.IsMine)
                {
                    c.Exploded = true;
                    Grid.RevealAllMines();
                    Completed = true;
                    _stopwatch.Stop();
                    return;
                }
            }
            if (CheckWin())
            {
                Completed = true;
                _stopwatch.Stop();
            }
        }

        private bool CheckWin()
        {
            for (int r = 0; r < Grid.Rows; r++)
                for (int c = 0; c < Grid.Cols; c++)
                {
                    var cell = Grid.Cells[r, c];
                    if (!cell.IsMine && !cell.IsRevealed) return false;
                }
            for (int r = 0; r < Grid.Rows; r++)
                for (int c = 0; c < Grid.Cols; c++)
                {
                    var cell = Grid.Cells[r, c];
                    if (cell.IsMine && !cell.IsFlagged) cell.IsFlagged = true;
                }
            return true;
        }

        public override void RenderGrid() => Render();

        private void Render()
        {
            int minesRemaining = Math.Max(_mines - Grid.FlagsPlaced, 0);
            int elapsed = (int)Math.Min(_stopwatch.Elapsed.TotalSeconds, 999);
            string face = Completed
                ? (IsLost() ? "(x_x)" : "(◕‿◕)")
                : "(•_•)";

            Console.WriteLine();
            Console.WriteLine(
                Color($"  ⚑ {minesRemaining:D3}", Purple, Bold) + "   " +
                Color(face, Yellow, Bold) + "   " +
                Color($"⏱ {elapsed:D3}", Cyan, Bold));

            Console.Write("    ");
            for (int j = 0; j < Grid.Cols; j++)
                Console.Write(Color($" {(char)('A' + j)} ", Yellow, Bold));
            Console.WriteLine();

            string border = new('─', Grid.Cols * 3);
            Console.WriteLine("   " + Color($"┌{border}┐", Gray));
            for (int r = 0; r < Grid.Rows; r++)
            {
                Console.Write(Color($"{(r + 1),2} ", Yellow, Bold) + Color("│", Gray));
                for (int c = 0; c < Grid.Cols; c++)
                    Console.Write(RenderCell(Grid.Cells[r, c]));
                Console.WriteLine(Color("│", Gray));
            }
            Console.WriteLine("   " + Color($"└{border}┘", Gray));
        }

        private static string RenderCell(Cell cell)
        {
            if (cell.WrongFlag) return Color(" ✕ ", Red, Bold);
            if (cell.IsFlagged) return Color(" ⚑ ", Purple, Bold);
            if (cell.IsQuestioned) return Color(" ? ", Yellow, Bold);
            if (!cell.IsRevealed) return Color(" · ", Gray);
            if (cell.IsMine) return Color(" ✱ ", cell.Exploded ? BgRed + White : Red, Bold);
            if (cell.AdjacentMines == 0) return "   ";
            return Color($" {cell.AdjacentMines} ", NumColor[cell.AdjacentMines], Bold);
        }

        private bool IsLost()
        {
            for (int r = 0; r < Grid.Rows; r++)
                for (int c = 0; c < Grid.Cols; c++)
                    if (Grid.Cells[r, c].IsMine && Grid.Cells[r, c].Exploded) return true;
            return false;
        }

        private void PrintOutcome()
        {
            Render();
            int elapsed = (int)_stopwatch.Elapsed.TotalSeconds;
            if (IsLost())
            {
                Console.WriteLine(Color("\n  💥  B O O M  💥", Red, Bold));
            }
            else
            {
                Console.WriteLine(Color("\n  ✨  V I C T O R Y  ✨", Green, Bold));
                Console.WriteLine(Color($"  Cleared in {elapsed}s", Green));
            }
        }

        private static (int, int, int) AskDifficulty()
        {
            Console.WriteLine(Color("\nChoose difficulty:", Bold, Cyan));
            Console.WriteLine($"  {Color("1", Yellow, Bold)}) Beginner       9 × 9    10 mines");
            Console.WriteLine($"  {Color("2", Yellow, Bold)}) Intermediate  16 × 16   40 mines");
            Console.WriteLine($"  {Color("3", Yellow, Bold)}) Expert        16 × 30   99 mines");
            Console.WriteLine($"  {Color("4", Yellow, Bold)}) Custom");
            while (true)
            {
                Console.Write(Color("\nSelection: ", Green));
                string? input = Console.ReadLine()?.Trim().ToLowerInvariant();
                switch (input)
                {
                    case "1": case "b": case "beginner": return (9, 9, 10);
                    case "2": case "i": case "intermediate": return (16, 16, 40);
                    case "3": case "e": case "expert": return (16, 30, 99);
                    case "4": case "c": case "custom": return AskCustom();
                    default: Console.WriteLine(Color("Please choose 1-4.", Red)); break;
                }
            }
        }

        private static (int, int, int) AskCustom()
        {
            int rows = ReadInt("Rows (5-26): ", 5, 26);
            int cols = ReadInt("Cols (5-26): ", 5, 26);
            int maxMines = rows * cols - 9;
            int mines = ReadInt($"Mines (1-{maxMines}): ", 1, maxMines);
            return (rows, cols, mines);
        }

        private static int ReadInt(string prompt, int min, int max)
        {
            while (true)
            {
                Console.Write(Color(prompt, Green));
                string? input = Console.ReadLine();
                if (int.TryParse(input, out int v) && v >= min && v <= max) return v;
                Console.WriteLine(Color($"Please enter a number between {min} and {max}.", Red));
            }
        }

        private record Command(string Action, int Row, int Col);

        private Command? ParseCommand(string text)
        {
            var t = text.Trim().ToLowerInvariant();
            if (string.IsNullOrEmpty(t)) return null;
            if (t is "q" or "quit" or "exit") return new("quit", 0, 0);
            if (t is "h" or "?" or "help") return new("help", 0, 0);
            if (t is "n" or "new") return new("new", 0, 0);

            string action = "reveal";
            if (t.Length > 1 && t[0] == 'f') { action = "flag"; t = t[1..].Trim(); }
            else if (t.Length > 1 && t[0] == 'c') { action = "chord"; t = t[1..].Trim(); }

            if (t.Length < 2) return null;
            char colCh = char.ToUpperInvariant(t[0]);
            if (colCh < 'A' || colCh > 'Z') return null;
            int col = colCh - 'A';
            if (!int.TryParse(t[1..], out int row)) return null;
            row -= 1;
            if (row < 0 || row >= Grid.Rows || col < 0 || col >= Grid.Cols) return null;
            return new(action, row, col);
        }

        private static void PrintHelp()
        {
            Console.WriteLine(Color("\nCommands:", Bold, Cyan));
            Console.WriteLine("  A1, B5      reveal cell at column-letter row-number");
            Console.WriteLine("  f A1        toggle flag on cell A1");
            Console.WriteLine("  c A1        chord-reveal around a numbered cell");
            Console.WriteLine("  n           new game · q quit · h help");
        }

        private void InformReplay()
        {
            Console.Write(Color("\nPlay again? [Y/n] ", Green));
            string? input = Console.ReadLine()?.Trim().ToLowerInvariant();
            if (input is "n" or "no" or "q" or "quit")
            {
                Console.WriteLine(Color("\nThanks for playing!\n", Cyan, Bold));
                Environment.Exit(0);
            }
            Reset();
            Initialize();
            Start();
        }

        private static string Color(string text, params string[] codes) =>
            string.Concat(codes) + text + Reset;

        private static void EnableAnsi()
        {
            if (OperatingSystem.IsWindows())
            {
                try { Console.OutputEncoding = System.Text.Encoding.UTF8; } catch { }
            }
        }
    }
}
