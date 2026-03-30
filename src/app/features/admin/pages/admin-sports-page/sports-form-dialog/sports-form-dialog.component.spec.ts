import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SportsFormDialogComponent } from './sports-form-dialog.component';
import { SportsFacadeService } from '../sports-facade.service';
import { MockSportRepository } from '../../../../../core/repositories/mock/mock-sport.repository';
import { Sport } from '../../../../../core/models';

describe('SportsFormDialogComponent', () => {
  let component: SportsFormDialogComponent;
  let fixture: ComponentFixture<SportsFormDialogComponent>;
  let facade: SportsFacadeService;

  const mockSport: Sport = {
    id: 'sp1',
    name: 'Pádel',
    key: 'padel',
    icon: '🎾',
    sortOrder: 1,
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SportsFormDialogComponent],
      providers: [SportsFacadeService, MockSportRepository]
    }).compileComponents();

    fixture = TestBed.createComponent(SportsFormDialogComponent);
    component = fixture.componentInstance;
    facade = TestBed.inject(SportsFacadeService);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form in create mode when no sport provided', () => {
    TestBed.runInInjectionContext(() => {
      fixture.componentRef.setInput('sport', null);
    });
    fixture.detectChanges();
    component.ngOnInit();

    expect(component.isEditing).toBe(false);
    expect(component.form.get('name')?.value).toBe('');
  });

  it('should initialize form in edit mode when sport provided', () => {
    TestBed.runInInjectionContext(() => {
      fixture.componentRef.setInput('sport', mockSport);
    });
    fixture.detectChanges();
    component.ngOnInit();

    expect(component.isEditing).toBe(true);
    expect(component.form.get('name')?.value).toBe(mockSport.name);
    expect(component.form.get('key')?.disabled).toBe(true);
  });

  it('should emit cancelled on cancel', () => {
    spyOn(component.cancelled, 'emit');
    component.onCancel();
    expect(component.cancelled.emit).toHaveBeenCalled();
  });

  it('should validate form', () => {
    fixture.detectChanges();
    component.ngOnInit();

    const form = component.form;
    form.get('name')?.setValue('');
    expect(form.valid).toBe(false);

    form.get('name')?.setValue('Tennis');
    form.get('key')?.setValue('tennis');
    expect(form.valid).toBe(true);
  });
});
