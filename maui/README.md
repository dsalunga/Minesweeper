# Minesweeper · .NET MAUI

Cross-platform Minesweeper (iOS, Android, macOS Catalyst, Windows) written
with .NET MAUI 8.

## Run

Requires the .NET MAUI workload:

```bash
dotnet workload install maui
cd maui
dotnet build -t:Run -f net8.0-maccatalyst   # macOS
dotnet build -t:Run -f net8.0-android       # Android
dotnet build -t:Run -f net8.0-ios           # iOS (Mac with Xcode)
dotnet build -t:Run -f net8.0-windows10.0.19041.0  # Windows
```

## Controls

- **Tap** reveal (or flag when *Flag mode* is on).
- **Double-tap** an unrevealed cell to flag (long-press fallback).
- Tap a numbered revealed cell with all neighbors flagged to chord.
- Smiley restarts the current preset; preset pills change difficulty.

## Features

- Full neon theme matching the web/Electron versions.
- Reusable C# `Game` engine (mirrors the JS/TS port: first-click safe zone,
  flood, chord, win/lose, mine counter, 999 s timer).
