import { FormEvent, useMemo, useState } from "react";
import "./App.css";

import Game from "./components/Game";
import Starter from "./components/Starter.tsx";

interface Settings {
    gridSize: number;
    numMines: number;
}

const MIN_GRID_SIZE = 4;
const MAX_GRID_SIZE = 26;

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);
const getMaxMinesForGrid = (gridSize: number) => Math.max(1, gridSize * gridSize - 1);

function App() {
    const [gameStarted, setGameStarted] = useState(false);
    const [gameSettings, setGameSettings] = useState<Settings>({ gridSize: 8, numMines: 10 });
    const [customGridSize, setCustomGridSize] = useState(8);
    const [customNumMines, setCustomNumMines] = useState(10);

    const presets = {
        easy: { gridSize: 8, numMines: 10 },
        medium: { gridSize: 16, numMines: 40 },
        expert: { gridSize: 24, numMines: 99 },
    };
    const customMaxMines = useMemo(() => getMaxMinesForGrid(customGridSize), [customGridSize]);

    const handleStartGame = (settings: Settings) => {
        setGameSettings(settings);
        setGameStarted(true);
    };

    const handlePreset = (level: keyof typeof presets) => {
        handleStartGame(presets[level]);
    };

    const handleSelectBoard = () => {
        setGameStarted(false);
    };

    const handleCustomGridSizeChange = (value: string) => {
        const parsed = Number(value);
        if (!Number.isFinite(parsed)) {
            return;
        }

        const nextSize = clamp(Math.trunc(parsed), MIN_GRID_SIZE, MAX_GRID_SIZE);
        setCustomGridSize(nextSize);
        setCustomNumMines((current) => clamp(current, 1, getMaxMinesForGrid(nextSize)));
    };

    const handleCustomMineCountChange = (value: string) => {
        const parsed = Number(value);
        if (!Number.isFinite(parsed)) {
            return;
        }
        setCustomNumMines(clamp(Math.trunc(parsed), 1, customMaxMines));
    };

    const startCustomGame = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const sanitizedGridSize = clamp(customGridSize, MIN_GRID_SIZE, MAX_GRID_SIZE);
        const sanitizedMines = clamp(customNumMines, 1, getMaxMinesForGrid(sanitizedGridSize));

        setCustomGridSize(sanitizedGridSize);
        setCustomNumMines(sanitizedMines);
        handleStartGame({ gridSize: sanitizedGridSize, numMines: sanitizedMines });
    };

    return (
        <div className="App" style={{ padding: "20px" }}>
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
                    <form onSubmit={startCustomGame}>
                        <input
                            type="number"
                            placeholder="Grid Size"
                            min={MIN_GRID_SIZE}
                            max={MAX_GRID_SIZE}
                            value={customGridSize}
                            onChange={(event) => handleCustomGridSizeChange(event.target.value)}
                        />
                        <input
                            type="number"
                            placeholder="Number of Mines"
                            min={1}
                            max={customMaxMines}
                            value={customNumMines}
                            onChange={(event) => handleCustomMineCountChange(event.target.value)}
                        />
                        <button type="submit">Start Custom Game</button>
                    </form>
                </>
            ) : (
                <Game gridSize={gameSettings.gridSize} numMines={gameSettings.numMines} selectBoard={handleSelectBoard} />
            )}
        </div>
    );
}

export default App;
