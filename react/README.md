# Minesweeper React

Web-based Minesweeper built with React, TypeScript, and Vite.

## Features

- Preset boards: Easy (`8x8`, `10` mines), Medium (`16x16`, `40` mines), Expert (`24x24`, `99` mines)
- Custom board setup
- Left-click to reveal cells
- Right-click to toggle flags
- Restart and board selection after game over

## Requirements

- Node.js 18+
- npm

## Run locally

From repository root:

```bash
cd react
npm install
npm run dev
```

## Available scripts

```bash
npm run dev
npm run lint
npm run build
npm run preview
```

## Custom game constraints

- Grid size input supports `4` to `26`.
- Mine count input supports `1` to `236`.
