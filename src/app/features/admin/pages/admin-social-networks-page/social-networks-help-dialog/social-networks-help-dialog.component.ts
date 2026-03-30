import { Component, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../../../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-social-networks-help-dialog',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  template: `
    <div class="help-dialog-overlay" (click)="onClose()">
      <div class="help-dialog" (click)="$event.stopPropagation()">
        <div class="help-dialog__header">
          <h2>{{ 'admin.social-networks.help.title' | t }}</h2>
          <button class="help-dialog__close" (click)="onClose()">×</button>
        </div>
        <div class="help-dialog__content">
          <h3>{{ 'admin.social-networks.help.section1Title' | t }}</h3>
          <p>{{ 'admin.social-networks.help.section1Text' | t }}</p>
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
      max-width: 500px;
      width: 90%;
      display: flex;
      flex-direction: column;
    }
    .help-dialog__header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.5rem;
      border-bottom: 1px solid #eee;
    }
    .help-dialog__content {
      padding: 1.5rem;
      flex: 1;
    }
    .help-dialog__footer {
      padding: 1.5rem;
      border-top: 1px solid #eee;
      text-align: right;
    }
    .btn-close {
      padding: 0.5rem 1rem;
      background-color: #f5f5f5;
      border: 1px solid #ddd;
      border-radius: 4px;
      cursor: pointer;
    }
  `]
})
export class SocialNetworksHelpDialogComponent {
  readonly closed = output<void>();

  onClose(): void {
    this.closed.emit();
  }
}
