import { Component, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../../../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-tournament-statuses-help-dialog',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  template: `
    <div class="help-dialog-overlay" (click)="onClose()">
      <div class="help-dialog" (click)="$event.stopPropagation()">
        <div class="help-dialog__header">
          <h2>{{ 'admin.tournament-statuses.help.title' | t }}</h2>
          <button class="help-dialog__close" (click)="onClose()">×</button>
        </div>
        <div class="help-dialog__content">
          <h3>{{ 'admin.tournament-statuses.help.section1Title' | t }}</h3>
          <p>{{ 'admin.tournament-statuses.help.section1Text' | t }}</p>

          <h3>{{ 'admin.tournament-statuses.help.section2Title' | t }}</h3>
          <p>{{ 'admin.tournament-statuses.help.section2Text' | t }}</p>

          <h3>{{ 'admin.tournament-statuses.help.section3Title' | t }}</h3>
          <ul>
            <li>{{ 'admin.tournament-statuses.help.section3Item1' | t }}</li>
            <li>{{ 'admin.tournament-statuses.help.section3Item2' | t }}</li>
            <li>{{ 'admin.tournament-statuses.help.section3Item3' | t }}</li>
          </ul>
        </div>
        <div class="help-dialog__footer">
          <button class="btn-close" (click)="onClose()">{{ 'common.close' | t }}</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .help-dialog-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .help-dialog {
      background-color: white;
      border-radius: 8px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
      max-width: 600px;
      width: 90%;
      max-height: 80vh;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
    }

    .help-dialog__header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.5rem;
      border-bottom: 1px solid #eee;

      h2 {
        margin: 0;
        font-size: 1.25rem;
      }
    }

    .help-dialog__close {
      background: none;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
      color: #999;
      padding: 0;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
      transition: all 0.2s;

      &:hover {
        color: #333;
        background-color: #f5f5f5;
      }
    }

    .help-dialog__content {
      padding: 1.5rem;
      flex: 1;
      overflow-y: auto;
      word-wrap: break-word;
      overflow-wrap: break-word;

      h3 {
        font-size: 1rem;
        font-weight: 600;
        margin-top: 1rem;
        margin-bottom: 0.5rem;

        &:first-child {
          margin-top: 0;
        }
      }

      p {
        margin: 0.5rem 0;
        font-size: 0.875rem;
        line-height: 1.5;
        color: #666;
      }

      ul {
        margin: 0.5rem 0;
        padding-left: 1.25rem;

        li {
          font-size: 0.875rem;
          line-height: 1.5;
          margin: 0.25rem 0;
          color: #666;
        }
      }
    }

    .help-dialog__footer {
      padding: 1.5rem;
      border-top: 1px solid #eee;
      display: flex;
      justify-content: flex-end;

      .btn-close {
        padding: 0.5rem 1rem;
        background-color: #f5f5f5;
        border: 1px solid #ddd;
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.875rem;
        font-weight: 500;
        transition: all 0.2s;

        &:hover {
          background-color: #eee;
        }
      }
    }
  `]
})
export class TournamentStatusesHelpDialogComponent {
  readonly closed = output<void>();

  onClose(): void {
    this.closed.emit();
  }
}
