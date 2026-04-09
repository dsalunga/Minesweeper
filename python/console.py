import random


def print_board(board):
    print("\n  " + " ".join(str(i) for i in range(1, len(board) + 1)))
    char_a = 'A'
    for row in board:
        print(f"{char_a} {' '.join(row)}")
        char_a = chr(ord(char_a) + 1)
    print()


def set_up_board(size, mines):
    board = [['-' for _ in range(size)] for _ in range(size)]
    mine_positions = set()
    while len(mine_positions) < mines:
        x, y = random.randint(0, size - 1), random.randint(0, size - 1)
        mine_positions.add((x, y))
        board[x][y] = '*'
    return board, mine_positions


def count_nearby_mines(x, y, board, size):
    count = 0
    for i in range(max(0, x - 1), min(x + 2, size)):
        for j in range(max(0, y - 1), min(y + 2, size)):
            if board[i][j] == '*':
                count += 1
    return count


def reveal_board(board, display_board, x, y, size):
    if x < 0 or x >= size or y < 0 or y >= size or display_board[x][y] != '-':
        return
    if board[x][y] == '*':
        return

    count = count_nearby_mines(x, y, board, size)
    display_board[x][y] = str(count) if count > 0 else ' '

    if count == 0:
        for dx in [-1, 0, 1]:
            for dy in [-1, 0, 1]:
                if dx != 0 or dy != 0:
                    reveal_board(board, display_board, x + dx, y + dy, size)


def play_minesweeper(size=8, mines=10):
    board, mine_positions = set_up_board(size, mines)
    display_board = [['-' for _ in range(size)] for _ in range(size)]
    remaining_cells = size * size - mines

    while remaining_cells > 0:
        print_board(display_board)
        while True:
            x = int(ord(input("Enter row (e.g. A or B): ").upper()) - ord('A'))
            if x < 0 or x >= size:
                print("Invalid row. Please try again.")
            else:
                break
        while True:
            y = int(input("Enter column number: ")) - 1
            if y < 0 or y >= size:
                print("Invalid column. Please try again.")
            else:
                break


        if (x, y) in mine_positions:
            print_board(board)
            print("Game Over! You hit a mine.")
            return

        if display_board[x][y] == '-':
            reveal_board(board, display_board, x, y, size)
            remaining_cells -= 1

    print_board(display_board)
    print("Congratulations! You cleared the minefield.")


if __name__ == "__main__":
    play_minesweeper()
