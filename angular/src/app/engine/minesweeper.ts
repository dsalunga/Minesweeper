export type CellState = 'hidden' | 'revealed' | 'flagged' | 'questioned';

export interface Cell {
  row: number;
  col: number;
  mine: boolean;
  adjacent: number;
  state: CellState;
  exploded?: boolean;
  wrongFlag?: boolean;
}

export type Difficulty = 'beginner' | 'intermediate' | 'expert' | 'custom';

export interface BoardConfig {
  rows: number;
  cols: number;
  mines: number;
}

export const DIFFICULTY_PRESETS: Record<Exclude<Difficulty, 'custom'>, BoardConfig> = {
  beginner: { rows: 9, cols: 9, mines: 10 },
  intermediate: { rows: 16, cols: 16, mines: 40 },
  expert: { rows: 16, cols: 30, mines: 99 },
};

export type GameStatus = 'idle' | 'playing' | 'won' | 'lost';

export function createEmptyBoard(rows: number, cols: number): Cell[][] {
  const board: Cell[][] = [];
  for (let r = 0; r < rows; r++) {
    const row: Cell[] = [];
    for (let c = 0; c < cols; c++) {
      row.push({ row: r, col: c, mine: false, adjacent: 0, state: 'hidden' });
    }
    board.push(row);
  }
  return board;
}

/**
 * Place mines avoiding the safe zone (the first-clicked cell and its neighbours).
 */
export function placeMines(
  board: Cell[][],
  mines: number,
  safeRow: number,
  safeCol: number,
): void {
  const rows = board.length;
  const cols = board[0].length;
  const safe = new Set<number>();
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      const r = safeRow + dr;
      const c = safeCol + dc;
      if (r >= 0 && r < rows && c >= 0 && c < cols) {
        safe.add(r * cols + c);
      }
    }
  }

  const total = rows * cols;
  const indexes: number[] = [];
  for (let i = 0; i < total; i++) {
    if (!safe.has(i)) indexes.push(i);
  }

  // Cap the mine count to fit the available cells.
  const placeCount = Math.min(mines, indexes.length);

  // Fisher–Yates partial shuffle to pick `placeCount` mines.
  for (let i = 0; i < placeCount; i++) {
    const j = i + Math.floor(Math.random() * (indexes.length - i));
    [indexes[i], indexes[j]] = [indexes[j], indexes[i]];
    const idx = indexes[i];
    const r = Math.floor(idx / cols);
    const c = idx % cols;
    board[r][c].mine = true;
  }

  // Compute adjacency counts.
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (board[r][c].mine) continue;
      let count = 0;
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const nr = r + dr;
          const nc = c + dc;
          if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && board[nr][nc].mine) count++;
        }
      }
      board[r][c].adjacent = count;
    }
  }
}

/**
 * Flood reveal starting at (row, col). Mutates board. Returns the cells
 * revealed as a result.
 */
export function flood(board: Cell[][], row: number, col: number): Cell[] {
  const rows = board.length;
  const cols = board[0].length;
  const revealed: Cell[] = [];
  const stack: Array<[number, number]> = [[row, col]];

  while (stack.length) {
    const [r, c] = stack.pop()!;
    if (r < 0 || r >= rows || c < 0 || c >= cols) continue;
    const cell = board[r][c];
    if (cell.state !== 'hidden') continue;
    if (cell.mine) continue;
    cell.state = 'revealed';
    revealed.push(cell);
    if (cell.adjacent === 0) {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          stack.push([r + dr, c + dc]);
        }
      }
    }
  }

  return revealed;
}

/**
 * Chord: when clicking a revealed numbered cell whose flagged neighbours
 * equal its number, reveal all remaining hidden neighbours. Returns the
 * neighbour cells that were revealed (any of them might be a mine — caller
 * checks for game-over).
 */
export function chord(board: Cell[][], row: number, col: number): Cell[] {
  const rows = board.length;
  const cols = board[0].length;
  const cell = board[row][col];
  if (cell.state !== 'revealed' || cell.adjacent === 0) return [];

  let flagged = 0;
  const hidden: Cell[] = [];
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const r = row + dr;
      const c = col + dc;
      if (r < 0 || r >= rows || c < 0 || c >= cols) continue;
      const n = board[r][c];
      if (n.state === 'flagged') flagged++;
      else if (n.state === 'hidden') hidden.push(n);
    }
  }
  if (flagged !== cell.adjacent) return [];

  const revealedAll: Cell[] = [];
  for (const h of hidden) {
    if (h.mine) {
      h.state = 'revealed';
      h.exploded = true;
      revealedAll.push(h);
    } else {
      const r = flood(board, h.row, h.col);
      revealedAll.push(...r);
    }
  }
  return revealedAll;
}
