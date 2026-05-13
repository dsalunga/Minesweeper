// Minesweeper engine + renderer (vanilla JS, shared between web wrappers).

const PRESETS = {
  beginner: { rows: 9, cols: 9, mines: 10 },
  intermediate: { rows: 16, cols: 16, mines: 40 },
  expert: { rows: 16, cols: 30, mines: 99 },
};

class Game {
  constructor(rows, cols, mines) {
    this.rows = rows;
    this.cols = cols;
    this.mines = mines;
    this.flags = 0;
    this.firstClick = true;
    this.status = 'idle'; // idle | playing | won | lost
    this.startedAt = 0;
    this.endedAt = 0;
    this.cells = Array.from({ length: rows }, (_, r) =>
      Array.from({ length: cols }, (_, c) => ({
        r, c, mine: false, revealed: false, flagged: false, questioned: false,
        adjacent: 0, exploded: false, wrongFlag: false,
      })),
    );
  }

  inBounds(r, c) { return r >= 0 && r < this.rows && c >= 0 && c < this.cols; }

  placeMines(safeR, safeC) {
    const safe = new Set();
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
      const rr = safeR + dr, cc = safeC + dc;
      if (this.inBounds(rr, cc)) safe.add(rr * this.cols + cc);
    }
    const candidates = [];
    for (let r = 0; r < this.rows; r++) for (let c = 0; c < this.cols; c++) {
      const k = r * this.cols + c;
      if (!safe.has(k)) candidates.push([r, c]);
    }
    for (let i = candidates.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
    }
    const n = Math.min(this.mines, candidates.length);
    for (let i = 0; i < n; i++) {
      const [r, c] = candidates[i];
      this.cells[r][c].mine = true;
    }
    for (let r = 0; r < this.rows; r++) for (let c = 0; c < this.cols; c++) {
      if (!this.cells[r][c].mine) this.cells[r][c].adjacent = this.countAdj(r, c);
    }
  }

  countAdj(r, c) {
    let n = 0;
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
      if (!dr && !dc) continue;
      const rr = r + dr, cc = c + dc;
      if (this.inBounds(rr, cc) && this.cells[rr][cc].mine) n++;
    }
    return n;
  }

  reveal(r, c) {
    if (this.status === 'won' || this.status === 'lost') return;
    const cell = this.cells[r][c];
    if (cell.revealed || cell.flagged) return;
    if (this.firstClick) {
      this.placeMines(r, c);
      this.firstClick = false;
      this.status = 'playing';
      this.startedAt = Date.now();
    }
    this._flood(r, c);
    if (cell.mine) {
      cell.exploded = true;
      this._revealAllMines();
      this.status = 'lost';
      this.endedAt = Date.now();
      return;
    }
    if (this._checkWin()) {
      this.status = 'won';
      this.endedAt = Date.now();
    }
  }

  _flood(r, c) {
    const stack = [[r, c]];
    while (stack.length) {
      const [cr, cc] = stack.pop();
      const cell = this.cells[cr][cc];
      if (cell.revealed || cell.flagged) continue;
      cell.revealed = true;
      if (cell.mine || cell.adjacent > 0) continue;
      for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
        if (!dr && !dc) continue;
        const nr = cr + dr, nc = cc + dc;
        if (this.inBounds(nr, nc) && !this.cells[nr][nc].revealed) stack.push([nr, nc]);
      }
    }
  }

  toggleFlag(r, c) {
    if (this.status === 'won' || this.status === 'lost') return;
    const cell = this.cells[r][c];
    if (cell.revealed) return;
    if (!cell.flagged && !cell.questioned) { cell.flagged = true; this.flags++; }
    else if (cell.flagged) { cell.flagged = false; cell.questioned = true; this.flags--; }
    else { cell.questioned = false; }
  }

  chord(r, c) {
    if (this.firstClick || this.status !== 'playing') return;
    const cell = this.cells[r][c];
    if (!cell.revealed || cell.adjacent === 0) return;
    let flagged = 0;
    const hidden = [];
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
      if (!dr && !dc) continue;
      const rr = r + dr, cc = c + dc;
      if (!this.inBounds(rr, cc)) continue;
      const n = this.cells[rr][cc];
      if (n.flagged) flagged++;
      else if (!n.revealed) hidden.push([rr, cc]);
    }
    if (flagged !== cell.adjacent) return;
    for (const [hr, hc] of hidden) {
      this.reveal(hr, hc);
      if (this.status === 'lost') return;
    }
  }

  _revealAllMines() {
    for (let r = 0; r < this.rows; r++) for (let c = 0; c < this.cols; c++) {
      const cell = this.cells[r][c];
      if (cell.mine && !cell.flagged) cell.revealed = true;
      if (!cell.mine && cell.flagged) { cell.wrongFlag = true; cell.revealed = true; }
    }
  }

  _checkWin() {
    for (let r = 0; r < this.rows; r++) for (let c = 0; c < this.cols; c++) {
      const cell = this.cells[r][c];
      if (!cell.mine && !cell.revealed) return false;
    }
    for (let r = 0; r < this.rows; r++) for (let c = 0; c < this.cols; c++) {
      const cell = this.cells[r][c];
      if (cell.mine && !cell.flagged) { cell.flagged = true; this.flags++; }
    }
    return true;
  }

  get minesRemaining() { return Math.max(this.mines - this.flags, 0); }
  get elapsed() {
    if (!this.startedAt) return 0;
    const end = (this.status === 'won' || this.status === 'lost') ? this.endedAt : Date.now();
    return Math.min(Math.floor((end - this.startedAt) / 1000), 999);
  }
}

// ---------- UI ----------

const boardEl = document.getElementById('board');
const minesEl = document.getElementById('mines');
const timerEl = document.getElementById('timer');
const faceEl = document.getElementById('face');
const bannerEl = document.getElementById('banner');
const presetsEl = document.querySelector('.presets');

let game;
let currentPreset = 'beginner';
let leftDown = false, rightDown = false, chordTarget = null;
let timerHandle = null;

function pad(n) { return String(n).padStart(3, '0'); }

function newGame(preset = currentPreset) {
  currentPreset = preset;
  let cfg;
  if (preset === 'custom') {
    const r = parseInt(prompt('Rows (5-26)?', '12'), 10);
    const c = parseInt(prompt('Cols (5-26)?', '20'), 10);
    if (!Number.isFinite(r) || !Number.isFinite(c)) return newGame('beginner');
    const max = r * c - 9;
    const m = parseInt(prompt(`Mines (1-${max})?`, '40'), 10);
    cfg = { rows: Math.max(5, Math.min(26, r)), cols: Math.max(5, Math.min(26, c)),
            mines: Math.max(1, Math.min(max, m)) };
  } else {
    cfg = PRESETS[preset];
  }
  game = new Game(cfg.rows, cfg.cols, cfg.mines);
  bannerEl.hidden = true;
  bannerEl.classList.remove('win', 'lose');
  faceEl.textContent = '🙂';
  for (const b of presetsEl.querySelectorAll('button')) {
    b.classList.toggle('active', b.dataset.preset === preset);
  }
  buildBoard();
  render();
  if (timerHandle) clearInterval(timerHandle);
  timerHandle = setInterval(() => {
    if (game && game.status === 'playing') updateHud();
  }, 250);
}

function buildBoard() {
  boardEl.style.gridTemplateColumns = `repeat(${game.cols}, 30px)`;
  boardEl.style.gridTemplateRows = `repeat(${game.rows}, 30px)`;
  boardEl.innerHTML = '';
  for (let r = 0; r < game.rows; r++) {
    for (let c = 0; c < game.cols; c++) {
      const div = document.createElement('div');
      div.className = 'cell';
      div.dataset.r = r;
      div.dataset.c = c;
      div.addEventListener('contextmenu', e => e.preventDefault());
      div.addEventListener('mousedown', onCellMouseDown);
      div.addEventListener('mouseup', onCellMouseUp);
      div.addEventListener('mouseleave', onCellMouseLeave);
      boardEl.appendChild(div);
    }
  }
}

function onCellMouseDown(e) {
  if (e.button === 0) leftDown = true;
  if (e.button === 2) rightDown = true;
  chordTarget = { r: +this.dataset.r, c: +this.dataset.c };
}

function onCellMouseUp(e) {
  if (!game || game.status === 'won' || game.status === 'lost') {
    leftDown = rightDown = false; chordTarget = null;
    return;
  }
  const r = +this.dataset.r, c = +this.dataset.c;
  if ((leftDown && rightDown) || e.button === 1) {
    game.chord(r, c);
  } else if (e.button === 0) {
    game.reveal(r, c);
  } else if (e.button === 2) {
    game.toggleFlag(r, c);
  }
  if (e.button === 0) leftDown = false;
  if (e.button === 2) rightDown = false;
  render();
}

function onCellMouseLeave() { /* keep state for chord */ }

document.addEventListener('mouseup', () => { leftDown = false; rightDown = false; chordTarget = null; });

faceEl.addEventListener('click', () => newGame(currentPreset));

presetsEl.addEventListener('click', e => {
  const b = e.target.closest('button[data-preset]');
  if (b) newGame(b.dataset.preset);
});

function render() {
  const cells = boardEl.children;
  for (let r = 0; r < game.rows; r++) for (let c = 0; c < game.cols; c++) {
    const el = cells[r * game.cols + c];
    const cell = game.cells[r][c];
    el.className = 'cell';
    el.textContent = '';
    if (cell.wrongFlag) { el.classList.add('revealed', 'wrong-flag'); continue; }
    if (cell.flagged) { el.classList.add('flag'); continue; }
    if (cell.questioned) { el.classList.add('question'); continue; }
    if (!cell.revealed) continue;
    el.classList.add('revealed');
    if (cell.mine) {
      el.classList.add('mine');
      if (cell.exploded) el.classList.add('exploded');
      continue;
    }
    if (cell.adjacent > 0) {
      el.classList.add('n' + cell.adjacent);
      el.textContent = String(cell.adjacent);
    }
  }
  updateHud();
  if (game.status === 'lost') {
    faceEl.textContent = '😵';
    bannerEl.textContent = '💥 BOOM 💥';
    bannerEl.classList.add('lose');
    bannerEl.hidden = false;
  } else if (game.status === 'won') {
    faceEl.textContent = '😎';
    bannerEl.textContent = '✨ VICTORY ✨';
    bannerEl.classList.add('win');
    bannerEl.hidden = false;
  } else {
    faceEl.textContent = leftDown ? '😮' : '🙂';
  }
}

function updateHud() {
  minesEl.textContent = pad(game.minesRemaining);
  timerEl.textContent = pad(game.elapsed);
}

newGame('beginner');
