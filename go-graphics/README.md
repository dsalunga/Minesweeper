# Minesweeper · Go (Ebitengine)

Full-featured graphical Minesweeper rendered with [Ebitengine](https://ebitengine.org/).

## Run

```bash
cd go-graphics
go run .
```

`go run` will fetch the `github.com/hajimehoshi/ebiten/v2` dependency on first
invocation. Requires Go 1.21+.

## Controls

- **Left click** reveal
- **Right click** cycle flag → ? → hidden
- **Middle click** (or **left+right** simultaneously) chord on a numbered cell
- Click a preset pill (Beginner/Intermediate/Expert) or the smiley to start a
  new game.

## Features

- First click is always safe (3×3 safe zone) with deferred mine placement.
- Flood fill on empty cells, chord-reveal on numbered cells.
- Live mine counter and 999-second timer with neon LED styling.
- Win auto-flags remaining mines; loss highlights the exploded mine and any
  wrong flags.
