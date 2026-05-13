// Minesweeper for Capacitor (touch + long-press + flag-mode toggle)

const PRESETS = {
  beginner: { rows: 9, cols: 9, mines: 10 },
  intermediate: { rows: 16, cols: 16, mines: 40 },
  expert: { rows: 16, cols: 30, mines: 99 },
};

class Game {
  constructor(rows, cols, mines) {
    this.rows = rows; this.cols = cols; this.mines = mines;
    this.flags = 0; this.firstClick = true;
    this.status = 'idle'; this.startedAt = 0; this.endedAt = 0;
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
    const cands = [];
    for (let r = 0; r < this.rows; r++) for (let c = 0; c < this.cols; c++)
      if (!safe.has(r * this.cols + c)) cands.push([r, c]);
    for (let i = cands.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cands[i], cands[j]] = [cands[j], cands[i]];
    }
    for (let i = 0; i < Math.min(this.mines, cands.length); i++) {
      const [r, c] = cands[i]; this.cells[r][c].mine = true;
    }
    for (let r = 0; r < this.rows; r++) for (let c = 0; c < this.cols; c++)
      if (!this.cells[r][c].mine) this.cells[r][c].adjacent = this._adj(r, c);
  }
  _adj(r, c) {
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
      this.placeMines(r, c); this.firstClick = false;
      this.status = 'playing'; this.startedAt = Date.now();
    }
    this._flood(r, c);
    if (cell.mine) {
      cell.exploded = true; this._revealAll();
      this.status = 'lost'; this.endedAt = Date.now(); return;
    }
    if (this._win()) { this.status = 'won'; this.endedAt = Date.now(); }
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
    let flagged = 0; const hidden = [];
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
      if (!dr && !dc) continue;
      const rr = r + dr, cc = c + dc;
      if (!this.inBounds(rr, cc)) continue;
      const n = this.cells[rr][cc];
      if (n.flagged) flagged++; else if (!n.revealed) hidden.push([rr, cc]);
    }
    if (flagged !== cell.adjacent) return;
    for (const [hr, hc] of hidden) { this.reveal(hr, hc); if (this.status === 'lost') return; }
  }
  _revealAll() {
    for (let r = 0; r < this.rows; r++) for (let c = 0; c < this.cols; c++) {
      const cell = this.cells[r][c];
      if (cell.mine && !cell.flagged) cell.revealed = true;
      if (!cell.mine && cell.flagged) { cell.wrongFlag = true; cell.revealed = true; }
    }
  }
  _win() {
    for (let r = 0; r < this.rows; r++) for (let c = 0; c < this.cols; c++)
      if (!this.cells[r][c].mine && !this.cells[r][c].revealed) return false;
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

const $ = id => document.getElementById(id);
const boardEl = $('board'), minesEl = $('mines'), timerEl = $('timer');
const faceEl = $('face'), bannerEl = $('banner');
const presetsEl = document.querySelector('.presets');
const modeReveal = $('mode-reveal'), modeFlag = $('mode-flag');

let game, currentPreset = 'beginner', flagMode = false, timerHandle = null;
let pressTimer = null, longPressed = false;

function pad(n) { return String(n).padStart(3, '0'); }

function newGame(preset = currentPreset) {
  currentPreset = preset;
  const cfg = PRESETS[preset] || PRESETS.beginner;
  game = new Game(cfg.rows, cfg.cols, cfg.mines);
  bannerEl.hidden = true; bannerEl.classList.remove('win', 'lose');
  faceEl.textContent = '🙂';
  for (const b of presetsEl.querySelectorAll('button'))
    b.classList.toggle('active', b.dataset.preset === preset);
  buildBoard(); render();
  if (timerHandle) clearInterval(timerHandle);
  timerHandle = setInterval(() => { if (game && game.status === 'playing') updateHud(); }, 250);
}

function buildBoard() {
  boardEl.style.gridTemplateColumns = `repeat(${game.cols}, 28px)`;
  boardEl.style.gridTemplateRows = `repeat(${game.rows}, 28px)`;
  boardEl.innerHTML = '';
  for (let r = 0; r < game.rows; r++) for (let c = 0; c < game.cols; c++) {
    const div = document.createElement('div');
    div.className = 'cell'; div.dataset.r = r; div.dataset.c = c;
    div.addEventListener('contextmenu', e => e.preventDefault());
    div.addEventListener('pointerdown', onDown);
    div.addEventListener('pointerup', onUp);
    div.addEventListener('pointercancel', onCancel);
    div.addEventListener('pointerleave', onCancel);
    boardEl.appendChild(div);
  }
}

function onDown(e) {
  longPressed = false;
  pressTimer = setTimeout(() => {
    longPressed = true;
    const r = +this.dataset.r, c = +this.dataset.c;
    const cell = game.cells[r][c];
    if (cell.revealed && cell.adjacent > 0) game.chord(r, c);
    else game.toggleFlag(r, c);
    render();
  }, 320);
}
function onUp(e) {
  if (pressTimer) { clearTimeout(pressTimer); pressTimer = null; }
  if (longPressed) return;
  const r = +this.dataset.r, c = +this.dataset.c;
  const cell = game.cells[r][c];
  if (cell.revealed && cell.adjacent > 0) game.chord(r, c);
  else if (flagMode) game.toggleFlag(r, c);
  else game.reveal(r, c);
  render();
}
function onCancel() {
  if (pressTimer) { clearTimeout(pressTimer); pressTimer = null; }
}

faceEl.addEventListener('click', () => newGame(currentPreset));
presetsEl.addEventListener('click', e => {
  const b = e.target.closest('button[data-preset]');
  if (b) newGame(b.dataset.preset);
});
modeReveal.addEventListener('click', () => { flagMode = false; modeReveal.classList.add('active'); modeFlag.classList.remove('active'); });
modeFlag.addEventListener('click', () => { flagMode = true; modeFlag.classList.add('active'); modeReveal.classList.remove('active'); });

function render() {
  const els = boardEl.children;
  for (let r = 0; r < game.rows; r++) for (let c = 0; c < game.cols; c++) {
    const el = els[r * game.cols + c]; const cell = game.cells[r][c];
    el.className = 'cell'; el.textContent = '';
    if (cell.wrongFlag) { el.classList.add('revealed', 'wrong-flag'); continue; }
    if (cell.flagged) { el.classList.add('flag'); continue; }
    if (cell.questioned) { el.classList.add('question'); continue; }
    if (!cell.revealed) continue;
    el.classList.add('revealed');
    if (cell.mine) { el.classList.add('mine'); if (cell.exploded) el.classList.add('exploded'); continue; }
    if (cell.adjacent > 0) { el.classList.add('n' + cell.adjacent); el.textContent = String(cell.adjacent); }
  }
  updateHud();
  if (game.status === 'lost') { faceEl.textContent = '😵'; bannerEl.textContent = '💥 BOOM 💥'; bannerEl.classList.add('lose'); bannerEl.hidden = false; }
  else if (game.status === 'won') { faceEl.textContent = '😎'; bannerEl.textContent = '✨ VICTORY ✨'; bannerEl.classList.add('win'); bannerEl.hidden = false; }
}

function updateHud() {
  minesEl.textContent = pad(game.minesRemaining);
  timerEl.textContent = pad(game.elapsed);
}

newGame('beginner');
