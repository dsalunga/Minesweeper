# Minesweeper C# (.NET 10)

Console Minesweeper implementation using a reusable engine project plus NUnit tests.

## Projects

- `Minesweeper.Console` - Console entrypoint
- `Minesweeper.Engine` - Core game logic
- `Minesweeper.Tests` - Unit and end-to-end tests

## Requirements

- .NET SDK 10+

## Run the app

From repository root:

```bash
cd csharp
dotnet run --project Minesweeper.Console/Minesweeper.Console.csproj
```

## Run tests

From repository root:

```bash
cd csharp
dotnet test Minesweeper.Tests/Minesweeper.Tests.csproj
```

## Optional commands

Build all projects in the solution:

```bash
cd csharp
dotnet build Minesweeper.sln
```

Verbose test output:

```bash
dotnet test Minesweeper.Tests/Minesweeper.Tests.csproj --verbosity detailed
```

## Gameplay notes

- Presets: Beginner (`9x9`, `10`), Intermediate (`16x16`, `40`), Expert (`16x30`, `99`), and Custom.
- Custom constraints: rows `5-26`, cols `5-26`, mines `1` to `rows * cols - 9`.
- Command grammar:
  - `A1` reveal
  - `f A1` toggle flag/question
  - `c A1` chord reveal
  - `n` new game, `q` quit, `h` help
