import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CellComponent } from '../cell/cell.component';
import { GameService } from '../../services/game.service';

@Component({
  selector: 'app-board',
  standalone: true,
  imports: [CommonModule, CellComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="board"
      [style.grid-template-columns]="'repeat(' + cols() + ', var(--cell-size))'"
      [class.game-over]="gameOver()"
      [class.won]="won()"
      (contextmenu)="$event.preventDefault()"
    >
      @for (row of board(); track $index; let r = $index) {
        @for (cell of row; track $index; let c = $index) {
          <app-cell
            [cell]="cell"
            [disabled]="gameOver()"
            (reveal)="game.reveal(r, c)"
            (flag)="game.toggleFlag(r, c)"
            (chord)="game.chordReveal(r, c)"
          />
        }
      }
    </div>
  `,
  styleUrl: './board.component.scss',
})
export class BoardComponent {
  readonly game = inject(GameService);
  readonly board = this.game.board;
  readonly cols = computed(() => this.game.config().cols);
  readonly gameOver = computed(() => {
    const s = this.game.status();
    return s === 'won' || s === 'lost';
  });
  readonly won = computed(() => this.game.status() === 'won');
}
