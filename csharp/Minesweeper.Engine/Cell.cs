namespace MineSweeper.Engine
{
    public class Cell
    {
        public bool IsMine { get; set; } = false;
        public bool IsRevealed { get; set; } = false;
        public bool IsFlagged { get; set; } = false;
        public bool IsQuestioned { get; set; } = false;
        public bool Exploded { get; set; } = false;
        public bool WrongFlag { get; set; } = false;
        public int AdjacentMines { get; set; } = 0;
    }
}
