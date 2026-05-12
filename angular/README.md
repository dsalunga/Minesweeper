# Minesweeper — Angular

A modern, full-featured Minesweeper built with **Angular 18** (standalone components, signals, OnPush change detection) and rich, animated visuals.

## Features

- Classic gameplay: reveal, flag (right click), question mark, and **chord** (left + right click on a number)
- First click is always safe (mines are placed after the first reveal, with a 3×3 safe zone)
- Three preset difficulties + **Custom** boards (rows `5-30`, cols `5-40`, mines up to `rows * cols - 9`)
- Animated HUD with mine counter, smiley face, and timer
- Win/lose overlay with animated card and confetti-style glow
- Saves your **best times** per difficulty in `localStorage`
- Polished UI: gradients, glow effects, particle starfield, smooth animations
- Fully responsive (desktop, tablet, mobile)

## Run locally

```bash
cd angular
npm install
npm start
```

Then open the URL printed by Angular CLI (defaults to http://localhost:4200).

## Build

```bash
npm run build
```

Outputs to `dist/minesweeper`.

## Test

```bash
npm test
```

## Controls

| Action | Mouse |
| ------ | ----- |
| Reveal | Left click |
| Flag / question / clear | Right click (cycles) |
| Chord reveal | Left + Right click on a numbered cell whose neighbour flags equal its number |
| New game | Click the smiley face or "⚙ New" |

## Project layout

```
src/
  app/
    engine/minesweeper.ts       # Pure game logic (mine placement, flood, chord)
    services/game.service.ts    # Signal-based reactive game state
    components/
      board/                    # Renders the grid
      cell/                     # A single tile (reveal/flag/mine/number visuals)
      hud/                      # Mine counter, face button, timer
      settings/                 # Difficulty picker + custom config
    app.component.*             # Layout, header, win/lose overlay, modal
  styles.scss                   # Theme variables + animated background
```
