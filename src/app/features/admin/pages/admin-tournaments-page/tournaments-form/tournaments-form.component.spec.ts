import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TournamentsFormComponent } from './tournaments-form.component';
import { TournamentsFacadeService } from '../tournaments-facade.service';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MockTournamentAdminRepository } from '../../../../../core/repositories/mock/mock-tournament-admin.repository';
import { ApiComplexRepository } from '../../../../../core/repositories/api/api-complex.repository';
import { ApiCategoryRepository } from '../../../../../core/repositories/api/api-category.repository';
import { ApiGenderRepository } from '../../../../../core/repositories/api/api-gender.repository';
import { MockTournamentTypeRepository } from '../../../../../core/repositories/tournament-admin.repository';
import { API_BASE_URL } from '../../../../../core/config/api-base-url.token';
import { Tournament } from '../../../../../core/models';

describe('TournamentsFormComponent', () => {
  let component: TournamentsFormComponent;
  let fixture: ComponentFixture<TournamentsFormComponent>;
  let facade: TournamentsFacadeService;

  const mockTournament: Tournament = {
    id: 't1',
    name: 'Copa Primavera 2026',
    complexId: 'cx1',
    complexName: 'Club Padel Norte',
    categoryId: 'cat1',
    categoryName: '4ta',
    genderId: 'g1',
    genderLabel: 'Masculino',
    tournamentTypeId: 'tt1',
    tournamentTypeName: 'Zonas + Eliminación',
    sportId: 'sp1',
    sportName: 'Padel',
    statusId: 'ts2',
    statusLabel: 'Inscripción abierta',
    startDate: '2026-04-15',
    endDate: '2026-04-20',
    registrationStartDate: '2026-03-01',
    registrationEndDate: '2026-04-10',
    maxPairs: 32,
    description: 'Test description',
    rules: 'Test rules',
    createdAt: '2026-02-15',
    isActive: true
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TournamentsFormComponent, NoopAnimationsModule],
      providers: [
        TournamentsFacadeService,
        MockTournamentAdminRepository,
        ApiComplexRepository,
        ApiCategoryRepository,
        ApiGenderRepository,
        MockTournamentTypeRepository,
        { provide: API_BASE_URL, useValue: 'http://localhost/api' },
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TournamentsFormComponent);
    component = fixture.componentInstance;
    facade = TestBed.inject(TournamentsFacadeService);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form in create mode when no tournament provided', () => {
    fixture.componentRef.setInput('tournament', null);
    fixture.detectChanges();
    component.ngOnInit();

    expect(component.isEditing).toBe(false);
    expect(component.form.get('name')?.value).toBe('');
  });

  it('should initialize form in edit mode when tournament provided', () => {
    fixture.componentRef.setInput('tournament', mockTournament);
    fixture.detectChanges();
    component.ngOnInit();

    expect(component.isEditing).toBe(true);
    expect(component.form.get('name')?.value).toBe(mockTournament.name);
    expect(component.form.get('key')?.disabled).toBe(true);
  });

  it('should emit cancelled on cancel', () => {
    spyOn(component.cancelled, 'emit');
    component.onCancel();
    expect(component.cancelled.emit).toHaveBeenCalled();
  });

  it('should validate required fields', () => {
    fixture.detectChanges();
    component.ngOnInit();

    const form = component.form;
    form.get('name')?.setValue('');
    form.get('complexId')?.setValue('');
    form.get('tournamentTypeId')?.setValue('');
    form.get('startDate')?.setValue('');
    form.get('endDate')?.setValue('');
    form.get('maxPairs')?.setValue('');
    expect(form.valid).toBe(false);

    form.get('name')?.setValue('Test Tournament');
    form.get('complexId')?.setValue('cx1');
    form.get('tournamentTypeId')?.setValue('tt1');
    form.get('startDate')?.setValue('2026-06-01');
    form.get('endDate')?.setValue('2026-06-10');
    form.get('maxPairs')?.setValue(16);
    expect(form.valid).toBe(true);
  });

  it('should validate maxPairs minimum value', () => {
    fixture.detectChanges();
    component.ngOnInit();

    component.form.get('maxPairs')?.setValue(1);
    expect(component.form.get('maxPairs')?.errors?.['min']).toBeTruthy();

    component.form.get('maxPairs')?.setValue(2);
    expect(component.form.get('maxPairs')?.errors).toBeNull();
  });

  it('should fix i18n pipe precedence — isFieldInvalid returns correct value', () => {
    fixture.detectChanges();
    component.ngOnInit();
    component.submitted = false;
    expect(component.isFieldInvalid('name')).toBe(false);
    component.submitted = true;
    component.form.get('name')?.setValue('');
    expect(component.isFieldInvalid('name')).toBe(true);
  });

  it('should compute status with i18n label keys', () => {
    const status = facade.computeStatus('2020-01-01', '2020-12-31');
    expect(status.key).toBe('finished');
    expect(status.labelKey).toBe('admin.tournaments.status.finished');
  });

  it('should derive lookup options from facade', async () => {
    await facade.load();
    fixture.detectChanges();
    expect(component.complexOptions().length).toBeGreaterThan(0);
    expect(component.tournamentTypeOptions().length).toBeGreaterThan(0);
  });
});
