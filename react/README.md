# Minesweeper React

Web-based Minesweeper built with React, TypeScript, and Vite.

## Features

- Preset boards: Beginner (`9x9`, `10`), Intermediate (`16x16`, `40`), Expert (`16x30`, `99`)
- Custom board setup
- First-click safety (3x3 safe zone around first reveal)
- Left-click reveal
- Right-click cycles hidden -> flag -> ? -> hidden
- Chord reveal with both mouse buttons on a revealed number
- Live timer, mine counter, and best-times tracking in `localStorage`

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

- Rows support `5` to `30`.
- Cols support `5` to `40`.
- Mine count supports `1` to `rows * cols - 9`.
