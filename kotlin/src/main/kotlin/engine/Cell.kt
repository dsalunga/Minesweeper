package org.minesweeper.engine

data class Cell(
    var isMine: Boolean = false,
    var isRevealed: Boolean = false,
    var adjacentMines: Int = 0,
    var isFlagged: Boolean = false,
    var isQuestioned: Boolean = false,
    var exploded: Boolean = false,
    var wrongFlag: Boolean = false,
)
