# Minesweeper · Rust (macroquad)

Full-featured graphical Minesweeper rendered with [macroquad](https://macroquad.rs/).

## Run

```bash
cd rust-graphics
cargo run --release
```

## Controls

- **Left click** reveal
- **Right click** cycle flag → ? → hidden
- **Middle click** (or **left+right** simultaneously) chord on a numbered cell
- Click a preset pill or the smiley to start a new game.

## Features

- First click is always safe (3×3 safe zone) with deferred mine placement.
- Flood fill on empty cells, chord-reveal on numbered cells.
- Live mine counter, 999-second timer, neon LED styling.
- Win auto-flags remaining mines; loss highlights the exploded mine and any
  wrong flags.
