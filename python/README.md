# Minesweeper Python

Python implementation with both console and Tkinter GUI versions.

## Requirements

- Python 3
- Tkinter (for `gui.py`, bundled with most Python installs)

## Run the console version

From repository root:

```bash
cd python
python3 console.py
```

## Run the GUI version

From repository root:

```bash
cd python
python3 gui.py
```

## Run the pygame version (full neon graphics)

```bash
cd python
pip install pygame
python3 pygame_app.py
```

## Gameplay notes

- Shared presets: Beginner (`9x9`, `10`), Intermediate (`16x16`, `40`), Expert (`16x30`, `99`), and Custom.
- Custom constraints: rows `5-26`, cols `5-26`, mines `1` to `rows * cols - 9`.
- Console command grammar:
  - `A1` reveal
  - `f A1` toggle flag/question
  - `n` new game, `q` quit, `h` help
- GUI controls:
  - Left click reveal
  - Right click cycles hidden -> flag -> ? -> hidden
  - Middle click (or left+right together) chord reveal
