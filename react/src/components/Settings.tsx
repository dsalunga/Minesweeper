import { useState } from 'react';
import {
    BoardConfig,
    DIFFICULTY_PRESETS,
    Difficulty,
} from '../engine/minesweeper';

interface SettingsProps {
    initialDifficulty: Difficulty;
    initialConfig: BoardConfig;
    bestTimes: { beginner?: number; intermediate?: number; expert?: number };
    onStart: (difficulty: Difficulty, custom?: BoardConfig) => void;
    onCancel: () => void;
}

const presets: { key: Exclude<Difficulty, 'custom'>; name: string; cfg: BoardConfig }[] = [
    { key: 'beginner', name: 'Beginner', cfg: DIFFICULTY_PRESETS.beginner },
    { key: 'intermediate', name: 'Intermediate', cfg: DIFFICULTY_PRESETS.intermediate },
    { key: 'expert', name: 'Expert', cfg: DIFFICULTY_PRESETS.expert },
];

const Settings = ({ initialDifficulty, initialConfig, bestTimes, onStart, onCancel }: SettingsProps) => {
    const [selected, setSelected] = useState<Difficulty>(initialDifficulty);
    const [rows, setRows] = useState(initialConfig.rows);
    const [cols, setCols] = useState(initialConfig.cols);
    const [mines, setMines] = useState(initialConfig.mines);

    const start = () => {
        if (selected === 'custom') {
            onStart('custom', { rows, cols, mines });
        } else {
            onStart(selected);
        }
    };

    return (
        <div className="settings">
            <h2>New Game</h2>
            <div className="difficulty-grid">
                {presets.map((p) => (
                    <button
                        key={p.key}
                        type="button"
                        className={`preset ${selected === p.key ? 'active' : ''}`}
                        onClick={() => setSelected(p.key)}
                    >
                        <div className="preset-name">{p.name}</div>
                        <div className="preset-meta">{p.cfg.cols} × {p.cfg.rows}</div>
                        <div className="preset-mines">{p.cfg.mines} mines</div>
                        {bestTimes[p.key] !== undefined && (
                            <div className="preset-best">Best: {bestTimes[p.key]}s</div>
                        )}
                    </button>
                ))}
                <button
                    type="button"
                    className={`preset ${selected === 'custom' ? 'active' : ''}`}
                    onClick={() => setSelected('custom')}
                >
                    <div className="preset-name">Custom</div>
                    <div className="preset-meta">Your size</div>
                    <div className="preset-mines">Your mines</div>
                </button>
            </div>

            {selected === 'custom' && (
                <div className="custom-fields">
                    <label>
                        Rows
                        <input type="number" min={5} max={30} value={rows} onChange={(e) => setRows(Number(e.target.value))} />
                    </label>
                    <label>
                        Cols
                        <input type="number" min={5} max={40} value={cols} onChange={(e) => setCols(Number(e.target.value))} />
                    </label>
                    <label>
                        Mines
                        <input type="number" min={1} max={rows * cols - 9} value={mines} onChange={(e) => setMines(Number(e.target.value))} />
                    </label>
                </div>
            )}

            <div className="actions">
                <button type="button" className="btn primary" onClick={start}>Start Game</button>
                <button type="button" className="btn ghost" onClick={onCancel}>Cancel</button>
            </div>

            <div className="hints">
                <p><strong>Left click</strong> to reveal · <strong>Right click</strong> to flag</p>
                <p><strong>Both buttons</strong> on a number cell to chord-reveal</p>
            </div>
        </div>
    );
};

export default Settings;
