# Minesweeper

A cross-stack collection of Minesweeper implementations — to compare engines, idioms, and presentation across languages.

## Highlights (every implementation)

- 🎯 **First-click safety** — the first reveal is always safe (3×3 safe zone)
- 🚩 **Flagging & questioning** — cycle hidden → flag → ? → hidden
- 💣 **Chord-reveal** — click a numbered cell with the matching number of flags to clear neighbors at once
- ⏱️ **Live timer & mine counter** — classic three-digit displays
- 🎚️ **Difficulty presets** — Beginner (9×9 / 10), Intermediate (16×16 / 40), Expert (16×30 / 99) + Custom
- 🎨 **Impressive visuals** — colored numbers, ANSI box-drawn boards, neon themes, animated faces
- 🔁 **Replay flow** — instant new game / restart on win or loss

## Implementations

| Stack | Path | UI | Notes |
|---|---|---|---|
| C# / .NET 10 | [csharp/](csharp/) | ANSI console | Engine + Console + NUnit tests |
| Kotlin / JVM | [kotlin/](kotlin/) | ANSI console | Gradle + JUnit; `application` plugin enabled |
| Go | [go/](go/) | ANSI console | Single-file, stdlib only |
| Rust | [rust/](rust/) | ANSI console | `rand` crate; `cargo run` |
| Python 3 | [python/](python/) | ANSI console **and** Tkinter GUI | Shared `engine.py` |
| React + TypeScript + Vite | [react/](react/) | Web (neon dark theme) | Hooks-based, custom CSS |

## Clone

```bash
git clone https://github.com/dsalunga/Minesweeper.git
cd Minesweeper
```

## Prerequisites

Install only what you need for the implementation you want to run:

- .NET SDK 10+ (for `csharp`)
- JDK 17+ (for `kotlin`)
- Go 1.21+ (for `go`)
- Rust + Cargo (for `rust`)
- Python 3.10+ with Tk (for `python`)
- Node.js 18+ and npm (for `react`)

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

### Python — console

```bash
cd python
python3 console.py
```

### Python — Tkinter GUI

```bash
cd python
python3 gui.py
```

GUI mouse controls: **Left** reveal · **Right** flag/question · **Middle** (or **Left+Right** together) chord.

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

## Console command grammar

All console implementations share the same input grammar:

| Input | Action |
|---|---|
| `A1`, `b5`, `K22` | Reveal cell at column-letter row-number |
| `f A1` | Toggle flag (hidden → flagged → ? → hidden) |
| `c A1` | Chord-reveal around a numbered cell |
| `n` | New game |
| `q` | Quit |
| `h` | Help |

## Notes

- Implementations are independent: each stack has its own engine and presentation, but they share the same feature contract and visual language so you can study idiomatic differences side-by-side.
- Some folders include their own language-specific README files with extra details.
