# Tournament card actions

## Objective
Fix two visible defects in `/admin/tournaments` card mode: the share action shows a raw translation key and the delete action overflows the card.

## Scope and constraints
- Reuse the existing translated share label rather than adding duplicate translations.
- Keep card actions inside the shared collection card at narrow widths without changing their behavior.
- Work directly on `dev` by explicit user request; publish this work unit there.
- No tests for this fix by explicit user request. Run a build and report that tests and browser verification were skipped.
- TDD mode: disabled for this task by explicit user request. Build runner: `npm run build`.
- Delivery strategy: ask-on-risk; forecast under 40 authored changed lines.

## Tasks
- [x] T1 — Correct share label and card action layout in the frontend; check resulting source, run `npm run build`, commit as a coherent work unit, and push `dev`. Route: delegated worker (two source files; multi-file writer trigger). Evidence: `share.label` replaces `common.share`; shared card actions wrap; worker and independent verifier both report `npm run build` passed and `git diff --check` passed. Work-unit commit `b303df862c4ef36bac488bf31196bc0c4b31745a` pushed to `origin/dev`.

## Acceptance
- The share action displays a translated label with available `es`, `en`, and `pt` entries.
- All card actions stay inside the card when the buttons do not fit one row.
- The build succeeds; tests and live browser verification remain explicitly pending.

## Progress
- Exploration identified missing `common.share` and a non-wrapping shared card-action row.
- Repo is clean on `dev`; `git pull --ff-only origin dev` reported already up to date.
- Engram mirror: pending (memory service returned `session has already ended`).
- Native risk assessment was unavailable (`package-local-binary-missing`); the returned plan required independent verification, which passed the build. No native review was started (RDD status unknown).
- Tests skipped by user request; browser layout verification pending.
- Parent spot-check: `git diff --check` passed before the work-unit commit.
- Next: visually verify the card at narrow widths in a browser when convenient; tests remain deferred by user request.
