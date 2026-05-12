import { type MouseEvent, useCallback, useEffect, useState } from "react";
import Cell from "./Cell";
import "./Game.css";

interface CellData {
    revealed: boolean;
    mine: boolean;
    flag: boolean;
    adjacentMines: number;
}

interface GridProps {
    gridSize: number;
    numMines: number;
    onGameOver: (won: boolean) => void;
}

const clampMineCount = (gridSize: number, numMines: number) => {
    const maxMines = Math.max(1, gridSize * gridSize - 1);
    return Math.min(Math.max(numMines, 1), maxMines);
};

const createCells = (gridSize: number): CellData[][] =>
    Array.from({ length: gridSize }, () =>
        Array.from({ length: gridSize }, () => ({
            revealed: false,
            mine: false,
            flag: false,
            adjacentMines: 0,
        })),
    );

const cloneCells = (cells: CellData[][]): CellData[][] =>
    cells.map((row) => row.map((cell) => ({ ...cell })));

const revealSafeRegion = (cells: CellData[][], startRow: number, startCol: number, gridSize: number) => {
    const queue: [number, number][] = [[startRow, startCol]];
    let head = 0;
    let revealedCount = 0;

    while (head < queue.length) {
        const [row, col] = queue[head];
        head += 1;

        if (row < 0 || row >= gridSize || col < 0 || col >= gridSize) {
            continue;
        }

        const currentCell = cells[row][col];
        if (currentCell.revealed || currentCell.flag || currentCell.mine) {
            continue;
        }

        currentCell.revealed = true;
        revealedCount += 1;

        if (currentCell.adjacentMines > 0) {
            continue;
        }

        for (let rowOffset = -1; rowOffset <= 1; rowOffset += 1) {
            for (let colOffset = -1; colOffset <= 1; colOffset += 1) {
                if (rowOffset === 0 && colOffset === 0) {
                    continue;
                }
                queue.push([row + rowOffset, col + colOffset]);
            }
        }
    }

    return revealedCount;
};

const revealAllMines = (cells: CellData[][], gridSize: number) => {
    for (let row = 0; row < gridSize; row += 1) {
        for (let col = 0; col < gridSize; col += 1) {
            if (cells[row][col].mine) {
                cells[row][col].revealed = true;
            }
        }
    }
};

const Grid = ({ gridSize, numMines, onGameOver }: GridProps) => {
    const [cells, setCells] = useState<CellData[][]>([]);
    const [completed, setCompleted] = useState(false);
    const [remainingSafeCells, setRemainingSafeCells] = useState(0);

    const initializeGrid = useCallback(() => {
        const safeMineCount = clampMineCount(gridSize, numMines);
        const newCells = createCells(gridSize);
        const totalCells = gridSize * gridSize;

        const mineIndexes = Array.from({ length: totalCells }, (_, index) => index);
        for (let i = 0; i < safeMineCount; i += 1) {
            const randomIndex = i + Math.floor(Math.random() * (totalCells - i));
            [mineIndexes[i], mineIndexes[randomIndex]] = [mineIndexes[randomIndex], mineIndexes[i]];
            const row = Math.floor(mineIndexes[i] / gridSize);
            const col = mineIndexes[i] % gridSize;
            newCells[row][col].mine = true;
        }

        for (let row = 0; row < gridSize; row += 1) {
            for (let col = 0; col < gridSize; col += 1) {
                if (newCells[row][col].mine) {
                    for (let rowOffset = -1; rowOffset <= 1; rowOffset += 1) {
                        for (let colOffset = -1; colOffset <= 1; colOffset += 1) {
                            if (rowOffset === 0 && colOffset === 0) {
                                continue;
                            }
                            const nextRow = row + rowOffset;
                            const nextCol = col + colOffset;
                            if (
                                nextRow >= 0 &&
                                nextRow < gridSize &&
                                nextCol >= 0 &&
                                nextCol < gridSize &&
                                !newCells[nextRow][nextCol].mine
                            ) {
                                newCells[nextRow][nextCol].adjacentMines += 1;
                            }
                        }
                    }
                }
            }
        }

        setCompleted(false);
        setRemainingSafeCells(totalCells - safeMineCount);
        setCells(newCells);
    }, [gridSize, numMines]);

    useEffect(() => {
        initializeGrid();
    }, [initializeGrid]);

    const handleCellClick = (row: number, col: number) => {
        if (completed || cells.length === 0) {
            return;
        }

        if (cells[row][col].flag || cells[row][col].revealed) {
            return;
        }

        const newCells = cloneCells(cells);
        if (newCells[row][col].mine) {
            setCompleted(true);
            revealAllMines(newCells, gridSize);
            setCells(newCells);
            onGameOver(false);
            return;
        }

        const revealedNow = revealSafeRegion(newCells, row, col, gridSize);
        if (revealedNow === 0) {
            return;
        }

        const nextRemainingSafeCells = remainingSafeCells - revealedNow;
        setCells(newCells);
        setRemainingSafeCells(nextRemainingSafeCells);

        if (nextRemainingSafeCells <= 0) {
            setCompleted(true);
            onGameOver(true);
        }
    };

    const handleRightClick = (event: MouseEvent, row: number, col: number) => {
        event.preventDefault();
        if (completed || cells.length === 0 || cells[row][col].revealed) {
            return;
        }
        const newCells = cloneCells(cells);
        newCells[row][col].flag = !newCells[row][col].flag;
        setCells(newCells);
    };

    return (
        <div className="grid-container" style={{ gridTemplateColumns: `repeat(${gridSize}, 34px)` }}>
            {cells.map((row, rowIndex) =>
                row.map((cell, colIndex) => (
                    <Cell
                        key={`${rowIndex}-${colIndex}`}
                        revealed={cell.revealed}
                        mine={cell.mine}
                        flag={cell.flag}
                        adjacentMines={cell.adjacentMines}
                        onClick={() => handleCellClick(rowIndex, colIndex)}
                        onRightClick={(event) => handleRightClick(event, rowIndex, colIndex)}
                    />
                )),
            )}
        </div>
    );
};

export default Grid;
