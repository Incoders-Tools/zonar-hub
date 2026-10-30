import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OrganizationFormPanelComponent } from './organization-form-panel.component';
import { ApiSportRepository } from '../../../../../core/repositories/api/api-sport.repository';
import { Sport } from '../../../../../core/models';

const catalogSports: Sport[] = [
  { id: 'sp1', name: 'Pádel', key: 'padel', icon: 'padel', iconSource: 'svg', modalityIds: [], sortOrder: 1, isActive: true, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
  { id: 'sp2', name: 'Fútbol', key: 'futbol', icon: '⚽', iconSource: 'unicode', modalityIds: [], sortOrder: 2, isActive: true, createdAt: '2024-01-01', updatedAt: '2024-01-01' }
];

describe('OrganizationFormPanelComponent', () => {
  let fixture: ComponentFixture<OrganizationFormPanelComponent>;
  let sportRepoSpy: jasmine.SpyObj<ApiSportRepository>;

  beforeEach(async () => {
    sportRepoSpy = jasmine.createSpyObj<ApiSportRepository>('ApiSportRepository', ['getAll', 'getForOrganization']);
    sportRepoSpy.getAll.and.resolveTo([...catalogSports]);
    sportRepoSpy.getForOrganization.and.resolveTo([]);

    await TestBed.configureTestingModule({
      imports: [OrganizationFormPanelComponent],
      providers: [{ provide: ApiSportRepository, useValue: sportRepoSpy }]
    }).compileComponents();

    fixture = TestBed.createComponent(OrganizationFormPanelComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  function sportOptions(): HTMLElement[] {
    return Array.from((fixture.nativeElement as HTMLElement).querySelectorAll<HTMLElement>('.organization-form-panel__sport-option'));
  }

  it('lists every active catalog sport as a selectable option', () => {
    expect(sportOptions().map(option => option.textContent?.trim())).toEqual([
      jasmine.stringContaining('Pádel'),
      jasmine.stringContaining('Fútbol')
    ]);
  });

  it('renders the padel paddle drawing for an svg-source sport instead of its key', () => {
    const [padel] = sportOptions();

    expect(padel.querySelector('img.sport-icon--svg')?.getAttribute('src')).toBe('uploads/sports-icons/padel.svg');
    expect(padel.textContent).not.toContain('padel');
  });

  it('renders the emoji for a unicode-source sport', () => {
    const [, futbol] = sportOptions();

    expect(futbol.querySelector('.sport-icon--unicode')?.textContent?.trim()).toBe('⚽');
    expect(futbol.querySelector('img')).toBeNull();
  });

  it('marks a sport option as active when the operator selects it', () => {
    const [padel] = sportOptions();

    padel.click();
    fixture.detectChanges();

    expect(padel.classList).toContain('organization-form-panel__sport-option--active');
  });
});
