"""Colorful console Minesweeper with flagging, first-click safety, and timer."""

from __future__ import annotations

import sys
import time
from typing import Optional, Tuple

from engine import (
    FLAGGED,
    HIDDEN,
    LOST,
    PRESETS,
    QUESTIONED,
    REVEALED,
    WON,
    Cell,
    Game,
)


# ---- ANSI helpers ---------------------------------------------------------

RESET = "\033[0m"
BOLD = "\033[1m"
DIM = "\033[2m"

FG = {
    "red": "\033[91m",
    "green": "\033[92m",
    "yellow": "\033[93m",
    "blue": "\033[94m",
    "magenta": "\033[95m",
    "cyan": "\033[96m",
    "white": "\033[97m",
    "gray": "\033[90m",
    "orange": "\033[38;5;208m",
    "teal": "\033[38;5;44m",
    "purple": "\033[38;5;141m",
}

BG = {
    "dark": "\033[48;5;236m",
    "darker": "\033[48;5;234m",
    "panel": "\033[48;5;238m",
    "red": "\033[48;5;124m",
}

NUM_COLORS = {
    1: FG["cyan"],
    2: FG["green"],
    3: FG["red"],
    4: FG["purple"],
    5: FG["orange"],
    6: FG["teal"],
    7: FG["white"],
    8: FG["gray"],
}


def supports_color() -> bool:
    if not sys.stdout.isatty():
        return False
    if sys.platform == "win32":
        try:
            import ctypes  # noqa: WPS433

            kernel32 = ctypes.windll.kernel32
            kernel32.SetConsoleMode(kernel32.GetStdHandle(-11), 7)
        except Exception:  # noqa: BLE001
            return False
    return True


COLOR = supports_color()


def c(text: str, *codes: str) -> str:
    if not COLOR:
        return text
    return f"{''.join(codes)}{text}{RESET}"


# ---- rendering ------------------------------------------------------------

BANNER = r"""
   ╔══════════════════════════════════════════════╗
   ║   M I N E S W E E P E R    ·    P Y T H O N  ║
   ╚══════════════════════════════════════════════╝
"""


def render_cell(cell: Cell, reveal_all: bool = False) -> str:
    if reveal_all and cell.mine and cell.state != FLAGGED:
        return c(" ✱ ", FG["red"], BOLD)
    if cell.wrong_flag:
        return c(" ✕ ", FG["red"], BOLD)
    if cell.state == FLAGGED:
        return c(" ⚑ ", FG["magenta"], BOLD)
    if cell.state == QUESTIONED:
        return c(" ? ", FG["yellow"], BOLD)
    if cell.state == HIDDEN:
        return c(" · ", FG["gray"])
    if cell.mine:
        glow = BG["red"] if cell.exploded else ""
        return c(" ✱ ", glow, FG["white"], BOLD)
    if cell.adjacent == 0:
        return "   "
    return c(f" {cell.adjacent} ", NUM_COLORS.get(cell.adjacent, FG["white"]), BOLD)


def render_board(game: Game, elapsed: float) -> str:
    lines = []
    width = game.cols * 3
    header = (
        c(f"  ⚑ {game.mines_remaining:03d}", FG["magenta"], BOLD)
        + "   "
        + c(_face(game.status), FG["yellow"], BOLD)
        + "   "
        + c(f"⏱ {int(elapsed):03d}", FG["cyan"], BOLD)
    )
    lines.append(header)

    col_letters = "   " + "".join(c(f" {chr(ord('A') + i)} ", FG["yellow"], BOLD) for i in range(game.cols))
    lines.append(col_letters)
    lines.append("   " + c("┌" + "─" * width + "┐", FG["gray"]))

    for r, row in enumerate(game.board):
        body = "".join(render_cell(cell, reveal_all=game.status == LOST) for cell in row)
        lines.append(
            f"{c(f'{r + 1:>2} ', FG['yellow'], BOLD)}"
            + c("│", FG["gray"])
            + body
            + c("│", FG["gray"])
        )
    lines.append("   " + c("└" + "─" * width + "┘", FG["gray"]))
    return "\n".join(lines)


def _face(status: str) -> str:
    if status == WON:
        return "(◕‿◕)"
    if status == LOST:
        return "(x_x)"
    return "(•_•)"


# ---- input --------------------------------------------------------------

def parse_command(text: str, rows: int, cols: int) -> Optional[Tuple[str, int, int]]:
    text = text.strip().lower()
    if not text:
        return None
    action = "reveal"
    if text in ("q", "quit", "exit"):
        return ("quit", 0, 0)
    if text[0] == "f" and len(text) > 1:
        action = "flag"
        text = text[1:].lstrip()
    elif text in ("h", "?", "help"):
        return ("help", 0, 0)
    elif text in ("n", "new"):
        return ("new", 0, 0)

    if len(text) < 2:
        return None
    col_char = text[0].upper()
    row_part = text[1:]
    try:
        row = int(row_part) - 1
    except ValueError:
        return None
    col = ord(col_char) - ord("A")
    if not (0 <= row < rows and 0 <= col < cols):
        return None
    return (action, row, col)


def ask_difficulty() -> Game:
    print(c("\nChoose difficulty:", BOLD, FG["cyan"]))
    print(f"  {c('1', FG['yellow'], BOLD)}) Beginner       9 × 9    10 mines")
    print(f"  {c('2', FG['yellow'], BOLD)}) Intermediate  16 × 16   40 mines")
    print(f"  {c('3', FG['yellow'], BOLD)}) Expert        16 × 30   99 mines")
    print(f"  {c('4', FG['yellow'], BOLD)}) Custom\n")
    while True:
        choice = input(c("Selection: ", FG["green"])).strip()
        if choice in ("1", "b", "beginner"):
            return Game.from_preset("beginner")
        if choice in ("2", "i", "intermediate"):
            return Game.from_preset("intermediate")
        if choice in ("3", "e", "expert"):
            return Game.from_preset("expert")
        if choice in ("4", "c", "custom"):
            return ask_custom()
        print(c("Please choose 1-4.", FG["red"]))


def ask_custom() -> Game:
    while True:
        try:
            rows = int(input(c("Rows (5-26): ", FG["green"])).strip())
            cols = int(input(c("Cols (5-26): ", FG["green"])).strip())
            max_mines = rows * cols - 9
            mines = int(input(c(f"Mines (1-{max_mines}): ", FG["green"])).strip())
            if 5 <= rows <= 26 and 5 <= cols <= 26 and 1 <= mines <= max_mines:
                return Game(rows, cols, mines)
            print(c("Out of range. Try again.", FG["red"]))
        except ValueError:
            print(c("Numbers only, please.", FG["red"]))


def print_help() -> None:
    print(c("\nCommands:", BOLD, FG["cyan"]))
    print("  A1, B5      reveal cell at column-letter row-number")
    print("  f A1        toggle flag on cell A1 (or use 'F A1')")
    print("  n           new game")
    print("  q           quit")
    print("  h           show this help\n")


def print_outcome(game: Game, elapsed: float) -> None:
    print()
    if game.status == WON:
        print(c("  ✨  V I C T O R Y  ✨", BOLD, FG["green"]))
        print(c(f"  Cleared in {int(elapsed)}s", FG["green"]))
    else:
        print(c("  💥  B O O M  💥", BOLD, FG["red"]))
        print(c("  Better luck next time.", FG["red"]))
    print()


# ---- main loop ------------------------------------------------------------

def play_one(game: Game) -> None:
    start_time: Optional[float] = None
    print_help()
    while True:
        elapsed = (time.time() - start_time) if start_time else 0.0
        print()
        print(render_board(game, elapsed))
        if game.status in (WON, LOST):
            print_outcome(game, elapsed)
            return

        try:
            raw = input(c("\n› ", FG["cyan"], BOLD))
        except (EOFError, KeyboardInterrupt):
            print()
            return
        cmd = parse_command(raw, game.rows, game.cols)
        if cmd is None:
            print(c("Unknown command. Type 'h' for help.", FG["red"]))
            continue
        action, r, col = cmd
        if action == "quit":
            return
        if action == "help":
            print_help()
            continue
        if action == "new":
            game = ask_difficulty()
            start_time = None
            continue
        if action == "flag":
            game.toggle_flag(r, col)
            continue
        # reveal
        game.reveal(r, col)
        if start_time is None and game.status == "playing":
            start_time = time.time()


def main() -> None:
    print(c(BANNER, FG["cyan"], BOLD))
    while True:
        game = ask_difficulty()
        play_one(game)
        again = input(c("\nPlay again? [Y/n] ", FG["green"])).strip().lower()
        if again in ("n", "no", "q", "quit"):
            print(c("\nThanks for playing!\n", FG["cyan"], BOLD))
            return


if __name__ == "__main__":
    main()
