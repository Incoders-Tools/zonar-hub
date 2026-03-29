# LoadingState

## Purpose
Inline loading indicator for content areas. Shows a spinner with an optional translatable message.

## When to use
- Inline section loading (within a page area)
- Content fetches where the user stays on the same page
- Tab or panel content that loads asynchronously

## When NOT to use
- Full-screen blocking operations (use `LoaderOverlayComponent`)
- Long-running multi-stage workflows (use `ProgressBarComponent`)
- Known-layout loading (use skeletons)

## Inputs
| Input        | Type    | Default          | Description                        |
|-------------|---------|------------------|------------------------------------|
| showMessage | boolean | true             | Whether to display text message    |
| messageKey  | string  | 'state.loading'  | Translation key for message text   |

## Outputs
None.

## Accessibility
- `role="status"` on container
- `aria-label` bound to the message translation key

## Theming
- Spinner uses `--zh-border-subtle` and `--zh-primary`
- Text uses `--zh-text-secondary`

## i18n
- Default message key: `state.loading`
- Accepts custom keys via `messageKey` input

## Dependencies
- `TranslatePipe`
