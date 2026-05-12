import { ChangeDetectionStrategy, Component, EventEmitter, Output, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameService } from '../../services/game.service';

@Component({
  selector: 'app-hud',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="hud">
      <div class="counter mines" title="Mines remaining">
        <span class="counter-icon">⚑</span>
        <span class="counter-value">{{ pad(game.minesRemaining(), 3) }}</span>
      </div>

      <button
        class="face"
        type="button"
        [class.face-playing]="game.status() === 'playing' || game.status() === 'idle'"
        [class.face-won]="game.status() === 'won'"
        [class.face-lost]="game.status() === 'lost'"
        (click)="restart.emit()"
        title="New game"
      >
        <span class="face-emoji">{{ faceEmoji() }}</span>
      </button>

      <div class="counter timer" title="Elapsed time">
        <span class="counter-icon">⏱</span>
        <span class="counter-value">{{ pad(game.elapsed(), 3) }}</span>
      </div>
    </div>
  `,
  styleUrl: './hud.component.scss',
})
export class HudComponent {
  readonly game = inject(GameService);
  @Output() restart = new EventEmitter<void>();

  readonly faceEmoji = computed(() => {
    switch (this.game.status()) {
      case 'won':
        return '😎';
      case 'lost':
        return '💀';
      default:
        return '🙂';
    }
  });

  pad(n: number, width: number): string {
    return Math.max(0, Math.min(999, n)).toString().padStart(width, '0');
  }
}
