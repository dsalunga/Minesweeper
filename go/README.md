# Minesweeper Go

Console Minesweeper implementation written in Go.

## Requirements

- Go 1.26+

## Run

From repository root:

```bash
cd go
go run .
```

## Gameplay notes

- Presets: Beginner (`9x9`, `10`), Intermediate (`16x16`, `40`), Expert (`16x30`, `99`), and Custom.
- Custom constraints: rows `5-26`, cols `5-26`, mines `1` to `rows * cols - 9`.
- Command grammar:
  - `A1` reveal
  - `f A1` toggle flag/question
  - `c A1` chord reveal
  - `n` new game, `q` quit, `h` help
