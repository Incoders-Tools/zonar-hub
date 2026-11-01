import { FormArray, FormControl, FormGroup } from '@angular/forms';
import { buildMatchResult, sets } from '../../core/models/tournament-draw.testing';
import { DrawScoringRules, MatchResultLock } from '../../core/services/match-result-rules';
import { matchResultValidator } from './match-result.validator';

function setRow(home: number | null, away: number | null) {
  return new FormGroup({
    home: new FormControl(home),
    away: new FormControl(away),
    tiebreakHome: new FormControl<number | null>(null),
    tiebreakAway: new FormControl<number | null>(null)
  });
}

function buildForm(rules: () => DrawScoringRules, lock?: () => MatchResultLock) {
  return new FormGroup({
    status: new FormControl('completed'),
    winnerSide: new FormControl<string | null>('home'),
    sets: new FormArray([setRow(6, 4), setRow(4, 6), setRow(10, 8)]),
    courtName: new FormControl(''),
    scheduledAt: new FormControl(''),
    startedAt: new FormControl(''),
    finishedAt: new FormControl('')
  }, { validators: matchResultValidator(rules, lock) });
}

describe('matchResultValidator', () => {
  it('accepts a valid result and reports the first issue with its set index', () => {
    const form = buildForm(() => ({ bestOf: 3, thirdSetSuperTiebreak: true }));
    expect(form.valid).toBeTrue();

    form.controls.sets.at(2).patchValue({ home: 12, away: 9 });
    expect(form.errors).toEqual({ matchResult: { code: 'invalid_super_tiebreak', setIndex: 2 } });
  });

  it('follows the scoring rules on every run', () => {
    let rules: DrawScoringRules = { bestOf: 3, thirdSetSuperTiebreak: true };
    const form = buildForm(() => rules);
    rules = { bestOf: 3, thirdSetSuperTiebreak: false };
    form.updateValueAndValidity();
    expect(form.errors).toEqual({ matchResult: { code: 'invalid_set', setIndex: 2 } });
  });

  it('applies the lock rule', () => {
    const current = buildMatchResult({ status: 'completed', sets: sets([6, 4], [4, 6], [10, 8]), winnerSide: 'home' });
    const form = buildForm(() => ({ bestOf: 3, thirdSetSuperTiebreak: true }), () => ({ locked: true, current }));
    expect(form.valid).toBeTrue();

    form.controls.sets.at(2).patchValue({ home: 11, away: 9 });
    expect(form.errors).toEqual({ matchResult: { code: 'locked_by_next_match' } });
  });
});
