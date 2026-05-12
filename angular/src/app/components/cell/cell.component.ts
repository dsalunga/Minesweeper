import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Cell } from '../../engine/minesweeper';

@Component({
  selector: 'app-cell',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      type="button"
      class="cell"
      [class.revealed]="cell.state === 'revealed'"
      [class.hidden]="cell.state === 'hidden'"
      [class.flagged]="cell.state === 'flagged'"
      [class.questioned]="cell.state === 'questioned'"
      [class.mine]="cell.state === 'revealed' && cell.mine"
      [class.exploded]="cell.exploded"
      [class.wrong-flag]="cell.wrongFlag"
      [attr.data-n]="cell.state === 'revealed' && !cell.mine ? cell.adjacent : null"
      (click)="onClick($event)"
      (contextmenu)="onContext($event)"
      (mousedown)="onMouseDown($event)"
      (mouseup)="onMouseUp($event)"
      (mouseleave)="onMouseLeave()"
    >
      <ng-container [ngSwitch]="display">
        <span *ngSwitchCase="'wrong'" class="icon wrong" aria-label="Wrong flag">✕</span>
        <span *ngSwitchCase="'flag'" class="icon flag" aria-label="Flag">⚑</span>
        <span *ngSwitchCase="'question'" class="icon question" aria-label="Maybe mine">?</span>
        <span *ngSwitchCase="'mine'" class="icon mine-icon" aria-label="Mine">
          <svg viewBox="0 0 24 24" width="60%" height="60%" aria-hidden="true">
            <defs>
              <radialGradient id="g" cx="35%" cy="30%" r="70%">
                <stop offset="0%" stop-color="#7a86b3" />
                <stop offset="60%" stop-color="#1a1f3a" />
                <stop offset="100%" stop-color="#06070f" />
              </radialGradient>
            </defs>
            <g>
              <circle cx="12" cy="13" r="6.5" fill="url(#g)" />
              <g stroke="#0d1230" stroke-width="1.4" stroke-linecap="round">
                <line x1="12" y1="3" x2="12" y2="22" />
                <line x1="3" y1="13" x2="21" y2="13" />
                <line x1="5.5" y1="6.5" x2="18.5" y2="19.5" />
                <line x1="18.5" y1="6.5" x2="5.5" y2="19.5" />
              </g>
              <circle cx="9.5" cy="10.5" r="1.6" fill="#ffffff" opacity="0.85" />
            </g>
          </svg>
        </span>
        <span *ngSwitchCase="'number'" class="num" [attr.data-n]="cell.adjacent">{{ cell.adjacent }}</span>
        <span *ngSwitchDefault></span>
      </ng-container>
    </button>
  `,
  styleUrl: './cell.component.scss',
})
export class CellComponent {
  @Input({ required: true }) cell!: Cell;
  /** When true, the cell was wrongly flagged and the game ended. */
  @Input() wrongFlag = false;
  /** Disabled (game over) — still allow context for visual flicker prevention. */
  @Input() disabled = false;

  @Output() reveal = new EventEmitter<void>();
  @Output() flag = new EventEmitter<void>();
  @Output() chord = new EventEmitter<void>();

  private leftDown = false;
  private rightDown = false;

  get display(): 'flag' | 'question' | 'mine' | 'number' | 'empty' | 'wrong' {
    const c = this.cell;
    if (c.wrongFlag) return 'wrong';
    if (c.state === 'flagged') return 'flag';
    if (c.state === 'questioned') return 'question';
    if (c.state === 'revealed') {
      if (c.mine) return 'mine';
      if (c.adjacent > 0) return 'number';
      return 'empty';
    }
    return 'empty';
  }

  onClick(e: MouseEvent): void {
    if (this.disabled) return;
    if (this.cell.state === 'revealed') return;
    e.preventDefault();
    this.reveal.emit();
  }

  onContext(e: MouseEvent): void {
    e.preventDefault();
    if (this.disabled) return;
    this.flag.emit();
  }

  onMouseDown(e: MouseEvent): void {
    if (this.disabled) return;
    if (e.button === 0) this.leftDown = true;
    if (e.button === 2) this.rightDown = true;
    if (this.leftDown && this.rightDown && this.cell.state === 'revealed') {
      this.chord.emit();
    }
  }

  onMouseUp(e: MouseEvent): void {
    if (e.button === 0) this.leftDown = false;
    if (e.button === 2) this.rightDown = false;
  }

  onMouseLeave(): void {
    this.leftDown = false;
    this.rightDown = false;
  }
}
