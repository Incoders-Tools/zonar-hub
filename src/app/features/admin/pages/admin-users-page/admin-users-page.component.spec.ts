import { computed, signal } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, flushMicrotasks, tick } from '@angular/core/testing';
import { AdminUsersPageComponent } from './admin-users-page.component';
import { UsersFacadeService } from './users-facade.service';
import { provideHttpClient } from '@angular/common/http';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Tenant } from '../../../../core/models/user.model';
import { AdminUser } from '../../../../core/models/admin-user.model';
import {
  AdminUserPage,
  AdminUserPageQuery,
  PermissionSourcePage,
  PermissionSourceUser
} from '../../../../core/repositories/admin-user.repository';
import { ApiAdminUserRepository } from '../../../../core/repositories/api/api-admin-user.repository';
import { ApiOrganizationRepository } from '../../../../core/repositories/api/api-organization.repository';
import { ApiPermissionRepository } from '../../../../core/repositories/api/api-permission.repository';
import { ActiveOrganizationService } from '../../../../core/services/active-organization.service';
import { I18nService } from '../../../../core/i18n/i18n.service';

interface Deferred<T> {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason: unknown) => void;
}

function deferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function sourceUser(id: string, fullName: string): PermissionSourceUser {
  return { id, fullName, email: `${id}@zonarhub.dev`, roleId: 'role003', isActive: true };
}

function sourcePage(items: PermissionSourceUser[], totalCount = items.length): PermissionSourcePage {
  return { items, page: 1, pageSize: 20, totalCount };
}

function adminUser(id: string, fullName: string): AdminUser {
  return {
    id,
    email: `${id}@zonarhub.dev`,
    fullName,
    roleId: 'role003',
    tenantIds: ['org-1'],
    isActive: true,
    createdAt: new Date().toISOString()
  };
}

function tenant(id: string): Tenant {
  const now = new Date().toISOString();
  return {
    id,
    name: `Org ${id}`,
    key: id,
    contactEmail: `${id}@example.com`,
    planId: 'plan-1',
    planType: 'starter',
    isActive: true,
    createdAt: now,
    updatedAt: now
  };
}

function usersPage(items: AdminUser[], page: number, totalCount: number): AdminUserPage {
  return { items, page, pageSize: 20, totalCount };
}

function pageOfUsers(count: number, offset = 0): AdminUser[] {
  return Array.from({ length: count }, (_, index) =>
    adminUser(`user-${offset + index + 1}`, `User ${offset + index + 1}`));
}

class ApiAdminUserRepositoryStub {
  readonly searchPermissionSources = jasmine.createSpy('searchPermissionSources')
    .and.callFake(() => Promise.resolve(sourcePage([])));
  readonly getPage = jasmine.createSpy('getPage')
    .and.callFake((query: AdminUserPageQuery) => Promise.resolve(usersPage([], query.page, 0)));
  readonly create = jasmine.createSpy('create').and.callFake((payload: any) => Promise.resolve(payload as AdminUser));
  readonly update = jasmine.createSpy('update').and.callFake((_id: string, payload: any) => Promise.resolve(payload as AdminUser));
  readonly delete = jasmine.createSpy('delete').and.resolveTo();
  readonly deleteMany = jasmine.createSpy('deleteMany').and.resolveTo();
}

class ApiOrganizationRepositoryStub {
  readonly getAll = jasmine.createSpy('getAll').and.resolveTo([]);
}

class ActiveOrganizationServiceStub {
  private readonly activeOrgIdState = signal<string | null>('org-1');
  private readonly organizationChangeCounter = signal(0);

  readonly activeOrganizationId = computed(() => this.activeOrgIdState());
  readonly activeOrganizationName = computed(() => this.activeOrgIdState() ?? '');
  readonly organizationChanged = this.organizationChangeCounter.asReadonly();

  switchOrganization(orgId: string | null): void {
    this.activeOrgIdState.set(orgId);
    this.organizationChangeCounter.update(count => count + 1);
  }
}

class ApiPermissionRepositoryStub {
  async getCatalog(): Promise<{ modules: any[] }> {
    return {
      modules: [
        {
          key: 'dashboard',
          labelKey: 'admin.permissions.module.dashboard',
          sortOrder: 1,
          isActive: true,
          tools: [
            {
              key: 'dashboard',
              moduleKey: 'dashboard',
              labelKey: 'admin.dashboard',
              route: '/admin',
              sortOrder: 1,
              isSystemAdminOnly: false,
              isActive: true
            }
          ]
        }
      ]
    };
  }

  async getUserPermissions(_userId?: string): Promise<{ permissionsByOrganization: any[] }> {
    return { permissionsByOrganization: [] };
  }
}

describe('AdminUsersPageComponent', () => {
  let component: AdminUsersPageComponent;
  let fixture: ComponentFixture<AdminUsersPageComponent>;
  let facade: UsersFacadeService;
  let activeOrg: ActiveOrganizationServiceStub;
  let adminUserRepository: ApiAdminUserRepositoryStub;

  beforeEach(async () => {
    localStorage.removeItem('zh.collection-view.mode.admin-users');
    await TestBed.configureTestingModule({
      imports: [AdminUsersPageComponent, NoopAnimationsModule],
      providers: [
        UsersFacadeService,
        provideHttpClient(),
        { provide: ApiAdminUserRepository, useClass: ApiAdminUserRepositoryStub },
        { provide: ApiOrganizationRepository, useClass: ApiOrganizationRepositoryStub },
        { provide: ApiPermissionRepository, useClass: ApiPermissionRepositoryStub },
        { provide: ActiveOrganizationService, useClass: ActiveOrganizationServiceStub }
      ]
    }).compileComponents();

    activeOrg = TestBed.inject(ActiveOrganizationService) as unknown as ActiveOrganizationServiceStub;
    adminUserRepository = TestBed.inject(ApiAdminUserRepository) as unknown as ApiAdminUserRepositoryStub;

    fixture = TestBed.createComponent(AdminUsersPageComponent);
    component = fixture.componentInstance;
    facade = fixture.debugElement.injector.get(UsersFacadeService);
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should load users on init', () => {
    const loadSpy = spyOn(facade, 'load');
    fixture.detectChanges();
    expect(loadSpy).toHaveBeenCalledTimes(1);
  });

  it('should load users exactly once per active organization switch', () => {
    const loadSpy = spyOn(facade, 'load').and.resolveTo();
    fixture.detectChanges();
    loadSpy.calls.reset();

    activeOrg.switchOrganization('org-2');
    fixture.detectChanges();

    expect(loadSpy).toHaveBeenCalledTimes(1);
  });

  it('should close transient panels when the active organization changes', () => {
    spyOn(facade, 'load').and.resolveTo();
    fixture.detectChanges();
    component.openCreateForm();
    expect(component.showFormPanel()).toBe(true);

    activeOrg.switchOrganization('org-2');
    fixture.detectChanges();

    expect(component.showFormPanel()).toBe(false);
  });

  it('should apply filters', () => {
    spyOn(facade, 'applyFilters');
    component.onFiltersApplied({ search: 'john', roleId: 'role001' });
    expect(facade.applyFilters).toHaveBeenCalled();
  });

  it('should clear filters', () => {
    spyOn(facade, 'clearFilters');
    component.onFiltersCleared();
    expect(facade.clearFilters).toHaveBeenCalled();
  });

  it('should open create form', () => {
    fixture.detectChanges();
    component.openCreateForm();
    expect(component.showFormPanel()).toBe(true);
    expect(component.editingUser()).toBeNull();
  });

  it('should include editor role in role filter options', () => {
    fixture.detectChanges();

    const roleField = component.filterFields().find(field => field.key === 'roleId');
    const roleValues = (roleField?.options ?? []).map(option => option.value);

    expect(roleValues).toContain('role004');
  });

  it('should expose all active tenant items from facade scope', () => {
    const now = new Date().toISOString();
    const tenants: Tenant[] = [
      {
        id: 'org-1',
        name: 'Org 1',
        key: 'org_1',
        contactEmail: 'org1@example.com',
        planId: 'plan-1',
        planType: 'starter',
        isActive: true,
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'org-2',
        name: 'Org 2',
        key: 'org_2',
        contactEmail: 'org2@example.com',
        planId: 'plan-1',
        planType: 'starter',
        isActive: true,
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'org-3',
        name: 'Org 3',
        key: 'org_3',
        contactEmail: 'org3@example.com',
        planId: 'plan-1',
        planType: 'starter',
        isActive: false,
        createdAt: now,
        updatedAt: now
      }
    ];

    facade.tenants.set(tenants);

    expect(component.tenantItems().map(item => item.id)).toEqual(['org-1', 'org-2']);
  });

  describe('server pagination', () => {
    let i18n: I18nService;

    function host(): HTMLElement {
      return fixture.nativeElement as HTMLElement;
    }

    function tableRows(): HTMLElement[] {
      return Array.from(host().querySelectorAll<HTMLElement>('app-data-table tbody tr'));
    }

    function cards(): HTMLElement[] {
      return Array.from(host().querySelectorAll<HTMLElement>('.zh-collection-view__card'));
    }

    function pagerText(): string {
      return (host().querySelector('.data-table__pagination-page')?.textContent ?? '').replace(/\s+/g, ' ').trim();
    }

    function pagerInfo(): string {
      return (host().querySelector('.data-table__pagination-info')?.textContent ?? '').replace(/\s+/g, ' ').trim();
    }

    function nextButton(): HTMLButtonElement {
      return host().querySelectorAll<HTMLButtonElement>('.data-table__pagination-btn')[1];
    }

    function bulkDeleteVisible(): boolean {
      const label = i18n.translate('admin.users.action.bulkDelete');
      return Array.from(host().querySelectorAll('app-async-button'))
        .some(button => button.textContent?.trim() === label);
    }

    function checkedRows(): number {
      return host().querySelectorAll('app-data-table tbody input[type="checkbox"]:checked').length;
    }

    function lastQuery(): AdminUserPageQuery {
      return adminUserRepository.getPage.calls.mostRecent().args[0] as AdminUserPageQuery;
    }

    async function stabilize(): Promise<void> {
      fixture.detectChanges();
      await new Promise(resolve => setTimeout(resolve));
      fixture.detectChanges();
    }

    async function selectRow(index = 0): Promise<void> {
      host().querySelectorAll<HTMLInputElement>('app-data-table tbody input[type="checkbox"]')[index].click();
      await stabilize();
    }

    function serveTotal(totalCount: number): void {
      adminUserRepository.getPage.and.callFake((query: AdminUserPageQuery) => {
        const offset = (query.page - 1) * query.pageSize;
        const count = Math.max(0, Math.min(query.pageSize, totalCount - offset));
        return Promise.resolve(usersPage(pageOfUsers(count, offset), query.page, totalCount));
      });
    }

    beforeEach(() => {
      i18n = TestBed.inject(I18nService);
    });

    afterEach(() => {
      localStorage.removeItem('zh.collection-view.mode.admin-users');
    });

    it('renders page 1 and then page 2 from the server with the server page count', async () => {
      serveTotal(45);
      await stabilize();

      expect(lastQuery()).toEqual(jasmine.objectContaining({
        scope: { kind: 'organization', organizationId: 'org-1' },
        page: 1,
        pageSize: 20
      }));
      expect(tableRows().length).toBe(20);
      expect(tableRows()[0].textContent).toContain('User 1');
      expect(pagerText()).toContain('1 / 3');
      expect(pagerInfo()).toContain('45');

      nextButton().click();
      await stabilize();

      expect(lastQuery().page).toBe(2);
      expect(tableRows().length).toBe(20);
      expect(tableRows()[0].textContent).toContain('User 21');
      expect(pagerText()).toContain('2 / 3');
    });

    it('renders the server page as-is in cards mode, without slicing it again', async () => {
      serveTotal(45);
      localStorage.setItem('zh.collection-view.mode.admin-users', 'cards');
      await stabilize();

      expect(cards().length).toBe(20);
      expect(pagerText()).toContain('1 / 3');

      nextButton().click();
      await stabilize();

      expect(lastQuery().page).toBe(2);
      expect(cards().length).toBe(20);
      expect(cards()[0].textContent).toContain('User 21');
      expect(pagerText()).toContain('2 / 3');
    });

    it('renders an unassigned user returned by the API in the organization scope', async () => {
      const unassigned: AdminUser = { ...adminUser('loose-1', 'Loose User'), tenantIds: [], organizationId: undefined };
      adminUserRepository.getPage.and.resolveTo(usersPage([unassigned], 1, 1));

      await stabilize();

      expect(tableRows().length).toBe(1);
      expect(tableRows()[0].textContent).toContain('Loose User');
    });

    it('only ever requests the active organization scope', async () => {
      serveTotal(45);
      await stabilize();
      nextButton().click();
      await stabilize();
      component.onFiltersApplied({ search: 'ana' });
      await stabilize();
      activeOrg.switchOrganization('org-2');
      await stabilize();

      const scopes = adminUserRepository.getPage.calls.allArgs()
        .map(args => (args[0] as AdminUserPageQuery).scope);
      expect(scopes.length).toBe(4);
      expect(scopes.every(scope => scope.kind === 'organization')).toBeTrue();
      expect(scopes.at(-1)).toEqual({ kind: 'organization', organizationId: 'org-2' });
    });

    it('does not request users and shows the empty state without an active organization', async () => {
      activeOrg.switchOrganization(null);
      await stabilize();

      expect(adminUserRepository.getPage).not.toHaveBeenCalled();
      expect(host().querySelector('app-empty-state')).not.toBeNull();
      expect(tableRows().length).toBe(0);
    });

    it('forwards filters to the server and returns to the first page', async () => {
      serveTotal(45);
      await stabilize();
      nextButton().click();
      await stabilize();

      component.onFiltersApplied({ search: 'ana', roleId: 'role003', isActive: 'true' });
      await stabilize();

      expect(lastQuery()).toEqual(jasmine.objectContaining({ page: 1, search: 'ana', roleId: 'role003', isActive: true }));
      expect(pagerText()).toContain('1 / 3');
    });

    it('shows only the latest page when an earlier page response arrives late', async () => {
      serveTotal(60);
      await stabilize();
      const page2 = deferred<AdminUserPage>();
      const page3 = deferred<AdminUserPage>();
      adminUserRepository.getPage.and.returnValues(page2.promise, page3.promise);

      component.onPageChange(2);
      component.onPageChange(3);
      page3.resolve(usersPage(pageOfUsers(20, 40), 3, 60));
      await stabilize();
      page2.resolve(usersPage(pageOfUsers(20, 20), 2, 60));
      await stabilize();

      expect(tableRows()[0].textContent).toContain('User 41');
      expect(pagerText()).toContain('3 / 3');
    });

    it('ignores a late error from a superseded page request', async () => {
      serveTotal(60);
      await stabilize();
      const page2 = deferred<AdminUserPage>();
      const page3 = deferred<AdminUserPage>();
      adminUserRepository.getPage.and.returnValues(page2.promise, page3.promise);

      component.onPageChange(2);
      component.onPageChange(3);
      page3.resolve(usersPage(pageOfUsers(20, 40), 3, 60));
      await stabilize();
      page2.reject(new Error('page 2 failed'));
      await stabilize();

      expect(host().querySelector('app-error-state')).toBeNull();
      expect(tableRows().length).toBe(20);
    });

    it('disables client-only sorting because the server order is fixed', async () => {
      serveTotal(45);
      await stabilize();
      const callsBefore = adminUserRepository.getPage.calls.count();

      expect(component.columns.every(column => !column.sortable)).toBeTrue();
      expect(host().querySelectorAll('.data-table__th--sortable').length).toBe(0);
      host().querySelector<HTMLElement>('app-data-table thead th:not(.data-table__th--checkbox)')!.click();
      await stabilize();

      expect(host().querySelector('.data-table__sort-icon')).toBeNull();
      expect(adminUserRepository.getPage.calls.count()).toBe(callsBefore);
      expect(tableRows()[0].textContent).toContain('User 1');
    });

    it('refetches the current page after creating a user', async () => {
      serveTotal(45);
      await stabilize();
      nextButton().click();
      await stabilize();
      adminUserRepository.getPage.calls.reset();

      component.openCreateForm();
      await stabilize();
      component.form.patchValue({ email: 'new@zonarhub.dev', fullName: 'New User' });
      await component.onFormSave();
      await stabilize();

      expect(adminUserRepository.create).toHaveBeenCalledTimes(1);
      expect(adminUserRepository.getPage).toHaveBeenCalledOnceWith(jasmine.objectContaining({ page: 2 }));
    });

    it('refetches the current page after updating a user', async () => {
      serveTotal(45);
      await stabilize();
      adminUserRepository.getPage.calls.reset();

      component.openEditForm({ id: 'user-1' } as never);
      await stabilize();
      component.form.patchValue({ fullName: 'Renamed' });
      await component.onFormSave();
      await stabilize();

      expect(adminUserRepository.update).toHaveBeenCalledOnceWith('user-1', jasmine.objectContaining({ fullName: 'Renamed' }));
      expect(adminUserRepository.getPage).toHaveBeenCalledOnceWith(jasmine.objectContaining({ page: 1 }));
    });

    it('refetches after deleting and clamps to the new last page', async () => {
      serveTotal(41);
      await stabilize();
      component.onPageChange(3);
      await stabilize();
      expect(tableRows().length).toBe(1);

      serveTotal(40);
      component.confirmDelete({ id: 'user-41' } as never);
      component.executeDelete();
      await stabilize();

      expect(adminUserRepository.delete).toHaveBeenCalledOnceWith('user-41');
      expect(lastQuery().page).toBe(2);
      expect(pagerText()).toContain('2 / 2');
      expect(tableRows().length).toBe(20);
    });

    it('clears the selection on page, filter and organization transitions', async () => {
      serveTotal(45);
      await stabilize();

      await selectRow();
      expect(component.selectedUsers().map(row => row.id)).toEqual(['user-1']);
      expect(bulkDeleteVisible()).toBeTrue();

      nextButton().click();
      await stabilize();
      expect(component.selectedUsers()).toEqual([]);
      expect(bulkDeleteVisible()).toBeFalse();
      expect(checkedRows()).toBe(0);

      await selectRow();
      component.onFiltersApplied({ search: 'user' });
      await stabilize();
      expect(component.selectedUsers()).toEqual([]);
      expect(checkedRows()).toBe(0);

      await selectRow();
      component.onFiltersCleared();
      await stabilize();
      expect(component.selectedUsers()).toEqual([]);
      expect(checkedRows()).toBe(0);

      await selectRow();
      activeOrg.switchOrganization('org-2');
      await stabilize();
      expect(component.selectedUsers()).toEqual([]);
      expect(bulkDeleteVisible()).toBeFalse();
      expect(checkedRows()).toBe(0);
    });

    function toggleMode(mode: 'table' | 'cards'): void {
      const index = mode === 'table' ? 0 : 1;
      host().querySelectorAll<HTMLButtonElement>('.zh-collection-view__toggle-btn')[index].click();
    }

    it('clears the selection and hides bulk delete when switching from table to cards', async () => {
      serveTotal(45);
      await stabilize();
      await selectRow();
      expect(bulkDeleteVisible()).toBeTrue();

      toggleMode('cards');
      await stabilize();

      expect(cards().length).toBe(20);
      expect(component.selectedUsers()).toEqual([]);
      expect(bulkDeleteVisible()).toBeFalse();

      toggleMode('table');
      await stabilize();

      expect(checkedRows()).toBe(0);
      expect(component.selectedUsers()).toEqual([]);
      expect(bulkDeleteVisible()).toBeFalse();
    });

    it('keeps bulk delete hidden in cards mode across a refetch after a cleared table selection', async () => {
      serveTotal(45);
      await stabilize();
      await selectRow();

      toggleMode('cards');
      await stabilize();
      nextButton().click();
      await stabilize();

      expect(lastQuery().page).toBe(2);
      expect(cards()[0].textContent).toContain('User 21');
      expect(component.selectedUsers()).toEqual([]);
      expect(bulkDeleteVisible()).toBeFalse();

      toggleMode('table');
      await stabilize();

      expect(checkedRows()).toBe(0);
      expect(bulkDeleteVisible()).toBeFalse();
    });

    it('bulk deletes only the rows selected on the current page', async () => {
      serveTotal(45);
      await stabilize();
      await selectRow(0);
      nextButton().click();
      await stabilize();
      await selectRow(1);

      component.openBulkDelete();
      component.executeBulkDelete();
      await stabilize();

      expect(adminUserRepository.deleteMany).toHaveBeenCalledOnceWith(['user-22']);
      expect(component.selectedUsers()).toEqual([]);
    });
  });

  describe('permission source search', () => {
    const SEARCH_INPUT = 'input#admin-users-source-search';
    const SOURCE_SELECT = 'select#admin-users-source-user';
    const STATUS_REGION = '#admin-users-source-status';
    const RETRY_BUTTON = 'button.users-page__source-retry';

    let i18n: I18nService;

    function query<T extends Element>(selector: string): T | null {
      return (fixture.nativeElement as HTMLElement).querySelector<T>(selector as never) as T | null;
    }

    function searchInput(): HTMLInputElement {
      return query<HTMLInputElement>(SEARCH_INPUT)!;
    }

    function sourceSelect(): HTMLSelectElement {
      return query<HTMLSelectElement>(SOURCE_SELECT)!;
    }

    function statusText(): string {
      return query<HTMLElement>(STATUS_REGION)?.textContent?.trim() ?? '';
    }

    function optionValues(): string[] {
      return Array.from(sourceSelect().options).map(option => option.value).filter(Boolean);
    }

    function typeSearch(value: string): void {
      const input = searchInput();
      input.value = value;
      input.dispatchEvent(new Event('input'));
      fixture.detectChanges();
    }

    function settle(): void {
      flushMicrotasks();
      fixture.detectChanges();
    }

    function openFormWithOrganization(): void {
      facade.tenants.set([tenant('org-1'), tenant('org-2')]);
      component.openCreateForm();
      component.onTenantSelectionChanged(new Set(['org-1']));
      settle();
    }

    function openEditFormWithOrganization(userId: string): void {
      component.openEditForm({ id: userId } as never);
      settle();
      component.onTenantSelectionChanged(new Set(['org-1']));
      settle();
    }

    function searchAndResolve(term: string, page: PermissionSourcePage): void {
      adminUserRepository.searchPermissionSources.and.returnValue(Promise.resolve(page));
      typeSearch(term);
      tick(300);
      settle();
    }

    function selectSource(userId: string): void {
      const select = sourceSelect();
      select.value = userId;
      select.dispatchEvent(new Event('change'));
      fixture.detectChanges();
    }

    beforeEach(() => {
      i18n = TestBed.inject(I18nService);
      spyOn(facade, 'load').and.resolveTo();
    });

    it('renders a labelled search input, a labelled native select and a polite live region', fakeAsync(() => {
      fixture.detectChanges();
      openFormWithOrganization();

      const input = searchInput();
      const select = sourceSelect();
      const host = fixture.nativeElement as HTMLElement;
      const inputLabel = host.querySelector<HTMLLabelElement>(`label[for="${input.id}"]`);
      const selectLabel = host.querySelector<HTMLLabelElement>(`label[for="${select.id}"]`);
      const status = query<HTMLElement>(STATUS_REGION)!;

      expect(input.type).toBe('search');
      expect(inputLabel?.textContent?.trim()).toBe(i18n.translate('admin.users.permissions.sourceSearch.label'));
      expect(selectLabel?.textContent?.trim()).toBe(i18n.translate('admin.users.permissions.replicateFromUser'));
      expect(select.tagName).toBe('SELECT');
      expect(host.querySelector('[role="combobox"]:not(input):not(select)')).toBeNull();
      expect(status.getAttribute('role')).toBe('status');
      expect(status.getAttribute('aria-live')).toBe('polite');

      const hintId = input.getAttribute('aria-describedby')!;
      expect(host.querySelector(`#${hintId}`)?.textContent?.trim())
        .toBe(i18n.translate('admin.users.permissions.sourceSearch.minChars'));
      expect(select.getAttribute('aria-describedby')).toContain('admin-users-source-status');
    }));

    it('does not derive source options from the users list', fakeAsync(() => {
      facade.users.set([adminUser('listed-1', 'Listed One'), adminUser('listed-2', 'Listed Two')]);
      fixture.detectChanges();
      openFormWithOrganization();

      expect(optionValues()).toEqual([]);
      expect(sourceSelect().disabled).toBeTrue();
      expect(adminUserRepository.searchPermissionSources).not.toHaveBeenCalled();

      searchAndResolve('ana', sourcePage([sourceUser('remote-1', 'Ana Remote')]));
      expect(optionValues()).toEqual(['remote-1']);

      facade.users.set([adminUser('listed-3', 'Listed Three')]);
      fixture.detectChanges();
      expect(optionValues()).toEqual(['remote-1']);
    }));

    it('debounces the search by 300ms and only sends the latest term', fakeAsync(() => {
      fixture.detectChanges();
      openFormWithOrganization();

      typeSearch('an');
      tick(299);
      typeSearch('ana');
      tick(299);
      expect(adminUserRepository.searchPermissionSources).not.toHaveBeenCalled();

      tick(1);
      settle();
      expect(adminUserRepository.searchPermissionSources).toHaveBeenCalledOnceWith({ search: 'ana' });
    }));

    it('does not send a request for fewer than two meaningful characters', fakeAsync(() => {
      fixture.detectChanges();
      openFormWithOrganization();

      for (const term of ['a', ' a ', '__', '_a_', '*a%', '(a)']) {
        typeSearch(term);
        tick(1000);
        settle();
      }

      expect(adminUserRepository.searchPermissionSources).not.toHaveBeenCalled();
      expect(statusText()).toBe('');
    }));

    it('searches immediately on Enter without submitting the form', fakeAsync(() => {
      fixture.detectChanges();
      openFormWithOrganization();

      typeSearch('ana');
      const event = new KeyboardEvent('keydown', { key: 'Enter', cancelable: true });
      searchInput().dispatchEvent(event);
      settle();

      expect(event.defaultPrevented).toBeTrue();
      expect(adminUserRepository.searchPermissionSources).toHaveBeenCalledOnceWith({ search: 'ana' });
      tick(300);
      expect(adminUserRepository.searchPermissionSources).toHaveBeenCalledTimes(1);
    }));

    it('ignores a stale response after the query changes', fakeAsync(() => {
      fixture.detectChanges();
      openFormWithOrganization();
      const first = deferred<PermissionSourcePage>();
      const second = deferred<PermissionSourcePage>();
      adminUserRepository.searchPermissionSources.and.returnValues(first.promise, second.promise);

      typeSearch('ana');
      tick(300);
      typeSearch('bob');
      tick(300);

      first.resolve(sourcePage([sourceUser('ana', 'Ana')]));
      settle();
      expect(optionValues()).toEqual([]);
      expect(statusText()).toBe(i18n.translate('admin.users.permissions.sourceSearch.loading'));

      second.resolve(sourcePage([sourceUser('bob', 'Bob')]));
      settle();
      expect(optionValues()).toEqual(['bob']);
    }));

    it('ignores a pending response after the form closes and resets the search', fakeAsync(() => {
      fixture.detectChanges();
      openFormWithOrganization();
      const pending = deferred<PermissionSourcePage>();
      adminUserRepository.searchPermissionSources.and.returnValue(pending.promise);
      typeSearch('ana');
      tick(300);

      component.closeFormPanel();
      settle();
      pending.resolve(sourcePage([sourceUser('ana', 'Ana')]));
      settle();

      expect(component.sourceOptions()).toEqual([]);
      expect(component.sourceSearchStatus()).toBe('idle');
      openFormWithOrganization();
      expect(searchInput().value).toBe('');
      expect(optionValues()).toEqual([]);
      expect(statusText()).toBe('');
    }));

    it('cancels a debounced search when the form closes', fakeAsync(() => {
      fixture.detectChanges();
      openFormWithOrganization();
      typeSearch('ana');

      component.closeFormPanel();
      tick(300);
      settle();

      expect(adminUserRepository.searchPermissionSources).not.toHaveBeenCalled();
    }));

    it('ignores a pending response after the active organization changes', fakeAsync(() => {
      fixture.detectChanges();
      openFormWithOrganization();
      const pending = deferred<PermissionSourcePage>();
      adminUserRepository.searchPermissionSources.and.returnValue(pending.promise);
      typeSearch('ana');
      tick(300);

      activeOrg.switchOrganization('org-2');
      fixture.detectChanges();
      pending.resolve(sourcePage([sourceUser('ana', 'Ana')]));
      settle();

      expect(component.showFormPanel()).toBeFalse();
      expect(component.sourceOptions()).toEqual([]);
      expect(component.sourceSearchStatus()).toBe('idle');
      openFormWithOrganization();
      expect(searchInput().value).toBe('');
      expect(optionValues()).toEqual([]);
    }));

    it('ignores a pending response and resets the source when the edited user changes', fakeAsync(() => {
      facade.users.set([adminUser('user-a', 'User A'), adminUser('user-b', 'User B')]);
      fixture.detectChanges();
      facade.tenants.set([tenant('org-1')]);
      openEditFormWithOrganization('user-a');
      searchAndResolve('ana', sourcePage([sourceUser('ana', 'Ana')]));
      selectSource('ana');
      const pending = deferred<PermissionSourcePage>();
      adminUserRepository.searchPermissionSources.and.returnValue(pending.promise);
      typeSearch('bob');
      tick(300);

      openEditFormWithOrganization('user-b');
      pending.resolve(sourcePage([sourceUser('bob', 'Bob')]));
      settle();

      expect(component.copySourceUserId()).toBe('');
      expect(searchInput().value).toBe('');
      expect(optionValues()).toEqual([]);
    }));

    it('excludes the user being edited from the source options', fakeAsync(() => {
      facade.users.set([adminUser('user-a', 'User A')]);
      fixture.detectChanges();
      facade.tenants.set([tenant('org-1')]);
      openEditFormWithOrganization('user-a');

      searchAndResolve('user', sourcePage([sourceUser('user-a', 'User A'), sourceUser('user-c', 'User C')]));

      expect(optionValues()).toEqual(['user-c']);
    }));

    it('keeps the selected source option while results refresh', fakeAsync(() => {
      fixture.detectChanges();
      openFormWithOrganization();
      searchAndResolve('ana', sourcePage([sourceUser('ana', 'Ana')]));
      selectSource('ana');
      const pending = deferred<PermissionSourcePage>();
      adminUserRepository.searchPermissionSources.and.returnValue(pending.promise);

      typeSearch('bob');
      tick(300);
      settle();
      expect(optionValues()).toEqual(['ana']);
      expect(sourceSelect().value).toBe('ana');

      pending.resolve(sourcePage([sourceUser('bob', 'Bob')]));
      settle();
      expect(optionValues()).toEqual(['ana', 'bob']);
      expect(sourceSelect().value).toBe('ana');
      expect(component.copySourceUserId()).toBe('ana');
      expect(component.canCopyPermissionsFromUser()).toBeTrue();
    }));

    it('resets the selected source when the form is reopened', fakeAsync(() => {
      fixture.detectChanges();
      openFormWithOrganization();
      searchAndResolve('ana', sourcePage([sourceUser('ana', 'Ana')]));
      selectSource('ana');

      component.closeFormPanel();
      settle();
      openFormWithOrganization();

      expect(component.copySourceUserId()).toBe('');
      expect(component.canCopyPermissionsFromUser()).toBeFalse();
      expect(sourceSelect().value).toBe('');
    }));

    it('ignores source ids that are not among the offered options', fakeAsync(() => {
      fixture.detectChanges();
      openFormWithOrganization();

      component.onCopySourceUserChanged('user-42');

      expect(component.copySourceUserId()).toBe('');
      expect(component.canCopyPermissionsFromUser()).toBeFalse();
    }));

    it('announces loading, then results, in the live region', fakeAsync(() => {
      fixture.detectChanges();
      openFormWithOrganization();
      const pending = deferred<PermissionSourcePage>();
      adminUserRepository.searchPermissionSources.and.returnValue(pending.promise);

      typeSearch('ana');
      tick(300);
      settle();
      expect(statusText()).toBe(i18n.translate('admin.users.permissions.sourceSearch.loading'));

      pending.resolve(sourcePage([sourceUser('ana', 'Ana'), sourceUser('anabel', 'Anabel')]));
      settle();
      expect(statusText()).toBe(i18n.translate('admin.users.permissions.sourceSearch.results').replace('{count}', '2'));
    }));

    it('shows the empty state when no users match', fakeAsync(() => {
      fixture.detectChanges();
      openFormWithOrganization();

      searchAndResolve('zzz', sourcePage([]));

      expect(statusText()).toBe(i18n.translate('admin.users.permissions.sourceSearch.empty'));
      expect(sourceSelect().disabled).toBeTrue();
    }));

    it('hints that the search should be refined when more results exist than are shown', fakeAsync(() => {
      fixture.detectChanges();
      openFormWithOrganization();

      searchAndResolve('an', sourcePage([sourceUser('ana', 'Ana'), sourceUser('anabel', 'Anabel')], 35));

      expect(statusText()).toBe(i18n.translate('admin.users.permissions.sourceSearch.moreResults')
        .replace('{shown}', '2')
        .replace('{total}', '35'));
    }));

    it('does not show the refine hint when all matches are shown', fakeAsync(() => {
      fixture.detectChanges();
      openFormWithOrganization();

      searchAndResolve('an', sourcePage([sourceUser('ana', 'Ana')], 1));

      expect(statusText()).not.toContain('35');
      expect(statusText()).toBe(i18n.translate('admin.users.permissions.sourceSearch.results').replace('{count}', '1'));
    }));

    it('shows an error with a retry action that repeats the search', fakeAsync(() => {
      fixture.detectChanges();
      openFormWithOrganization();
      adminUserRepository.searchPermissionSources.and.callFake(() => Promise.reject(new Error('common.unexpected')));

      typeSearch('ana');
      tick(300);
      settle();

      expect(statusText()).toBe(i18n.translate('admin.users.permissions.sourceSearch.error'));
      const retry = query<HTMLButtonElement>(RETRY_BUTTON)!;
      expect(retry).not.toBeNull();
      expect(retry.type).toBe('button');
      expect(retry.textContent?.trim()).toBe(i18n.translate('common.retry'));

      adminUserRepository.searchPermissionSources.and.returnValue(Promise.resolve(sourcePage([sourceUser('ana', 'Ana')])));
      retry.click();
      settle();

      expect(adminUserRepository.searchPermissionSources).toHaveBeenCalledTimes(2);
      expect(adminUserRepository.searchPermissionSources.calls.mostRecent().args).toEqual([{ search: 'ana' }]);
      expect(query(RETRY_BUTTON)).toBeNull();
      expect(optionValues()).toEqual(['ana']);
    }));

    it('copies permissions from the selected source into the target organization', fakeAsync(() => {
      const permissionRepository = TestBed.inject(ApiPermissionRepository) as unknown as ApiPermissionRepositoryStub;
      spyOn(permissionRepository, 'getUserPermissions').and.resolveTo({
        permissionsByOrganization: [{ organizationId: 'org-1', toolKeys: ['dashboard'] }]
      });
      fixture.detectChanges();
      settle();
      openFormWithOrganization();
      component.permissionsByOrganization.set({ 'org-1': [] });
      searchAndResolve('ana', sourcePage([sourceUser('ana', 'Ana')]));

      expect(component.canCopyPermissionsFromUser()).toBeFalse();
      selectSource('ana');
      expect(component.canCopyPermissionsFromUser()).toBeTrue();

      void component.copyPermissionsFromUser();
      settle();

      expect(permissionRepository.getUserPermissions).toHaveBeenCalledOnceWith('ana');
      expect(component.permissionsByOrganization()['org-1']).toEqual(['dashboard']);
    }));
  });
});
