using System;
using System.Collections.Generic;

namespace Minesweeper.Unity
{
    public enum CellState { Hidden, Revealed, Flagged, Questioned }
    public enum GameStatus { Idle, Playing, Won, Lost }

    public class Cell
    {
        public int Row, Col, Adjacent;
        public bool Mine, Exploded, WrongFlag;
        public CellState State = CellState.Hidden;
        public Cell(int r, int c) { Row = r; Col = c; }
    }

    public struct Preset
    {
        public string Name;
        public int Rows, Cols, Mines;
        public Preset(string n, int r, int c, int m) { Name = n; Rows = r; Cols = c; Mines = m; }
        public static readonly Preset[] All = {
            new Preset("Beginner", 9, 9, 10),
            new Preset("Intermediate", 16, 16, 40),
            new Preset("Expert", 16, 30, 99),
        };
    }

    public class Game
    {
        public int Rows, Cols, Mines;
        public Cell[,] Cells;
        public int Flags;
        public bool FirstClick = true;
        public GameStatus Status = GameStatus.Idle;
        public DateTime? StartedAt, EndedAt;
        private readonly System.Random _rand = new System.Random();

        public Game(Preset p)
        {
            Rows = p.Rows; Cols = p.Cols; Mines = p.Mines;
            Cells = new Cell[Rows, Cols];
            for (int r = 0; r < Rows; r++)
                for (int c = 0; c < Cols; c++) Cells[r, c] = new Cell(r, c);
        }

        public int MinesRemaining { get { return Math.Max(Mines - Flags, 0); } }

        public int ElapsedSeconds
        {
            get
            {
                if (!StartedAt.HasValue) return 0;
                var end = (Status == GameStatus.Won || Status == GameStatus.Lost) && EndedAt.HasValue
                    ? EndedAt.Value : DateTime.UtcNow;
                return Math.Min((int)(end - StartedAt.Value).TotalSeconds, 999);
            }
        }

        bool InB(int r, int c) { return r >= 0 && r < Rows && c >= 0 && c < Cols; }

        void PlaceMines(int sr, int sc)
        {
            var safe = new HashSet<int>();
            for (int dr = -1; dr <= 1; dr++)
                for (int dc = -1; dc <= 1; dc++)
                    if (InB(sr + dr, sc + dc)) safe.Add((sr + dr) * Cols + (sc + dc));
            var cands = new List<int>();
            for (int r = 0; r < Rows; r++)
                for (int c = 0; c < Cols; c++)
                    if (!safe.Contains(r * Cols + c)) cands.Add(r * Cols + c);
            for (int i = cands.Count - 1; i > 0; i--)
            {
                int j = _rand.Next(i + 1);
                var t = cands[i]; cands[i] = cands[j]; cands[j] = t;
            }
            int n = Math.Min(Mines, cands.Count);
            for (int i = 0; i < n; i++)
            {
                int idx = cands[i];
                Cells[idx / Cols, idx % Cols].Mine = true;
            }
            for (int r = 0; r < Rows; r++)
                for (int c = 0; c < Cols; c++)
                {
                    if (Cells[r, c].Mine) continue;
                    int k = 0;
                    for (int dr = -1; dr <= 1; dr++)
                        for (int dc = -1; dc <= 1; dc++)
                            if ((dr | dc) != 0 && InB(r + dr, c + dc) && Cells[r + dr, c + dc].Mine) k++;
                    Cells[r, c].Adjacent = k;
                }
        }

        public void Reveal(int r, int c)
        {
            if (Status == GameStatus.Won || Status == GameStatus.Lost) return;
            var cell = Cells[r, c];
            if (cell.State == CellState.Revealed || cell.State == CellState.Flagged) return;
            if (FirstClick) { PlaceMines(r, c); FirstClick = false; Status = GameStatus.Playing; StartedAt = DateTime.UtcNow; }
            if (cell.Mine)
            {
                cell.State = CellState.Revealed; cell.Exploded = true;
                RevealAll(); Status = GameStatus.Lost; EndedAt = DateTime.UtcNow; return;
            }
            Flood(r, c);
            if (CheckWin()) { Status = GameStatus.Won; EndedAt = DateTime.UtcNow; }
        }

        void Flood(int r, int c)
        {
            var stack = new Stack<int>();
            stack.Push(r * Cols + c);
            while (stack.Count > 0)
            {
                int p = stack.Pop();
                int rr = p / Cols, cc = p % Cols;
                var cell = Cells[rr, cc];
                if (cell.State == CellState.Revealed || cell.State == CellState.Flagged || cell.Mine) continue;
                cell.State = CellState.Revealed;
                if (cell.Adjacent > 0) continue;
                for (int dr = -1; dr <= 1; dr++)
                    for (int dc = -1; dc <= 1; dc++)
                        if ((dr | dc) != 0 && InB(rr + dr, cc + dc))
                            stack.Push((rr + dr) * Cols + (cc + dc));
            }
        }

        public void ToggleFlag(int r, int c)
        {
            if (Status == GameStatus.Won || Status == GameStatus.Lost) return;
            var cell = Cells[r, c];
            if (cell.State == CellState.Revealed) return;
            if (cell.State == CellState.Hidden) { cell.State = CellState.Flagged; Flags++; }
            else if (cell.State == CellState.Flagged) { cell.State = CellState.Questioned; Flags--; }
            else cell.State = CellState.Hidden;
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
            foreach (var h in hidden) { Reveal(h.Item1, h.Item2); if (Status == GameStatus.Lost) return; }
        }

        void RevealAll()
        {
            for (int r = 0; r < Rows; r++)
                for (int c = 0; c < Cols; c++)
                {
                    var cell = Cells[r, c];
                    if (cell.Mine && cell.State != CellState.Flagged) cell.State = CellState.Revealed;
                    if (!cell.Mine && cell.State == CellState.Flagged) { cell.WrongFlag = true; cell.State = CellState.Revealed; }
                }
        }

        bool CheckWin()
        {
            for (int r = 0; r < Rows; r++)
                for (int c = 0; c < Cols; c++)
                    if (!Cells[r, c].Mine && Cells[r, c].State != CellState.Revealed) return false;
            for (int r = 0; r < Rows; r++)
                for (int c = 0; c < Cols; c++)
                    if (Cells[r, c].Mine && Cells[r, c].State != CellState.Flagged)
                    { Cells[r, c].State = CellState.Flagged; Flags++; }
            return true;
        }
    }
}
