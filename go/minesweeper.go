package main

import (
	"bufio"
	"fmt"
	"math/rand"
	"os"
	"strconv"
	"strings"
	"time"
)

// ---- ANSI ------------------------------------------------------------------

const (
	reset  = "\033[0m"
	bold   = "\033[1m"
	red    = "\033[91m"
	green  = "\033[92m"
	yellow = "\033[93m"
	blue   = "\033[94m"
	purple = "\033[95m"
	cyan   = "\033[96m"
	white  = "\033[97m"
	gray   = "\033[90m"
	orange = "\033[38;5;208m"
	teal   = "\033[38;5;44m"
	bgRed  = "\033[48;5;124m"
)

func c(text string, codes ...string) string {
	return strings.Join(codes, "") + text + reset
}

var numColor = map[int]string{
	1: cyan,
	2: green,
	3: red,
	4: purple,
	5: orange,
	6: teal,
	7: white,
	8: gray,
}

// ---- types -----------------------------------------------------------------

type CellState int

const (
	StateHidden CellState = iota
	StateRevealed
	StateFlagged
	StateQuestioned
)

type Cell struct {
	IsMine    bool
	Adjacent  int
	State     CellState
	Exploded  bool
	WrongFlag bool
}

type Status int

const (
	StatusIdle Status = iota
	StatusPlaying
	StatusWon
	StatusLost
)

type Board struct {
	rows, cols, mines int
	cells             [][]Cell
	flags             int
	status            Status
	firstClick        bool
}

func newBoard(rows, cols, mines int) *Board {
	b := &Board{rows: rows, cols: cols, mines: mines, status: StatusIdle, firstClick: true}
	b.cells = make([][]Cell, rows)
	for i := range b.cells {
		b.cells[i] = make([]Cell, cols)
	}
	return b
}

func (b *Board) placeMines(safeR, safeC int) {
	safe := map[int]bool{}
	for dr := -1; dr <= 1; dr++ {
		for dc := -1; dc <= 1; dc++ {
			rr, cc := safeR+dr, safeC+dc
			if rr >= 0 && rr < b.rows && cc >= 0 && cc < b.cols {
				safe[rr*b.cols+cc] = true
			}
		}
	}
	cands := []int{}
	for i := 0; i < b.rows*b.cols; i++ {
		if !safe[i] {
			cands = append(cands, i)
		}
	}
	rand.Shuffle(len(cands), func(i, j int) { cands[i], cands[j] = cands[j], cands[i] })
	n := b.mines
	if n > len(cands) {
		n = len(cands)
	}
	for _, idx := range cands[:n] {
		b.cells[idx/b.cols][idx%b.cols].IsMine = true
	}
	for r := 0; r < b.rows; r++ {
		for col := 0; col < b.cols; col++ {
			if b.cells[r][col].IsMine {
				continue
			}
			cnt := 0
			for dr := -1; dr <= 1; dr++ {
				for dc := -1; dc <= 1; dc++ {
					if dr == 0 && dc == 0 {
						continue
					}
					nr, nc := r+dr, col+dc
					if nr >= 0 && nr < b.rows && nc >= 0 && nc < b.cols && b.cells[nr][nc].IsMine {
						cnt++
					}
				}
			}
			b.cells[r][col].Adjacent = cnt
		}
	}
}

func (b *Board) reveal(r, col int) {
	if b.status == StatusWon || b.status == StatusLost {
		return
	}
	if r < 0 || r >= b.rows || col < 0 || col >= b.cols {
		return
	}
	cell := &b.cells[r][col]
	if cell.State == StateRevealed || cell.State == StateFlagged {
		return
	}
	if b.firstClick {
		b.placeMines(r, col)
		b.firstClick = false
		b.status = StatusPlaying
	}
	if cell.IsMine {
		cell.State = StateRevealed
		cell.Exploded = true
		b.revealAllMines()
		b.status = StatusLost
		return
	}
	b.flood(r, col)
	b.checkWin()
}

func (b *Board) flood(r, col int) {
	stack := [][2]int{{r, col}}
	for len(stack) > 0 {
		p := stack[len(stack)-1]
		stack = stack[:len(stack)-1]
		rr, cc := p[0], p[1]
		if rr < 0 || rr >= b.rows || cc < 0 || cc >= b.cols {
			continue
		}
		cell := &b.cells[rr][cc]
		if cell.State != StateHidden || cell.IsMine {
			continue
		}
		cell.State = StateRevealed
		if cell.Adjacent == 0 {
			for dr := -1; dr <= 1; dr++ {
				for dc := -1; dc <= 1; dc++ {
					if dr == 0 && dc == 0 {
						continue
					}
					stack = append(stack, [2]int{rr + dr, cc + dc})
				}
			}
		}
	}
}

func (b *Board) toggleFlag(r, col int) {
	if b.status == StatusWon || b.status == StatusLost {
		return
	}
	cell := &b.cells[r][col]
	switch cell.State {
	case StateHidden:
		cell.State = StateFlagged
		b.flags++
	case StateFlagged:
		cell.State = StateQuestioned
		b.flags--
	case StateQuestioned:
		cell.State = StateHidden
	}
}

func (b *Board) chord(r, col int) {
	if b.status != StatusPlaying {
		return
	}
	cell := &b.cells[r][col]
	if cell.State != StateRevealed || cell.Adjacent == 0 {
		return
	}
	flagged := 0
	hidden := [][2]int{}
	for dr := -1; dr <= 1; dr++ {
		for dc := -1; dc <= 1; dc++ {
			if dr == 0 && dc == 0 {
				continue
			}
			nr, nc := r+dr, col+dc
			if nr < 0 || nr >= b.rows || nc < 0 || nc >= b.cols {
				continue
			}
			n := &b.cells[nr][nc]
			if n.State == StateFlagged {
				flagged++
			} else if n.State == StateHidden {
				hidden = append(hidden, [2]int{nr, nc})
			}
		}
	}
	if flagged != cell.Adjacent {
		return
	}
	for _, h := range hidden {
		hCell := &b.cells[h[0]][h[1]]
		if hCell.IsMine {
			hCell.State = StateRevealed
			hCell.Exploded = true
			b.revealAllMines()
			b.status = StatusLost
			return
		}
		b.flood(h[0], h[1])
	}
	b.checkWin()
}

func (b *Board) revealAllMines() {
	for r := 0; r < b.rows; r++ {
		for col := 0; col < b.cols; col++ {
			cell := &b.cells[r][col]
			if cell.IsMine && cell.State != StateFlagged {
				cell.State = StateRevealed
			}
			if !cell.IsMine && cell.State == StateFlagged {
				cell.WrongFlag = true
				cell.State = StateRevealed
			}
		}
	}
}

func (b *Board) checkWin() {
	totalSafe := b.rows*b.cols - b.mines
	revealed := 0
	for r := 0; r < b.rows; r++ {
		for col := 0; col < b.cols; col++ {
			if b.cells[r][col].State == StateRevealed && !b.cells[r][col].IsMine {
				revealed++
			}
		}
	}
	if revealed >= totalSafe {
		for r := 0; r < b.rows; r++ {
			for col := 0; col < b.cols; col++ {
				if b.cells[r][col].IsMine && b.cells[r][col].State != StateFlagged {
					b.cells[r][col].State = StateFlagged
				}
			}
		}
		b.flags = b.mines
		b.status = StatusWon
	}
}

func (b *Board) minesRemaining() int {
	r := b.mines - b.flags
	if r < 0 {
		return 0
	}
	return r
}

// ---- rendering -------------------------------------------------------------

func face(s Status) string {
	switch s {
	case StatusWon:
		return "(◕‿◕)"
	case StatusLost:
		return "(x_x)"
	default:
		return "(•_•)"
	}
}

func renderCell(cell Cell) string {
	if cell.WrongFlag {
		return c(" ✕ ", red, bold)
	}
	switch cell.State {
	case StateFlagged:
		return c(" ⚑ ", purple, bold)
	case StateQuestioned:
		return c(" ? ", yellow, bold)
	case StateHidden:
		return c(" · ", gray)
	}
	if cell.IsMine {
		if cell.Exploded {
			return c(" ✱ ", bgRed, white, bold)
		}
		return c(" ✱ ", red, bold)
	}
	if cell.Adjacent == 0 {
		return "   "
	}
	return c(fmt.Sprintf(" %d ", cell.Adjacent), numColor[cell.Adjacent], bold)
}

func render(b *Board, elapsed int) {
	fmt.Println()
	fmt.Println(c(fmt.Sprintf("  ⚑ %03d", b.minesRemaining()), purple, bold) +
		"   " + c(face(b.status), yellow, bold) +
		"   " + c(fmt.Sprintf("⏱ %03d", elapsed), cyan, bold))
	fmt.Print("    ")
	for i := 0; i < b.cols; i++ {
		fmt.Print(c(fmt.Sprintf(" %c ", 'A'+i), yellow, bold))
	}
	fmt.Println()
	width := b.cols * 3
	fmt.Println("   " + c("┌"+strings.Repeat("─", width)+"┐", gray))
	for r := 0; r < b.rows; r++ {
		fmt.Print(c(fmt.Sprintf("%2d ", r+1), yellow, bold) + c("│", gray))
		for col := 0; col < b.cols; col++ {
			fmt.Print(renderCell(b.cells[r][col]))
		}
		fmt.Println(c("│", gray))
	}
	fmt.Println("   " + c("└"+strings.Repeat("─", width)+"┘", gray))
}

// ---- input -----------------------------------------------------------------

type command struct {
	action   string
	row, col int
}

func parseCommand(text string, rows, cols int) (command, bool) {
	t := strings.TrimSpace(strings.ToLower(text))
	if t == "" {
		return command{}, false
	}
	if t == "q" || t == "quit" || t == "exit" {
		return command{action: "quit"}, true
	}
	if t == "h" || t == "?" || t == "help" {
		return command{action: "help"}, true
	}
	if t == "n" || t == "new" {
		return command{action: "new"}, true
	}
	action := "reveal"
	if t[0] == 'f' && len(t) > 1 {
		action = "flag"
		t = strings.TrimSpace(t[1:])
	} else if t[0] == 'c' && len(t) > 1 {
		action = "chord"
		t = strings.TrimSpace(t[1:])
	}
	if len(t) < 2 {
		return command{}, false
	}
	colCh := strings.ToUpper(string(t[0]))[0]
	row, err := strconv.Atoi(t[1:])
	if err != nil {
		return command{}, false
	}
	col := int(colCh - 'A')
	row--
	if row < 0 || row >= rows || col < 0 || col >= cols {
		return command{}, false
	}
	return command{action: action, row: row, col: col}, true
}

func askDifficulty(reader *bufio.Reader) *Board {
	fmt.Println(c("\nChoose difficulty:", bold, cyan))
	fmt.Println("  " + c("1", yellow, bold) + ") Beginner       9 × 9    10 mines")
	fmt.Println("  " + c("2", yellow, bold) + ") Intermediate  16 × 16   40 mines")
	fmt.Println("  " + c("3", yellow, bold) + ") Expert        16 × 30   99 mines")
	fmt.Println("  " + c("4", yellow, bold) + ") Custom")
	for {
		fmt.Print(c("\nSelection: ", green))
		line, _ := reader.ReadString('\n')
		switch strings.TrimSpace(line) {
		case "1", "b", "beginner":
			return newBoard(9, 9, 10)
		case "2", "i", "intermediate":
			return newBoard(16, 16, 40)
		case "3", "e", "expert":
			return newBoard(16, 30, 99)
		case "4", "c", "custom":
			return askCustom(reader)
		default:
			fmt.Println(c("Please choose 1-4.", red))
		}
	}
}

func readInt(reader *bufio.Reader, prompt string) int {
	for {
		fmt.Print(c(prompt, green))
		line, _ := reader.ReadString('\n')
		v, err := strconv.Atoi(strings.TrimSpace(line))
		if err == nil && v > 0 {
			return v
		}
		fmt.Println(c("Please enter a positive number.", red))
	}
}

func askCustom(reader *bufio.Reader) *Board {
	for {
		rows := readInt(reader, "Rows (5-26): ")
		cols := readInt(reader, "Cols (5-26): ")
		maxMines := rows*cols - 9
		mines := readInt(reader, fmt.Sprintf("Mines (1-%d): ", maxMines))
		if rows >= 5 && rows <= 26 && cols >= 5 && cols <= 26 && mines >= 1 && mines <= maxMines {
			return newBoard(rows, cols, mines)
		}
		fmt.Println(c("Out of range. Try again.", red))
	}
}

func printHelp() {
	fmt.Println(c("\nCommands:", bold, cyan))
	fmt.Println("  A1, B5      reveal cell at column-letter row-number")
	fmt.Println("  f A1        toggle flag on cell A1")
	fmt.Println("  c A1        chord-reveal around a numbered cell")
	fmt.Println("  n           new game · q quit · h help")
	fmt.Println()
}

func playOne(board *Board, reader *bufio.Reader) {
	printHelp()
	var startTime time.Time
	for {
		elapsed := 0
		if !startTime.IsZero() {
			elapsed = int(time.Since(startTime).Seconds())
		}
		render(board, elapsed)
		if board.status == StatusWon {
			fmt.Println(c("\n  ✨  V I C T O R Y  ✨", bold, green))
			fmt.Println(c(fmt.Sprintf("  Cleared in %ds", elapsed), green))
			return
		}
		if board.status == StatusLost {
			fmt.Println(c("\n  💥  B O O M  💥", bold, red))
			return
		}
		fmt.Print(c("\n› ", cyan, bold))
		line, err := reader.ReadString('\n')
		if err != nil {
			return
		}
		cmd, ok := parseCommand(line, board.rows, board.cols)
		if !ok {
			fmt.Println(c("Unknown command. Type 'h' for help.", red))
			continue
		}
		switch cmd.action {
		case "quit":
			return
		case "help":
			printHelp()
		case "new":
			return
		case "flag":
			board.toggleFlag(cmd.row, cmd.col)
		case "chord":
			board.chord(cmd.row, cmd.col)
		default:
			board.reveal(cmd.row, cmd.col)
			if startTime.IsZero() && board.status == StatusPlaying {
				startTime = time.Now()
			}
		}
	}
}

const banner = `
   ╔══════════════════════════════════════════════╗
   ║      M I N E S W E E P E R   ·   G O         ║
   ╚══════════════════════════════════════════════╝
`

func main() {
	rand.Seed(time.Now().UnixNano())
	fmt.Print(c(banner, cyan, bold))
	reader := bufio.NewReader(os.Stdin)
	for {
		board := askDifficulty(reader)
		playOne(board, reader)
		fmt.Print(c("\nPlay again? [Y/n] ", green))
		line, err := reader.ReadString('\n')
		if err != nil {
			return
		}
		ans := strings.ToLower(strings.TrimSpace(line))
		if ans == "n" || ans == "no" || ans == "q" || ans == "quit" {
			fmt.Println(c("\nThanks for playing!\n", cyan, bold))
			return
		}
	}
}
