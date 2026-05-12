"""Polished Tkinter Minesweeper with dark theme, timer, flagging, and chord."""

from __future__ import annotations

import tkinter as tk
import tkinter.font as tkfont
from tkinter import messagebox
from typing import Dict, Optional, Tuple

from engine import (
    FLAGGED,
    HIDDEN,
    LOST,
    PLAYING,
    PRESETS,
    QUESTIONED,
    REVEALED,
    WON,
    Cell,
    Game,
)


THEME = {
    "bg": "#0c1024",
    "panel": "#161a3a",
    "panel_light": "#1f2547",
    "text": "#e8ebff",
    "text_dim": "#8a90b8",
    "accent": "#4cc9f0",
    "accent_2": "#b388ff",
    "accent_3": "#ff5c8d",
    "hidden": "#3a3f70",
    "hidden_hover": "#4d5495",
    "revealed": "#1a1d3a",
    "border": "#262b55",
    "mine": "#ff5c5c",
    "exploded": "#fff200",
    "flag": "#ff5c8d",
    "question": "#ffd166",
    "counter": "#0a0c1a",
    "counter_text": "#ff5c8d",
    "timer_text": "#4cc9f0",
}

NUM_COLOR = {
    1: "#4cc9f0",
    2: "#6ee7b7",
    3: "#ff7b9c",
    4: "#b388ff",
    5: "#ffb46b",
    6: "#4dd0e1",
    7: "#ffffff",
    8: "#b8bdd6",
}


class MinesweeperApp:
    def __init__(self, root: tk.Tk) -> None:
        self.root = root
        self.root.title("Minesweeper · Python")
        self.root.configure(bg=THEME["bg"])

        self._fonts()

        self.game: Optional[Game] = None
        self.buttons: Dict[Tuple[int, int], tk.Label] = {}
        self.cell_size = 30
        self.timer_id: Optional[str] = None
        self.start_ms: int = 0
        self.elapsed_seconds = 0
        self._left_down = False
        self._right_down = False
        self._chord_target: Optional[Tuple[int, int]] = None

        self._build_menu()
        self.header_frame = tk.Frame(root, bg=THEME["panel"], padx=14, pady=10)
        self.header_frame.pack(fill="x", padx=12, pady=(12, 0))

        self.mines_var = tk.StringVar(value="000")
        self.timer_var = tk.StringVar(value="000")
        self.face_var = tk.StringVar(value="🙂")

        tk.Label(
            self.header_frame,
            textvariable=self.mines_var,
            font=self.counter_font,
            fg=THEME["counter_text"],
            bg=THEME["counter"],
            padx=12,
            pady=4,
        ).pack(side="left")

        face = tk.Button(
            self.header_frame,
            textvariable=self.face_var,
            font=self.face_font,
            bg=THEME["accent"],
            fg="#0a0c20",
            activebackground=THEME["accent_2"],
            relief="flat",
            bd=0,
            padx=8,
            pady=2,
            command=self.restart,
        )
        face.pack(side="left", expand=True)
        self.face_btn = face

        tk.Label(
            self.header_frame,
            textvariable=self.timer_var,
            font=self.counter_font,
            fg=THEME["timer_text"],
            bg=THEME["counter"],
            padx=12,
            pady=4,
        ).pack(side="right")

        self.board_frame = tk.Frame(root, bg=THEME["panel"], padx=8, pady=8)
        self.board_frame.pack(padx=12, pady=12)

        self.status_var = tk.StringVar(
            value="Left-click reveal · Right-click flag · Both-click chord"
        )
        tk.Label(
            root,
            textvariable=self.status_var,
            font=self.status_font,
            fg=THEME["text_dim"],
            bg=THEME["bg"],
        ).pack(pady=(0, 12))

        self.start_new_game("beginner")

    def _fonts(self) -> None:
        self.cell_font = tkfont.Font(family="Courier", size=12, weight="bold")
        self.counter_font = tkfont.Font(family="Courier", size=18, weight="bold")
        self.face_font = tkfont.Font(family="Helvetica", size=18)
        self.status_font = tkfont.Font(family="Helvetica", size=10)

    # ---- menu / new game ------------------------------------------------
    def _build_menu(self) -> None:
        menubar = tk.Menu(self.root)
        self.root.config(menu=menubar)
        game_menu = tk.Menu(menubar, tearoff=0)
        menubar.add_cascade(label="Game", menu=game_menu)
        for name in ("beginner", "intermediate", "expert"):
            game_menu.add_command(
                label=name.capitalize(),
                command=lambda n=name: self.start_new_game(n),
            )
        game_menu.add_separator()
        game_menu.add_command(label="Custom…", command=self.ask_custom)
        game_menu.add_separator()
        game_menu.add_command(label="Restart", command=self.restart)
        game_menu.add_command(label="Quit", command=self.root.destroy)

    def start_new_game(self, preset: str) -> None:
        rows, cols, mines = PRESETS[preset]
        self._reset_game(Game(rows, cols, mines))

    def _reset_game(self, game: Game) -> None:
        self.game = game
        if self.timer_id:
            self.root.after_cancel(self.timer_id)
            self.timer_id = None
        self.elapsed_seconds = 0
        self.timer_var.set("000")
        self.face_var.set("🙂")
        self.mines_var.set(f"{game.mines:03d}")
        self._rebuild_board()

    def restart(self) -> None:
        if self.game:
            self._reset_game(Game(self.game.rows, self.game.cols, self.game.mines))

    def ask_custom(self) -> None:
        win = tk.Toplevel(self.root)
        win.title("Custom Game")
        win.configure(bg=THEME["bg"])
        win.transient(self.root)
        win.grab_set()

        entries: Dict[str, tk.Entry] = {}
        for i, (label, default) in enumerate([("Rows", 10), ("Cols", 10), ("Mines", 15)]):
            tk.Label(win, text=label, fg=THEME["text"], bg=THEME["bg"]).grid(
                row=i, column=0, sticky="w", padx=10, pady=6
            )
            e = tk.Entry(win, bg=THEME["panel_light"], fg=THEME["text"], insertbackground=THEME["text"], width=8)
            e.insert(0, str(default))
            e.grid(row=i, column=1, padx=10, pady=6)
            entries[label] = e

        def submit() -> None:
            try:
                rows = max(5, min(30, int(entries["Rows"].get())))
                cols = max(5, min(30, int(entries["Cols"].get())))
                mines = max(1, min(rows * cols - 9, int(entries["Mines"].get())))
            except ValueError:
                messagebox.showerror("Invalid", "Please enter integers.")
                return
            win.destroy()
            self._reset_game(Game(rows, cols, mines))

        tk.Button(
            win,
            text="Start",
            command=submit,
            bg=THEME["accent"],
            fg="#0a0c20",
            relief="flat",
            padx=14,
            pady=4,
        ).grid(row=3, column=0, columnspan=2, pady=12)

    # ---- board rendering ------------------------------------------------
    def _rebuild_board(self) -> None:
        for child in self.board_frame.winfo_children():
            child.destroy()
        self.buttons.clear()
        assert self.game is not None
        for r in range(self.game.rows):
            for col in range(self.game.cols):
                btn = tk.Label(
                    self.board_frame,
                    text="",
                    width=2,
                    height=1,
                    font=self.cell_font,
                    bg=THEME["hidden"],
                    fg=THEME["text"],
                    bd=0,
                    relief="flat",
                    padx=0,
                    pady=0,
                    highlightthickness=1,
                    highlightbackground=THEME["border"],
                )
                btn.grid(row=r, column=col, padx=1, pady=1, ipadx=4, ipady=2)
                btn.bind("<Button-1>", lambda e, rr=r, cc=col: self._on_left_press(rr, cc))
                btn.bind("<ButtonRelease-1>", lambda e, rr=r, cc=col: self._on_left_release(rr, cc))
                btn.bind("<Button-3>", lambda e, rr=r, cc=col: self._on_right(rr, cc))
                btn.bind("<Button-2>", lambda e, rr=r, cc=col: self._on_chord(rr, cc))
                btn.bind("<Enter>", lambda e, w=btn: self._hover(w, True))
                btn.bind("<Leave>", lambda e, w=btn: self._hover(w, False))
                self.buttons[(r, col)] = btn

    def _hover(self, widget: tk.Label, entering: bool) -> None:
        cur_bg = widget.cget("bg")
        if entering and cur_bg == THEME["hidden"]:
            widget.config(bg=THEME["hidden_hover"])
        elif not entering and cur_bg == THEME["hidden_hover"]:
            widget.config(bg=THEME["hidden"])

    # ---- input handlers -------------------------------------------------
    def _on_left_press(self, r: int, col: int) -> None:
        self._left_down = True
        if self._right_down:
            self._on_chord(r, col)
            self._chord_target = (r, col)

    def _on_left_release(self, r: int, col: int) -> None:
        was_chord = self._chord_target is not None
        self._left_down = False
        self._chord_target = None
        if was_chord:
            return
        self._reveal(r, col)

    def _on_right(self, r: int, col: int) -> None:
        self._right_down = True
        if self._left_down:
            self._on_chord(r, col)
            self._chord_target = (r, col)
            return
        self._toggle_flag(r, col)
        self.root.after(50, lambda: setattr(self, "_right_down", False))

    def _on_chord(self, r: int, col: int) -> None:
        if not self.game:
            return
        self.game.chord(r, col)
        self._refresh()

    def _reveal(self, r: int, col: int) -> None:
        if not self.game or self.game.status in (WON, LOST):
            return
        was_idle = self.game.status != PLAYING
        self.game.reveal(r, col)
        if was_idle and self.game.status == PLAYING:
            self._start_timer()
        self._refresh()

    def _toggle_flag(self, r: int, col: int) -> None:
        if not self.game:
            return
        self.game.toggle_flag(r, col)
        self._refresh()

    # ---- timer / refresh ------------------------------------------------
    def _start_timer(self) -> None:
        import time

        self.start_ms = int(time.time() * 1000)
        self._tick()

    def _tick(self) -> None:
        import time

        elapsed = (int(time.time() * 1000) - self.start_ms) // 1000
        self.elapsed_seconds = min(elapsed, 999)
        self.timer_var.set(f"{self.elapsed_seconds:03d}")
        if self.game and self.game.status == PLAYING:
            self.timer_id = self.root.after(250, self._tick)

    def _refresh(self) -> None:
        if not self.game:
            return
        for (r, col), btn in self.buttons.items():
            self._render_cell(btn, self.game.board[r][col])
        self.mines_var.set(f"{self.game.mines_remaining:03d}")
        if self.game.status == WON:
            self.face_var.set("😎")
            messagebox.showinfo(
                "Victory", f"You cleared the minefield in {self.elapsed_seconds}s!"
            )
        elif self.game.status == LOST:
            self.face_var.set("💀")
            messagebox.showinfo("Game Over", "You hit a mine!")

    def _render_cell(self, widget: tk.Label, cell: Cell) -> None:
        if cell.wrong_flag:
            widget.config(text="✕", fg="#ffffff", bg=THEME["mine"])
            return
        if cell.state == FLAGGED:
            widget.config(text="⚑", fg=THEME["flag"], bg=THEME["hidden"])
            return
        if cell.state == QUESTIONED:
            widget.config(text="?", fg=THEME["question"], bg=THEME["hidden"])
            return
        if cell.state == HIDDEN:
            widget.config(text="", bg=THEME["hidden"])
            return
        # revealed
        if cell.mine:
            bg = THEME["exploded"] if cell.exploded else THEME["mine"]
            widget.config(text="✱", fg="#0a0c20", bg=bg)
            return
        if cell.adjacent == 0:
            widget.config(text="", bg=THEME["revealed"])
        else:
            widget.config(
                text=str(cell.adjacent),
                fg=NUM_COLOR.get(cell.adjacent, THEME["text"]),
                bg=THEME["revealed"],
            )


def main() -> None:
    root = tk.Tk()
    root.resizable(False, False)
    MinesweeperApp(root)
    root.mainloop()


if __name__ == "__main__":
    main()
