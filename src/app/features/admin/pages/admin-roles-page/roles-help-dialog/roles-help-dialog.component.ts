import { Component, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from '../../../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-roles-help-dialog',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, TranslatePipe],
  template: `
    <div class="help-overlay" (click)="onClose()" role="dialog">
      <div class="help-dialog" (click)="$event.stopPropagation()">
        <div class="help-dialog__header">
          <h2 class="help-dialog__title">{{ 'admin.roles.help.title' | t }}</h2>
          <button class="help-dialog__close" (click)="onClose()" [attr.aria-label]="'common.close' | t">
            <mat-icon>close</mat-icon>
          </button>
        </div>
        <div class="help-dialog__content">
          <p>{{ 'admin.roles.help.description' | t }}</p>
          <h3>{{ 'admin.roles.help.systemRoles' | t }}</h3>
          <p>{{ 'admin.roles.help.systemRolesDescription' | t }}</p>
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
      background-color: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }
    .help-dialog {
      background: white;
      border-radius: 8px;
      max-width: 500px;
      max-height: 80vh;
      overflow-y: auto;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
    }
    .help-dialog__header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px;
      border-bottom: 1px solid #e0e0e0;
    }
    .help-dialog__title {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
    }
    .help-dialog__close {
      background: none;
      border: none;
      cursor: pointer;
      padding: 0;
    }
    .help-dialog__content {
      padding: 20px;
    }
    .help-dialog__content p {
      margin: 12px 0;
      line-height: 1.6;
    }
    .help-dialog__content h3 {
      margin: 16px 0 8px 0;
      font-size: 14px;
      font-weight: 600;
    }
  `]
})
export class RolesHelpDialogComponent {
  readonly closed = output<void>();

  onClose(): void {
    this.closed.emit();
  }
}
