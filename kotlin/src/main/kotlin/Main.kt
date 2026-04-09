package org.minesweeper

fun main() {
    println("Welcome to Minesweeper!")

    val game = GameConsole()
    game.initialize()
    game.start()
}