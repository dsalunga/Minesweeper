import {useState} from 'react'
import './App.css'

import Game from './components/Game';
import Starter from "./components/Starter.tsx";

interface Settings {
    gridSize: number;
    numMines: number;
}

function App() {
    const [gameStarted, setGameStarted] = useState(false);
    const [gameSettings, setGameSettings] = useState<Settings>({ gridSize: 8, numMines: 10 });

    const presets = {
        easy: { gridSize: 8, numMines: 10 },
        medium: { gridSize: 16, numMines: 40 },
        expert: { gridSize: 24, numMines: 99 }
    };

    const handleStartGame = (settings: Settings) => {
        setGameSettings(settings);
        setGameStarted(true);
    };

    const handlePreset = (level: keyof typeof presets) => {
        handleStartGame(presets[level]);
    };

    const handleSelectBoard = () => {
        setGameStarted(false);
    }

    return (
        <div className="App" style={{ padding: '20px' }}>
            <Starter />

            {!gameStarted ? (
                <>
                    <h1>Welcome to Minesweeper</h1>
                    <div>
                        <button onClick={() => handlePreset('easy')}>Easy</button>
                        <button onClick={() => handlePreset('medium')}>Medium</button>
                        <button onClick={() => handlePreset('expert')}>Expert</button>
                    </div>
                    <h2>Or Customize Your Game</h2>
                    <form onSubmit={(event) => {
                        event.preventDefault();
                        const gridSize = parseInt((event.target as any)[0].value);
                        const numMines = parseInt((event.target as any)[1].value);
                        handleStartGame({ gridSize, numMines });
                    }}>
                        <input type="number" placeholder="Grid Size" min={4} max={26} defaultValue={8} />
                        <input type="number" placeholder="Number of Mines" min={1} max={236} defaultValue={10} />
                        <button type="submit">Start Custom Game</button>
                    </form>
                </>
            ) : (
                <Game gridSize={gameSettings.gridSize} numMines={gameSettings.numMines} selectBoard={handleSelectBoard} />
            )}
        </div>
    )
}

export default App
