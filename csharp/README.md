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

- Grid size accepts values from `4` to `26`.
- Mine count must be between `1` and the max allowed for the selected grid.
- Squares are selected using coordinates like `A1`.
