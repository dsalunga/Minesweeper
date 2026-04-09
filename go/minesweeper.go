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

type Cell struct {
	isMine        bool
	isRevealed    bool
	adjacentMines int
}

type Board struct {
	cells [][]Cell
	rows  int
	cols  int
	mines int
}

func main() {
	rand.Seed(time.Now().UnixNano())

	// Get board size and number of mines from the user
	size := getBoardSize()
	rows := size
	cols := size
	mines := getNumberOfMines(size)

	// Initialize the board
	board := Board{
		rows:  rows,
		cols:  cols,
		mines: mines,
	}
	board.initialize()
	board.placeMines()
	board.calculateAdjacentMines()

	// Game loop
	for {
		board.display()

		// Get user move
		row, col := getUserMove(rows, cols)

		// Reveal the cell
		if !board.revealCell(row, col) {
			board.displayAll()
			fmt.Println("Game Over! You hit a mine.")
			break
		}

		// Check for win condition
		if board.isWin() {
			board.displayAll()
			fmt.Println("Congratulations! You've cleared all the mines.")
			break
		}
	}
}

func getBoardSize() int {
	reader := bufio.NewReader(os.Stdin)

	fmt.Print("Enter the board size: ")
	rowInput, _ := reader.ReadString('\n')
	size, err := strconv.Atoi(strings.TrimSpace(rowInput))
	if err != nil || size <= 0 {
		fmt.Println("Invalid input. Please enter a positive integer.")
		return getBoardSize()
	}

	return size
}

func getNumberOfMines(size int) int {
	reader := bufio.NewReader(os.Stdin)
	maxMines := size*size - 1

	fmt.Printf("Enter the number of mines (1-%d): ", maxMines)
	minesInput, _ := reader.ReadString('\n')
	mines, err := strconv.Atoi(strings.TrimSpace(minesInput))
	if err != nil || mines <= 0 || mines > maxMines {
		fmt.Println("Invalid input. Please enter a positive integer within the valid range.")
		return getNumberOfMines(size)
	}

	return mines
}

func getUserMove(rows, cols int) (int, int) {
	reader := bufio.NewReader(os.Stdin)
	fmt.Print("Enter your move (e.g., A1, E5): ")
	moveInput, _ := reader.ReadString('\n')
	moveInput = strings.TrimSpace(moveInput)

	if len(moveInput) < 2 {
		fmt.Println("Invalid input. Please enter a valid move.")
		return getUserMove(rows, cols)
	}

	colLetter := strings.ToUpper(string(moveInput[0]))
	rowNumber := moveInput[1:]

	col := int(colLetter[0] - 'A')
	row, err := strconv.Atoi(rowNumber)
	if err != nil || row < 1 || row > rows || col < 0 || col >= cols {
		fmt.Println("Invalid input. Please enter a valid move.")
		return getUserMove(rows, cols)
	}

	return row - 1, col
}

func (b *Board) initialize() {
	b.cells = make([][]Cell, b.rows)
	for i := 0; i < b.rows; i++ {
		b.cells[i] = make([]Cell, b.cols)
	}
}

func (b *Board) placeMines() {
	placedMines := 0
	for placedMines < b.mines {
		row := rand.Intn(b.rows)
		col := rand.Intn(b.cols)
		if !b.cells[row][col].isMine {
			b.cells[row][col].isMine = true
			placedMines++
		}
	}
}

func (b *Board) calculateAdjacentMines() {
	for row := 0; row < b.rows; row++ {
		for col := 0; col < b.cols; col++ {
			if b.cells[row][col].isMine {
				continue
			}
			count := 0
			for dr := -1; dr <= 1; dr++ {
				for dc := -1; dc <= 1; dc++ {
					r := row + dr
					c := col + dc
					if r >= 0 && r < b.rows && c >= 0 && c < b.cols {
						if b.cells[r][c].isMine {
							count++
						}
					}
				}
			}
			b.cells[row][col].adjacentMines = count
		}
	}
}

func (b *Board) display() {
	fmt.Print("  ")
	for col := 0; col < b.cols; col++ {
		fmt.Printf(" %c", 'A'+col)
	}
	fmt.Println()
	for row := 0; row < b.rows; row++ {
		fmt.Printf("%2d", row+1)
		for col := 0; col < b.cols; col++ {
			cell := b.cells[row][col]
			if cell.isRevealed {
				if cell.isMine {
					fmt.Print(" *")
				} else if cell.adjacentMines > 0 {
					fmt.Printf(" %d", cell.adjacentMines)
				} else {
					fmt.Print("  ")
				}
			} else {
				fmt.Print(" #")
			}
		}
		fmt.Println()
	}
}

func (b *Board) displayAll() {
	fmt.Print("  ")
	for col := 0; col < b.cols; col++ {
		fmt.Printf(" %c", 'A'+col)
	}
	fmt.Println()
	for row := 0; row < b.rows; row++ {
		fmt.Printf("%2d", row+1)
		for col := 0; col < b.cols; col++ {
			cell := b.cells[row][col]
			if cell.isMine {
				fmt.Print(" *")
			} else if cell.adjacentMines > 0 {
				fmt.Printf(" %d", cell.adjacentMines)
			} else {
				fmt.Print("  ")
			}
		}
		fmt.Println()
	}
}

func (b *Board) revealCell(row, col int) bool {
	if b.cells[row][col].isRevealed {
		fmt.Println("Cell already revealed.")
		return true
	}

	b.cells[row][col].isRevealed = true

	if b.cells[row][col].isMine {
		return false
	}

	if b.cells[row][col].adjacentMines == 0 {
		// Reveal adjacent cells recursively
		for dr := -1; dr <= 1; dr++ {
			for dc := -1; dc <= 1; dc++ {
				r := row + dr
				c := col + dc
				if r >= 0 && r < b.rows && c >= 0 && c < b.cols {
					if !b.cells[r][c].isRevealed && !b.cells[r][c].isMine {
						b.revealCell(r, c)
					}
				}
			}
		}
	}

	return true
}

func (b *Board) isWin() bool {
	for row := 0; row < b.rows; row++ {
		for col := 0; col < b.cols; col++ {
			cell := b.cells[row][col]
			if !cell.isMine && !cell.isRevealed {
				return false
			}
		}
	}
	return true
}
