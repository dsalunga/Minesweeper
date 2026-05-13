# Minesweeper · Tauri

Lightweight cross-platform desktop Minesweeper using Tauri 2 + a vanilla webview UI.

## Run

```bash
cd tauri
npm install
npm run dev
```

Build a release bundle:

```bash
npm run build
```

Requires Rust, Cargo, and the [Tauri prerequisites](https://v2.tauri.app/start/prerequisites/) for your platform.

## Notes

The frontend (`src/`) is a static HTML/CSS/JS app; the Rust backend (`src-tauri/`) only hosts the webview. Add your own icons under `src-tauri/icons/` before producing distributable bundles.
