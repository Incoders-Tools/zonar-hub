import { Component, inject, input, output, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { TranslatePipe } from '../../../../../shared/pipes/translate.pipe';
import { FormShellComponent } from '../../../../../shared/components/form-shell/form-shell.component';
import { AsyncButtonComponent } from '../../../../../shared/components/async-button/async-button.component';
import { SocialNetwork } from '../../../../../core/models';
import { SocialNetworksFacadeService } from '../social-networks-facade.service';

@Component({
  selector: 'app-social-networks-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatInputModule,
    MatCheckboxModule,
    TranslatePipe,
    FormShellComponent,
    AsyncButtonComponent
  ],
  templateUrl: './social-networks-form-dialog.component.html',
  styleUrl: './social-networks-form-dialog.component.scss'
})
export class SocialNetworksFormDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly facade = inject(SocialNetworksFacadeService);

  readonly network = input<SocialNetwork | null>(null);
  readonly saving = input(false);

  readonly saved = output<void>();
  readonly cancelled = output<void>();

  form!: FormGroup;
  isEditing = false;
  submitted = false;

  ngOnInit(): void {
    this.initializeForm();
    this.populateForm();
  }

  private initializeForm(): void {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.pattern(/^[a-zA-Z\s]+$/)]],
      key: ['', [Validators.required, Validators.pattern(/^[a-z_]+$/)]],
      url: ['', [Validators.pattern(/^https?:\/\//)]],
      description: [''],
      faIcon: [''],
      sortOrder: ['', [Validators.min(0)]],
      isActive: [true]
    });
  }

  private populateForm(): void {
    const network = this.network();
    if (network) {
      this.isEditing = true;
      this.form.patchValue({
        name: network.name,
        key: network.key,
        url: network.url || '',
        description: network.description || '',
        faIcon: network.faIcon || '',
        sortOrder: network.sortOrder || '',
        isActive: network.isActive
      });
      this.form.get('key')?.disable();
    } else {
      this.isEditing = false;
      const nextOrder = this.facade.getNextSortOrder();
      this.form.patchValue({
        sortOrder: nextOrder,
        isActive: true
      });
    }
  }

  async onSave(): Promise<void> {
    this.submitted = true;

    if (!this.form.valid) {
      return;
    }

    const keyValue = this.isEditing ? this.form.get('key')?.value : this.form.get('key')?.getRawValue();
    const formValue = this.form.getRawValue();

    if (!this.isEditing) {
      const keyExists = await this.facade.checkKeyExists(keyValue);
      if (keyExists) {
        this.form.get('key')?.setErrors({ keyExists: true });
        return;
      }
    }

    const nameExists = await this.facade.checkNameExists(formValue.name, this.network()?.id);
    if (nameExists) {
      this.form.get('name')?.setErrors({ nameExists: true });
      return;
    }

    const sortOrderExists = await this.facade.checkSortOrderExists(
      formValue.sortOrder ? Number(formValue.sortOrder) : null,
      this.network()?.id
    );
    if (sortOrderExists) {
      this.form.get('sortOrder')?.setErrors({ sortOrderExists: true });
      return;
    }

    const payload = this.isEditing
      ? {
          ...this.network(),
          ...formValue
        }
      : formValue;

    const success = await this.facade.saveNetwork(payload);
    if (success) {
      this.saved.emit();
    }
  }

  onCancel(): void {
    this.cancelled.emit();
  }

  getErrorMessage(controlName: string): string {
    const control = this.form.get(controlName);
    if (!control || !this.submitted || !control.errors) {
      return '';
    }

    if (control.errors['required']) {
      return `admin.social-networks.error.${controlName}Required`;
    }
    if (control.errors['pattern']) {
      return `admin.social-networks.error.${controlName}Invalid`;
    }
    if (control.errors['min']) {
      return 'admin.social-networks.error.sortOrderMin';
    }
    if (control.errors['keyExists']) {
      return 'admin.social-networks.error.keyExists';
    }
    if (control.errors['nameExists']) {
      return 'admin.social-networks.error.nameExists';
    }
    if (control.errors['sortOrderExists']) {
      return 'admin.social-networks.error.sortOrderExists';
    }

    return 'admin.social-networks.error.invalid';
  }

  isFieldInvalid(controlName: string): boolean {
    const control = this.form.get(controlName);
    return this.submitted && control?.invalid || false;
  }
}
