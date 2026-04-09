import tkinter as tk
import random
from tkinter import messagebox

class Minesweeper:
    def __init__(self, master, size=10, mines=1):
        self.size = size
        self.mines = mines
        self.master = master
        self.buttons = []
        self.mine_positions = set()
        self.is_game_over = False
        self.mine_count = 0
        self.cells_revealed = 0

        menu = tk.Menu(master)
        master.config(menu=menu)
        game_menu = tk.Menu(menu)
        menu.add_cascade(label="Game", menu=game_menu)
        game_menu.add_command(label="Restart", command=self.restart)

        for x in range(self.size):
            row = []
            for y in range(self.size):
                button = tk.Button(master, text=' ', width=2, height=1,
                                   command=lambda x=x, y=y: self.reveal_cell(x, y))
                button.bind("<Button-3>", lambda e, x=x, y=y: self.flag_cell(x, y))  # Right-click to flag
                button.grid(row=x, column=y)
                row.append(button)
            self.buttons.append(row)

        self.place_mines()

    def restart(self):
        self.master.destroy()
        root = tk.Tk()
        game = Minesweeper(root)
        root.mainloop()

    def place_mines(self):
        while len(self.mine_positions) < self.mines:
            x, y = random.randint(0, self.size-1), random.randint(0, self.size-1)
            if (x, y) not in self.mine_positions:
                self.mine_positions.add((x, y))

    def reveal_cell(self, x, y):
        if self.is_game_over or self.buttons[x][y]['text'] in ['F', '*']:
            return

        if (x, y) in self.mine_positions:
            self.buttons[x][y].config(text='*', background='red')
            self.game_over(False)
        else:
            num_mines = self.count_nearby_mines(x, y)
            self.buttons[x][y].config(text=str(num_mines) if num_mines > 0 else ' ', state='normal', relief=tk.SUNKEN)
            self.cells_revealed += 1
            if num_mines == 0:
                for dx in [-1, 0, 1]:
                    for dy in [-1, 0, 1]:
                        if dx != 0 or dy != 0:
                            if 0 <= x + dx < self.size and 0 <= y + dy < self.size:
                                self.reveal_cell(x + dx, y + dy)

        if self.size * self.size - self.mines == self.cells_revealed:
            self.game_over(True)

    def flag_cell(self, x, y):
        if self.buttons[x][y]['text'] == 'F':
            self.buttons[x][y].config(text=' ')
            self.mine_count -= 1
        elif self.buttons[x][y]['text'] == ' ':
            self.buttons[x][y].config(text='F')
            self.mine_count += 1
        self.master.title(f'Mines: {self.mines - self.mine_count}')

    def game_over(self, won):
        self.is_game_over = True
        if won is False:
            for (x, y) in self.mine_positions:
                if self.buttons[x][y]['text'] != 'F':
                    self.buttons[x][y].config(text='*', background='grey')
        message = "Congratulations! You won!" if won else "Game Over! You hit a mine."
        messagebox.showinfo("You Won" if won else "Game Over", message)

    def count_nearby_mines(self, x, y):
        count = 0
        for dx in range(-1, 2):
            for dy in range(-1, 2):
                if (x + dx, y + dy) in self.mine_positions:
                    count += 1
        return count

if __name__ == "__main__":
    root = tk.Tk()
    root.title("Minesweeper")
    game = Minesweeper(root)
    root.resizable(False, False)
    root.mainloop()
