import { ComponentFixture, TestBed } from '@angular/core/testing';
import { computed, signal } from '@angular/core';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { AdminOrganizationsPageComponent } from './admin-organizations-page.component';
import { AuthService } from '../../../../core/auth/auth.service';
import { Organization, Tenant, User } from '../../../../core/models';
import { ApiOrganizationRepository } from '../../../../core/repositories/api/api-organization.repository';
import { ApiSportRepository } from '../../../../core/repositories/api/api-sport.repository';
import { ActiveOrganizationService } from '../../../../core/services/active-organization.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { ZhCollectionViewComponent } from '../../../../shared/components/zh-collection-view/zh-collection-view.component';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';

const now = '2026-01-01T00:00:00.000Z';

const organizations: Organization[] = [
  { id: 'org-1', tenantId: 'tenant-a', displayName: 'Alpha Circuit', type: 'circuito', isActive: true, createdAt: now, createdByUserId: 'user-1' },
  { id: 'org-2', tenantId: 'tenant-a', displayName: 'Beta Academy', type: 'academia', isActive: true, createdAt: now, createdByUserId: 'user-1' },
  { id: 'org-3', tenantId: 'tenant-a', displayName: 'Gamma Brand', type: 'marca', isActive: true, createdAt: now, createdByUserId: 'user-1' }
];

const toTenant = (org: Organization): Tenant => ({
  id: org.id, name: org.displayName, key: org.id, contactEmail: 'admin@example.com',
  planId: 'plan-1', planType: 'starter', isActive: org.isActive, createdAt: org.createdAt
});

class AuthServiceStub {
  readonly user = signal<User>({
    id: 'user-1', email: 'admin@example.com', fullName: 'Admin User', roleId: 'role002', role: 'admin',
    isActive: true, tenantId: 'tenant-a', tenantIds: ['org-1', 'org-2'], organizationId: 'org-1', createdAt: now
  });
  readonly currentUser = computed(() => this.user());
  readonly isAdmin = computed(() => this.user().role === 'admin' || this.user().role === 'system_admin');
}

class ActiveOrganizationServiceStub {
  readonly organizationChanged = signal(0);
  readonly activeOrganizationId = signal<string | null>('org-1');
  readonly primaryId = signal<string | null>('org-1');
  readonly primaryOrganizationId = this.primaryId.asReadonly();
  readonly eligible = signal<Tenant[]>([toTenant(organizations[0]), toTenant(organizations[1])]);
  readonly primaryEligibleOrganizations = this.eligible.asReadonly();
  readonly switchOrganization = jasmine.createSpy('switchOrganization');
  readonly refreshOrganizations = jasmine.createSpy('refreshOrganizations');
  readonly setPrimaryOrganization = jasmine.createSpy('setPrimaryOrganization').and.callFake(async (id: string) => {
    this.primaryId.set(id);
  });
}

class NotificationServiceStub {
  readonly success = jasmine.createSpy('success');
  readonly error = jasmine.createSpy('error');
}

describe('AdminOrganizationsPageComponent', () => {
  let fixture: ComponentFixture<AdminOrganizationsPageComponent>;
  let auth: AuthServiceStub;
  let activeOrg: ActiveOrganizationServiceStub;
  let notification: NotificationServiceStub;

  beforeEach(async () => {
    localStorage.removeItem('zh.collection-view.mode.admin-organizations');
    await TestBed.configureTestingModule({
      imports: [AdminOrganizationsPageComponent, NoopAnimationsModule],
      providers: [
        { provide: AuthService, useClass: AuthServiceStub },
        { provide: ActiveOrganizationService, useClass: ActiveOrganizationServiceStub },
        { provide: NotificationService, useClass: NotificationServiceStub },
        { provide: ApiOrganizationRepository, useValue: { getAll: jasmine.createSpy('getAll').and.callFake(async () => [...organizations]) } },
        { provide: ApiSportRepository, useValue: { setForOrganization: jasmine.createSpy('setForOrganization') } }
      ]
    }).compileComponents();

    auth = TestBed.inject(AuthService) as unknown as AuthServiceStub;
    activeOrg = TestBed.inject(ActiveOrganizationService) as unknown as ActiveOrganizationServiceStub;
    notification = TestBed.inject(NotificationService) as unknown as NotificationServiceStub;
    fixture = TestBed.createComponent(AdminOrganizationsPageComponent);
  });

  afterEach(() => localStorage.removeItem('zh.collection-view.mode.admin-organizations'));

  async function render(mode: 'table' | 'cards' = 'table'): Promise<void> {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.debugElement.query(By.directive(ZhCollectionViewComponent)).componentInstance.setMode(mode);
    fixture.detectChanges();
  }

  async function settle(): Promise<void> {
    await fixture.whenStable();
    fixture.detectChanges();
  }

  function tableRow(name: string): HTMLElement {
    const rows = Array.from(fixture.nativeElement.querySelectorAll('tbody tr')) as HTMLElement[];
    const row = rows.find(r => r.textContent?.includes(name));
    if (!row) throw new Error(`Row ${name} not rendered`);
    return row;
  }

  function card(name: string): HTMLElement {
    const cards = Array.from(fixture.nativeElement.querySelectorAll('.zh-collection-view__card')) as HTMLElement[];
    const found = cards.find(c => c.textContent?.includes(name));
    if (!found) throw new Error(`Card ${name} not rendered`);
    return found;
  }

  function actionIcons(container: HTMLElement): string[] {
    return Array.from(container.querySelectorAll('.data-table__action-btn mat-icon, .zh-collection-view__card-action mat-icon'))
      .map(icon => icon.textContent?.trim() ?? '');
  }

  function clickStar(container: HTMLElement): void {
    const star = Array.from(container.querySelectorAll('button'))
      .find(button => button.querySelector('mat-icon')?.textContent?.trim() === 'star');
    if (!star) throw new Error('Primary action not rendered');
    star.click();
    fixture.detectChanges();
  }

  function dialog(): ConfirmDialogComponent | null {
    return fixture.debugElement.query(By.directive(ConfirmDialogComponent))?.componentInstance ?? null;
  }

  function hasTablePrimaryPill(name: string): boolean {
    return !!tableRow(name).querySelector('.data-table__pill[data-variant="info"]');
  }

  function hasCardPrimaryPill(name: string): boolean {
    return !!card(name).querySelector('.zh-list-card__status--info');
  }

  it('shows the primary action only on eligible non-primary table rows and keeps edit/delete everywhere', async () => {
    await render('table');

    expect(actionIcons(tableRow('Alpha Circuit'))).toEqual(['edit', 'delete']);
    expect(actionIcons(tableRow('Beta Academy'))).toEqual(['star', 'edit', 'delete']);
    expect(actionIcons(tableRow('Gamma Brand'))).toEqual(['edit', 'delete']);
  });

  it('shows the primary action only on eligible non-primary cards and keeps edit/delete everywhere', async () => {
    await render('cards');

    expect(actionIcons(card('Alpha Circuit'))).toEqual(['edit', 'delete']);
    expect(actionIcons(card('Beta Academy'))).toEqual(['star', 'edit', 'delete']);
    expect(actionIcons(card('Gamma Brand'))).toEqual(['edit', 'delete']);
  });

  it('marks only the primary organization with a pill in table and cards', async () => {
    await render('table');
    expect(hasTablePrimaryPill('Alpha Circuit')).toBeTrue();
    expect(hasTablePrimaryPill('Beta Academy')).toBeFalse();
    expect(hasTablePrimaryPill('Gamma Brand')).toBeFalse();
    expect(tableRow('Alpha Circuit').querySelector('.data-table__pill[data-variant="info"]')?.textContent?.trim()).toBeTruthy();

    fixture.debugElement.query(By.directive(ZhCollectionViewComponent)).componentInstance.setMode('cards');
    fixture.detectChanges();
    expect(hasCardPrimaryPill('Alpha Circuit')).toBeTrue();
    expect(hasCardPrimaryPill('Beta Academy')).toBeFalse();
    expect(hasCardPrimaryPill('Gamma Brand')).toBeFalse();
  });

  it('hides the primary action for non-admin users', async () => {
    auth.user.update(user => ({ ...user, role: 'player' }));
    await render('table');

    expect(actionIcons(tableRow('Beta Academy'))).toEqual(['edit', 'delete']);
  });

  it('hides the primary action when the admin has a single eligible assignment', async () => {
    activeOrg.eligible.set([toTenant(organizations[0])]);
    await render('cards');

    expect(actionIcons(card('Beta Academy'))).toEqual(['edit', 'delete']);
  });

  it('asks for confirmation before replacing an existing primary and moves the pill on success', async () => {
    await render('table');
    clickStar(tableRow('Beta Academy'));

    const confirm = dialog();
    expect(confirm).not.toBeNull();
    expect(confirm!.titleKey()).toBe('org.selector.confirmTitle');
    expect(confirm!.messageKey()).toBe('org.selector.confirmMessage');
    expect(confirm!.warningKey()).toBe('org.selector.confirmWarning');
    expect(activeOrg.setPrimaryOrganization).not.toHaveBeenCalled();

    confirm!.confirmed.emit();
    await settle();

    expect(activeOrg.setPrimaryOrganization).toHaveBeenCalledOnceWith('org-2');
    expect(dialog()).toBeNull();
    expect(hasTablePrimaryPill('Alpha Circuit')).toBeFalse();
    expect(hasTablePrimaryPill('Beta Academy')).toBeTrue();
    expect(actionIcons(tableRow('Alpha Circuit'))).toEqual(['star', 'edit', 'delete']);
    expect(actionIcons(tableRow('Beta Academy'))).toEqual(['edit', 'delete']);
    expect(activeOrg.switchOrganization).not.toHaveBeenCalled();
  });

  it('keeps the existing primary when the confirmation is cancelled from a card', async () => {
    await render('cards');
    clickStar(card('Beta Academy'));

    dialog()!.cancelled.emit();
    fixture.detectChanges();

    expect(dialog()).toBeNull();
    expect(activeOrg.setPrimaryOrganization).not.toHaveBeenCalled();
    expect(hasCardPrimaryPill('Alpha Circuit')).toBeTrue();
    expect(hasCardPrimaryPill('Beta Academy')).toBeFalse();
  });

  it('keeps the existing primary and active organization when the update fails', async () => {
    activeOrg.setPrimaryOrganization.and.rejectWith(new Error('org.selector.primaryError'));
    await render('table');
    clickStar(tableRow('Beta Academy'));

    dialog()!.confirmed.emit();
    await settle();

    expect(notification.error).toHaveBeenCalledWith('org.selector.primaryError');
    expect(dialog()).withContext('dialog stays open so the admin can retry or cancel').not.toBeNull();
    expect(hasTablePrimaryPill('Alpha Circuit')).toBeTrue();
    expect(hasTablePrimaryPill('Beta Academy')).toBeFalse();
    expect(activeOrg.switchOrganization).not.toHaveBeenCalled();
    expect(activeOrg.activeOrganizationId()).toBe('org-1');
  });

  it('ignores primary requests for ineligible or already-primary rows', async () => {
    await render('table');
    const rows = fixture.componentInstance.tableData();

    fixture.componentInstance.onRowActionClicked({ action: 'setPrimary', row: rows.find(r => r.id === 'org-3')! });
    fixture.componentInstance.onRowActionClicked({ action: 'setPrimary', row: rows.find(r => r.id === 'org-1')! });
    fixture.detectChanges();
    await settle();

    expect(dialog()).toBeNull();
    expect(activeOrg.setPrimaryOrganization).not.toHaveBeenCalled();
  });

  it('sets the primary directly when no primary exists yet', async () => {
    activeOrg.primaryId.set(null);
    await render('cards');
    expect(actionIcons(card('Alpha Circuit'))).toEqual(['star', 'edit', 'delete']);

    clickStar(card('Beta Academy'));
    expect(dialog()).toBeNull();
    await settle();

    expect(activeOrg.setPrimaryOrganization).toHaveBeenCalledOnceWith('org-2');
    expect(hasCardPrimaryPill('Beta Academy')).toBeTrue();
  });

  it('ignores repeated confirmations while the primary update is pending', async () => {
    let resolve!: () => void;
    activeOrg.setPrimaryOrganization.and.returnValue(new Promise<void>(r => { resolve = r; }));
    await render('table');
    clickStar(tableRow('Beta Academy'));

    dialog()!.confirmed.emit();
    dialog()!.confirmed.emit();
    fixture.detectChanges();
    expect(dialog()!.loading()).toBeTrue();

    resolve();
    await settle();
    expect(activeOrg.setPrimaryOrganization).toHaveBeenCalledTimes(1);
  });
});
