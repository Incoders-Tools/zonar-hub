import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { AdminTournamentsPageComponent } from './admin-tournaments-page.component';
import { TournamentsFacadeService } from './tournaments-facade.service';
import { AuthService } from '../../../../core/auth/auth.service';
import { TenantContextService } from '../../../../core/services/tenant-context.service';
import { ActiveOrganizationService } from '../../../../core/services/active-organization.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { ZhCollectionViewComponent } from '../../../../shared/components/zh-collection-view/zh-collection-view.component';
import { Tournament } from '../../../../core/models';

const base: Tournament = {
  id: 't-1', organizationId: 'org-1', name: 'Copa Pública', complexId: 'c-1', complexName: 'Arena', categoryId: '',
  categoryName: '', genderId: 'g-1', genderLabel: '', tournamentTypeId: '', tournamentTypeName: '', sportId: 's-1',
  sportName: '', statusId: 'upcoming', statusLabel: '', startDate: '2030-12-01', endDate: '2030-12-03',
  registrationStartDate: '', registrationEndDate: '', maxPairs: 16, description: '', rules: '',
  createdAt: '2026-01-01T00:00:00Z', isActive: true
};

const tournaments: Tournament[] = [
  { ...base, id: 't-1', name: 'Copa Pública', isPublic: true, publicSlug: 'copa-publica-a1b2c3' },
  { ...base, id: 't-2', name: 'Copa Privada', isPublic: false, publicSlug: 'copa-privada-z9y8x7' },
  { ...base, id: 't-3', name: 'Copa Sin Enlace', isPublic: true }
];

describe('AdminTournamentsPageComponent public link action', () => {
  let fixture: ComponentFixture<AdminTournamentsPageComponent>;
  let notification: jasmine.SpyObj<NotificationService>;

  beforeEach(async () => {
    localStorage.removeItem('zh.collection-view.mode.admin-tournaments');
    notification = jasmine.createSpyObj<NotificationService>('NotificationService', ['success', 'error']);
    const facade = {
      load: jasmine.createSpy('load').and.resolveTo(),
      filteredTournaments: signal(tournaments),
      entities: signal(tournaments),
      loading: signal(false),
      error: signal<string | null>(null),
      saving: signal(false),
      deleting: signal(false),
      computeStatus: () => ({ key: 'upcoming', labelKey: 'admin.tournaments.status.upcoming' }),
      applyFilters: jasmine.createSpy('applyFilters'),
      clearFilters: jasmine.createSpy('clearFilters'),
      applySortOption: jasmine.createSpy('applySortOption'),
      applySortRules: jasmine.createSpy('applySortRules')
    };

    await TestBed.configureTestingModule({
      imports: [AdminTournamentsPageComponent, NoopAnimationsModule],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { isSystemAdmin: signal(false) } },
        { provide: TenantContextService, useValue: { planType: signal('pro') } },
        { provide: ActiveOrganizationService, useValue: { organizationChanged: signal(0), activeOrganizationId: signal('org-1') } },
        { provide: NotificationService, useValue: notification }
      ]
    })
      .overrideComponent(AdminTournamentsPageComponent, {
        set: { providers: [{ provide: TournamentsFacadeService, useValue: facade }] }
      })
      .compileComponents();

    fixture = TestBed.createComponent(AdminTournamentsPageComponent);
  });

  afterEach(() => localStorage.removeItem('zh.collection-view.mode.admin-tournaments'));

  async function render(mode: 'table' | 'cards'): Promise<void> {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.debugElement.query(By.directive(ZhCollectionViewComponent)).componentInstance.setMode(mode);
    fixture.detectChanges();
  }

  function container(name: string, mode: 'table' | 'cards'): HTMLElement {
    const selector = mode === 'table' ? 'tbody tr' : '.zh-collection-view__card';
    const found = (Array.from(fixture.nativeElement.querySelectorAll(selector)) as HTMLElement[])
      .find(el => el.textContent?.includes(name));
    if (!found) throw new Error(`${name} not rendered`);
    return found;
  }

  function actionIcons(el: HTMLElement): string[] {
    return Array.from(el.querySelectorAll('.data-table__action-btn mat-icon, .zh-collection-view__card-action mat-icon'))
      .map(icon => icon.textContent?.trim() ?? '');
  }

  function clickAction(el: HTMLElement, icon: string): void {
    const button = Array.from(el.querySelectorAll('button'))
      .find(b => b.querySelector('mat-icon')?.textContent?.trim() === icon);
    if (!button) throw new Error(`${icon} action not rendered`);
    button.click();
  }

  for (const mode of ['table', 'cards'] as const) {
    it(`offers the copy public link action only for public tournaments with a link (${mode})`, async () => {
      await render(mode);

      expect(actionIcons(container('Copa Pública', mode))).toEqual(['edit', 'share', 'link', 'delete']);
      expect(actionIcons(container('Copa Privada', mode))).toEqual(['edit', 'share', 'delete']);
      expect(actionIcons(container('Copa Sin Enlace', mode))).toEqual(['edit', 'share', 'delete']);
    });
  }

  it('copies the public link of the row and confirms success', async () => {
    await render('table');
    const writeText = spyOn(navigator.clipboard, 'writeText').and.resolveTo();

    clickAction(container('Copa Pública', 'table'), 'link');
    await fixture.whenStable();

    expect(writeText).toHaveBeenCalledOnceWith(`${window.location.origin}/tournaments/copa-publica-a1b2c3`);
    expect(notification.success).toHaveBeenCalledOnceWith('admin.tournaments.share.copySuccess');
  });

  it('keeps the Instagram share preview action', async () => {
    await render('table');

    clickAction(container('Copa Privada', 'table'), 'share');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('app-social-share-preview')).toBeTruthy();
  });
});
