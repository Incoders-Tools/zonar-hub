# MatchResultDialogComponent

## Purpose

Result dialog of one draw match on the admin draw page (F3, D3/D4/D9). The organizer sets the status, the winner, the sets, the court and the times; the dialog validates them with the same rules as the API and emits the `PUT matches/{matchId}/result` body. It never calls HTTP: the page saves through `DrawPlannerService` and passes back the saving state and the API error.

## Feature context and business intent

- Scoring (S6, D3): best of 3 sets; the third set is a super tie-break to 10 when the draw options say so (`options.scoring.thirdSetSuperTiebreak`, default true). Walkover and retirement are supported.
- Progression (D4): a result can be entered only when both slots are resolved participants and the match is not a bye (the page checks it before opening the dialog). Once the winner played the next match, the result is locked: only the court and the times may change.

## Inputs

| Input | Type | Default | Description |
| --- | --- | --- | --- |
| `draw` | `TournamentDraw` (required) | — | The saved draw: scoring options, participant names and the lock rule. |
| `match` | `DrawMatch` (required) | — | The match; its stored `result` fills the form. |
| `saving` | `boolean` | `false` | The page is saving: submit shows a spinner, every action is disabled, cancel is ignored. |
| `errorKey` | `string \| null` | `null` | Translation key of the last API failure (`draws.errors.results.*`, `common.*`), shown as an alert inside the dialog. |

## Outputs

| Output | Payload | When |
| --- | --- | --- |
| `submitted` | `TournamentDrawMatchResultRequest` | Save with a valid form. |
| `cleared` | `TournamentDrawMatchResultRequest` (`scheduled`, no sets, no winner, court and planned time kept, start/end null) | Clear result confirmed in the confirm dialog. |
| `cancelled` | `void` | Cancel button, backdrop click or Escape (not while saving). |

## Dependencies

- `core/services/match-result-rules.ts` (pure): set and match rules, availability, lock rule, form ↔ request mapping, clear body.
- `shared/validators/match-result.validator.ts`: FormGroup validator adapting the rules (`{ matchResult: { code, setIndex? } }`).
- Shared: `FormShellComponent`, `AsyncButtonComponent`, `ConfirmDialogComponent`, `TranslatePipe`, `MatIcon`. Overlay markup follows the shared dialog pattern (`role="dialog"`, backdrop, panel).

## Form (Reactive Forms) and validation rules

| Control | Shown when | Rules |
| --- | --- | --- |
| `status` | always | `scheduled` · `inProgress` · `completed` · `walkover` · `retired` (radio group). |
| `winnerSide` | completed, walkover, retired | Required for those statuses; ignored otherwise. |
| `sets[]` (one row per possible set, 3) | in progress, completed, retired | Regular set: 6-0..6-4, 7-5 or 7-6. Tie-break inputs appear on a 7-6 row only (won by the set winner, to 7 by 2, beyond 7 by exactly 2). Super tie-break set: to 10 by 2, beyond by exactly 2, no tie-break inputs. Empty trailing rows are not sent; a half-filled row or an empty row before a filled one is invalid. |
| `courtName` | always | Optional; trimmed, empty → null. |
| `scheduledAt`, `startedAt`, `finishedAt` | always | Optional `datetime-local` (local time), sent as UTC ISO. The end cannot be before the start (the end input gets `min`). |

Status rules: completed needs a decided score whose winner is the chosen side; in progress keeps a partial score and no winner; walkover needs a winner and no sets; retired needs a winner and a partial score; scheduled has no sets and no winner. A locked match keeps its status, winner and sets.

The first issue is shown under the form (prefixed with the set label for set issues) with the translated `draws.errors.results.*` message, the same text the API error would show.

## States

- Editing (valid / invalid with the issue and the disabled-save hint).
- Saving (`saving`): spinner on save, actions disabled.
- API error (`errorKey`): alert inside the dialog; the form keeps the typed values.
- Locked: warning hint; clear disabled; outcome changes rejected.
- Clear confirmation (shared confirm dialog).

## Disabled-action behavior

- Save: disabled while the form has an issue or the page is saving.
- Clear result: only for a match with a stored score or a decided status; disabled when locked or saving.

## Accessibility notes

- `role="dialog"` with `aria-modal`, labelled by the "home vs away" line; Escape closes.
- Status and winner are native radio groups inside `fieldset`/`legend`; every score input has an `aria-label` with the set and the pair name.
- The validation issue is in an `aria-live="polite"` region; the API error is `role="alert"`.

## i18n notes

Keys under `adminDraw.resultDialog.*`, statuses reuse `bracket.status.*`, issue messages reuse `draws.errors.results.*`; es, en and pt. `{n}`, `{set}` and `{name}` are interpolated in the component.

## Theming notes

Only `--zh-*` semantic tokens (surfaces, borders, text, primary, warning, danger). No hardcoded colors.

## Reuse guidance

Keep score rules in `match-result-rules.ts` (they mirror the API domain); reuse `matchResultValidator` in any other result form (for example a future public or referee entry). Do not call HTTP from this component.
