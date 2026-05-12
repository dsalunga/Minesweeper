import { memo, type MouseEvent, useRef } from 'react';
import type { Cell as CellModel } from '../engine/minesweeper';

interface CellProps {
    cell: CellModel;
    disabled: boolean;
    onReveal: () => void;
    onFlag: () => void;
    onChord: () => void;
}

type Display = 'flag' | 'question' | 'mine' | 'number' | 'empty' | 'wrong';

const getDisplay = (c: CellModel): Display => {
    if (c.wrongFlag) return 'wrong';
    if (c.state === 'flagged') return 'flag';
    if (c.state === 'questioned') return 'question';
    if (c.state === 'revealed') {
        if (c.mine) return 'mine';
        if (c.adjacent > 0) return 'number';
        return 'empty';
    }
    return 'empty';
};

const Cell = memo(({ cell, disabled, onReveal, onFlag, onChord }: CellProps) => {
    const leftDownRef = useRef(false);
    const rightDownRef = useRef(false);

    const display = getDisplay(cell);

    const className = [
        'cell',
        cell.state === 'revealed' ? 'revealed' : 'hidden',
        cell.state === 'flagged' && 'flagged',
        cell.state === 'questioned' && 'questioned',
        cell.state === 'revealed' && cell.mine && 'mine',
        cell.exploded && 'exploded',
        cell.wrongFlag && 'wrong-flag',
    ]
        .filter(Boolean)
        .join(' ');

    const handleClick = (e: MouseEvent) => {
        if (disabled) return;
        if (cell.state === 'revealed') return;
        e.preventDefault();
        onReveal();
    };

    const handleContext = (e: MouseEvent) => {
        e.preventDefault();
        if (disabled) return;
        onFlag();
    };

    const handleMouseDown = (e: MouseEvent) => {
        if (disabled) return;
        if (e.button === 0) leftDownRef.current = true;
        if (e.button === 2) rightDownRef.current = true;
        if (leftDownRef.current && rightDownRef.current && cell.state === 'revealed') {
            onChord();
        }
    };

    const handleMouseUp = (e: MouseEvent) => {
        if (e.button === 0) leftDownRef.current = false;
        if (e.button === 2) rightDownRef.current = false;
    };

    const handleLeave = () => {
        leftDownRef.current = false;
        rightDownRef.current = false;
    };

    return (
        <button
            type="button"
            className={className}
            onClick={handleClick}
            onContextMenu={handleContext}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleLeave}
        >
            {display === 'flag' && <span className="icon flag" aria-label="flag">⚑</span>}
            {display === 'question' && <span className="icon question" aria-label="question">?</span>}
            {display === 'wrong' && <span className="icon wrong" aria-label="wrong flag">✕</span>}
            {display === 'mine' && (
                <span className="icon mine-icon" aria-label="mine">
                    <svg viewBox="0 0 24 24" width="60%" height="60%" aria-hidden="true">
                        <defs>
                            <radialGradient id={`mg-${cell.row}-${cell.col}`} cx="35%" cy="30%" r="70%">
                                <stop offset="0%" stopColor="#7a86b3" />
                                <stop offset="60%" stopColor="#1a1f3a" />
                                <stop offset="100%" stopColor="#06070f" />
                            </radialGradient>
                        </defs>
                        <circle cx="12" cy="13" r="6.5" fill={`url(#mg-${cell.row}-${cell.col})`} />
                        <g stroke="#0d1230" strokeWidth="1.4" strokeLinecap="round">
                            <line x1="12" y1="3" x2="12" y2="22" />
                            <line x1="3" y1="13" x2="21" y2="13" />
                            <line x1="5.5" y1="6.5" x2="18.5" y2="19.5" />
                            <line x1="18.5" y1="6.5" x2="5.5" y2="19.5" />
                        </g>
                        <circle cx="9.5" cy="10.5" r="1.6" fill="#ffffff" opacity="0.85" />
                    </svg>
                </span>
            )}
            {display === 'number' && (
                <span className="num" data-n={cell.adjacent}>
                    {cell.adjacent}
                </span>
            )}
        </button>
    );
});

export default Cell;
