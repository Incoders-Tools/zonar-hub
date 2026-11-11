import {
  RegistrationCapacity,
  allowedManualPayments,
  allowedRegistrationTransitions,
  isRegistrationCapacityFull
} from './tournament-registration.model';

const capacity = (overrides: Partial<RegistrationCapacity> = {}): RegistrationCapacity => ({
  maxPairs: 8, confirmed: 3, pending: 2, waitlisted: 1, placesLeft: 5, ...overrides
});

describe('tournament registration rules (D2)', () => {
  it('lets a pending registration be confirmed, rejected, waitlisted or cancelled', () => {
    expect(allowedRegistrationTransitions('pending')).toEqual(['confirm', 'reject', 'waitlist', 'cancel']);
  });

  it('lets a waitlisted registration be confirmed or cancelled', () => {
    expect(allowedRegistrationTransitions('waitlisted')).toEqual(['confirm', 'cancel']);
  });

  it('lets a confirmed registration only be cancelled', () => {
    expect(allowedRegistrationTransitions('confirmed')).toEqual(['cancel']);
  });

  it('allows no change from the final statuses', () => {
    expect(allowedRegistrationTransitions('rejected')).toEqual([]);
    expect(allowedRegistrationTransitions('cancelled')).toEqual([]);
  });

  it('marks paid from pending or failed and refunded from paid only (D5)', () => {
    expect(allowedManualPayments('pending')).toEqual(['paid']);
    expect(allowedManualPayments('failed')).toEqual(['paid']);
    expect(allowedManualPayments('paid')).toEqual(['refunded']);
    expect(allowedManualPayments('refunded')).toEqual([]);
    expect(allowedManualPayments('notRequired')).toEqual([]);
  });

  it('is full when no place is left and never full without a limit', () => {
    expect(isRegistrationCapacityFull(capacity({ placesLeft: 0, confirmed: 8 }))).toBeTrue();
    expect(isRegistrationCapacityFull(capacity({ placesLeft: 1 }))).toBeFalse();
    expect(isRegistrationCapacityFull(capacity({ maxPairs: null, placesLeft: null }))).toBeFalse();
    expect(isRegistrationCapacityFull(null)).toBeFalse();
  });
});
