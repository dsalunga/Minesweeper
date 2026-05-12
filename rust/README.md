# Minesweeper Rust

Console Minesweeper implementation in Rust.

## Requirements

- Rust toolchain (includes `cargo`)

## Run

From repository root:

```bash
cd rust
cargo run
```

## Optional commands

```bash
cargo build --release
cargo test
```

## Gameplay notes

- Presets: Beginner (`9x9`, `10`), Intermediate (`16x16`, `40`), Expert (`16x30`, `99`), and Custom.
- Custom constraints: rows `5-26`, cols `5-26`, mines `1` to `rows * cols - 9`.
- Command grammar:
  - `A1` reveal
  - `f A1` toggle flag/question
  - `c A1` chord reveal
  - `n` new game, `q` quit, `h` help
