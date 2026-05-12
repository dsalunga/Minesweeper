import { useCallback, useEffect, useRef, useState } from 'react';
import {
    BoardConfig,
    Cell,
    DIFFICULTY_PRESETS,
    Difficulty,
    GameStatus,
    chord,
    cloneBoard,
    createEmptyBoard,
    flood,
    placeMines,
    sanitizeConfig,
} from '../engine/minesweeper';

interface BestTimes {
    beginner?: number;
    intermediate?: number;
    expert?: number;
}

const STORAGE_KEY = 'minesweeper-react.bestTimes.v1';

const loadBest = (): BestTimes => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? (JSON.parse(raw) as BestTimes) : {};
    } catch {
        return {};
    }
};

export interface UseGameApi {
    config: BoardConfig;
    difficulty: Difficulty;
    board: Cell[][];
    status: GameStatus;
    flagsPlaced: number;
    minesRemaining: number;
    elapsed: number;
    bestTimes: BestTimes;
    newGame: (difficulty: Difficulty, custom?: BoardConfig) => void;
    reveal: (row: number, col: number) => void;
    toggleFlag: (row: number, col: number) => void;
    chordReveal: (row: number, col: number) => void;
    restart: () => void;
}

export const useGame = (initialDifficulty: Difficulty = 'beginner'): UseGameApi => {
    const [difficulty, setDifficulty] = useState<Difficulty>(initialDifficulty);
    const [config, setConfig] = useState<BoardConfig>(DIFFICULTY_PRESETS.beginner);
    const [board, setBoard] = useState<Cell[][]>(() => createEmptyBoard(9, 9));
    const [status, setStatus] = useState<GameStatus>('idle');
    const [flagsPlaced, setFlagsPlaced] = useState(0);
    const [elapsed, setElapsed] = useState(0);
    const [bestTimes, setBestTimes] = useState<BestTimes>(loadBest);

    const firstClickRef = useRef(true);
    const startMsRef = useRef(0);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const stopTimer = useCallback(() => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    }, []);

    const startTimer = useCallback(() => {
        stopTimer();
        startMsRef.current = Date.now();
        timerRef.current = setInterval(() => {
            setElapsed(Math.floor((Date.now() - startMsRef.current) / 1000));
        }, 200);
    }, [stopTimer]);

    useEffect(() => () => stopTimer(), [stopTimer]);

    const newGame = useCallback(
        (d: Difficulty, custom?: BoardConfig) => {
            const cfg =
                d === 'custom'
                    ? sanitizeConfig(custom ?? config)
                    : DIFFICULTY_PRESETS[d];
            setDifficulty(d);
            setConfig(cfg);
            setBoard(createEmptyBoard(cfg.rows, cfg.cols));
            setStatus('idle');
            setFlagsPlaced(0);
            setElapsed(0);
            firstClickRef.current = true;
            stopTimer();
        },
        [config, stopTimer],
    );

    const restart = useCallback(() => newGame(difficulty, config), [difficulty, config, newGame]);

    const recordBest = useCallback(
        (t: number) => {
            if (difficulty === 'custom') return;
            const cur = bestTimes;
            if (!cur[difficulty] || t < (cur[difficulty] as number)) {
                const next: BestTimes = { ...cur, [difficulty]: t };
                setBestTimes(next);
                try {
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
                } catch {
                    /* ignore */
                }
            }
        },
        [difficulty, bestTimes],
    );

    const checkWin = useCallback(
        (b: Cell[][]) => {
            const totalSafe = config.rows * config.cols - config.mines;
            let revealed = 0;
            for (const r of b) for (const c of r) if (c.state === 'revealed') revealed++;
            if (revealed >= totalSafe) {
                for (const r of b) for (const c of r) if (c.mine && c.state !== 'flagged') c.state = 'flagged';
                setFlagsPlaced(config.mines);
                setBoard(b);
                setStatus('won');
                stopTimer();
                recordBest(Math.floor((Date.now() - startMsRef.current) / 1000));
            }
        },
        [config, stopTimer, recordBest],
    );

    const revealAllMines = (b: Cell[][]) => {
        for (const r of b) {
            for (const c of r) {
                if (c.mine && c.state !== 'flagged') c.state = 'revealed';
                if (!c.mine && c.state === 'flagged') {
                    c.wrongFlag = true;
                    c.state = 'revealed';
                }
            }
        }
    };

    const reveal = useCallback(
        (row: number, col: number) => {
            if (status === 'won' || status === 'lost') return;
            const b = cloneBoard(board);
            const cell = b[row][col];
            if (cell.state === 'flagged' || cell.state === 'revealed') return;

            if (firstClickRef.current) {
                placeMines(b, config.mines, row, col);
                firstClickRef.current = false;
                setStatus('playing');
                startTimer();
            }

            if (cell.mine) {
                cell.state = 'revealed';
                cell.exploded = true;
                revealAllMines(b);
                setBoard(b);
                setStatus('lost');
                stopTimer();
                return;
            }

            flood(b, row, col);
            setBoard(b);
            checkWin(b);
        },
        [board, config, status, startTimer, stopTimer, checkWin],
    );

    const toggleFlag = useCallback(
        (row: number, col: number) => {
            if (status === 'won' || status === 'lost') return;
            const b = cloneBoard(board);
            const cell = b[row][col];
            if (cell.state === 'revealed') return;
            if (cell.state === 'hidden') {
                cell.state = 'flagged';
                setFlagsPlaced((n) => n + 1);
            } else if (cell.state === 'flagged') {
                cell.state = 'questioned';
                setFlagsPlaced((n) => n - 1);
            } else {
                cell.state = 'hidden';
            }
            setBoard(b);
        },
        [board, status],
    );

    const chordReveal = useCallback(
        (row: number, col: number) => {
            if (status !== 'playing') return;
            const b = cloneBoard(board);
            const revealed = chord(b, row, col);
            if (revealed.length === 0) return;
            const exploded = revealed.some((c) => c.exploded);
            if (exploded) {
                revealAllMines(b);
                setBoard(b);
                setStatus('lost');
                stopTimer();
                return;
            }
            setBoard(b);
            checkWin(b);
        },
        [board, status, stopTimer, checkWin],
    );

    const minesRemaining = Math.max(config.mines - flagsPlaced, 0);

    return {
        config,
        difficulty,
        board,
        status,
        flagsPlaced,
        minesRemaining,
        elapsed,
        bestTimes,
        newGame,
        reveal,
        toggleFlag,
        chordReveal,
        restart,
    };
};
