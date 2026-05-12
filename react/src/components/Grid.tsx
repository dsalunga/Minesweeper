import type { CSSProperties } from 'react';
import Cell from './Cell';
import type { Cell as CellModel, GameStatus } from '../engine/minesweeper';

interface GridProps {
    board: CellModel[][];
    cols: number;
    status: GameStatus;
    onReveal: (row: number, col: number) => void;
    onFlag: (row: number, col: number) => void;
    onChord: (row: number, col: number) => void;
}

const Grid = ({ board, cols, status, onReveal, onFlag, onChord }: GridProps) => {
    const gameOver = status === 'won' || status === 'lost';
    const won = status === 'won';

    const style: CSSProperties = {
        gridTemplateColumns: `repeat(${cols}, var(--cell-size))`,
    };

    return (
        <div
            className={`board ${gameOver ? 'game-over' : ''} ${won ? 'won' : ''}`}
            style={style}
            onContextMenu={(e) => e.preventDefault()}
        >
            {board.map((row, r) =>
                row.map((cell, c) => (
                    <Cell
                        key={`${r}-${c}`}
                        cell={cell}
                        disabled={gameOver}
                        onReveal={() => onReveal(r, c)}
                        onFlag={() => onFlag(r, c)}
                        onChord={() => onChord(r, c)}
                    />
                )),
            )}
        </div>
    );
};

export default Grid;
