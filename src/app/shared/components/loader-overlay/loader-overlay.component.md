# LoaderOverlay

## Purpose
Full-screen blocking overlay spinner for short, unknown-duration operations that prevent user interaction.

## When to use
- Global data fetches that block the entire UI
- Route transitions with loading state
- Operations where the user must wait and cannot interact

## When NOT to use
- Long-running, multi-stage workflows (use `ProgressBarComponent` instead)
- Inline content loading (use `LoadingStateComponent` instead)
- Known-layout loading (use skeletons instead)

## Inputs
None.

## Outputs
None.

## Accessibility
- `role="status"` for screen reader announcements
- `aria-label` bound to the `state.loading` translation key

## Theming
- Uses `--zh-surface-overlay` for backdrop
- Uses `--zh-primary` and `--zh-border-subtle` for spinner colors

## i18n
- `state.loading` key used for accessible label

## Dependencies
- `TranslatePipe`
