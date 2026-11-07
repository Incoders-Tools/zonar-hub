import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OrganizationFormPanelComponent, OrganizationFormSubmitData } from './organization-form-panel.component';
import { ApiSportRepository } from '../../../../../core/repositories/api/api-sport.repository';
import { Organization, Sport } from '../../../../../core/models';

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

describe('OrganizationFormPanelComponent public profile', () => {
  let fixture: ComponentFixture<OrganizationFormPanelComponent>;
  let emitted: OrganizationFormSubmitData[];

  const organization: Organization = {
    id: 'org-1', tenantId: 'tenant-a', displayName: 'Alpha Circuit', type: 'circuito', isActive: true,
    createdAt: '2026-01-01T00:00:00Z', createdByUserId: 'user-1',
    publicProfileEnabled: false, websiteUrl: 'https://alpha.example.com'
  };

  const LINK_FIELDS = ['websiteUrl', 'instagramUrl', 'facebookUrl', 'tiktokUrl', 'youtubeUrl'] as const;

  async function render(org: Organization | null): Promise<void> {
    const sportRepoSpy = jasmine.createSpyObj<ApiSportRepository>('ApiSportRepository', ['getAll', 'getForOrganization']);
    sportRepoSpy.getAll.and.resolveTo([...catalogSports]);
    sportRepoSpy.getForOrganization.and.resolveTo([catalogSports[0]]);

    await TestBed.configureTestingModule({
      imports: [OrganizationFormPanelComponent],
      providers: [{ provide: ApiSportRepository, useValue: sportRepoSpy }]
    }).compileComponents();

    fixture = TestBed.createComponent(OrganizationFormPanelComponent);
    fixture.componentRef.setInput('organization', org);
    emitted = [];
    fixture.componentInstance.submitted.subscribe(data => emitted.push(data));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  const host = () => fixture.nativeElement as HTMLElement;
  const field = (name: string) => host().querySelector<HTMLInputElement>(`#org-${name}`)!;
  const errorOf = (name: string) => host().querySelector<HTMLElement>(`#org-${name}-error`);
  const consentToggle = () => host().querySelector<HTMLInputElement>('.organization-form-panel__public-profile input[type="checkbox"]')!;
  const submitButton = () => host().querySelector<HTMLButtonElement>('app-async-button button')!;

  function type(name: string, value: string): void {
    const input = field(name);
    input.value = value;
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(new Event('blur'));
    fixture.detectChanges();
  }

  it('shows the consent toggle off by default with translated consent and benefit help', async () => {
    await render(null);

    const section = host().querySelector<HTMLElement>('.organization-form-panel__public-profile')!;
    expect(section).toBeTruthy();
    expect(consentToggle().checked).toBeFalse();
    const help = section.querySelector<HTMLElement>('.organization-form-panel__public-profile-help')!;
    expect(help.textContent!.trim().length).toBeGreaterThan(0);
    expect(section.textContent).not.toContain('admin.organizations');
  });

  it('loads the stored consent and links when editing', async () => {
    await render({ ...organization, publicProfileEnabled: true, whatsappPhone: '+5491122334455' });

    expect(consentToggle().checked).toBeTrue();
    expect(field('websiteUrl').value).toBe('https://alpha.example.com');
    expect(field('whatsappPhone').value).toBe('+5491122334455');
  });

  it('renders the seven link inputs with translated placeholders and helper texts', async () => {
    await render(null);

    for (const name of [...LINK_FIELDS, 'whatsappPhone', 'contactEmail']) {
      expect(field(name)).withContext(name).toBeTruthy();
      expect(field(name).placeholder).withContext(name).not.toContain('admin.organizations');
      expect(field(name).placeholder.length).withContext(name).toBeGreaterThan(0);
      const hint = host().querySelector<HTMLElement>(`#org-${name}-hint`);
      expect(hint?.textContent?.trim().length).withContext(name).toBeGreaterThan(0);
    }
  });

  for (const name of LINK_FIELDS) {
    it(`validates ${name} as an absolute http/https URL`, async () => {
      await render(organization);

      for (const invalid of ['javascript:alert(1)', 'ftp://x', 'www.example.com']) {
        type(name, invalid);
        expect(errorOf(name)).withContext(invalid).toBeTruthy();
        expect(errorOf(name)!.textContent).not.toContain('admin.organizations');
        expect(submitButton().disabled).withContext(invalid).toBeTrue();
      }

      type(name, `https://example.com/${'a'.repeat(500)}`);
      expect(errorOf(name)).withContext('too long').toBeTruthy();

      type(name, 'https://example.com/club');
      expect(errorOf(name)).toBeNull();
      expect(submitButton().disabled).toBeFalse();
    });
  }

  it('validates the contact email', async () => {
    await render(organization);

    for (const invalid of ['hola', 'hola@club', 'ho la@club.com']) {
      type('contactEmail', invalid);
      expect(errorOf('contactEmail')).withContext(invalid).toBeTruthy();
      expect(submitButton().disabled).toBeTrue();
    }

    type('contactEmail', 'hola@club.com');
    expect(errorOf('contactEmail')).toBeNull();
    expect(submitButton().disabled).toBeFalse();
  });

  it('validates the WhatsApp phone as digits with an optional plus', async () => {
    await render(organization);

    for (const invalid of ['54911abc4455', '+54 9 11 2233 4455', '1234567']) {
      type('whatsappPhone', invalid);
      expect(errorOf('whatsappPhone')).withContext(invalid).toBeTruthy();
      expect(submitButton().disabled).toBeTrue();
    }

    type('whatsappPhone', '+5491122334455');
    expect(errorOf('whatsappPhone')).toBeNull();
    expect(submitButton().disabled).toBeFalse();
  });

  it('submits the consent and every profile field', async () => {
    await render(organization);

    consentToggle().click();
    fixture.detectChanges();
    type('websiteUrl', ' https://alpha.example.com/new ');
    type('instagramUrl', 'https://instagram.com/alpha');
    type('whatsappPhone', '+5491122334455');
    type('contactEmail', 'hola@alpha.example.com');
    submitButton().click();

    expect(emitted.length).toBe(1);
    expect(emitted[0]).toEqual(jasmine.objectContaining({
      publicProfileEnabled: true,
      websiteUrl: 'https://alpha.example.com/new',
      instagramUrl: 'https://instagram.com/alpha',
      facebookUrl: '',
      tiktokUrl: '',
      youtubeUrl: '',
      whatsappPhone: '+5491122334455',
      contactEmail: 'hola@alpha.example.com'
    }));
  });
});
