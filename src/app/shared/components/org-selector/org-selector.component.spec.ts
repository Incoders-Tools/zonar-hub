import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OrgSelectorComponent } from './org-selector.component';
import { ActiveOrganizationService } from '../../../core/services/active-organization.service';
import { computed, signal } from '@angular/core';
import { AuthService } from '../../../core/auth/auth.service';
import { NotificationService } from '../../../core/services/notification.service';

describe('OrgSelectorComponent', () => {
  let component: OrgSelectorComponent;
  let fixture: ComponentFixture<OrgSelectorComponent>;

  const mockActiveOrgService = {
    activeOrganization: signal(null),
    activeOrganizationId: signal(null),
    activeOrganizationName: signal(''),
    primaryOrganizationId: signal<string | null>(null),
    manageableOrganizations: signal<{ id: string; name: string }[]>([]),
    primaryEligibleOrganizations: signal<{ id: string; name: string }[]>([]),
    hasMultipleOrganizations: signal(false),
    switchOrganization: jasmine.createSpy('switchOrganization'),
    setPrimaryOrganization: jasmine.createSpy('setPrimaryOrganization').and.resolveTo()
  };

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
    mockActiveOrgService.setPrimaryOrganization.and.resolveTo();

    await TestBed.configureTestingModule({
      imports: [OrgSelectorComponent],
      providers: [
        { provide: ActiveOrganizationService, useValue: mockActiveOrgService },
        { provide: AuthService, useValue: { isAdmin: signal(true) } },
        { provide: NotificationService, useValue: { success: jasmine.createSpy('success'), error: jasmine.createSpy('error') } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(OrgSelectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('shows the server primary first and keeps switch separate from set-primary', () => {
    mockActiveOrgService.manageableOrganizations.set([
      { id: 'org-2', name: 'Second' }, { id: 'org-1', name: 'First' }
    ] as never);
    mockActiveOrgService.primaryOrganizationId.set('org-1' as never);
    mockActiveOrgService.hasMultipleOrganizations.set(true);
    mockActiveOrgService.primaryEligibleOrganizations.set([
      { id: 'org-1', name: 'First' }, { id: 'org-2', name: 'Second' }
    ]);
    fixture.detectChanges();
    component.toggle();
    fixture.detectChanges();
    expect(component.organizations().map(org => org.id)).toEqual(['org-1', 'org-2']);
    expect(fixture.nativeElement.querySelectorAll('.org-selector__set-primary').length).toBe(1);
    component.requestPrimary('org-2');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-confirm-dialog')).toBeTruthy();
    expect(mockActiveOrgService.switchOrganization).not.toHaveBeenCalled();
    expect(mockActiveOrgService.setPrimaryOrganization).not.toHaveBeenCalled();
  });

  it('does not offer primary on unassigned organizations and hides the badge for one assignment', () => {
    mockActiveOrgService.manageableOrganizations.set([
      { id: 'org-1', name: 'First' }, { id: 'org-2', name: 'Second' }
    ]);
    mockActiveOrgService.primaryEligibleOrganizations.set([{ id: 'org-1', name: 'First' }]);
    mockActiveOrgService.primaryOrganizationId.set('org-1');
    mockActiveOrgService.hasMultipleOrganizations.set(true);
    component.toggle();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.org-selector__set-primary').length).toBe(0);
    expect(fixture.nativeElement.querySelectorAll('.org-selector__option-badge').length).toBe(0);
    component.requestPrimary('org-2');
    expect(component.pendingPrimaryId()).toBeNull();
  });

  it('saves an eligible first primary without showing replacement confirmation', async () => {
    mockActiveOrgService.primaryEligibleOrganizations.set([
      { id: 'org-1', name: 'First' }, { id: 'org-2', name: 'Second' }
    ]);
    component.requestPrimary('org-2');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-confirm-dialog')).toBeNull();
    expect(component.pendingPrimaryId()).toBeNull();
    expect(mockActiveOrgService.setPrimaryOrganization).toHaveBeenCalledOnceWith('org-2');
    await fixture.whenStable();
    expect(TestBed.inject(NotificationService).success).toHaveBeenCalledWith('org.selector.primarySuccess');
  });

  it('requires confirmation to replace a primary and cancellation preserves it', () => {
    mockActiveOrgService.primaryEligibleOrganizations.set([
      { id: 'org-1', name: 'First' }, { id: 'org-2', name: 'Second' }
    ]);
    mockActiveOrgService.primaryOrganizationId.set('org-1');
    component.requestPrimary('org-2');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-confirm-dialog')).toBeTruthy();
    expect(mockActiveOrgService.setPrimaryOrganization).not.toHaveBeenCalled();
    component.pendingPrimaryId.set(null);
    expect(mockActiveOrgService.primaryOrganizationId()).toBe('org-1');
    expect(mockActiveOrgService.setPrimaryOrganization).not.toHaveBeenCalled();
  });

  it('reports first-primary save failure without changing the primary', async () => {
    mockActiveOrgService.primaryEligibleOrganizations.set([
      { id: 'org-1', name: 'First' }, { id: 'org-2', name: 'Second' }
    ]);
    mockActiveOrgService.setPrimaryOrganization.and.rejectWith(new Error('failed'));
    component.requestPrimary('org-2');
    await fixture.whenStable();
    expect(mockActiveOrgService.primaryOrganizationId()).toBeNull();
    expect(TestBed.inject(NotificationService).error).toHaveBeenCalledWith('org.selector.primaryError');
  });

  it('retains the old primary after a failed save', async () => {
    mockActiveOrgService.primaryEligibleOrganizations.set([
      { id: 'org-1', name: 'First' }, { id: 'org-2', name: 'Second' }
    ]);
    mockActiveOrgService.hasMultipleOrganizations.set(true);
    mockActiveOrgService.primaryOrganizationId.set('org-1' as never);
    mockActiveOrgService.setPrimaryOrganization.and.rejectWith(new Error('failed'));
    component.requestPrimary('org-2');
    await component.confirmPrimary();
    expect(mockActiveOrgService.primaryOrganizationId()).toBe('org-1');
    expect(component.pendingPrimaryId()).toBe('org-2');
    expect(TestBed.inject(NotificationService).error).toHaveBeenCalledWith('org.selector.primaryError');
  });
});
