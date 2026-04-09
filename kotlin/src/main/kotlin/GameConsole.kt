package org.minesweeper

import org.minesweeper.engine.BaseGame
import org.minesweeper.engine.Point
import kotlin.math.round


/**
 * Implementation of the game logic in a console application
 */
class GameConsole : BaseGame() {
    override fun initialize() {
        val size = askGridSize()
        val numberOfMines = askNumberOfMines(size)
        initialize(size, numberOfMines)
    }

    override fun renderGrid() {
        val pad = if (grid.size >= 10) " " else "" // Add padding for single-digit numbers for even grid display when grid size is 10 or more

        println("\nHere is your updated minefield:")
        print("  ")
        for (i in 1..grid.size) {
            print("$i " + (if (i < 10) pad else ""))
        }
        println()
        for (i in 0 until grid.size) {
            print("${'A' + i} ")
            for (j in 0 until grid.size) {
                val cell = grid.cells[i][j]
                when {
                    !cell.isRevealed -> print("_ $pad")
                    cell.isMine -> {
                        print("* $pad")
                    }
                    else -> print("${cell.adjacentMines} $pad")
                }
            }
            println()
        }
        println()
    }

    override fun runGameRoutine() {
        while (true) {
            try {
                renderGrid()
                val choice = askSquareChoice()
                val cell = selectCell(choice)
                if (cell.isMine) {
                    renderGrid()
                    println("Oh no, you detonated a mine! Game over.")
                } else if (isGameWon()) {
                    renderGrid()
                    println("Congratulations, you have won the game!")
                } else {
                    println("This square contains ${cell.adjacentMines} adjacent mine(s).")
                }

                if (completed) {
                    informReplay()
                }

            } catch (e: Exception) {
                println("Error: ${e.message}")
            }
        }
    }

    private fun askSquareChoice(): Point {
        var choice: Point?
        do {
            print("Select a square to reveal (e.g., A1): ")
            val input = readlnOrNull()
            choice = Point.tryParse(input, grid.size)
            if (choice == null) println("Invalid input, try again.")
        } while (choice == null)
        return choice
    }

    private fun askGridSize(): Int {
        var size = 0
        var validInput = false
        while (!validInput) {
            print("Enter the size of the grid (between $MIN_GRID_SIZE and $MAX_GRID_SIZE): ")
            val input = readlnOrNull()
            if (input != null && input.toIntOrNull() in MIN_GRID_SIZE..MAX_GRID_SIZE) {
                size = input.toInt()
                validInput = true
            } else {
                println("Invalid input.")
            }
        }
        return size
    }

    private fun askNumberOfMines(gridSize: Int): Int {
        var numberOfMines = 0
        val maxMines = (gridSize * gridSize * MAX_MINES_PCT).toInt()
        var validInput = false
        while (!validInput) {
            print("Enter the number of mines to place on the grid (maximum is $maxMines): ")
            val input = readlnOrNull()
            if (input != null) {
                var inputFloat = input.toFloat()
                if (inputFloat >=1 && inputFloat <= maxMines) {
                    numberOfMines = round(inputFloat).toInt()
                    println("numberOfMines: $numberOfMines")
                    validInput = true
                }
            } else {
                println("Invalid input. Please enter a number between 1 and $maxMines.")
            }
        }
        return numberOfMines
    }

    private fun informReplay() {
        print("Press any key to play again...")
        readlnOrNull()
        println()

        reset()
        initialize()
        start()
    }
}
