import { ChangeDetectionStrategy, Component, EventEmitter, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GameService } from '../../services/game.service';
import { DIFFICULTY_PRESETS, Difficulty } from '../../engine/minesweeper';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="settings">
      <h2>New Game</h2>

      <div class="difficulty-grid">
        @for (d of presets; track d.key) {
          <button
            type="button"
            class="preset"
            [class.active]="selected() === d.key"
            (click)="select(d.key)"
          >
            <div class="preset-name">{{ d.name }}</div>
            <div class="preset-meta">{{ d.cfg.cols }} × {{ d.cfg.rows }}</div>
            <div class="preset-mines">{{ d.cfg.mines }} mines</div>
            @if (game.bestTimes()[d.key]) {
              <div class="preset-best">Best: {{ game.bestTimes()[d.key] }}s</div>
            }
          </button>
        }

        <button
          type="button"
          class="preset"
          [class.active]="selected() === 'custom'"
          (click)="select('custom')"
        >
          <div class="preset-name">Custom</div>
          <div class="preset-meta">Your size</div>
          <div class="preset-mines">Your mines</div>
        </button>
      </div>

      @if (selected() === 'custom') {
        <div class="custom-fields">
          <label>
            Rows
            <input type="number" min="5" max="30" [(ngModel)]="customRows" />
          </label>
          <label>
            Cols
            <input type="number" min="5" max="40" [(ngModel)]="customCols" />
          </label>
          <label>
            Mines
            <input type="number" min="1" [max]="customRows * customCols - 9" [(ngModel)]="customMines" />
          </label>
        </div>
      }

      <div class="actions">
        <button type="button" class="btn primary" (click)="start()">Start Game</button>
        <button type="button" class="btn ghost" (click)="cancel.emit()">Cancel</button>
      </div>

      <div class="hints">
        <p><strong>Left click</strong> to reveal · <strong>Right click</strong> to flag</p>
        <p><strong>Both buttons</strong> on a number cell to chord-reveal</p>
      </div>
    </div>
  `,
  styleUrl: './settings.component.scss',
})
export class SettingsComponent {
  readonly game = inject(GameService);

  readonly selected = signal<Difficulty>(this.game.difficulty());
  customRows = this.game.config().rows;
  customCols = this.game.config().cols;
  customMines = this.game.config().mines;

  readonly presets: { key: Exclude<Difficulty, 'custom'>; name: string; cfg: typeof DIFFICULTY_PRESETS.beginner }[] = [
    { key: 'beginner', name: 'Beginner', cfg: DIFFICULTY_PRESETS.beginner },
    { key: 'intermediate', name: 'Intermediate', cfg: DIFFICULTY_PRESETS.intermediate },
    { key: 'expert', name: 'Expert', cfg: DIFFICULTY_PRESETS.expert },
  ];

  @Output() start_ = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  select(d: Difficulty): void {
    this.selected.set(d);
  }

  start(): void {
    const d = this.selected();
    if (d === 'custom') {
      this.game.newGame('custom', {
        rows: this.customRows,
        cols: this.customCols,
        mines: this.customMines,
      });
    } else {
      this.game.newGame(d);
    }
    this.start_.emit();
  }
}
