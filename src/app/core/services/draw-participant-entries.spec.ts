import {
  DrawParticipantEntry,
  drawOptionsForRequest,
  isValidDrawSeed,
  parseDrawParticipantPaste,
  toDrawRequestParticipants,
  validateDrawParticipantEntries
} from './draw-participant-entries';

function entry(displayName: string, members: string[], overrides: Partial<DrawParticipantEntry> = {}): DrawParticipantEntry {
  return { id: null, displayName, members, seedRank: null, separationKey: null, ...overrides };
}

describe('draw participant paste parser', () => {
  it('parses one pair per line with optional seed and club markers in any order', () => {
    const result = parseDrawParticipantPaste(
      [
        'Ana Gómez / Bea Pérez [1] #Club Norte',
        '',
        '  Caro Ruiz/Dani Sosa  ',
        'Eva Díaz / Flor Torres #Club Sur [2]'
      ].join('\n'),
      'pair'
    );

    expect(result.issues).toEqual([]);
    expect(result.entries).toEqual([
      entry('Ana Gómez / Bea Pérez', ['Ana Gómez', 'Bea Pérez'], { seedRank: 1, separationKey: 'Club Norte' }),
      entry('Caro Ruiz / Dani Sosa', ['Caro Ruiz', 'Dani Sosa']),
      entry('Eva Díaz / Flor Torres', ['Eva Díaz', 'Flor Torres'], { seedRank: 2, separationKey: 'Club Sur' })
    ]);
  });

  it('parses one player per line for individual draws', () => {
    const result = parseDrawParticipantPaste('Ana Gómez [3]\nBea Pérez #Norte', 'individual');

    expect(result.issues).toEqual([]);
    expect(result.entries).toEqual([
      entry('Ana Gómez', ['Ana Gómez'], { seedRank: 3 }),
      entry('Bea Pérez', ['Bea Pérez'], { separationKey: 'Norte' })
    ]);
  });

  it('parses a team name before a colon and its members separated by slashes', () => {
    const result = parseDrawParticipantPaste('Los Halcones: Ana / Bea / Caro [1]', 'team');

    expect(result.issues).toEqual([]);
    expect(result.entries).toEqual([entry('Los Halcones', ['Ana', 'Bea', 'Caro'], { seedRank: 1 })]);
  });

  it('reports invalid lines by their line number', () => {
    const result = parseDrawParticipantPaste(
      [
        'Ana Gómez / Bea Pérez',
        'Solo Uno',
        'Caro Ruiz / ',
        'Dani Sosa / Eva Díaz [0]',
        'Flor Torres / Gabi Luna [x]',
        'Ana Gómez / Bea Pérez',
        'Hilda Rey / Ines Vega [1] [2]'
      ].join('\n'),
      'pair'
    );

    expect(result.issues).toEqual([
      { position: 2, key: 'memberCount' },
      { position: 3, key: 'memberRequired' },
      { position: 4, key: 'invalidSeed' },
      { position: 5, key: 'invalidSeed' },
      { position: 6, key: 'duplicateName' },
      { position: 7, key: 'invalidSeed' }
    ]);
    expect(result.entries.length).toBe(7);
  });

  it('reports team lines without a name or members and individual lines with two names', () => {
    expect(parseDrawParticipantPaste('Ana / Bea', 'team').issues).toEqual([{ position: 1, key: 'teamNameRequired' }]);
    expect(parseDrawParticipantPaste('Los Halcones:', 'team').issues).toEqual([{ position: 1, key: 'memberRequired' }]);
    expect(parseDrawParticipantPaste('Ana / Bea', 'individual').issues).toEqual([{ position: 1, key: 'memberCount' }]);
  });

  it('reports duplicate seeds on the later line', () => {
    const result = parseDrawParticipantPaste('Ana / Bea [1]\nCaro / Dani [1]', 'pair');

    expect(result.issues).toEqual([{ position: 2, key: 'duplicateSeed' }]);
  });
});

describe('draw participant validation', () => {
  it('accepts a valid list', () => {
    expect(validateDrawParticipantEntries([entry('A', ['A']), entry('B', ['B'])], 'individual')).toEqual([]);
  });

  it('requires at least two participants and at most 256', () => {
    expect(validateDrawParticipantEntries([entry('A', ['A'])], 'individual')).toEqual([{ position: null, key: 'minParticipants' }]);
    const many = Array.from({ length: 257 }, (_, index) => entry(`P${index}`, [`P${index}`]));
    expect(validateDrawParticipantEntries(many, 'individual')).toEqual([{ position: null, key: 'maxParticipants' }]);
  });

  it('flags empty members, duplicate names (case-insensitive) and duplicate seeds by row', () => {
    const issues = validateDrawParticipantEntries(
      [
        entry('Ana / Bea', ['Ana', 'Bea'], { seedRank: 1 }),
        entry('ana / bea', ['ana', 'bea']),
        entry('Caro / ', ['Caro', '']),
        entry('Dani / Eva', ['Dani', 'Eva'], { seedRank: 1 })
      ],
      'pair'
    );

    expect(issues).toEqual([
      { position: 2, key: 'duplicateName' },
      { position: 3, key: 'memberRequired' },
      { position: 4, key: 'duplicateSeed' }
    ]);
  });
});

describe('draw request mapping', () => {
  it('keeps existing participant ids and assigns free p{n} ids to new entries', () => {
    const participants = toDrawRequestParticipants([
      entry('A', ['A'], { id: 'p2' }),
      entry('B', ['B'], { seedRank: 1, separationKey: 'Norte' }),
      entry('C', ['C'])
    ]);

    expect(participants).toEqual([
      { id: 'p2', displayName: 'A', members: ['A'], seedRank: null, separationKey: null },
      { id: 'p1', displayName: 'B', members: ['B'], seedRank: 1, separationKey: 'Norte' },
      { id: 'p3', displayName: 'C', members: ['C'], seedRank: null, separationKey: null }
    ]);
  });

  it('sends only the options of the selected format', () => {
    const settings = {
      thirdPlaceMatch: true, legs: 2, groupSizing: 'count' as const, groupCount: 3, groupSize: 4,
      qualifiersPerGroup: 2, thirdSetSuperTiebreak: false
    };

    expect(drawOptionsForRequest('singleElimination', settings)).toEqual({
      knockout: { thirdPlaceMatch: true }, scoring: { thirdSetSuperTiebreak: false }
    });
    expect(drawOptionsForRequest('roundRobin', settings)).toEqual({
      roundRobin: { legs: 2 }, scoring: { thirdSetSuperTiebreak: false }
    });
    expect(drawOptionsForRequest('groupsThenKnockout', settings)).toEqual({
      groups: { groupCount: 3, qualifiersPerGroup: 2 },
      roundRobin: { legs: 2 },
      knockout: { thirdPlaceMatch: true },
      scoring: { thirdSetSuperTiebreak: false }
    });
    expect(drawOptionsForRequest('groupsThenKnockout', { ...settings, groupSizing: 'size' }).groups)
      .toEqual({ groupSize: 4, qualifiersPerGroup: 2 });
  });

  it('accepts empty or unsigned 64-bit decimal seeds only', () => {
    expect(isValidDrawSeed('')).toBeTrue();
    expect(isValidDrawSeed('0')).toBeTrue();
    expect(isValidDrawSeed('18446744073709551615')).toBeTrue();
    expect(isValidDrawSeed('18446744073709551616')).toBeFalse();
    expect(isValidDrawSeed('-1')).toBeFalse();
    expect(isValidDrawSeed('12a')).toBeFalse();
  });
});
