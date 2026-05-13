import React, { useEffect, useRef, useState } from 'react';
import {
  Pressable, ScrollView, StatusBar, StyleSheet, Text, View,
} from 'react-native';

type Cell = {
  mine: boolean; revealed: boolean; flagged: boolean; questioned: boolean;
  adjacent: number; exploded: boolean; wrongFlag: boolean;
};
type Status = 'idle' | 'playing' | 'won' | 'lost';

const PRESETS = {
  beginner: { rows: 9, cols: 9, mines: 10 },
  intermediate: { rows: 16, cols: 16, mines: 40 },
  expert: { rows: 16, cols: 30, mines: 99 },
} as const;
type Preset = keyof typeof PRESETS;

class Game {
  rows: number; cols: number; mines: number;
  flags = 0; firstClick = true; status: Status = 'idle';
  startedAt = 0; endedAt = 0;
  cells: Cell[][];
  constructor(rows: number, cols: number, mines: number) {
    this.rows = rows; this.cols = cols; this.mines = mines;
    this.cells = Array.from({ length: rows }, () =>
      Array.from({ length: cols }, () => ({
        mine: false, revealed: false, flagged: false, questioned: false,
        adjacent: 0, exploded: false, wrongFlag: false,
      } as Cell)));
  }
  inB(r: number, c: number) { return r >= 0 && r < this.rows && c >= 0 && c < this.cols; }
  placeMines(sr: number, sc: number) {
    const safe = new Set<number>();
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
      const rr = sr + dr, cc = sc + dc;
      if (this.inB(rr, cc)) safe.add(rr * this.cols + cc);
    }
    const cands: [number, number][] = [];
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
      if (!this.cells[r][c].mine) this.cells[r][c].adjacent = this.adj(r, c);
  }
  adj(r: number, c: number) {
    let n = 0;
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
      if (!dr && !dc) continue;
      const rr = r + dr, cc = c + dc;
      if (this.inB(rr, cc) && this.cells[rr][cc].mine) n++;
    }
    return n;
  }
  reveal(r: number, c: number) {
    if (this.status === 'won' || this.status === 'lost') return;
    const cell = this.cells[r][c];
    if (cell.revealed || cell.flagged) return;
    if (this.firstClick) {
      this.placeMines(r, c); this.firstClick = false;
      this.status = 'playing'; this.startedAt = Date.now();
    }
    this.flood(r, c);
    if (cell.mine) {
      cell.exploded = true; this.revealAll();
      this.status = 'lost'; this.endedAt = Date.now(); return;
    }
    if (this.win()) { this.status = 'won'; this.endedAt = Date.now(); }
  }
  flood(r: number, c: number) {
    const stack: [number, number][] = [[r, c]];
    while (stack.length) {
      const [cr, cc] = stack.pop()!;
      const cell = this.cells[cr][cc];
      if (cell.revealed || cell.flagged) continue;
      cell.revealed = true;
      if (cell.mine || cell.adjacent > 0) continue;
      for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
        if (!dr && !dc) continue;
        const nr = cr + dr, nc = cc + dc;
        if (this.inB(nr, nc) && !this.cells[nr][nc].revealed) stack.push([nr, nc]);
      }
    }
  }
  toggleFlag(r: number, c: number) {
    if (this.status === 'won' || this.status === 'lost') return;
    const cell = this.cells[r][c]; if (cell.revealed) return;
    if (!cell.flagged && !cell.questioned) { cell.flagged = true; this.flags++; }
    else if (cell.flagged) { cell.flagged = false; cell.questioned = true; this.flags--; }
    else { cell.questioned = false; }
  }
  chord(r: number, c: number) {
    if (this.firstClick || this.status !== 'playing') return;
    const cell = this.cells[r][c];
    if (!cell.revealed || cell.adjacent === 0) return;
    let flagged = 0; const hidden: [number, number][] = [];
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
      if (!dr && !dc) continue;
      const rr = r + dr, cc = c + dc;
      if (!this.inB(rr, cc)) continue;
      const n = this.cells[rr][cc];
      if (n.flagged) flagged++; else if (!n.revealed) hidden.push([rr, cc]);
    }
    if (flagged !== cell.adjacent) return;
    for (const [hr, hc] of hidden) { this.reveal(hr, hc); if (this.status === 'lost') return; }
  }
  revealAll() {
    for (let r = 0; r < this.rows; r++) for (let c = 0; c < this.cols; c++) {
      const cell = this.cells[r][c];
      if (cell.mine && !cell.flagged) cell.revealed = true;
      if (!cell.mine && cell.flagged) { cell.wrongFlag = true; cell.revealed = true; }
    }
  }
  win() {
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
    const end = this.status === 'won' || this.status === 'lost' ? this.endedAt : Date.now();
    return Math.min(Math.floor((end - this.startedAt) / 1000), 999);
  }
}

const NUM_COLORS = ['', '#4cc9f0', '#6ef0a3', '#ff5c8d', '#b388ff', '#ffb454', '#4ad7d1', '#e9ecff', '#8d92c7'];
const pad = (n: number) => String(n).padStart(3, '0');

export default function App() {
  const gameRef = useRef<Game>(new Game(9, 9, 10));
  const [, setTick] = useState(0);
  const [preset, setPreset] = useState<Preset>('beginner');
  const [flagMode, setFlagMode] = useState(false);
  const refresh = () => setTick(t => t + 1);

  useEffect(() => {
    const id = setInterval(() => {
      if (gameRef.current.status === 'playing') refresh();
    }, 250);
    return () => clearInterval(id);
  }, []);

  function newGame(p: Preset) {
    const cfg = PRESETS[p];
    gameRef.current = new Game(cfg.rows, cfg.cols, cfg.mines);
    setPreset(p); refresh();
  }

  function onCellPress(r: number, c: number) {
    const g = gameRef.current; const cell = g.cells[r][c];
    if (cell.revealed && cell.adjacent > 0) g.chord(r, c);
    else if (flagMode) g.toggleFlag(r, c);
    else g.reveal(r, c);
    refresh();
  }
  function onCellLongPress(r: number, c: number) {
    const g = gameRef.current; const cell = g.cells[r][c];
    if (cell.revealed && cell.adjacent > 0) g.chord(r, c);
    else g.toggleFlag(r, c);
    refresh();
  }

  const g = gameRef.current;
  const cellSize = g.cols > 16 ? 22 : 28;

  return (
    <View style={styles.app}>
      <StatusBar barStyle="light-content" />
      <View style={styles.hud}>
        <Text style={styles.brand}>MINE·SWEEPER · RN</Text>
        <View style={styles.hudRow}>
          <Text style={[styles.counter, styles.counterRed]}>{pad(g.minesRemaining)}</Text>
          <Pressable style={styles.face} onPress={() => newGame(preset)}>
            <Text style={styles.faceText}>
              {g.status === 'lost' ? '😵' : g.status === 'won' ? '😎' : '🙂'}
            </Text>
          </Pressable>
          <Text style={[styles.counter, styles.counterCyan]}>{pad(g.elapsed)}</Text>
        </View>
        <View style={styles.row}>
          {(Object.keys(PRESETS) as Preset[]).map(p => (
            <Pressable key={p}
              style={[styles.pill, preset === p && styles.pillActive]}
              onPress={() => newGame(p)}>
              <Text style={[styles.pillText, preset === p && styles.pillTextActive]}>
                {p[0].toUpperCase() + p.slice(1)}
              </Text>
            </Pressable>
          ))}
        </View>
        <View style={styles.row}>
          <Pressable style={[styles.pill, !flagMode && styles.pillActive]} onPress={() => setFlagMode(false)}>
            <Text style={[styles.pillText, !flagMode && styles.pillTextActive]}>⛏ Reveal</Text>
          </Pressable>
          <Pressable style={[styles.pill, flagMode && styles.pillActiveFlag]} onPress={() => setFlagMode(true)}>
            <Text style={[styles.pillText, flagMode && styles.pillTextActive]}>⚑ Flag</Text>
          </Pressable>
        </View>
      </View>
      <ScrollView horizontal contentContainerStyle={styles.boardWrap}>
        <ScrollView contentContainerStyle={{ alignSelf: 'flex-start' }}>
          <View style={styles.board}>
            {g.cells.map((row, r) => (
              <View key={r} style={{ flexDirection: 'row' }}>
                {row.map((cell, c) => (
                  <Pressable
                    key={c}
                    onPress={() => onCellPress(r, c)}
                    onLongPress={() => onCellLongPress(r, c)}
                    delayLongPress={280}
                    style={[
                      { width: cellSize, height: cellSize, margin: 1 },
                      styles.cell,
                      cell.revealed && styles.cellRevealed,
                      cell.exploded && styles.cellExploded,
                      cell.mine && cell.revealed && !cell.exploded && styles.cellMine,
                    ]}>
                    <Text style={[
                      styles.cellText,
                      cell.revealed && !cell.mine && cell.adjacent > 0 && { color: NUM_COLORS[cell.adjacent] },
                      cell.flagged && { color: '#b388ff' },
                      cell.questioned && { color: '#ffb454' },
                      cell.wrongFlag && { color: '#ff5c8d' },
                      cell.mine && cell.revealed && { color: '#ff5c8d' },
                      { fontSize: cellSize - 12 },
                    ]}>
                      {cell.wrongFlag ? '✕'
                        : cell.flagged ? '⚑'
                        : cell.questioned ? '?'
                        : !cell.revealed ? ''
                        : cell.mine ? '✱'
                        : cell.adjacent > 0 ? String(cell.adjacent) : ''}
                    </Text>
                  </Pressable>
                ))}
              </View>
            ))}
          </View>
        </ScrollView>
      </ScrollView>
      {(g.status === 'won' || g.status === 'lost') && (
        <View pointerEvents="none" style={styles.banner}>
          <Text style={[styles.bannerText, { color: g.status === 'won' ? '#6ef0a3' : '#ff5c8d' }]}>
            {g.status === 'won' ? '✨ VICTORY ✨' : '💥 BOOM 💥'}
          </Text>
        </View>
      )}
      <Text style={styles.hint}>Tap to reveal · Long-press to flag · Toggle mode for fast flagging</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  app: { flex: 1, backgroundColor: '#0c1024', paddingHorizontal: 12, paddingTop: 50, paddingBottom: 24 },
  hud: { backgroundColor: '#161a3a', borderRadius: 16, padding: 14, gap: 12, borderWidth: 1, borderColor: '#262b66' },
  brand: { color: '#4cc9f0', fontWeight: '800', letterSpacing: 4, textAlign: 'center', fontSize: 12 },
  hudRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  counter: { fontFamily: 'Menlo', fontWeight: '800', fontSize: 26, paddingHorizontal: 12, paddingVertical: 4,
    backgroundColor: '#100020', borderRadius: 10, borderWidth: 1, minWidth: 90, textAlign: 'center' },
  counterRed: { color: '#ff3b6b', borderColor: '#45104b' },
  counterCyan: { color: '#4cc9f0', borderColor: '#16345a' },
  face: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#f5c518', alignItems: 'center', justifyContent: 'center' },
  faceText: { fontSize: 28 },
  row: { flexDirection: 'row', gap: 8, justifyContent: 'center', flexWrap: 'wrap' },
  pill: { backgroundColor: '#1f2452', borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: '#2c3275' },
  pillActive: { backgroundColor: '#4cc9f0', borderColor: 'transparent' },
  pillActiveFlag: { backgroundColor: '#b388ff', borderColor: 'transparent' },
  pillText: { color: '#e9ecff', fontSize: 13 },
  pillTextActive: { color: '#04101c', fontWeight: '700' },
  boardWrap: { padding: 10, alignItems: 'center', justifyContent: 'center' },
  board: { padding: 8, borderRadius: 12, backgroundColor: '#1b2050' },
  cell: { backgroundColor: '#353a78', borderRadius: 4, alignItems: 'center', justifyContent: 'center' },
  cellRevealed: { backgroundColor: '#0f1330' },
  cellMine: { backgroundColor: '#2a0f1c' },
  cellExploded: { backgroundColor: '#6b0e2a' },
  cellText: { fontFamily: 'Menlo', fontWeight: '800', color: '#e9ecff' },
  banner: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  bannerText: { fontSize: 32, fontWeight: '900', letterSpacing: 4 },
  hint: { color: '#8d92c7', fontSize: 12, textAlign: 'center', marginTop: 8 },
});
