
namespace MineSweeper.Engine
{
    public interface IGame
    {
        bool Completed { get; }
        Grid Grid { get; }

        void Initialize();
        void Initialize(int gridSize, int numberOfMines);
        void Initialize(int size, List<Point> minePositions);
        bool IsGameLost();
        bool IsGameWon();
        void Start();
        void RenderGrid();
        void Reset();
        Cell SelectCell(int row, int col);
        Cell SelectCell(Point cell);
    }
}