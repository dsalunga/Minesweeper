// Minesweeper rendered with macroquad — full-featured neon edition.
use macroquad::prelude::*;
use macroquad::rand::ChooseRandom;

use std::time::Instant;

#[derive(Clone, Copy, PartialEq)]
enum Status {
    Idle,
    Playing,
    Won,
    Lost,
}

#[derive(Clone, Copy, Default)]
struct Cell {
    mine: bool,
    revealed: bool,
    flagged: bool,
    questioned: bool,
    exploded: bool,
    wrong_flag: bool,
    adjacent: u8,
}

#[derive(Clone, Copy)]
struct Preset {
    name: &'static str,
    rows: usize,
    cols: usize,
    mines: usize,
}

const PRESETS: [Preset; 3] = [
    Preset { name: "Beginner", rows: 9, cols: 9, mines: 10 },
    Preset { name: "Intermediate", rows: 16, cols: 16, mines: 40 },
    Preset { name: "Expert", rows: 16, cols: 30, mines: 99 },
];

struct Game {
    rows: usize,
    cols: usize,
    mines: usize,
    cells: Vec<Vec<Cell>>,
    flags: i32,
    first_click: bool,
    status: Status,
    started_at: Option<Instant>,
    elapsed_at_end: Option<u32>,
}

impl Game {
    fn new(p: Preset) -> Self {
        Self {
            rows: p.rows,
            cols: p.cols,
            mines: p.mines,
            cells: vec![vec![Cell::default(); p.cols]; p.rows],
            flags: 0,
            first_click: true,
            status: Status::Idle,
            started_at: None,
            elapsed_at_end: None,
        }
    }

    fn in_b(&self, r: i32, c: i32) -> bool {
        r >= 0 && (r as usize) < self.rows && c >= 0 && (c as usize) < self.cols
    }

    fn place_mines(&mut self, sr: usize, sc: usize) {
        let mut safe = vec![false; self.rows * self.cols];
        for dr in -1i32..=1 {
            for dc in -1i32..=1 {
                let r = sr as i32 + dr;
                let c = sc as i32 + dc;
                if self.in_b(r, c) {
                    safe[(r as usize) * self.cols + (c as usize)] = true;
                }
            }
        }
        let mut cands: Vec<(usize, usize)> = Vec::new();
        for r in 0..self.rows {
            for c in 0..self.cols {
                if !safe[r * self.cols + c] {
                    cands.push((r, c));
                }
            }
        }
        cands.shuffle();
        for &(r, c) in cands.iter().take(self.mines.min(cands.len())) {
            self.cells[r][c].mine = true;
        }
        for r in 0..self.rows {
            for c in 0..self.cols {
                if self.cells[r][c].mine {
                    continue;
                }
                let mut n = 0u8;
                for dr in -1i32..=1 {
                    for dc in -1i32..=1 {
                        if dr == 0 && dc == 0 { continue; }
                        let rr = r as i32 + dr;
                        let cc = c as i32 + dc;
                        if self.in_b(rr, cc) && self.cells[rr as usize][cc as usize].mine {
                            n += 1;
                        }
                    }
                }
                self.cells[r][c].adjacent = n;
            }
        }
    }

    fn reveal(&mut self, r: usize, c: usize) {
        if matches!(self.status, Status::Won | Status::Lost) {
            return;
        }
        let cell = self.cells[r][c];
        if cell.revealed || cell.flagged {
            return;
        }
        if self.first_click {
            self.place_mines(r, c);
            self.first_click = false;
            self.status = Status::Playing;
            self.started_at = Some(Instant::now());
        }
        if self.cells[r][c].mine {
            self.cells[r][c].revealed = true;
            self.cells[r][c].exploded = true;
            self.reveal_all();
            self.status = Status::Lost;
            self.freeze_timer();
            return;
        }
        self.flood(r, c);
        if self.check_win() {
            self.status = Status::Won;
            self.freeze_timer();
        }
    }

    fn flood(&mut self, r: usize, c: usize) {
        let mut stack = vec![(r, c)];
        while let Some((r, c)) = stack.pop() {
            let cell = &mut self.cells[r][c];
            if cell.revealed || cell.flagged || cell.mine {
                continue;
            }
            cell.revealed = true;
            if cell.adjacent > 0 {
                continue;
            }
            for dr in -1i32..=1 {
                for dc in -1i32..=1 {
                    if dr == 0 && dc == 0 { continue; }
                    let rr = r as i32 + dr;
                    let cc = c as i32 + dc;
                    if self.in_b(rr, cc) {
                        let nr = rr as usize;
                        let nc = cc as usize;
                        if !self.cells[nr][nc].revealed {
                            stack.push((nr, nc));
                        }
                    }
                }
            }
        }
    }

    fn toggle_flag(&mut self, r: usize, c: usize) {
        if matches!(self.status, Status::Won | Status::Lost) {
            return;
        }
        let cell = &mut self.cells[r][c];
        if cell.revealed { return; }
        if !cell.flagged && !cell.questioned {
            cell.flagged = true;
            self.flags += 1;
        } else if cell.flagged {
            cell.flagged = false;
            cell.questioned = true;
            self.flags -= 1;
        } else {
            cell.questioned = false;
        }
    }

    fn chord(&mut self, r: usize, c: usize) {
        if self.status != Status::Playing { return; }
        let cell = self.cells[r][c];
        if !cell.revealed || cell.adjacent == 0 { return; }
        let mut flagged = 0u8;
        let mut hidden = Vec::new();
        for dr in -1i32..=1 {
            for dc in -1i32..=1 {
                if dr == 0 && dc == 0 { continue; }
                let rr = r as i32 + dr;
                let cc = c as i32 + dc;
                if !self.in_b(rr, cc) { continue; }
                let n = self.cells[rr as usize][cc as usize];
                if n.flagged { flagged += 1; }
                else if !n.revealed { hidden.push((rr as usize, cc as usize)); }
            }
        }
        if flagged != cell.adjacent { return; }
        for (hr, hc) in hidden {
            self.reveal(hr, hc);
            if self.status == Status::Lost { return; }
        }
    }

    fn reveal_all(&mut self) {
        for r in 0..self.rows {
            for c in 0..self.cols {
                let cell = &mut self.cells[r][c];
                if cell.mine && !cell.flagged { cell.revealed = true; }
                if !cell.mine && cell.flagged {
                    cell.wrong_flag = true;
                    cell.revealed = true;
                }
            }
        }
    }

    fn check_win(&mut self) -> bool {
        for r in 0..self.rows {
            for c in 0..self.cols {
                let cell = self.cells[r][c];
                if !cell.mine && !cell.revealed {
                    return false;
                }
            }
        }
        for r in 0..self.rows {
            for c in 0..self.cols {
                let cell = &mut self.cells[r][c];
                if cell.mine && !cell.flagged {
                    cell.flagged = true;
                    self.flags += 1;
                }
            }
        }
        true
    }

    fn freeze_timer(&mut self) {
        if let Some(start) = self.started_at {
            self.elapsed_at_end = Some((start.elapsed().as_secs() as u32).min(999));
        } else {
            self.elapsed_at_end = Some(0);
        }
    }

    fn mines_remaining(&self) -> i32 {
        (self.mines as i32 - self.flags).max(0)
    }

    fn elapsed_secs(&self) -> u32 {
        if let Some(e) = self.elapsed_at_end { return e; }
        match self.started_at {
            Some(s) => (s.elapsed().as_secs() as u32).min(999),
            None => 0,
        }
    }
}

// ---------- view ----------

const CELL: f32 = 30.0;
const GAP: f32 = 2.0;
const PAD: f32 = 10.0;
const HUD_H: f32 = 130.0;
const TOP_M: f32 = 20.0;
const SIDE_M: f32 = 20.0;
const HINT_H: f32 = 30.0;

fn bg() -> Color { Color::from_rgba(12, 16, 36, 255) }
fn panel() -> Color { Color::from_rgba(22, 26, 58, 255) }
fn panel2() -> Color { Color::from_rgba(31, 36, 82, 255) }
fn ink() -> Color { Color::from_rgba(233, 236, 255, 255) }
fn muted() -> Color { Color::from_rgba(141, 146, 199, 255) }
fn accent() -> Color { Color::from_rgba(76, 201, 240, 255) }
fn accent2() -> Color { Color::from_rgba(179, 136, 255, 255) }
fn danger() -> Color { Color::from_rgba(255, 92, 141, 255) }
fn good() -> Color { Color::from_rgba(110, 240, 163, 255) }
fn hidden_c() -> Color { Color::from_rgba(53, 58, 120, 255) }
fn revealed_c() -> Color { Color::from_rgba(15, 19, 48, 255) }
fn grid_c() -> Color { Color::from_rgba(27, 32, 80, 255) }
fn led_red() -> Color { Color::from_rgba(255, 59, 107, 255) }
fn led_bg() -> Color { Color::from_rgba(16, 0, 32, 255) }
fn mine_bg() -> Color { Color::from_rgba(42, 15, 28, 255) }
fn explo_bg() -> Color { Color::from_rgba(107, 14, 42, 255) }
fn yellow() -> Color { Color::from_rgba(245, 197, 24, 255) }
fn yellow_dark() -> Color { Color::from_rgba(181, 136, 0, 255) }

fn num_color(n: u8) -> Color {
    match n {
        1 => Color::from_rgba(76, 201, 240, 255),
        2 => Color::from_rgba(110, 240, 163, 255),
        3 => Color::from_rgba(255, 92, 141, 255),
        4 => Color::from_rgba(179, 136, 255, 255),
        5 => Color::from_rgba(255, 180, 84, 255),
        6 => Color::from_rgba(74, 215, 209, 255),
        7 => Color::from_rgba(233, 236, 255, 255),
        _ => Color::from_rgba(141, 146, 199, 255),
    }
}

fn window_size(g: &Game) -> (i32, i32) {
    let board_w = g.cols as f32 * CELL + (g.cols as f32 - 1.0) * GAP + 2.0 * PAD;
    let board_h = g.rows as f32 * CELL + (g.rows as f32 - 1.0) * GAP + 2.0 * PAD;
    let w = (board_w + 2.0 * SIDE_M).max(640.0);
    let h = TOP_M + HUD_H + 14.0 + board_h + HINT_H;
    (w as i32, h as i32)
}

fn board_origin(g: &Game) -> (f32, f32) {
    let board_w = g.cols as f32 * CELL + (g.cols as f32 - 1.0) * GAP + 2.0 * PAD;
    let x = (screen_width() - board_w) / 2.0;
    let y = TOP_M + HUD_H + 14.0;
    (x, y)
}

fn cell_at(g: &Game, mx: f32, my: f32) -> Option<(usize, usize)> {
    let (ox, oy) = board_origin(g);
    let x = mx - ox - PAD;
    let y = my - oy - PAD;
    if x < 0.0 || y < 0.0 { return None; }
    let cw = CELL + GAP;
    let c = (x / cw) as i32;
    let r = (y / cw) as i32;
    if r < 0 || r >= g.rows as i32 || c < 0 || c >= g.cols as i32 { return None; }
    let lx = x - c as f32 * cw;
    let ly = y - r as f32 * cw;
    if lx >= CELL || ly >= CELL { return None; }
    Some((r as usize, c as usize))
}

fn face_rect() -> Rect {
    Rect::new(screen_width() / 2.0 - 26.0, TOP_M + 38.0, 52.0, 52.0)
}

fn preset_rect(i: usize) -> Rect {
    let pill_w = 130.0_f32;
    let pill_h = 30.0_f32;
    let gap = 8.0_f32;
    let total = PRESETS.len() as f32 * pill_w + (PRESETS.len() as f32 - 1.0) * gap;
    let x0 = (screen_width() - total) / 2.0;
    Rect::new(x0 + i as f32 * (pill_w + gap), TOP_M + HUD_H - 38.0, pill_w, pill_h)
}

fn window_conf() -> Conf {
    let g = Game::new(PRESETS[0]);
    let (w, h) = window_size(&g);
    Conf {
        window_title: "Minesweeper · Rust".into(),
        window_width: w,
        window_height: h,
        high_dpi: true,
        ..Default::default()
    }
}

fn draw_text_centered(s: &str, x: f32, y: f32, size: f32, color: Color) {
    let dim = measure_text(s, None, size as u16, 1.0);
    draw_text(s, x - dim.width / 2.0, y + dim.height / 2.0, size, color);
}

fn draw_counter(label: &str, c: Color, x: f32, y: f32) {
    draw_rectangle(x, y, 100.0, 38.0, led_bg());
    draw_rectangle_lines(x, y, 100.0, 38.0, 1.0, Color::from_rgba(
        (c.r * 127.0) as u8, (c.g * 127.0) as u8, (c.b * 127.0) as u8, 255));
    draw_text_centered(label, x + 50.0, y + 19.0, 28.0, c);
}

#[macroquad::main(window_conf)]
async fn main() {
    let mut preset_idx: usize = 0;
    let mut game = Game::new(PRESETS[preset_idx]);
    let mut left_down = false;
    let mut right_down = false;

    loop {
        clear_background(bg());

        let (mx, my) = mouse_position();
        let l_pressed = is_mouse_button_pressed(MouseButton::Left);
        let r_pressed = is_mouse_button_pressed(MouseButton::Right);
        let m_pressed = is_mouse_button_pressed(MouseButton::Middle);
        let l_released = is_mouse_button_released(MouseButton::Left);
        let r_released = is_mouse_button_released(MouseButton::Right);
        if l_pressed { left_down = true; }
        if r_pressed { right_down = true; }

        if l_pressed {
            for i in 0..PRESETS.len() {
                if preset_rect(i).contains(vec2(mx, my)) {
                    preset_idx = i;
                    game = Game::new(PRESETS[i]);
                }
            }
            if face_rect().contains(vec2(mx, my)) {
                game = Game::new(PRESETS[preset_idx]);
            }
        }

        if l_released {
            if let Some((r, c)) = cell_at(&game, mx, my) {
                if right_down { game.chord(r, c); } else { game.reveal(r, c); }
            }
            left_down = false;
        }
        if r_released {
            if let Some((r, c)) = cell_at(&game, mx, my) {
                if left_down { game.chord(r, c); } else { game.toggle_flag(r, c); }
            }
            right_down = false;
        }
        if m_pressed {
            if let Some((r, c)) = cell_at(&game, mx, my) {
                game.chord(r, c);
            }
        }

        // hud
        let hud_x = SIDE_M;
        let hud_y = TOP_M;
        let hud_w = screen_width() - 2.0 * SIDE_M;
        draw_rectangle(hud_x, hud_y, hud_w, HUD_H, panel());
        draw_rectangle_lines(hud_x, hud_y, hud_w, HUD_H, 1.0, Color::from_rgba(38, 43, 102, 255));
        draw_text_centered("MINE·SWEEPER · RUST", hud_x + hud_w / 2.0, hud_y + 16.0, 18.0, accent());

        let mines_str = format!("{:03}", game.mines_remaining());
        let timer_str = format!("{:03}", game.elapsed_secs());
        draw_counter(&mines_str, led_red(), hud_x + 24.0, hud_y + 38.0);
        draw_counter(&timer_str, accent(), hud_x + hud_w - 24.0 - 100.0, hud_y + 38.0);

        // face
        let fr = face_rect();
        draw_circle(fr.x + fr.w / 2.0, fr.y + fr.h / 2.0, fr.w / 2.0, yellow());
        draw_circle_lines(fr.x + fr.w / 2.0, fr.y + fr.h / 2.0, fr.w / 2.0, 2.0, yellow_dark());
        let face = match game.status {
            Status::Lost => "X(",
            Status::Won => "B)",
            _ if left_down => ":O",
            _ => ":)",
        };
        draw_text_centered(face, fr.x + fr.w / 2.0, fr.y + fr.h / 2.0, 22.0, BLACK);

        // presets
        for (i, p) in PRESETS.iter().enumerate() {
            let pr = preset_rect(i);
            let active = i == preset_idx;
            let bgc = if active { accent() } else { panel2() };
            let fg = if active { Color::from_rgba(4, 16, 28, 255) } else { ink() };
            draw_rectangle(pr.x, pr.y, pr.w, pr.h, bgc);
            if !active {
                draw_rectangle_lines(pr.x, pr.y, pr.w, pr.h, 1.0, Color::from_rgba(44, 50, 117, 255));
            }
            draw_text_centered(p.name, pr.x + pr.w / 2.0, pr.y + pr.h / 2.0, 16.0, fg);
        }

        // board
        let (ox, oy) = board_origin(&game);
        let board_w = game.cols as f32 * CELL + (game.cols as f32 - 1.0) * GAP + 2.0 * PAD;
        let board_h = game.rows as f32 * CELL + (game.rows as f32 - 1.0) * GAP + 2.0 * PAD;
        draw_rectangle(ox, oy, board_w, board_h, grid_c());
        for r in 0..game.rows {
            for c in 0..game.cols {
                let cell = game.cells[r][c];
                let x = ox + PAD + c as f32 * (CELL + GAP);
                let y = oy + PAD + r as f32 * (CELL + GAP);
                let mut col = hidden_c();
                if cell.revealed {
                    col = revealed_c();
                    if cell.exploded { col = explo_bg(); }
                    else if cell.mine { col = mine_bg(); }
                }
                draw_rectangle(x, y, CELL, CELL, col);

                let (txt, fg) = if cell.wrong_flag {
                    ("X".to_string(), danger())
                } else if cell.flagged {
                    ("F".to_string(), accent2())
                } else if cell.questioned {
                    ("?".to_string(), Color::from_rgba(255, 180, 84, 255))
                } else if cell.revealed && cell.mine {
                    ("*".to_string(), danger())
                } else if cell.revealed && cell.adjacent > 0 {
                    (format!("{}", cell.adjacent), num_color(cell.adjacent))
                } else {
                    (String::new(), ink())
                };
                if !txt.is_empty() {
                    draw_text_centered(&txt, x + CELL / 2.0, y + CELL / 2.0, 22.0, fg);
                }
            }
        }

        // banner
        if matches!(game.status, Status::Won | Status::Lost) {
            draw_rectangle(0.0, 0.0, screen_width(), screen_height(),
                Color::from_rgba(8, 10, 30, 170));
            let (label, col) = match game.status {
                Status::Won => ("VICTORY!", good()),
                _ => ("BOOM!", danger()),
            };
            draw_text_centered(label, screen_width() / 2.0, screen_height() / 2.0, 56.0, col);
        }

        draw_text_centered(
            "Left reveal | Right flag | Middle (or L+R) chord | Click smiley to restart",
            screen_width() / 2.0,
            screen_height() - HINT_H / 2.0,
            14.0,
            muted(),
        );

        next_frame().await;
    }
}
