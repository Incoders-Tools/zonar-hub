import { TestBed } from '@angular/core/testing';
import { NotificationService } from './notification.service';
import { PublicTournamentLinkService, publicTournamentPath } from './public-tournament-link.service';

describe('PublicTournamentLinkService', () => {
  let service: PublicTournamentLinkService;
  let notification: jasmine.SpyObj<NotificationService>;

  beforeEach(() => {
    notification = jasmine.createSpyObj<NotificationService>('NotificationService', ['success', 'error']);
    TestBed.configureTestingModule({
      providers: [{ provide: NotificationService, useValue: notification }]
    });
    service = TestBed.inject(PublicTournamentLinkService);
  });

  it('builds the public route path from the slug', () => {
    expect(publicTournamentPath('copa-verano-a1b2c3')).toBe('/tournaments/copa-verano-a1b2c3');
  });

  it('builds the absolute share URL from the current origin and the slug', () => {
    expect(service.shareUrl('copa-verano-a1b2c3')).toBe(`${window.location.origin}/tournaments/copa-verano-a1b2c3`);
  });

  it('copies the share URL to the clipboard and confirms success', async () => {
    const writeText = spyOn(navigator.clipboard, 'writeText').and.resolveTo();

    const copied = await service.copyShareUrl('copa-verano-a1b2c3');

    expect(copied).toBeTrue();
    expect(writeText).toHaveBeenCalledOnceWith(`${window.location.origin}/tournaments/copa-verano-a1b2c3`);
    expect(notification.success).toHaveBeenCalledOnceWith('admin.tournaments.share.copySuccess');
    expect(notification.error).not.toHaveBeenCalled();
  });

  it('reports an error when the clipboard rejects the write', async () => {
    spyOn(navigator.clipboard, 'writeText').and.rejectWith(new Error('denied'));

    const copied = await service.copyShareUrl('copa-verano-a1b2c3');

    expect(copied).toBeFalse();
    expect(notification.error).toHaveBeenCalledOnceWith('admin.tournaments.share.copyError');
    expect(notification.success).not.toHaveBeenCalled();
  });
});
