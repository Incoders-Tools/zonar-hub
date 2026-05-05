import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RolesFormComponent } from './roles-form.component';
import { Role } from '../../../../../core/models';

describe('RolesFormComponent', () => {
  let component: RolesFormComponent;
  let fixture: ComponentFixture<RolesFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        RolesFormComponent,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatCheckboxModule,
        MatButtonModule,
        BrowserAnimationsModule
      ],
      providers: [FormBuilder]
    }).compileComponents();

    fixture = TestBed.createComponent(RolesFormComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form in create mode when no role provided', () => {
    fixture.componentRef.setInput('role', null);
    fixture.detectChanges();

    const form = component.form();
    expect(form).toBeTruthy();
    expect(form?.get('name')?.value).toBe('');
    expect(form?.get('description')?.value).toBe('');
    expect(form?.get('isActive')?.value).toBe(true);
  });

  it('should initialize form in edit mode with role data', () => {
    const mockRole: Role = {
      id: 'r1',
      name: 'test_role',
      description: 'Test role description',
      isActive: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    fixture.componentRef.setInput('role', mockRole);
    fixture.detectChanges();

    const form = component.form();
    expect(form?.get('name')?.value).toBe('test_role');
    expect(form?.get('description')?.value).toBe('Test role description');
    expect(form?.get('isActive')?.value).toBe(false);
  });

  it('should disable name field for system roles', () => {
    const systemRole: Role = {
      id: 'r1',
      name: 'admin',
      description: 'Admin role',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    fixture.componentRef.setInput('role', systemRole);
    fixture.detectChanges();

    const nameControl = component.form()?.get('name');
    expect(nameControl?.disabled).toBe(true);
  });

  it('should emit submitted event with form data', () => {
    spyOn(component.submitted, 'emit');

    fixture.componentRef.setInput('role', null);
    fixture.detectChanges();

    const form = component.form();
    form?.patchValue({
      name: 'custom_role',
      description: 'Custom role description',
      isActive: true
    });

    component.onSubmit();

    expect(component.submitted.emit).toHaveBeenCalledWith({
      name: 'custom_role',
      description: 'Custom role description',
      isActive: true
    });
  });

  it('should not submit invalid form', () => {
    spyOn(component.submitted, 'emit');

    fixture.componentRef.setInput('role', null);
    fixture.detectChanges();

    const form = component.form();
    form?.patchValue({
      name: 'a', // Too short
      description: 'short' // Too short
    });

    component.onSubmit();

    expect(component.submitted.emit).not.toHaveBeenCalled();
  });

  it('should emit cancelled event', () => {
    spyOn(component.cancelled, 'emit');

    fixture.componentRef.setInput('role', null);
    fixture.detectChanges();

    component.onCancel();

    expect(component.cancelled.emit).toHaveBeenCalled();
  });
});
