"""Shared Minesweeper engine for the Python console and GUI implementations."""

from __future__ import annotations

import random
from dataclasses import dataclass, field
from typing import Iterable, List, Optional, Set, Tuple


HIDDEN = "hidden"
REVEALED = "revealed"
FLAGGED = "flagged"
QUESTIONED = "questioned"

IDLE = "idle"
PLAYING = "playing"
WON = "won"
LOST = "lost"


PRESETS = {
    "beginner": (9, 9, 10),
    "intermediate": (16, 16, 40),
    "expert": (16, 30, 99),
}


@dataclass
class Cell:
    row: int
    col: int
    mine: bool = False
    adjacent: int = 0
    state: str = HIDDEN
    exploded: bool = False
    wrong_flag: bool = False


@dataclass
class Game:
    rows: int
    cols: int
    mines: int
    board: List[List[Cell]] = field(default_factory=list)
    status: str = IDLE
    flags_placed: int = 0
    first_click: bool = True

    def __post_init__(self) -> None:
        self.board = [
            [Cell(r, c) for c in range(self.cols)] for r in range(self.rows)
        ]

    @classmethod
    def from_preset(cls, name: str) -> "Game":
        rows, cols, mines = PRESETS[name]
        return cls(rows, cols, mines)

    # ---- placement -------------------------------------------------------
    def _place_mines(self, safe_row: int, safe_col: int) -> None:
        safe_zone: Set[Tuple[int, int]] = set()
        for dr in (-1, 0, 1):
            for dc in (-1, 0, 1):
                rr, cc = safe_row + dr, safe_col + dc
                if 0 <= rr < self.rows and 0 <= cc < self.cols:
                    safe_zone.add((rr, cc))

        candidates = [
            (r, c)
            for r in range(self.rows)
            for c in range(self.cols)
            if (r, c) not in safe_zone
        ]
        random.shuffle(candidates)
        for r, c in candidates[: min(self.mines, len(candidates))]:
            self.board[r][c].mine = True

        for r in range(self.rows):
            for c in range(self.cols):
                if self.board[r][c].mine:
                    continue
                count = 0
                for dr in (-1, 0, 1):
                    for dc in (-1, 0, 1):
                        if dr == 0 and dc == 0:
                            continue
                        rr, cc = r + dr, c + dc
                        if 0 <= rr < self.rows and 0 <= cc < self.cols and self.board[rr][cc].mine:
                            count += 1
                self.board[r][c].adjacent = count

    # ---- moves -----------------------------------------------------------
    def reveal(self, row: int, col: int) -> List[Cell]:
        if self.status in (WON, LOST):
            return []
        if not (0 <= row < self.rows and 0 <= col < self.cols):
            return []

        cell = self.board[row][col]
        if cell.state in (REVEALED, FLAGGED):
            return []

        if self.first_click:
            self._place_mines(row, col)
            self.first_click = False
            self.status = PLAYING

        if cell.mine:
            cell.state = REVEALED
            cell.exploded = True
            self._reveal_all_mines()
            self.status = LOST
            return [cell]

        revealed = self._flood(row, col)
        self._check_win()
        return revealed

    def _flood(self, row: int, col: int) -> List[Cell]:
        revealed: List[Cell] = []
        stack: List[Tuple[int, int]] = [(row, col)]
        while stack:
            r, c = stack.pop()
            if not (0 <= r < self.rows and 0 <= c < self.cols):
                continue
            cell = self.board[r][c]
            if cell.state != HIDDEN or cell.mine:
                continue
            cell.state = REVEALED
            revealed.append(cell)
            if cell.adjacent == 0:
                for dr in (-1, 0, 1):
                    for dc in (-1, 0, 1):
                        if dr == 0 and dc == 0:
                            continue
                        stack.append((r + dr, c + dc))
        return revealed

    def toggle_flag(self, row: int, col: int) -> Optional[Cell]:
        if self.status in (WON, LOST):
            return None
        cell = self.board[row][col]
        if cell.state == REVEALED:
            return None
        if cell.state == HIDDEN:
            cell.state = FLAGGED
            self.flags_placed += 1
        elif cell.state == FLAGGED:
            cell.state = QUESTIONED
            self.flags_placed -= 1
        else:
            cell.state = HIDDEN
        return cell

    def chord(self, row: int, col: int) -> List[Cell]:
        if self.status != PLAYING:
            return []
        cell = self.board[row][col]
        if cell.state != REVEALED or cell.adjacent == 0:
            return []
        flagged = 0
        hidden_neighbors: List[Cell] = []
        for dr in (-1, 0, 1):
            for dc in (-1, 0, 1):
                if dr == 0 and dc == 0:
                    continue
                rr, cc = row + dr, col + dc
                if not (0 <= rr < self.rows and 0 <= cc < self.cols):
                    continue
                n = self.board[rr][cc]
                if n.state == FLAGGED:
                    flagged += 1
                elif n.state == HIDDEN:
                    hidden_neighbors.append(n)
        if flagged != cell.adjacent:
            return []
        revealed: List[Cell] = []
        for h in hidden_neighbors:
            if h.mine:
                h.state = REVEALED
                h.exploded = True
                self._reveal_all_mines()
                self.status = LOST
                return [h]
            revealed.extend(self._flood(h.row, h.col))
        self._check_win()
        return revealed

    def _reveal_all_mines(self) -> None:
        for row in self.board:
            for c in row:
                if c.mine and c.state != FLAGGED:
                    c.state = REVEALED
                if not c.mine and c.state == FLAGGED:
                    c.wrong_flag = True
                    c.state = REVEALED

    def _check_win(self) -> None:
        total_safe = self.rows * self.cols - self.mines
        revealed = sum(
            1 for row in self.board for c in row if c.state == REVEALED and not c.mine
        )
        if revealed >= total_safe:
            for row in self.board:
                for c in row:
                    if c.mine and c.state != FLAGGED:
                        c.state = FLAGGED
            self.flags_placed = self.mines
            self.status = WON

    @property
    def mines_remaining(self) -> int:
        return max(self.mines - self.flags_placed, 0)

    def iter_cells(self) -> Iterable[Cell]:
        for row in self.board:
            for c in row:
                yield c
