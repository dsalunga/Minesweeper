# Minesweeper

A cross-stack collection of Minesweeper implementations to compare engines, idioms, and presentation across languages.

## Highlights Across The Collection

- First-click safety (3x3 safe zone)
- Flag/question cycling (hidden -> flag -> ? -> hidden)
- Chord reveal in C#, Kotlin, Go, Rust, React, Angular, and Python GUI
- Live timer and mine counter
- Difficulty presets: Beginner (9x9 / 10), Intermediate (16x16 / 40), Expert (16x30 / 99), plus Custom
- Replay flow (new game/restart after win or loss)

## Implementations

| Stack | Path | UI | Notes |
|---|---|---|---|
| C# / .NET 10 | [csharp/](csharp/) | ANSI console | Engine + Console + NUnit tests |
| Kotlin / JVM | [kotlin/](kotlin/) | ANSI console | Gradle + JUnit |
| Go | [go/](go/) | ANSI console | Single-file, stdlib only |
| Rust | [rust/](rust/) | ANSI console | `rand` crate |
| Python 3 | [python/](python/) | ANSI console and Tkinter GUI | Shared `engine.py` |
| React + TypeScript + Vite | [react/](react/) | Web | Hooks-based state + custom styling |
| Angular 18 | [angular/](angular/) | Web | Standalone components + signals |
| Electron | [electron/](electron/) | Cross-platform desktop | Chromium shell + neon UI |
| Tauri | [tauri/](tauri/) | Cross-platform desktop | Rust core + webview UI |
| Capacitor | [capacitor/](capacitor/) | iOS / Android / Web | Web UI bridged to native shells |
| React Native (Expo) | [reactnative/](reactnative/) | iOS / Android / Web | Pure RN components |
| Flutter | [flutter/](flutter/) | iOS / Android / Web / Desktop | Material 3 dark theme |
| Python pygame | [python/pygame_app.py](python/pygame_app.py) | Desktop GUI | Neon HUD with LED counters |
| Go (Ebitengine) | [go-graphics/](go-graphics/) | Desktop GUI | 2D engine with vector primitives |
| Rust (macroquad) | [rust-graphics/](rust-graphics/) | Desktop GUI | Single-binary GPU-accelerated UI |
| .NET MAUI | [maui/](maui/) | iOS / Android / macOS / Windows | Shared C# engine + XAML-less code-only UI |
| Unity | [unity/](unity/) | Cross-platform game engine | UGUI bootstrap, no scene wiring needed |
| Native iOS (SwiftUI) | [ios/](ios/) | iPhone / iPad | Reusable `MinesweeperCore` Swift Package |
| Native Android (Compose) | [android/](android/) | Android | Jetpack Compose + Material 3 |

## Clone

```bash
git clone https://github.com/dsalunga/Minesweeper.git
cd Minesweeper
```

## Prerequisites

Install only what you need for the implementation you want to run:

- .NET SDK 10+ (for `csharp`)
- JDK 17+ (for `kotlin`)
- Go 1.26+ (for `go`)
- Rust + Cargo (for `rust`)
- Python 3.10+ with Tk (for `python`)
- Node.js 18+ and npm (for `react` and `angular`)

## Run Instructions

### C# (.NET 10)

```bash
cd csharp
dotnet run --project Minesweeper.Console/Minesweeper.Console.csproj
```

Run tests:

```bash
cd csharp
dotnet test
```

### Kotlin (JVM)

```bash
cd kotlin
./gradlew run --console=plain -q
```

Run tests:

```bash
cd kotlin
./gradlew test
```

### Go

```bash
cd go
go run .
```

### Rust

```bash
cd rust
cargo run --release
```

### Python Console

```bash
cd python
python3 console.py
```

### Python Tkinter GUI

```bash
cd python
python3 gui.py
```

GUI mouse controls: left reveal, right flag/question, middle (or left+right together) chord.

### React + TypeScript (Vite)

```bash
cd react
npm install
npm run dev
```

Optional:

```bash
npm run lint
npm run build
npm run preview
```

### Angular 18

```bash
cd angular
npm install
npm start
```

Optional:

```bash
npm run build
npm run test
```

## Console Command Grammar

C#, Kotlin, Go, and Rust share this grammar:

| Input | Action |
|---|---|
| `A1`, `b5`, `K22` | Reveal cell at column-letter row-number |
| `f A1` | Toggle flag (hidden -> flagged -> ? -> hidden) |
| `c A1` | Chord reveal around a numbered cell |
| `n` | New game |
| `q` | Quit |
| `h` | Help |

Python console uses the same grammar except it currently does not expose `c A1` (chord).

### Electron / Tauri / Capacitor / React Native / Flutter

See each subfolder README for the full setup. Quick starts:

```bash
cd electron && npm install && npm start
cd tauri && npm install && npm run tauri dev
cd capacitor && npm install && npm run dev          # web preview
cd reactnative && npm install && npx expo start
cd flutter && flutter pub get && flutter run -d chrome
```

### Graphics-rich desktop ports

```bash
cd python && python3 -m pip install pygame && python3 pygame_app.py
cd go-graphics && go run .
cd rust-graphics && cargo run --release
```

### .NET MAUI / Unity

```bash
cd maui && dotnet workload install maui && dotnet build -t:Run -f net8.0-maccatalyst
# Unity: open the unity/ folder in Unity Hub (2022.3 LTS), attach
# Assets/Scripts/MinesweeperBootstrap.cs to a GameObject, press Play.
```

### Native mobile

```bash
# iOS — open ios/ in Xcode 15+ (uses local Swift Package MinesweeperCore)
# Android — open android/ in Android Studio Hedgehog+ and run :app
```

## Notes

- Each stack is independent and keeps its own implementation details.
- See each subfolder README for language-specific setup and controls.
