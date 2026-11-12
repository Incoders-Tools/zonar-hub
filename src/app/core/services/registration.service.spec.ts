import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { RegistrationService } from './registration.service';

describe('RegistrationService', () => {
  let service: RegistrationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RegistrationService);
  });

  it('generates an active six-digit token for the tournament and lists it', fakeAsync(() => {
    let created: Awaited<ReturnType<RegistrationService['generateToken']>> | undefined;
    service.generateToken('t-1').then(token => (created = token));
    tick(300);

    expect(created?.tournamentId).toBe('t-1');
    expect(created?.isActive).toBeTrue();
    expect(created?.code).toMatch(/^\d{6}$/);
    expect(service.tokens()).toEqual([created!]);
  }));

  it('deactivates a token without removing it', fakeAsync(() => {
    service.generateToken('t-1');
    tick(300);
    const id = service.tokens()[0].id;

    service.deactivateToken(id);
    tick(300);

    expect(service.tokens().length).toBe(1);
    expect(service.tokens()[0].isActive).toBeFalse();
  }));

  it('has no registrations of a player: public registrations live in the API', () => {
    expect(service.getByPlayer('p-1')).toEqual([]);
  });
});
