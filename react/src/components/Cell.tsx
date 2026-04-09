import React from 'react';
import './Game.css'

interface CellProps {
    revealed: boolean;
    mine: boolean;
    flag: boolean;
    adjacentMines: number;
    onClick: () => void;
    onRightClick: (event: React.MouseEvent) => void;
}

const Cell: React.FC<CellProps> = ({ revealed, mine, flag, adjacentMines, onClick, onRightClick }) => {
    let display = '';
    let style = {
        backgroundColor: revealed ? '#fdfdfd' : '#bebebe',
        userSelect: 'none' as 'none',
    };

    if (revealed) {
        if (mine) {
            display = '💣';
            style.backgroundColor = '#e57373';
        } else if (adjacentMines > 0) {
            display = String(adjacentMines);
        }
    } else if (flag) {
        display = '🚩';
    }

    return (
        <div className="cell" style={style} onClick={onClick} onContextMenu={onRightClick}>
            {display}
        </div>
    );
};

export default Cell;
