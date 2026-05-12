import type { GameStatus } from '../engine/minesweeper';

interface HudProps {
    minesRemaining: number;
    elapsed: number;
    status: GameStatus;
    onRestart: () => void;
}

const pad = (n: number, width = 3) =>
    Math.max(0, Math.min(999, n)).toString().padStart(width, '0');

const faceEmoji = (status: GameStatus) => {
    switch (status) {
        case 'won':
            return '😎';
        case 'lost':
            return '💀';
        default:
            return '🙂';
    }
};

const Hud = ({ minesRemaining, elapsed, status, onRestart }: HudProps) => {
    return (
        <div className="hud">
            <div className="counter mines" title="Mines remaining">
                <span className="counter-icon">⚑</span>
                <span className="counter-value">{pad(minesRemaining)}</span>
            </div>
            <button
                type="button"
                className={`face ${status === 'won' ? 'face-won' : status === 'lost' ? 'face-lost' : 'face-playing'}`}
                onClick={onRestart}
                title="New game"
            >
                <span className="face-emoji">{faceEmoji(status)}</span>
            </button>
            <div className="counter timer" title="Elapsed time">
                <span className="counter-icon">⏱</span>
                <span className="counter-value">{pad(elapsed)}</span>
            </div>
        </div>
    );
};

export default Hud;
