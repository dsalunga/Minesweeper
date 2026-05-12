import { memo, type CSSProperties, type MouseEvent } from "react";
import "./Game.css";

interface CellProps {
    revealed: boolean;
    mine: boolean;
    flag: boolean;
    adjacentMines: number;
    onClick: () => void;
    onRightClick: (event: MouseEvent) => void;
}

const Cell = memo(({ revealed, mine, flag, adjacentMines, onClick, onRightClick }: CellProps) => {
    let display = "";
    const style: CSSProperties = {
        backgroundColor: revealed ? "#fdfdfd" : "#bebebe",
        userSelect: "none",
    };

    if (revealed) {
        if (mine) {
            display = "💣";
            style.backgroundColor = "#e57373";
        } else if (adjacentMines > 0) {
            display = String(adjacentMines);
        }
    } else if (flag) {
        display = "🚩";
    }

    return (
        <div className="cell" style={style} onClick={onClick} onContextMenu={onRightClick}>
            {display}
        </div>
    );
});

export default Cell;
