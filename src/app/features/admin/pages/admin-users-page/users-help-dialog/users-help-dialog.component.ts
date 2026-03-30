import { Component, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { TranslatePipe } from '../../../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-users-help-dialog',
  standalone: true,
  imports: [CommonModule, MatButtonModule, TranslatePipe],
  template: `
    <div class="help-overlay" (click)="close()">
      <div class="help-dialog" (click)="$event.stopPropagation()">
        <div class="help-dialog__header">
          <h2 class="help-dialog__title">{{ 'admin.users.help.title' | t }}</h2>
          <button class="help-dialog__close" (click)="close()">&times;</button>
        </div>
        <div class="help-dialog__body">
          <p>{{ 'admin.users.help.description' | t }}</p>
          <div class="help-dialog__section">
            <h3>{{ 'admin.users.help.roles' | t }}</h3>
            <ul>
              <li><strong>{{ 'admin.users.role.systemAdmin' | t }}:</strong> {{ 'admin.users.help.roleSystemAdmin' | t }}</li>
              <li><strong>{{ 'admin.users.role.admin' | t }}:</strong> {{ 'admin.users.help.roleAdmin' | t }}</li>
              <li><strong>{{ 'admin.users.role.viewer' | t }}:</strong> {{ 'admin.users.help.roleViewer' | t }}</li>
            </ul>
          </div>
        </div>
        <div class="help-dialog__footer">
          <button (mat-raised-button)="true" color="primary" (click)="close()">{{ 'common.close' | t }}</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .help-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .help-dialog {
      background: white;
      border-radius: 8px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
      max-width: 500px;
      width: 90%;
      max-height: 80vh;
      overflow-y: auto;

      &__header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 24px;
        border-bottom: 1px solid #e0e0e0;
      }

      &__title {
        margin: 0;
        font-size: 20px;
        font-weight: 600;
      }

      &__close {
        background: none;
        border: none;
        font-size: 24px;
        cursor: pointer;
        color: #666;

        &:hover {
          color: #000;
        }
      }

      &__body {
        padding: 24px;
        font-size: 14px;
        line-height: 1.6;
        color: #333;

        p {
          margin: 0 0 16px 0;
        }
      }

      &__section {
        margin-top: 16px;

        h3 {
          margin: 0 0 12px 0;
          font-size: 15px;
          font-weight: 600;
        }

        ul {
          margin: 0;
          padding-left: 20px;

          li {
            margin: 8px 0;
          }
        }
      }

      &__footer {
        padding: 16px 24px;
        border-top: 1px solid #e0e0e0;
        display: flex;
        justify-content: flex-end;
        gap: 8px;
      }
    }
  `]
})
export class UsersHelpDialogComponent {
  readonly closed = output<void>();

  close(): void {
    this.closed.emit();
  }
}

