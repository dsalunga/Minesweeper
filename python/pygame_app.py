"""Pygame-powered Minesweeper with neon visuals.

Reuses the shared `engine` module (engine.py) used by the console and tk GUI
implementations and renders it with pygame.
"""

from __future__ import annotations

import sys
import time

import pygame

from engine import (
    FLAGGED, HIDDEN, LOST, PLAYING, PRESETS, QUESTIONED, REVEALED, WON, Game,
)

# ---------- theme ----------
BG = (12, 16, 36)
PANEL = (22, 26, 58)
PANEL_2 = (31, 36, 82)
INK = (233, 236, 255)
MUTED = (141, 146, 199)
ACCENT = (76, 201, 240)
ACCENT_2 = (179, 136, 255)
DANGER = (255, 92, 141)
GOOD = (110, 240, 163)
HIDDEN_C = (53, 58, 120)
REVEALED_C = (15, 19, 48)
GRID = (27, 32, 80)
LED_RED = (255, 59, 107)
LED_BG = (16, 0, 32)
COUNTER_BORDER_RED = (69, 16, 75)
COUNTER_BORDER_CYAN = (22, 52, 90)

NUM_COLORS = {
    1: (76, 201, 240),
    2: (110, 240, 163),
    3: (255, 92, 141),
    4: (179, 136, 255),
    5: (255, 180, 84),
    6: (74, 215, 209),
    7: (233, 236, 255),
    8: (141, 146, 199),
}

CELL_SIZE = 30
GAP = 2
PAD = 10
HUD_HEIGHT = 130
TOP_MARGIN = 20
SIDE_MARGIN = 20
PRESET_NAMES = ("beginner", "intermediate", "expert")


def main() -> None:
    pygame.init()
    pygame.display.set_caption("Minesweeper · pygame")

    preset = "beginner"
    game = Game.from_preset(preset)
    started_at: float | None = None
    ended_at: float | None = None

    width, height = compute_window_size(game)
    screen = pygame.display.set_mode((width, height))
    clock = pygame.time.Clock()

    font_cell = pygame.font.SysFont("menlo,consolas,monospace", 16, bold=True)
    font_counter = pygame.font.SysFont("menlo,consolas,monospace", 28, bold=True)
    font_brand = pygame.font.SysFont("Helvetica", 14, bold=True)
    font_pill = pygame.font.SysFont("Helvetica", 13, bold=True)
    font_face = pygame.font.SysFont("Apple Color Emoji,Segoe UI Emoji", 28)
    font_banner = pygame.font.SysFont("Helvetica", 36, bold=True)
    font_hint = pygame.font.SysFont("Helvetica", 11)

    left_down = right_down = False
    chord_target: tuple[int, int] | None = None

    def reset(new_preset: str) -> None:
        nonlocal game, preset, started_at, ended_at, width, height, screen
        preset = new_preset
        game = Game.from_preset(new_preset)
        started_at = ended_at = None
        new_width, new_height = compute_window_size(game)
        if (new_width, new_height) != (width, height):
            width, height = new_width, new_height
            screen = pygame.display.set_mode((width, height))

    while True:
        # ---- input ----
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                pygame.quit()
                sys.exit(0)
            if event.type == pygame.MOUSEBUTTONDOWN:
                if event.button == 1:
                    left_down = True
                elif event.button == 3:
                    right_down = True
                target = cell_at(event.pos, game)
                if target is not None:
                    chord_target = target
                hit_preset = preset_at(event.pos)
                if hit_preset:
                    reset(hit_preset)
                if face_rect().collidepoint(event.pos):
                    reset(preset)
            if event.type == pygame.MOUSEBUTTONUP:
                target = cell_at(event.pos, game)
                if target is not None and game.status not in (WON, LOST):
                    r, c = target
                    if (left_down and right_down) or event.button == 2:
                        game.chord(r, c)
                    elif event.button == 1:
                        if started_at is None and game.first_click:
                            started_at = time.time()
                        game.reveal(r, c)
                    elif event.button == 3:
                        game.toggle_flag(r, c)
                    if game.status in (WON, LOST) and ended_at is None:
                        ended_at = time.time()
                if event.button == 1:
                    left_down = False
                elif event.button == 3:
                    right_down = False
                chord_target = None

        # ---- draw ----
        screen.fill(BG)
        draw_radial_bg(screen)
        draw_hud(screen, game, preset, started_at, ended_at,
                 font_brand, font_counter, font_face, font_pill, left_down)
        draw_board(screen, game, font_cell)
        draw_banner(screen, game, font_banner)
        draw_hint(screen, font_hint)
        pygame.display.flip()
        clock.tick(60)


def compute_window_size(game: Game) -> tuple[int, int]:
    board_w = game.cols * CELL_SIZE + (game.cols - 1) * GAP + 2 * PAD
    board_h = game.rows * CELL_SIZE + (game.rows - 1) * GAP + 2 * PAD
    width = max(board_w + 2 * SIDE_MARGIN, 600)
    height = TOP_MARGIN + HUD_HEIGHT + 14 + board_h + 40
    return width, height


def draw_radial_bg(screen: pygame.Surface) -> None:
    w, h = screen.get_size()
    overlay = pygame.Surface((w, h), pygame.SRCALPHA)
    pygame.draw.circle(overlay, (27, 32, 104, 110), (int(w * 0.7), -120), 600)
    pygame.draw.circle(overlay, (42, 23, 85, 110), (int(w * -0.1), int(h * 1.1)), 500)
    screen.blit(overlay, (0, 0))


def board_origin(game: Game) -> tuple[int, int]:
    w, _ = pygame.display.get_surface().get_size()
    board_w = game.cols * CELL_SIZE + (game.cols - 1) * GAP + 2 * PAD
    x = (w - board_w) // 2
    y = TOP_MARGIN + HUD_HEIGHT + 14
    return x, y


def cell_at(pos: tuple[int, int], game: Game) -> tuple[int, int] | None:
    ox, oy = board_origin(game)
    x, y = pos[0] - ox - PAD, pos[1] - oy - PAD
    if x < 0 or y < 0:
        return None
    cw = CELL_SIZE + GAP
    c = x // cw
    r = y // cw
    if 0 <= r < game.rows and 0 <= c < game.cols:
        # ensure click is on cell, not in gap
        if x - c * cw < CELL_SIZE and y - r * cw < CELL_SIZE:
            return r, c
    return None


def draw_hud(screen, game, preset, started_at, ended_at,
             font_brand, font_counter, font_face, font_pill, left_down) -> None:
    w, _ = screen.get_size()
    rect = pygame.Rect(SIDE_MARGIN, TOP_MARGIN, w - 2 * SIDE_MARGIN, HUD_HEIGHT)
    pygame.draw.rect(screen, PANEL, rect, border_radius=16)
    pygame.draw.rect(screen, (38, 43, 102), rect, width=1, border_radius=16)

    brand = font_brand.render("MINE·SWEEPER · PYGAME", True, ACCENT)
    screen.blit(brand, brand.get_rect(midtop=(rect.centerx, rect.top + 10)))

    # counters
    mines = max(game.mines - game.flags_placed, 0)
    elapsed = compute_elapsed(game, started_at, ended_at)
    draw_counter(screen, font_counter, f"{mines:03d}", LED_RED, COUNTER_BORDER_RED,
                 (rect.left + 24, rect.top + 38))
    draw_counter(screen, font_counter, f"{elapsed:03d}", ACCENT, COUNTER_BORDER_CYAN,
                 (rect.right - 24 - 100, rect.top + 38))

    # face
    fr = face_rect()
    pygame.draw.circle(screen, (245, 197, 24), fr.center, fr.width // 2)
    pygame.draw.circle(screen, (181, 136, 0), fr.center, fr.width // 2, width=2)
    face_char = "🙂"
    if game.status == LOST:
        face_char = "😵"
    elif game.status == WON:
        face_char = "😎"
    elif left_down:
        face_char = "😮"
    face_surf = font_face.render(face_char, True, (0, 0, 0))
    screen.blit(face_surf, face_surf.get_rect(center=fr.center))

    # presets
    for i, name in enumerate(PRESET_NAMES):
        prect = preset_rect(i)
        active = (preset == name)
        bg = ACCENT if active else PANEL_2
        fg = (4, 16, 28) if active else INK
        pygame.draw.rect(screen, bg, prect, border_radius=999)
        if not active:
            pygame.draw.rect(screen, (44, 50, 117), prect, width=1, border_radius=999)
        label = font_pill.render(name.title(), True, fg)
        screen.blit(label, label.get_rect(center=prect.center))


def compute_elapsed(game: Game, started_at, ended_at) -> int:
    if started_at is None:
        return 0
    end = ended_at if (game.status in (WON, LOST) and ended_at is not None) else time.time()
    return min(int(end - started_at), 999)


def draw_counter(screen, font, text, color, border, topleft) -> None:
    rect = pygame.Rect(topleft, (100, 38))
    pygame.draw.rect(screen, LED_BG, rect, border_radius=10)
    pygame.draw.rect(screen, border, rect, width=1, border_radius=10)
    surf = font.render(text, True, color)
    screen.blit(surf, surf.get_rect(center=rect.center))


def face_rect() -> pygame.Rect:
    surface = pygame.display.get_surface()
    if surface is None:
        return pygame.Rect(0, 0, 0, 0)
    w, _ = surface.get_size()
    return pygame.Rect(w // 2 - 26, TOP_MARGIN + 38, 52, 52)


def preset_rect(i: int) -> pygame.Rect:
    surface = pygame.display.get_surface()
    if surface is None:
        return pygame.Rect(0, 0, 0, 0)
    w, _ = surface.get_size()
    pill_w = 110
    gap = 8
    total = len(PRESET_NAMES) * pill_w + (len(PRESET_NAMES) - 1) * gap
    x0 = (w - total) // 2
    return pygame.Rect(x0 + i * (pill_w + gap), TOP_MARGIN + HUD_HEIGHT - 38, pill_w, 30)


def preset_at(pos: tuple[int, int]) -> str | None:
    for i, name in enumerate(PRESET_NAMES):
        if preset_rect(i).collidepoint(pos):
            return name
    return None


def draw_board(screen, game, font_cell) -> None:
    ox, oy = board_origin(game)
    board_w = game.cols * CELL_SIZE + (game.cols - 1) * GAP + 2 * PAD
    board_h = game.rows * CELL_SIZE + (game.rows - 1) * GAP + 2 * PAD
    pygame.draw.rect(screen, GRID, pygame.Rect(ox, oy, board_w, board_h), border_radius=12)

    for r in range(game.rows):
        for c in range(game.cols):
            cell = game.board[r][c]
            x = ox + PAD + c * (CELL_SIZE + GAP)
            y = oy + PAD + r * (CELL_SIZE + GAP)
            rect = pygame.Rect(x, y, CELL_SIZE, CELL_SIZE)

            bg = HIDDEN_C
            if cell.state == REVEALED:
                bg = REVEALED_C
                if cell.exploded:
                    bg = (107, 14, 42)
                elif cell.mine:
                    bg = (42, 15, 28)
            pygame.draw.rect(screen, bg, rect, border_radius=4)

            text = ""
            color = INK
            if cell.wrong_flag:
                text, color = "✕", DANGER
            elif cell.state == FLAGGED:
                text, color = "⚑", ACCENT_2
            elif cell.state == QUESTIONED:
                text, color = "?", (255, 180, 84)
            elif cell.state == REVEALED:
                if cell.mine:
                    text, color = "✱", DANGER
                elif cell.adjacent > 0:
                    text = str(cell.adjacent)
                    color = NUM_COLORS.get(cell.adjacent, INK)
            if text:
                surf = font_cell.render(text, True, color)
                screen.blit(surf, surf.get_rect(center=rect.center))


def draw_banner(screen, game, font_banner) -> None:
    if game.status not in (WON, LOST):
        return
    text = "✨ VICTORY ✨" if game.status == WON else "💥 BOOM 💥"
    color = GOOD if game.status == WON else DANGER
    w, h = screen.get_size()
    overlay = pygame.Surface((w, h), pygame.SRCALPHA)
    overlay.fill((8, 10, 30, 170))
    screen.blit(overlay, (0, 0))
    surf = font_banner.render(text, True, color)
    screen.blit(surf, surf.get_rect(center=(w // 2, h // 2)))


def draw_hint(screen, font_hint) -> None:
    w, h = screen.get_size()
    surf = font_hint.render(
        "Left reveal · Right flag · Middle (or L+R) chord · Click face for new game",
        True, MUTED,
    )
    screen.blit(surf, surf.get_rect(midbottom=(w // 2, h - 10)))


if __name__ == "__main__":
    main()
