import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OrgSelectorComponent } from './org-selector.component';
import { ActiveOrganizationService } from '../../../core/services/active-organization.service';
import { signal } from '@angular/core';

describe('OrgSelectorComponent', () => {
  let component: OrgSelectorComponent;
  let fixture: ComponentFixture<OrgSelectorComponent>;

  const first = { id: 'org-1', name: 'First Club' };
  const second = { id: 'org-2', name: 'Second Club' };

  const mockActiveOrgService = {
    activeOrganization: signal<{ id: string; name: string } | null>(null),
    activeOrganizationId: signal<string | null>(null),
    activeOrganizationName: signal(''),
    primaryOrganizationId: signal<string | null>(null),
    manageableOrganizations: signal<{ id: string; name: string }[]>([]),
    primaryEligibleOrganizations: signal<{ id: string; name: string }[]>([]),
    hasMultipleOrganizations: signal(false),
    switchOrganization: jasmine.createSpy('switchOrganization'),
    setPrimaryOrganization: jasmine.createSpy('setPrimaryOrganization').and.resolveTo()
  };

  const element = (): HTMLElement => fixture.nativeElement;

  function setOrganizations(
    organizations: { id: string; name: string }[],
    eligible: { id: string; name: string }[],
    primaryId: string | null,
    activeId: string | null = null
  ): void {
    mockActiveOrgService.manageableOrganizations.set(organizations);
    mockActiveOrgService.primaryEligibleOrganizations.set(eligible);
    mockActiveOrgService.primaryOrganizationId.set(primaryId);
    mockActiveOrgService.activeOrganizationId.set(activeId);
    mockActiveOrgService.hasMultipleOrganizations.set(organizations.length > 1);
    fixture.detectChanges();
  }

  function openDropdown(): void {
    element().querySelector<HTMLButtonElement>('.org-selector__trigger')!.click();
    fixture.detectChanges();
  }

  const optionNames = (): string[] =>
    Array.from(element().querySelectorAll('.org-selector__option-name')).map(node => node.textContent!.trim());

  beforeEach(async () => {
    mockActiveOrgService.activeOrganization.set(null);
    mockActiveOrgService.activeOrganizationId.set(null);
    mockActiveOrgService.activeOrganizationName.set('');
    mockActiveOrgService.primaryOrganizationId.set(null);
    mockActiveOrgService.manageableOrganizations.set([]);
    mockActiveOrgService.primaryEligibleOrganizations.set([]);
    mockActiveOrgService.hasMultipleOrganizations.set(false);
    mockActiveOrgService.switchOrganization.calls.reset();
    mockActiveOrgService.setPrimaryOrganization.calls.reset();

    await TestBed.configureTestingModule({
      imports: [OrgSelectorComponent],
      providers: [{ provide: ActiveOrganizationService, useValue: mockActiveOrgService }]
    }).compileComponents();

    fixture = TestBed.createComponent(OrgSelectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('lists the primary organization first and marks it when several organizations are eligible', () => {
    setOrganizations([second, first], [first, second], first.id);
    openDropdown();

    expect(optionNames()).toEqual([first.name, second.name]);
    const badges = element().querySelectorAll('.org-selector__option-badge');
    expect(badges.length).toBe(1);
    expect(element().querySelectorAll('.org-selector__option')[0].contains(badges[0])).toBeTrue();
  });

  it('hides the primary badge when only one organization is eligible', () => {
    setOrganizations([first, second], [first], first.id);
    openDropdown();

    expect(element().querySelectorAll('.org-selector__option').length).toBe(2);
    expect(element().querySelector('.org-selector__option-badge')).toBeNull();
  });

  it('offers no set-primary action or confirmation even with several eligible organizations', () => {
    setOrganizations([first, second], [first, second], first.id, first.id);
    openDropdown();

    const buttons = Array.from(element().querySelectorAll<HTMLButtonElement>('.org-selector__dropdown button'));
    expect(buttons.length).toBe(2);
    expect(buttons.every(button => button.classList.contains('org-selector__option'))).toBeTrue();
    expect(element().querySelector('.org-selector__set-primary')).toBeNull();

    buttons[1].click();
    fixture.detectChanges();

    expect(element().querySelector('app-confirm-dialog')).toBeNull();
    expect(mockActiveOrgService.setPrimaryOrganization).not.toHaveBeenCalled();
  });

  it('switches the active organization and closes the dropdown on selection', () => {
    setOrganizations([first, second], [first, second], first.id, first.id);
    openDropdown();

    element().querySelectorAll<HTMLButtonElement>('.org-selector__option')[1].click();
    fixture.detectChanges();

    expect(mockActiveOrgService.switchOrganization).toHaveBeenCalledOnceWith(second.id);
    expect(mockActiveOrgService.primaryOrganizationId()).toBe(first.id);
    expect(element().querySelector('.org-selector__dropdown')).toBeNull();
  });

  it('marks the active organization for assistive technology and exposes the expanded state', () => {
    setOrganizations([first, second], [first, second], first.id, second.id);
    const trigger = element().querySelector<HTMLButtonElement>('.org-selector__trigger')!;
    expect(trigger.getAttribute('aria-expanded')).toBe('false');

    openDropdown();

    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    const options = element().querySelectorAll<HTMLButtonElement>('.org-selector__option');
    expect(options[0].getAttribute('aria-current')).toBeNull();
    expect(options[1].getAttribute('aria-current')).toBe('true');
    expect(options[1].type).toBe('button');
  });

  it('does not open the dropdown when only one organization is available', () => {
    setOrganizations([first], [first], first.id, first.id);
    openDropdown();

    expect(element().querySelector('.org-selector__dropdown')).toBeNull();
    expect(element().querySelector('.org-selector__chevron')).toBeNull();
  });

  it('filters organizations by search and shows an empty result state', () => {
    const many = Array.from({ length: 6 }, (_, index) => ({ id: `org-${index}`, name: `Club ${index}` }));
    setOrganizations(many, many, many[0].id);
    openDropdown();

    const search = element().querySelector<HTMLInputElement>('.org-selector__search-input')!;
    expect(search.getAttribute('aria-label')).toBeTruthy();

    component.searchQuery.set('club 3');
    fixture.detectChanges();
    expect(optionNames()).toEqual(['Club 3']);

    component.searchQuery.set('missing');
    fixture.detectChanges();
    expect(element().querySelector('.org-selector__option')).toBeNull();
    expect(element().querySelector('.org-selector__empty')).toBeTruthy();
  });

  it('closes and clears the search when clicking outside', () => {
    const many = Array.from({ length: 6 }, (_, index) => ({ id: `org-${index}`, name: `Club ${index}` }));
    setOrganizations(many, many, many[0].id);
    openDropdown();
    component.searchQuery.set('club');

    document.body.click();
    fixture.detectChanges();

    expect(element().querySelector('.org-selector__dropdown')).toBeNull();
    expect(component.searchQuery()).toBe('');
  });
});
