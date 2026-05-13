# Minesweeper · Unity

A complete Unity (2022.3 LTS, UGUI + TextMeshPro) Minesweeper implementation
that bootstraps its own UI at runtime — no manual scene wiring required.

## Setup

1. Open this folder (`unity/`) in Unity Hub → Add → Select `2022.3.20f1` (or
   compatible LTS).
2. Create a new empty scene (or use the default `SampleScene`).
3. Create an empty `GameObject` and attach
   `Assets/Scripts/MinesweeperBootstrap.cs` to it.
4. Press Play. The HUD, presets and board appear automatically.

## Controls

- **Left click** reveal (or chord on a numbered revealed cell).
- **Right click** cycle flag → ? → hidden.
- **Middle click** chord on a numbered cell.
- Click a preset pill to start a new game.

## Features

- Reusable `Game` engine in `Assets/Scripts/Game.cs` (mirrors web/MAUI ports).
- Neon palette matching the rest of the repo.
- Live mine counter and 999 s timer; win/lose banner overlay.
