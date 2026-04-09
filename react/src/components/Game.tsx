import React, { useState, useCallback } from 'react';
import Grid from './Grid';

interface GameProps {
    gridSize: number;
    numMines: number;
    selectBoard: () => void;  // Callback to reset game in App component
}

const Game: React.FC<GameProps> = ({ gridSize, numMines, selectBoard }) => {
    const [gameOver, setGameOver] = useState(false);
    const [gameWon, setGameWon] = useState(false);
    const [resetCounter, setResetCounter] = useState(0);

    const handleGameOver = useCallback((won: boolean) => {
        setGameOver(true);
        setGameWon(won);
    }, []);

    const resetGame = () => {
        setGameOver(false);
        setGameWon(false);
        setResetCounter(c => c + 1);
    };

    return (
        <div>
            <h1>Minesweeper Game</h1>
            {gameOver && (
                <div>
                    <h3>{gameWon ? "Congratulations, you won!" : "Game Over! Try again?"}</h3>
                    <button onClick={resetGame}>Restart Game</button>
                    <button onClick={selectBoard}>Board Selection</button>
                </div>
            )}
            <Grid gridSize={gridSize} numMines={numMines} onGameOver={handleGameOver} key={resetCounter} />
        </div>
    );
};

export default Game;
