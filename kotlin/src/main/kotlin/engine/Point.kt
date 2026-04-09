package org.minesweeper.engine

/**
 * Represents a point or a position on the game grid
 */
data class Point(val row: Int, val col: Int) {
    override fun toString(): String = "($row, $col)"

    companion object {
        fun tryParse(input: String?, gridSize: Int): Point? {
            input ?: return null // Input cannot be null or empty.
            val trimmed = input.uppercase().trim()
            if (trimmed.length !in 2..3) return null // Invalid input format.

            val row = trimmed[0] - 'A'
            val col = trimmed.substring(1).toInt() - 1

            if (row !in 0 until gridSize || col !in 0 until gridSize) return null // Input out of grid bounds.

            return Point(row, col)
        }
    }
}