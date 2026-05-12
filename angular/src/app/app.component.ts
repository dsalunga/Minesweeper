import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameService } from './services/game.service';
import { BoardComponent } from './components/board/board.component';
import { HudComponent } from './components/hud/hud.component';
import { SettingsComponent } from './components/settings/settings.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, BoardComponent, HudComponent, SettingsComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="app">
      <header class="app-header">
        <h1 class="logo">
          <span class="logo-icon" aria-hidden="true">
            <svg viewBox="0 0 64 64" width="36" height="36">
              <defs>
                <radialGradient id="bombg" cx="35%" cy="30%" r="70%">
                  <stop offset="0%" stop-color="#9aa3c7" />
                  <stop offset="55%" stop-color="#1a1f3a" />
                  <stop offset="100%" stop-color="#06070f" />
                </radialGradient>
              </defs>
              <circle cx="32" cy="36" r="20" fill="url(#bombg)" />
              <g stroke="#0b1020" stroke-width="3" stroke-linecap="round">
                <line x1="32" y1="10" x2="32" y2="62" />
                <line x1="6" y1="36" x2="58" y2="36" />
              </g>
              <circle cx="24" cy="28" r="4" fill="#fff" opacity="0.85" />
              <path d="M40 12 q4 -6 10 -4" stroke="#ffcc4d" stroke-width="2.5" fill="none" stroke-linecap="round" />
              <circle cx="50" cy="8" r="3" fill="#ff4d6d" />
            </svg>
          </span>
          <span class="logo-text">MINESWEEPER</span>
        </h1>

        <div class="controls">
          <button class="ctl" type="button" (click)="restart()">⟳ Restart</button>
          <button class="ctl primary" type="button" (click)="openSettings()">⚙ New</button>
        </div>
      </header>

      <main class="frame">
        <app-hud (restart)="restart()" />
        <app-board />

        @if (showOverlay()) {
          <div class="overlay" [class.win]="game.status() === 'won'" [class.lose]="game.status() === 'lost'">
            <div class="overlay-card">
              <div class="overlay-emoji">{{ game.status() === 'won' ? '🏆' : '💥' }}</div>
              <h2>{{ game.status() === 'won' ? 'Victory!' : 'Boom!' }}</h2>
              <p>
                {{ game.status() === 'won'
                  ? 'You cleared the field in ' + game.elapsed() + 's.'
                  : 'You hit a mine. Better luck next time!' }}
              </p>
              <div class="overlay-actions">
                <button class="btn primary" type="button" (click)="restart()">Play again</button>
                <button class="btn ghost" type="button" (click)="openSettings()">Change difficulty</button>
              </div>
            </div>
          </div>
        }
      </main>

      <footer class="app-footer">
        <span>Built with Angular · Signals · {{ game.config().rows }}×{{ game.config().cols }} · {{ game.config().mines }} mines</span>
      </footer>

      @if (settingsOpen()) {
        <div class="modal" (click)="closeSettings($event)">
          <div class="modal-content" (click)="$event.stopPropagation()">
            <app-settings (start_)="onStarted()" (cancel)="settingsOpen.set(false)" />
          </div>
        </div>
      }
    </div>
  `,
  styleUrl: './app.component.scss',
})
export class AppComponent {
  readonly game = inject(GameService);
  readonly settingsOpen = signal(true);

  readonly showOverlay = computed(() => {
    const s = this.game.status();
    return s === 'won' || s === 'lost';
  });

  restart(): void {
    this.game.newGame(this.game.difficulty(), this.game.config());
  }

  openSettings(): void {
    this.settingsOpen.set(true);
  }

  closeSettings(_e: MouseEvent): void {
    this.settingsOpen.set(false);
  }

  onStarted(): void {
    this.settingsOpen.set(false);
  }
}
