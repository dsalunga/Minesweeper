use rand::seq::SliceRandom;
use rand::thread_rng;
use std::io::{self, BufRead, Write};
use std::time::Instant;

// ---- ANSI ----------------------------------------------------------------
const RESET: &str = "\x1b[0m";
const BOLD: &str = "\x1b[1m";
const RED: &str = "\x1b[91m";
const GREEN: &str = "\x1b[92m";
const YELLOW: &str = "\x1b[93m";
const PURPLE: &str = "\x1b[95m";
const CYAN: &str = "\x1b[96m";
const WHITE: &str = "\x1b[97m";
const GRAY: &str = "\x1b[90m";
const ORANGE: &str = "\x1b[38;5;208m";
const TEAL: &str = "\x1b[38;5;44m";
const VIOLET: &str = "\x1b[38;5;141m";
const BG_RED: &str = "\x1b[48;5;124m";

fn paint(text: &str, codes: &[&str]) -> String {
    format!("{}{}{}", codes.concat(), text, RESET)
}

fn num_color(n: u8) -> &'static str {
    match n {
        1 => CYAN,
        2 => GREEN,
        3 => RED,
        4 => VIOLET,
        5 => ORANGE,
        6 => TEAL,
        7 => WHITE,
        _ => GRAY,
    }
}

// ---- model ---------------------------------------------------------------

#[derive(Clone, Copy, PartialEq)]
enum CellState {
    Hidden,
    Revealed,
    Flagged,
    Questioned,
}

#[derive(Clone, Copy)]
struct Cell {
    is_mine: bool,
    adjacent: u8,
    state: CellState,
    exploded: bool,
    wrong_flag: bool,
}

impl Cell {
    fn new() -> Self {
        Self {
            is_mine: false,
            adjacent: 0,
            state: CellState::Hidden,
            exploded: false,
            wrong_flag: false,
        }
    }
}

#[derive(PartialEq, Clone, Copy)]
enum Status {
    Idle,
    Playing,
    Won,
    Lost,
}

struct Board {
    rows: usize,
    cols: usize,
    mines: usize,
    cells: Vec<Vec<Cell>>,
    flags: usize,
    status: Status,
    first_click: bool,
}

impl Board {
    fn new(rows: usize, cols: usize, mines: usize) -> Self {
        Self {
            rows,
            cols,
            mines,
            cells: vec![vec![Cell::new(); cols]; rows],
            flags: 0,
            status: Status::Idle,
            first_click: true,
        }
    }

    fn place_mines(&mut self, safe_r: usize, safe_c: usize) {
        let mut safe = std::collections::HashSet::new();
        for dr in -1i32..=1 {
            for dc in -1i32..=1 {
                let rr = safe_r as i32 + dr;
                let cc = safe_c as i32 + dc;
                if rr >= 0 && (rr as usize) < self.rows && cc >= 0 && (cc as usize) < self.cols {
                    safe.insert((rr as usize, cc as usize));
                }
            }
        }
        let mut cands: Vec<(usize, usize)> = (0..self.rows)
            .flat_map(|r| (0..self.cols).map(move |c| (r, c)))
            .filter(|p| !safe.contains(p))
            .collect();
        let mut rng = thread_rng();
        cands.shuffle(&mut rng);
        let n = self.mines.min(cands.len());
        for &(r, c) in cands.iter().take(n) {
            self.cells[r][c].is_mine = true;
        }
        for r in 0..self.rows {
            for c in 0..self.cols {
                if self.cells[r][c].is_mine {
                    continue;
                }
                let mut count = 0u8;
                for dr in -1i32..=1 {
                    for dc in -1i32..=1 {
                        if dr == 0 && dc == 0 {
                            continue;
                        }
                        let nr = r as i32 + dr;
                        let nc = c as i32 + dc;
                        if nr >= 0
                            && (nr as usize) < self.rows
                            && nc >= 0
                            && (nc as usize) < self.cols
                            && self.cells[nr as usize][nc as usize].is_mine
                        {
                            count += 1;
                        }
                    }
                }
                self.cells[r][c].adjacent = count;
            }
        }
    }

    fn reveal(&mut self, r: usize, c: usize) {
        if matches!(self.status, Status::Won | Status::Lost) {
            return;
        }
        if r >= self.rows || c >= self.cols {
            return;
        }
        let cell = self.cells[r][c];
        if matches!(cell.state, CellState::Revealed | CellState::Flagged) {
            return;
        }
        if self.first_click {
            self.place_mines(r, c);
            self.first_click = false;
            self.status = Status::Playing;
        }
        if self.cells[r][c].is_mine {
            self.cells[r][c].state = CellState::Revealed;
            self.cells[r][c].exploded = true;
            self.reveal_all_mines();
            self.status = Status::Lost;
            return;
        }
        self.flood(r, c);
        self.check_win();
    }

    fn flood(&mut self, r: usize, c: usize) {
        let mut stack = vec![(r as i32, c as i32)];
        while let Some((rr, cc)) = stack.pop() {
            if rr < 0 || cc < 0 || rr as usize >= self.rows || cc as usize >= self.cols {
                continue;
            }
            let (ru, cu) = (rr as usize, cc as usize);
            let cell = &mut self.cells[ru][cu];
            if cell.state != CellState::Hidden || cell.is_mine {
                continue;
            }
            cell.state = CellState::Revealed;
            if cell.adjacent == 0 {
                for dr in -1i32..=1 {
                    for dc in -1i32..=1 {
                        if dr == 0 && dc == 0 {
                            continue;
                        }
                        stack.push((rr + dr, cc + dc));
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
        match cell.state {
            CellState::Hidden => {
                cell.state = CellState::Flagged;
                self.flags += 1;
            }
            CellState::Flagged => {
                cell.state = CellState::Questioned;
                self.flags = self.flags.saturating_sub(1);
            }
            CellState::Questioned => cell.state = CellState::Hidden,
            CellState::Revealed => {}
        }
    }

    fn chord(&mut self, r: usize, c: usize) {
        if self.status != Status::Playing {
            return;
        }
        let cell = self.cells[r][c];
        if cell.state != CellState::Revealed || cell.adjacent == 0 {
            return;
        }
        let mut flagged = 0u8;
        let mut hidden = vec![];
        for dr in -1i32..=1 {
            for dc in -1i32..=1 {
                if dr == 0 && dc == 0 {
                    continue;
                }
                let nr = r as i32 + dr;
                let nc = c as i32 + dc;
                if nr < 0 || nc < 0 || nr as usize >= self.rows || nc as usize >= self.cols {
                    continue;
                }
                let n = self.cells[nr as usize][nc as usize];
                if n.state == CellState::Flagged {
                    flagged += 1;
                } else if n.state == CellState::Hidden {
                    hidden.push((nr as usize, nc as usize));
                }
            }
        }
        if flagged != cell.adjacent {
            return;
        }
        for (hr, hc) in hidden {
            if self.cells[hr][hc].is_mine {
                self.cells[hr][hc].state = CellState::Revealed;
                self.cells[hr][hc].exploded = true;
                self.reveal_all_mines();
                self.status = Status::Lost;
                return;
            }
            self.flood(hr, hc);
        }
        self.check_win();
    }

    fn reveal_all_mines(&mut self) {
        for r in 0..self.rows {
            for c in 0..self.cols {
                let cell = &mut self.cells[r][c];
                if cell.is_mine && cell.state != CellState::Flagged {
                    cell.state = CellState::Revealed;
                }
                if !cell.is_mine && cell.state == CellState::Flagged {
                    cell.wrong_flag = true;
                    cell.state = CellState::Revealed;
                }
            }
        }
    }

    fn check_win(&mut self) {
        let total_safe = self.rows * self.cols - self.mines;
        let revealed = self
            .cells
            .iter()
            .flatten()
            .filter(|c| c.state == CellState::Revealed && !c.is_mine)
            .count();
        if revealed >= total_safe {
            for row in &mut self.cells {
                for c in row.iter_mut() {
                    if c.is_mine && c.state != CellState::Flagged {
                        c.state = CellState::Flagged;
                    }
                }
            }
            self.flags = self.mines;
            self.status = Status::Won;
        }
    }

    fn mines_remaining(&self) -> i32 {
        self.mines as i32 - self.flags as i32
    }
}

// ---- rendering ----------------------------------------------------------

fn render_cell(cell: Cell) -> String {
    if cell.wrong_flag {
        return paint(" ✕ ", &[RED, BOLD]);
    }
    match cell.state {
        CellState::Flagged => paint(" ⚑ ", &[PURPLE, BOLD]),
        CellState::Questioned => paint(" ? ", &[YELLOW, BOLD]),
        CellState::Hidden => paint(" · ", &[GRAY]),
        CellState::Revealed => {
            if cell.is_mine {
                if cell.exploded {
                    paint(" ✱ ", &[BG_RED, WHITE, BOLD])
                } else {
                    paint(" ✱ ", &[RED, BOLD])
                }
            } else if cell.adjacent == 0 {
                "   ".to_string()
            } else {
                paint(
                    &format!(" {} ", cell.adjacent),
                    &[num_color(cell.adjacent), BOLD],
                )
            }
        }
    }
}

fn face(s: Status) -> &'static str {
    match s {
        Status::Won => "(◕‿◕)",
        Status::Lost => "(x_x)",
        _ => "(•_•)",
    }
}

fn render(board: &Board, elapsed: u64) {
    println!();
    println!(
        "{}   {}   {}",
        paint(&format!("  ⚑ {:03}", board.mines_remaining().max(0)), &[PURPLE, BOLD]),
        paint(face(board.status), &[YELLOW, BOLD]),
        paint(&format!("⏱ {:03}", elapsed.min(999)), &[CYAN, BOLD]),
    );
    print!("    ");
    for i in 0..board.cols {
        print!("{}", paint(&format!(" {} ", (b'A' + i as u8) as char), &[YELLOW, BOLD]));
    }
    println!();
    let width: String = "─".repeat(board.cols * 3);
    println!("   {}", paint(&format!("┌{}┐", width), &[GRAY]));
    for r in 0..board.rows {
        print!(
            "{}{}",
            paint(&format!("{:>2} ", r + 1), &[YELLOW, BOLD]),
            paint("│", &[GRAY])
        );
        for c in 0..board.cols {
            print!("{}", render_cell(board.cells[r][c]));
        }
        println!("{}", paint("│", &[GRAY]));
    }
    println!("   {}", paint(&format!("└{}┘", width), &[GRAY]));
}

// ---- input --------------------------------------------------------------

enum Action {
    Reveal,
    Flag,
    Chord,
    Quit,
    Help,
    New,
}

fn parse_command(text: &str, rows: usize, cols: usize) -> Option<(Action, usize, usize)> {
    let t = text.trim().to_lowercase();
    if t.is_empty() {
        return None;
    }
    match t.as_str() {
        "q" | "quit" | "exit" => return Some((Action::Quit, 0, 0)),
        "h" | "?" | "help" => return Some((Action::Help, 0, 0)),
        "n" | "new" => return Some((Action::New, 0, 0)),
        _ => {}
    }
    let bytes = t.as_bytes();
    let (action, rest) = if bytes[0] == b'f' && bytes.len() > 1 {
        (Action::Flag, t[1..].trim())
    } else if bytes[0] == b'c' && bytes.len() > 1 {
        (Action::Chord, t[1..].trim())
    } else {
        (Action::Reveal, t.as_str())
    };
    if rest.len() < 2 {
        return None;
    }
    let col_ch = rest.as_bytes()[0].to_ascii_uppercase();
    if !(b'A'..=b'Z').contains(&col_ch) {
        return None;
    }
    let col = (col_ch - b'A') as usize;
    let row: usize = rest[1..].parse().ok()?;
    if row == 0 || row > rows || col >= cols {
        return None;
    }
    Some((action, row - 1, col))
}

fn read_line(reader: &mut impl BufRead) -> Option<String> {
    let mut s = String::new();
    if reader.read_line(&mut s).ok()? == 0 {
        return None;
    }
    Some(s)
}

fn ask_difficulty(reader: &mut impl BufRead) -> Board {
    println!("{}", paint("\nChoose difficulty:", &[BOLD, CYAN]));
    println!("  {}) Beginner       9 × 9    10 mines", paint("1", &[YELLOW, BOLD]));
    println!("  {}) Intermediate  16 × 16   40 mines", paint("2", &[YELLOW, BOLD]));
    println!("  {}) Expert        16 × 30   99 mines", paint("3", &[YELLOW, BOLD]));
    println!("  {}) Custom", paint("4", &[YELLOW, BOLD]));
    loop {
        print!("{}", paint("\nSelection: ", &[GREEN]));
        io::stdout().flush().ok();
        let line = match read_line(reader) {
            Some(l) => l,
            None => return Board::new(9, 9, 10),
        };
        match line.trim() {
            "1" | "b" | "beginner" => return Board::new(9, 9, 10),
            "2" | "i" | "intermediate" => return Board::new(16, 16, 40),
            "3" | "e" | "expert" => return Board::new(16, 30, 99),
            "4" | "c" | "custom" => return ask_custom(reader),
            _ => println!("{}", paint("Please choose 1-4.", &[RED])),
        }
    }
}

fn read_int(reader: &mut impl BufRead, prompt: &str) -> usize {
    loop {
        print!("{}", paint(prompt, &[GREEN]));
        io::stdout().flush().ok();
        let line = read_line(reader).unwrap_or_default();
        if let Ok(v) = line.trim().parse::<usize>() {
            if v > 0 {
                return v;
            }
        }
        println!("{}", paint("Please enter a positive number.", &[RED]));
    }
}

fn ask_custom(reader: &mut impl BufRead) -> Board {
    loop {
        let rows = read_int(reader, "Rows (5-26): ");
        let cols = read_int(reader, "Cols (5-26): ");
        let max_mines = rows * cols - 9;
        let mines = read_int(reader, &format!("Mines (1-{}): ", max_mines));
        if (5..=26).contains(&rows) && (5..=26).contains(&cols) && mines >= 1 && mines <= max_mines {
            return Board::new(rows, cols, mines);
        }
        println!("{}", paint("Out of range. Try again.", &[RED]));
    }
}

fn print_help() {
    println!("{}", paint("\nCommands:", &[BOLD, CYAN]));
    println!("  A1, B5      reveal cell at column-letter row-number");
    println!("  f A1        toggle flag on cell A1");
    println!("  c A1        chord-reveal around a numbered cell");
    println!("  n           new game · q quit · h help\n");
}

fn play_one(board: &mut Board, reader: &mut impl BufRead) -> bool {
    print_help();
    let mut start: Option<Instant> = None;
    loop {
        let elapsed = start.map(|s| s.elapsed().as_secs()).unwrap_or(0);
        render(board, elapsed);
        match board.status {
            Status::Won => {
                println!("{}", paint("\n  ✨  V I C T O R Y  ✨", &[BOLD, GREEN]));
                println!("{}", paint(&format!("  Cleared in {}s", elapsed), &[GREEN]));
                return true;
            }
            Status::Lost => {
                println!("{}", paint("\n  💥  B O O M  💥", &[BOLD, RED]));
                return true;
            }
            _ => {}
        }
        print!("{}", paint("\n› ", &[CYAN, BOLD]));
        io::stdout().flush().ok();
        let line = match read_line(reader) {
            Some(l) => l,
            None => return false,
        };
        let cmd = match parse_command(&line, board.rows, board.cols) {
            Some(v) => v,
            None => {
                println!("{}", paint("Unknown command. Type 'h' for help.", &[RED]));
                continue;
            }
        };
        match cmd.0 {
            Action::Quit => return false,
            Action::Help => print_help(),
            Action::New => return true,
            Action::Flag => board.toggle_flag(cmd.1, cmd.2),
            Action::Chord => board.chord(cmd.1, cmd.2),
            Action::Reveal => {
                board.reveal(cmd.1, cmd.2);
                if start.is_none() && board.status == Status::Playing {
                    start = Some(Instant::now());
                }
            }
        }
    }
}

const BANNER: &str = "
   ╔══════════════════════════════════════════════╗
   ║      M I N E S W E E P E R   ·   R U S T     ║
   ╚══════════════════════════════════════════════╝
";

fn main() {
    print!("{}", paint(BANNER, &[CYAN, BOLD]));
    let stdin = io::stdin();
    let mut reader = stdin.lock();
    loop {
        let mut board = ask_difficulty(&mut reader);
        if !play_one(&mut board, &mut reader) {
            println!("{}", paint("\nThanks for playing!\n", &[CYAN, BOLD]));
            return;
        }
        print!("{}", paint("\nPlay again? [Y/n] ", &[GREEN]));
        io::stdout().flush().ok();
        let line = read_line(&mut reader).unwrap_or_default();
        let ans = line.trim().to_lowercase();
        if matches!(ans.as_str(), "n" | "no" | "q" | "quit") {
            println!("{}", paint("\nThanks for playing!\n", &[CYAN, BOLD]));
            return;
        }
    }
}
