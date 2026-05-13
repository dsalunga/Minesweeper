using System.Collections.Generic;

namespace Minesweeper.Maui;

public enum CellState { Hidden, Revealed, Flagged, Questioned }
public enum GameStatus { Idle, Playing, Won, Lost }

public class Cell
{
    public int Row { get; }
    public int Col { get; }
    public bool Mine;
    public CellState State = CellState.Hidden;
    public int Adjacent;
    public bool Exploded;
    public bool WrongFlag;
    public Cell(int r, int c) { Row = r; Col = c; }
}

public record Preset(string Name, int Rows, int Cols, int Mines)
{
    public static readonly Preset Beginner = new("Beginner", 9, 9, 10);
    public static readonly Preset Intermediate = new("Intermediate", 16, 16, 40);
    public static readonly Preset Expert = new("Expert", 16, 30, 99);
    public static readonly Preset[] All = { Beginner, Intermediate, Expert };
}

public class Game
{
    public int Rows { get; }
    public int Cols { get; }
    public int Mines { get; }
    public Cell[,] Cells { get; }
    public int Flags { get; private set; }
    public bool FirstClick { get; private set; } = true;
    public GameStatus Status { get; private set; } = GameStatus.Idle;
    public DateTime? StartedAt { get; private set; }
    public DateTime? EndedAt { get; private set; }

    private readonly Random _rand = new();

    public Game(Preset p) : this(p.Rows, p.Cols, p.Mines) { }
    public Game(int rows, int cols, int mines)
    {
        Rows = rows; Cols = cols; Mines = mines;
        Cells = new Cell[rows, cols];
        for (int r = 0; r < rows; r++)
            for (int c = 0; c < cols; c++)
                Cells[r, c] = new Cell(r, c);
    }

    public int MinesRemaining => Math.Max(Mines - Flags, 0);

    public int ElapsedSeconds
    {
        get
        {
            if (StartedAt is null) return 0;
            var end = (Status is GameStatus.Won or GameStatus.Lost) && EndedAt.HasValue
                ? EndedAt.Value : DateTime.UtcNow;
            return Math.Min((int)(end - StartedAt.Value).TotalSeconds, 999);
        }
    }

    private bool InB(int r, int c) => r >= 0 && r < Rows && c >= 0 && c < Cols;

    private void PlaceMines(int sr, int sc)
    {
        var safe = new HashSet<(int, int)>();
        for (int dr = -1; dr <= 1; dr++)
            for (int dc = -1; dc <= 1; dc++)
                if (InB(sr + dr, sc + dc)) safe.Add((sr + dr, sc + dc));

        var cands = new List<(int, int)>();
        for (int r = 0; r < Rows; r++)
            for (int c = 0; c < Cols; c++)
                if (!safe.Contains((r, c))) cands.Add((r, c));

        for (int i = cands.Count - 1; i > 0; i--)
        {
            int j = _rand.Next(i + 1);
            (cands[i], cands[j]) = (cands[j], cands[i]);
        }
        for (int i = 0; i < Math.Min(Mines, cands.Count); i++)
            Cells[cands[i].Item1, cands[i].Item2].Mine = true;

        for (int r = 0; r < Rows; r++)
            for (int c = 0; c < Cols; c++)
            {
                if (Cells[r, c].Mine) continue;
                int n = 0;
                for (int dr = -1; dr <= 1; dr++)
                    for (int dc = -1; dc <= 1; dc++)
                        if ((dr | dc) != 0 && InB(r + dr, c + dc) && Cells[r + dr, c + dc].Mine)
                            n++;
                Cells[r, c].Adjacent = n;
            }
    }

    public void Reveal(int r, int c)
    {
        if (Status is GameStatus.Won or GameStatus.Lost) return;
        var cell = Cells[r, c];
        if (cell.State is CellState.Revealed or CellState.Flagged) return;
        if (FirstClick)
        {
            PlaceMines(r, c);
            FirstClick = false;
            Status = GameStatus.Playing;
            StartedAt = DateTime.UtcNow;
        }
        if (cell.Mine)
        {
            cell.State = CellState.Revealed;
            cell.Exploded = true;
            RevealAll();
            Status = GameStatus.Lost;
            EndedAt = DateTime.UtcNow;
            return;
        }
        Flood(r, c);
        if (CheckWin())
        {
            Status = GameStatus.Won;
            EndedAt = DateTime.UtcNow;
        }
    }

    private void Flood(int r, int c)
    {
        var stack = new Stack<(int, int)>();
        stack.Push((r, c));
        while (stack.Count > 0)
        {
            var (rr, cc) = stack.Pop();
            var cell = Cells[rr, cc];
            if (cell.State != CellState.Hidden && cell.State != CellState.Questioned) continue;
            if (cell.Mine) continue;
            cell.State = CellState.Revealed;
            if (cell.Adjacent > 0) continue;
            for (int dr = -1; dr <= 1; dr++)
                for (int dc = -1; dc <= 1; dc++)
                    if ((dr | dc) != 0 && InB(rr + dr, cc + dc))
                        stack.Push((rr + dr, cc + dc));
        }
    }

    public void ToggleFlag(int r, int c)
    {
        if (Status is GameStatus.Won or GameStatus.Lost) return;
        var cell = Cells[r, c];
        if (cell.State == CellState.Revealed) return;
        switch (cell.State)
        {
            case CellState.Hidden: cell.State = CellState.Flagged; Flags++; break;
            case CellState.Flagged: cell.State = CellState.Questioned; Flags--; break;
            case CellState.Questioned: cell.State = CellState.Hidden; break;
        }
    }

    public void Chord(int r, int c)
    {
        if (Status != GameStatus.Playing) return;
        var cell = Cells[r, c];
        if (cell.State != CellState.Revealed || cell.Adjacent == 0) return;
        int flagged = 0;
        var hidden = new List<(int, int)>();
        for (int dr = -1; dr <= 1; dr++)
            for (int dc = -1; dc <= 1; dc++)
            {
                if ((dr | dc) == 0) continue;
                int nr = r + dr, nc = c + dc;
                if (!InB(nr, nc)) continue;
                var n = Cells[nr, nc];
                if (n.State == CellState.Flagged) flagged++;
                else if (n.State != CellState.Revealed) hidden.Add((nr, nc));
            }
        if (flagged != cell.Adjacent) return;
        foreach (var (hr, hc) in hidden)
        {
            Reveal(hr, hc);
            if (Status == GameStatus.Lost) return;
        }
    }

    private void RevealAll()
    {
        for (int r = 0; r < Rows; r++)
            for (int c = 0; c < Cols; c++)
            {
                var cell = Cells[r, c];
                if (cell.Mine && cell.State != CellState.Flagged) cell.State = CellState.Revealed;
                if (!cell.Mine && cell.State == CellState.Flagged)
                {
                    cell.WrongFlag = true; cell.State = CellState.Revealed;
                }
            }
    }

    private bool CheckWin()
    {
        for (int r = 0; r < Rows; r++)
            for (int c = 0; c < Cols; c++)
                if (!Cells[r, c].Mine && Cells[r, c].State != CellState.Revealed) return false;
        for (int r = 0; r < Rows; r++)
            for (int c = 0; c < Cols; c++)
                if (Cells[r, c].Mine && Cells[r, c].State != CellState.Flagged)
                {
                    Cells[r, c].State = CellState.Flagged; Flags++;
                }
        return true;
    }
}
