import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import {
  DrawScoringRules,
  MatchResultFormValue,
  MatchResultLock,
  validateMatchResultForm
} from '../../core/services/match-result-rules';

/**
 * FormGroup-level validator of a match result form (F3). The group value must have the `MatchResultFormValue`
 * shape (status, winnerSide, sets[], courtName, scheduledAt, startedAt, finishedAt). The rules live in
 * `core/services/match-result-rules.ts` (mirror of the API domain); this only adapts them to Reactive Forms.
 *
 * Error: `{ matchResult: MatchResultIssue }`; translate it with `matchResultIssueKey`.
 * `rules` and `lock` are read on every run, so they can follow signals.
 */
export function matchResultValidator(rules: () => DrawScoringRules, lock: () => MatchResultLock | undefined = () => undefined): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const raw = (group as AbstractControl & { getRawValue?: () => unknown }).getRawValue?.() ?? group.value;
    const issue = validateMatchResultForm(raw as MatchResultFormValue, rules(), lock());
    return issue ? { matchResult: issue } : null;
  };
}
