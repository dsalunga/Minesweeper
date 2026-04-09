import React, { useState, useEffect } from 'react';
import Cell from './Cell';
import './Game.css';

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

const Grid: React.FC<GridProps> = ({ gridSize, numMines, onGameOver }) => {
    const [cells, setCells] = useState<CellData[][]>([]);
    const [completed, setCompleted] = useState(false);

    useEffect(() => {
        initializeGrid();
    }, []);

    const initializeGrid = () => {
        const newCells: CellData[][] = Array(gridSize).fill(null).map(() =>
            Array(gridSize).fill(null).map(() => ({
                revealed: false,
                mine: false,
                flag: false,
                adjacentMines: 0,
            }))
        );

        // Randomly place mines
        let minesPlaced = 0;
        while (minesPlaced < numMines) {
            const row = Math.floor(Math.random() * gridSize);
            const col = Math.floor(Math.random() * gridSize);
            if (!newCells[row][col].mine) {
                newCells[row][col].mine = true;
                minesPlaced++;
            }
        }

        // Calculate adjacent mines
        for (let row = 0; row < gridSize; row++) {
            for (let col = 0; col < gridSize; col++) {
                if (newCells[row][col].mine) {
                    for (let i = -1; i <= 1; i++) {
                        for (let j = -1; j <= 1; j++) {
                            if (
                                row + i >= 0 && row + i < gridSize &&
                                col + j >= 0 && col + j < gridSize &&
                                !newCells[row + i][col + j].mine
                            ) {
                                newCells[row + i][col + j].adjacentMines++;
                            }
                        }
                    }
                }
            }
        }

        setCells(newCells);
    };

    const handleCellClick = (row: number, col: number) => {
        if (completed) {
            return;
        }

        if (cells[row][col].flag || cells[row][col].revealed) {
            return;
        }

        const newCells = [...cells];
        // const newCells = cells.map(row => row.slice());
        if (newCells[row][col].mine) {
            setCompleted(true);
            // Reveal all mines
            revealMines(newCells);
            setCells(newCells);
            onGameOver(false);
            return;
        }

        revealCell(newCells, row, col);
        setCells(newCells);
        if (checkVictory(newCells)) {
            setCompleted(true);
            onGameOver(true); // If won, call the victory handler
        }
    };

    const checkVictory = (cells: CellData[][]): boolean => {
        for (const row of cells) {
            for (const cell of row) {
                if (!cell.revealed && !cell.mine) {
                    return false;
                }
            }
        }
        return true; // All non-mine cells are revealed
    };

    const handleRightClick = (event: React.MouseEvent, row: number, col: number) => {
        event.preventDefault();
        if (cells[row][col].revealed) {
            return;
        }
        const newCells = [...cells];
        newCells[row][col].flag = !newCells[row][col].flag;
        setCells(newCells);
    };

    const revealCell = (cells: CellData[][], row: number, col: number) => {
        const cellQueue: [number, number][] = [[row, col]];

        while (cellQueue.length > 0) {
            const [r, c] = cellQueue.shift()!;
            if (!cells[r][c].revealed) {
                cells[r][c].revealed = true;
                if (cells[r][c].adjacentMines === 0) {
                    for (let i = -1; i <= 1; i++) {
                        for (let j = -1; j <= 1; j++) {
                            if (
                                r + i >= 0 && r + i < gridSize &&
                                c + j >= 0 && c + j < gridSize &&
                                !cells[r + i][c + j].revealed
                            ) {
                                cellQueue.push([r + i, c + j]);
                            }
                        }
                    }
                }
            }
        }
    };

    const revealMines = (cells: CellData[][]) => {
        for (let row = 0; row < gridSize; row++) {
            for (let col = 0; col < gridSize; col++) {
                if (cells[row][col].mine) {
                    cells[row][col].revealed = true;
                }
            }
        }
    };

    return (
        <div className="grid-container" style={{ gridTemplateColumns: `repeat(${gridSize}, 34px)` }}>
            {cells.map((row, rowIndex) => row.map((cell, colIndex) => (
                <Cell
                    key={`${rowIndex}-${colIndex}`}
                    revealed={cell.revealed}
                    mine={cell.mine}
                    flag={cell.flag}
                    adjacentMines={cell.adjacentMines}
                    onClick={() => handleCellClick(rowIndex, colIndex)}
                    onRightClick={(event) => handleRightClick(event, rowIndex, colIndex)}
                />
            )))}
        </div>
    );
};

export default Grid;
