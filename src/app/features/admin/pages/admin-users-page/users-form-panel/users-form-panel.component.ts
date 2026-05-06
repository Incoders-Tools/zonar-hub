import { Component, input, output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '../../../../../shared/pipes/translate.pipe';
import { PhoneInputComponent } from '../../../../../shared/components/phone-input/phone-input.component';
import { ActiveToggleComponent } from '../../../../../shared/components/active-toggle/active-toggle.component';
import { AdminUser } from '../../../../../core/models/admin-user.model';
import { UsersFacadeService } from '../users-facade.service';

@Component({
  selector: 'app-users-form-panel',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslatePipe,
    PhoneInputComponent,
    ActiveToggleComponent
  ],
  template: `
    <div class="form-overlay" (click)="close()">
      <div class="form-panel" (click)="$event.stopPropagation()">
        <div class="form-panel__header">
          <h2 class="form-panel__title">
            {{ editingUser() ? ('admin.users.form.edit' | t) : ('admin.users.form.create' | t) }}
          </h2>
          <button class="form-panel__close" (click)="close()">&times;</button>
        </div>
        <div class="form-panel__body">
          <div class="form-group">
            <label>{{ 'admin.users.form.email' | t }}</label>
            <input type="email" [(ngModel)]="formData.email" [disabled]="!!editingUser()" placeholder="user@example.com" />
          </div>
          <div class="form-group">
            <label>{{ 'admin.users.form.fullName' | t }}</label>
            <input type="text" [(ngModel)]="formData.fullName" placeholder="John Doe" />
          </div>
          <div class="form-group">
            <label>{{ 'admin.users.form.phone' | t }}</label>
            <app-phone-input [(ngModel)]="formData.phone" name="phone"></app-phone-input>
          </div>
          <div class="form-group">
            <label>{{ 'admin.users.form.role' | t }}</label>
            <select [(ngModel)]="formData.roleId">
              <option value="">{{ 'common.select' | t }}</option>
              <option value="role001">{{ 'admin.users.role.systemAdmin' | t }}</option>
              <option value="role002">{{ 'admin.users.role.admin' | t }}</option>
              <option value="role003">{{ 'admin.users.role.viewer' | t }}</option>
              <option value="role004">{{ 'admin.users.role.editor' | t }}</option>
            </select>
          </div>
          <div class="form-group">
            <app-active-toggle
              [value]="formData.isActive"
              mode="toggle"
              (toggled)="formData.isActive = $event">
            </app-active-toggle>
          </div>
        </div>
        <div class="form-panel__footer">
          <button class="form-panel__cancel" (click)="close()">{{ 'common.cancel' | t }}</button>
          <button class="form-panel__submit" (click)="submit()">{{ 'common.save' | t }}</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .form-overlay {
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

    .form-panel {
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

        .form-group {
          margin-bottom: 16px;

          label {
            display: block;
            margin-bottom: 8px;
            font-weight: 500;
            font-size: 14px;
          }

          input, select {
            width: 100%;
            padding: 8px 12px;
            border: 1px solid #ccc;
            border-radius: 4px;
            font-size: 14px;

            &:disabled {
              background-color: #f5f5f5;
              cursor: not-allowed;
            }
          }
        }
      }

      &__footer {
        padding: 16px 24px;
        border-top: 1px solid #e0e0e0;
        display: flex;
        justify-content: flex-end;
        gap: 8px;

        button {
          padding: 8px 16px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
        }
      }

      &__cancel {
        background: #f0f0f0;
        color: #333;

        &:hover {
          background: #e0e0e0;
        }
      }

      &__submit {
        background: #1976d2;
        color: white;

        &:hover {
          background: #1565c0;
        }
      }
    }
  `]
})
export class UsersFormPanelComponent {
  readonly editingUser = input<AdminUser | null>(null);
  readonly closed = output<void>();

  protected facade = inject(UsersFacadeService);

  protected formData = {
    email: '',
    fullName: '',
    phone: '',
    roleId: '',
    isActive: true
  };

  submit(): void {
    // TODO: Implement submit logic
    this.close();
  }

  close(): void {
    this.closed.emit();
  }
}

