import { Injectable, computed, signal } from '@angular/core';
import {
  BoardConfig,
  Cell,
  DIFFICULTY_PRESETS,
  Difficulty,
  GameStatus,
  chord,
  createEmptyBoard,
  flood,
  placeMines,
} from '../engine/minesweeper';

interface BestTimes {
  beginner?: number;
  intermediate?: number;
  expert?: number;
}

const STORAGE_KEY = 'minesweeper.bestTimes.v1';

@Injectable({ providedIn: 'root' })
export class GameService {
  readonly difficulty = signal<Difficulty>('beginner');
  readonly config = signal<BoardConfig>(DIFFICULTY_PRESETS.beginner);
  readonly board = signal<Cell[][]>(createEmptyBoard(9, 9));
  readonly status = signal<GameStatus>('idle');
  readonly flagsPlaced = signal(0);
  readonly elapsed = signal(0);
  readonly bestTimes = signal<BestTimes>(this.loadBest());

  readonly minesRemaining = computed(() =>
    Math.max(this.config().mines - this.flagsPlaced(), 0),
  );

  readonly cellsRevealed = computed(() => {
    let n = 0;
    for (const row of this.board()) for (const c of row) if (c.state === 'revealed') n++;
    return n;
  });

  private timerHandle: ReturnType<typeof setInterval> | null = null;
  private startMs = 0;
  private firstClick = true;

  newGame(difficulty: Difficulty, custom?: BoardConfig): void {
    const cfg =
      difficulty === 'custom'
        ? this.sanitize(custom ?? this.config())
        : DIFFICULTY_PRESETS[difficulty];
    this.difficulty.set(difficulty);
    this.config.set(cfg);
    this.board.set(createEmptyBoard(cfg.rows, cfg.cols));
    this.status.set('idle');
    this.flagsPlaced.set(0);
    this.elapsed.set(0);
    this.firstClick = true;
    this.stopTimer();
  }

  reveal(row: number, col: number): void {
    if (this.status() === 'won' || this.status() === 'lost') return;
    const board = this.cloneBoard();
    const cell = board[row][col];
    if (cell.state === 'flagged' || cell.state === 'revealed') return;

    if (this.firstClick) {
      placeMines(board, this.config().mines, row, col);
      this.firstClick = false;
      this.status.set('playing');
      this.startTimer();
    }

    if (cell.mine) {
      cell.state = 'revealed';
      cell.exploded = true;
      this.revealAllMines(board);
      this.board.set(board);
      this.status.set('lost');
      this.stopTimer();
      return;
    }

    flood(board, row, col);
    this.board.set(board);
    this.checkWin(board);
  }

  toggleFlag(row: number, col: number): void {
    if (this.status() === 'won' || this.status() === 'lost') return;
    const board = this.cloneBoard();
    const cell = board[row][col];
    if (cell.state === 'revealed') return;
    if (cell.state === 'hidden') {
      cell.state = 'flagged';
      this.flagsPlaced.update((n) => n + 1);
    } else if (cell.state === 'flagged') {
      cell.state = 'questioned';
      this.flagsPlaced.update((n) => n - 1);
    } else {
      cell.state = 'hidden';
    }
    this.board.set(board);
  }

  chordReveal(row: number, col: number): void {
    if (this.status() !== 'playing') return;
    const board = this.cloneBoard();
    const revealed = chord(board, row, col);
    if (revealed.length === 0) return;
    const exploded = revealed.some((c) => c.exploded);
    if (exploded) {
      this.revealAllMines(board);
      this.board.set(board);
      this.status.set('lost');
      this.stopTimer();
      return;
    }
    this.board.set(board);
    this.checkWin(board);
  }

  private checkWin(board: Cell[][]): void {
    const cfg = this.config();
    const totalSafe = cfg.rows * cfg.cols - cfg.mines;
    let revealed = 0;
    for (const r of board) for (const c of r) if (c.state === 'revealed') revealed++;
    if (revealed >= totalSafe) {
      // auto-flag remaining mines for visual completeness
      for (const r of board) for (const c of r) if (c.mine && c.state !== 'flagged') c.state = 'flagged';
      this.flagsPlaced.set(cfg.mines);
      this.board.set(board);
      this.status.set('won');
      this.stopTimer();
      this.recordBest();
    }
  }

  private revealAllMines(board: Cell[][]): void {
    for (const r of board) {
      for (const c of r) {
        if (c.mine && c.state !== 'flagged') c.state = 'revealed';
        if (!c.mine && c.state === 'flagged') {
          c.wrongFlag = true;
          c.state = 'revealed';
        }
      }
    }
  }

  private cloneBoard(): Cell[][] {
    return this.board().map((row) => row.map((c) => ({ ...c })));
  }

  private startTimer(): void {
    this.stopTimer();
    this.startMs = Date.now();
    this.timerHandle = setInterval(() => {
      this.elapsed.set(Math.floor((Date.now() - this.startMs) / 1000));
    }, 200);
  }

  private stopTimer(): void {
    if (this.timerHandle) {
      clearInterval(this.timerHandle);
      this.timerHandle = null;
    }
  }

  private recordBest(): void {
    const d = this.difficulty();
    if (d === 'custom') return;
    const t = this.elapsed();
    const cur = this.bestTimes();
    if (!cur[d] || t < (cur[d] as number)) {
      const next: BestTimes = { ...cur, [d]: t };
      this.bestTimes.set(next);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
    }
  }

  private loadBest(): BestTimes {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as BestTimes) : {};
    } catch {
      return {};
    }
  }

  private sanitize(cfg: BoardConfig): BoardConfig {
    const rows = Math.max(5, Math.min(30, Math.floor(cfg.rows)));
    const cols = Math.max(5, Math.min(40, Math.floor(cfg.cols)));
    const maxMines = rows * cols - 9; // leave the safe zone
    const mines = Math.max(1, Math.min(maxMines, Math.floor(cfg.mines)));
    return { rows, cols, mines };
  }
}
