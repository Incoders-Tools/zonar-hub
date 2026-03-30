import { Component, input, output, inject, computed, signal } from '@angular/core';
import { Role } from '../../../../../core/models';
import { RoleFacadeService } from '../role-facade.service';
import { RolesFormComponent } from '../roles-form/roles-form.component';

@Component({
  selector: 'app-roles-form-dialog',
  standalone: true,
  imports: [RolesFormComponent],
  template: `
    <app-roles-form
      [role]="role()"
      [isSubmitting]="isSubmitting()"
      (submitted)="onFormSubmitted($event)"
      (cancelled)="cancelled.emit()">
    </app-roles-form>
  `
})
export class RolesFormDialogComponent {
  private readonly facade = inject(RoleFacadeService);

  readonly role = input<Role | null>(null);
  readonly saving = input(false);
  readonly saved = output<void>();
  readonly cancelled = output<void>();

  readonly isSubmitting = computed(() => this.saving());

  async onFormSubmitted(formData: Partial<Role>): Promise<void> {
    const existingRole = this.role();

    if (existingRole) {
      // Update mode
      const success = await this.facade.updateRole(existingRole.id, formData);
      if (success) {
        this.saved.emit();
      }
    } else {
      // Create mode
      const success = await this.facade.createRole(formData as any);
      if (success) {
        this.saved.emit();
      }
    }
  }
}
