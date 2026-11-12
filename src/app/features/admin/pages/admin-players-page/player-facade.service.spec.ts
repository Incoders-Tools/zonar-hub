import { TestBed } from '@angular/core/testing';
import { PlayerFacadeService } from './player-facade.service';
import { ApiPlayerRepository } from '../../../../core/repositories/api/api-player.repository';
import { ApiCategoryRepository } from '../../../../core/repositories/api/api-category.repository';
import { ApiGenderRepository } from '../../../../core/repositories/api/api-gender.repository';
import { NotificationService } from '../../../../core/services/notification.service';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { Player } from '../../../../core/models';
import { PlayerPage } from '../../../../core/repositories/player.repository';

const player = (overrides: Partial<Player> = {}): Player => ({
  id: 'p1', firstName: 'Ana', lastName: 'Gil', email: '', genderId: 'g-f', genderLabel: '', categoryId: 'c-4',
  categoryName: '', isActive: true, createdAt: '', ...overrides
});

const page = (items: Player[], totalCount = items.length): PlayerPage => ({ items, page: 1, pageSize: 25, totalCount });

describe('PlayerFacadeService', () => {
  let service: PlayerFacadeService;
  let repo: jasmine.SpyObj<ApiPlayerRepository>;
  let notification: jasmine.SpyObj<NotificationService>;

  beforeEach(() => {
    repo = jasmine.createSpyObj<ApiPlayerRepository>('ApiPlayerRepository', ['getPage', 'create', 'update', 'setActive']);
    repo.getPage.and.resolveTo(page([player()], 40));
    notification = jasmine.createSpyObj<NotificationService>('NotificationService', ['success', 'error']);
    TestBed.configureTestingModule({
      providers: [
        PlayerFacadeService,
        { provide: ApiPlayerRepository, useValue: repo },
        { provide: ApiCategoryRepository, useValue: { getAll: () => Promise.resolve([{ id: 'c-4', name: 'Cuarta' }]) } },
        { provide: ApiGenderRepository, useValue: { getAll: () => Promise.resolve([{ id: 'g-f', name: 'Femenino' }]) } },
        { provide: NotificationService, useValue: notification },
        { provide: I18nService, useValue: { translate: (key: string) => `t:${key}` } }
      ]
    });
    service = TestBed.inject(PlayerFacadeService);
  });

  it('loads one server page with the catalog names and the server total', async () => {
    await service.load();
    expect(repo.getPage).toHaveBeenCalledOnceWith({ page: 1, pageSize: 25, search: undefined, isActive: undefined });
    expect(service.players()[0]).toEqual(jasmine.objectContaining({ categoryName: 'Cuarta', genderLabel: 'Femenino' }));
    expect(service.totalCount()).toBe(40);
    expect(service.loading()).toBeFalse();
    expect(service.error()).toBeNull();
  });

  it('sends search and status to the server and restarts at page 1', async () => {
    service.goToPage(3);
    service.applyFilters({ search: 'gil', isActive: 'false' });
    await Promise.resolve();
    expect(repo.getPage.calls.mostRecent().args[0]).toEqual({ page: 1, pageSize: 25, search: 'gil', isActive: false });
    expect(service.page()).toBe(1);
  });

  it('exposes the translation key of a failed load and empties the page', async () => {
    repo.getPage.and.rejectWith(new Error('common.forbidden'));
    await service.load();
    expect(service.error()).toBe('common.forbidden');
    expect(service.players()).toEqual([]);
    expect(service.totalCount()).toBe(0);
  });

  it('creates, confirms with a toast and reloads', async () => {
    repo.create.and.resolveTo(player());
    const ok = await service.save({ firstName: 'Ana', lastName: 'Gil', isActive: true });
    expect(ok).toBeTrue();
    expect(repo.create).toHaveBeenCalled();
    expect(notification.success).toHaveBeenCalledWith('t:toast.saveSuccess');
    expect(repo.getPage).toHaveBeenCalled();
  });

  it('reports the translated API error of a refused save and keeps the list', async () => {
    repo.update.and.rejectWith(new Error('players.errors.email_taken'));
    const ok = await service.save({ firstName: 'Ana', lastName: 'Gil', isActive: true }, 'p1');
    expect(ok).toBeFalse();
    expect(notification.error).toHaveBeenCalledWith('t:players.errors.email_taken');
    expect(repo.getPage).not.toHaveBeenCalled();
    expect(service.saving()).toBeFalse();
  });

  it('deactivates each player and reloads; never deletes', async () => {
    repo.setActive.and.resolveTo(player({ isActive: false }));
    const ok = await service.setActive(['p1', 'p2'], false);
    expect(ok).toBeTrue();
    expect(repo.setActive.calls.allArgs()).toEqual([['p1', false], ['p2', false]]);
    expect(notification.success).toHaveBeenCalledWith('t:admin.players.feedback.deactivated');
    expect(repo.getPage).toHaveBeenCalled();
  });

  it('reports a failed reactivation and still reloads the stored state', async () => {
    repo.setActive.and.rejectWith(new Error('players.errors.not_found'));
    const ok = await service.setActive(['p1'], true);
    expect(ok).toBeFalse();
    expect(notification.error).toHaveBeenCalledWith('t:players.errors.not_found');
    expect(repo.getPage).toHaveBeenCalled();
    expect(service.updatingStatus()).toBeFalse();
  });
});
