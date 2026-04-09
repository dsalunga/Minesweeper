# Minesweeper

A collection of Minesweeper implementations in multiple languages and frameworks.

This repository is useful if you want to compare game logic and console/UI approaches across different stacks.

## Implementations

- `csharp/` - .NET 10 console app with engine/project separation and NUnit tests
- `kotlin/` - Kotlin/JVM console app with JUnit tests
- `go/` - Go console app
- `rust/` - Rust console app
- `python/` - Python console and Tkinter GUI versions
- `react/` - React + TypeScript + Vite web app

## Clone

```bash
git clone https://github.com/dsalunga/Minesweeper.git
cd Minesweeper
```

## Prerequisites

Install only what you need for the implementation you want to run:

- .NET SDK 10+ (for `csharp`)
- JDK 22+ (for `kotlin`)
- Go (for `go`)
- Rust + Cargo (for `rust`)
- Python 3 (for `python`)
- Node.js 18+ and npm (for `react`)

## Run Instructions

### C# (.NET 10)

Run the console game:

```bash
cd csharp
dotnet run --project Minesweeper.Console/Minesweeper.Console.csproj
```

Run tests:

```bash
cd csharp
dotnet test Minesweeper.Tests/Minesweeper.Tests.csproj
```

### Kotlin (JVM)

Run tests from CLI:

```bash
cd kotlin
bash ./gradlew test
```

Run the app from IntelliJ IDEA:

1. Open the `kotlin` project in IntelliJ IDEA.
2. Open `src/main/kotlin/Main.kt`.
3. Run `main()` (`MainKt`).

Note: The Gradle project currently does not define a `run` task.

### Go

```bash
cd go
go run minesweeper.go
```

### Rust

```bash
cd rust
cargo run
```

### Python

Console version:

```bash
cd python
python3 console.py
```

Tkinter GUI version:

```bash
cd python
python3 gui.py
```

### React + TypeScript (Vite)

```bash
cd react
npm install
npm run dev
```

Optional checks/build:

```bash
npm run lint
npm run build
npm run preview
```

## Gameplay

Most console versions ask for a board size, mine count, and then moves such as `A1`, `B3`, etc.

## Notes

- This repo contains independent implementations rather than one shared engine across all languages.
- Some folders include their own language-specific README files with extra details.
