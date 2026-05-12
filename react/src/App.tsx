import { useState } from 'react';
import './App.css';
import Grid from './components/Grid';
import Hud from './components/Hud';
import Settings from './components/Settings';
import { useGame } from './hooks/useGame';
import type { BoardConfig, Difficulty } from './engine/minesweeper';

function App() {
    const game = useGame('beginner');
    const [showSettings, setShowSettings] = useState(true);

    const handleStart = (d: Difficulty, custom?: BoardConfig) => {
        game.newGame(d, custom);
        setShowSettings(false);
    };

    const overlayMessage =
        game.status === 'won'
            ? '✨ Victory! ✨'
            : game.status === 'lost'
              ? '💥 Boom! 💥'
              : null;

    return (
        <div className="app">
            <div className="starfield" aria-hidden="true">
                {Array.from({ length: 60 }).map((_, i) => (
                    <span
                        key={i}
                        className="star"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            animationDelay: `${Math.random() * 6}s`,
                            animationDuration: `${4 + Math.random() * 8}s`,
                            opacity: 0.3 + Math.random() * 0.7,
                        }}
                    />
                ))}
            </div>

            <header className="header">
                <h1 className="title">
                    <span className="title-mine">💣</span>
                    <span className="title-text">MINESWEEPER</span>
                </h1>
                <p className="subtitle">React · TypeScript · Vite</p>
            </header>

            <main className="main">
                <Hud
                    minesRemaining={game.minesRemaining}
                    elapsed={game.elapsed}
                    status={game.status}
                    onRestart={game.restart}
                />

                <div className="board-wrapper">
                    <Grid
                        board={game.board}
                        cols={game.config.cols}
                        status={game.status}
                        onReveal={game.reveal}
                        onFlag={game.toggleFlag}
                        onChord={game.chordReveal}
                    />
                    {overlayMessage && (
                        <div className={`overlay ${game.status}`}>
                            <div className="overlay-card">
                                <div className="overlay-message">{overlayMessage}</div>
                                {game.status === 'won' && (
                                    <div className="overlay-time">Time: {game.elapsed}s</div>
                                )}
                                <div className="overlay-actions">
                                    <button type="button" className="btn primary" onClick={game.restart}>
                                        Play Again
                                    </button>
                                    <button type="button" className="btn ghost" onClick={() => setShowSettings(true)}>
                                        New Settings
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="toolbar">
                    <button type="button" className="btn ghost" onClick={() => setShowSettings(true)}>
                        Change Difficulty
                    </button>
                    <button type="button" className="btn ghost" onClick={game.restart}>
                        Restart
                    </button>
                </div>
            </main>

            {showSettings && (
                <div className="modal-backdrop" onClick={() => setShowSettings(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <Settings
                            initialDifficulty={game.difficulty}
                            initialConfig={game.config}
                            bestTimes={game.bestTimes}
                            onStart={handleStart}
                            onCancel={() => setShowSettings(false)}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

export default App;
