# PhoneInputComponent

## Purpose

Shared phone number input with country code selector. Implements `ControlValueAccessor` for seamless Reactive Forms integration.

## Business context

Used in player registration, user profile, and contact forms. Provides a consistent phone input experience with country dial code selection and basic format validation.

## Value model

Full international number string, e.g. `"+5491112345678"`.

## Inputs

| Input            | Type      | Default             | Description                                      |
|------------------|-----------|---------------------|--------------------------------------------------|
| `placeholder`    | `string`  | `'phone.placeholder'` | Translation key for placeholder text             |
| `required`       | `boolean` | `false`             | Whether the field is required                    |
| `showValidation` | `boolean` | `true`              | Whether to show inline validation errors         |

## Outputs

Implements `ControlValueAccessor` — no direct outputs. Changes propagate through the form control.

Standalone usage alternative:
| Input/Output   | Type     | Description                        |
|----------------|----------|------------------------------------|
| `value`        | `string` | Standalone value binding (input)   |
| `valueChange`  | `string` | Standalone value change (output)   |

## Dependencies

- `ReactiveFormsModule` — for `ControlValueAccessor`
- `TranslatePipe` — for i18n placeholder and labels
- `I18nService` — for resolving placeholder translation

## Supported countries

Argentina, Brasil, Chile, Colombia, Ecuador, España, México, Paraguay, Perú, Uruguay, United States, Venezuela.

Extensible via `COUNTRY_CODES` constant.

## Variants and states

- **Default**: Argentina (+54) selected, empty input
- **With value**: Parsed from full international string
- **Disabled**: Both select and input disabled, reduced opacity
- **Invalid**: Red border on both fields, error message shown below
- **Touched**: Validation activates after first blur

## Validation rules

- Numbers must be 6–15 digits
- Only numeric characters allowed (spaces/dashes/parens stripped)
- If `required` is true, empty value defers to parent form required validation

## Accessibility notes

- Country selector has `aria-label` via `phone.countryCode` translation key
- Number input has `aria-label` via `phone.number` translation key
- `autocomplete="tel"` for browser autofill support

## Translation notes

Uses keys:
- `phone.countryCode` — aria label for country selector
- `phone.number` — aria label for number input
- `phone.placeholder` — default placeholder
- `phone.invalidFormat` — validation error message

## Theming notes

Uses design tokens:
- `--zh-border-default`, `--zh-danger`
- `--zh-surface-bg`
- `--zh-text-primary`, `--zh-text-muted`
- `--zh-radius-md`
- `--zh-space-*`, `--zh-font-size-*`

## Test expectations

- Creates and renders country selector + number input
- Defaults to Argentina (+54)
- Updates on country change and number input
- Computes full international value
- Parses phone via `writeValue`
- Resets on null value
- Shows error for invalid format after touch
- Respects disabled state
- Calls registered `onChange`/`onTouched` callbacks

## Reuse guidance

Use in any form requiring phone input:
```html
<app-phone-input formControlName="phone"></app-phone-input>
```

Or standalone:
```html
<app-phone-input [value]="'+5491112345678'" (valueChange)="onPhone($event)"></app-phone-input>
```
