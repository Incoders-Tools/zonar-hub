# OrganizationFormPanelComponent

## Purpose
Create/edit form for an organization inside the organizations admin page: identity (name, legal name, description, type), enabled sports, active status, and the public profile (consent plus contact links) used by the ZonarHub public tournament showcase.

## Inputs
- `organization: Organization | null` — `null` for create; an organization pre-fills every field, including the consent and links.
- `saving: boolean` — disables submit and shows the async-button loader while the parent saves.

## Outputs
- `submitted: OrganizationFormSubmitData` — identity fields, `isActive`, `selectedSportIds`, `publicProfileEnabled`, and the seven trimmed link values (`websiteUrl`, `instagramUrl`, `facebookUrl`, `tiktokUrl`, `youtubeUrl`, `whatsappPhone`, `contactEmail`). Blank links are emitted as `''`; the repository sends them as `null`.
- `cancelled: void`

## Dependencies
- `ApiSportRepository` — catalog sports and the organization's enabled sports
- Shared: `FormShellComponent`, `AsyncButtonComponent`, `ActiveToggleComponent` (active status and consent), `SportIconComponent`, `TranslatePipe`
- Shared validators: `httpUrlValidator`, `contactEmailValidator`, `whatsappPhoneValidator` (`shared/validators/contact.validators.ts`)

## Public profile section
- Consent toggle (`publicProfileEnabled`, off by default) with the statement "I want to appear for free in ZonarHub promotions and public sections…".
- Business help explains:
  - the win-win: ZonarHub shows real organizations to build trust, and the organization gains visibility in one more channel besides its social networks;
  - what is shown with consent: name, logo, description, type and the links;
  - that nothing is shown without consent (links stay saved but are not published) and every link is optional;
  - that save stays disabled while a link is invalid.
- Link fields, each with label, placeholder, helper text and a translated error:

| Field | Rule (mirrors the API) | Error keys |
| --- | --- | --- |
| Website, Instagram, Facebook, TikTok, YouTube | Absolute `http`/`https` URL with a host, ≤ 500 chars | `…publicProfile.error.url`, `…error.urlTooLong` |
| WhatsApp | `^\+?[0-9]{8,16}$` | `…error.whatsappPhone` |
| Contact email | One `@`, no spaces, dot in the domain, ≤ 254 chars | `…error.email`, `…error.emailTooLong` |

Values are trimmed before validation and submit. Blank values are valid.

## Validation and disabled submit
Submit (`canSubmit`) requires a valid form (name, type and every link), at least one sport, not saving, and — when editing — a change. Link errors render after the field is touched or edited.

## States
- Create / edit
- Sports loading failure → empty sports hint
- Saving → async-button loader, submit disabled
- Invalid link → inline error, submit disabled

## Accessibility
- Every link input has a `<label for>`; the hint and, when present, the error are linked through `aria-describedby`; invalid inputs set `aria-invalid="true"`; errors use `role="alert"`.
- The public-profile block is a `<section>` labelled by its heading. The consent toggle is a native checkbox with a visible status label.
- Inputs use `type="url" | "tel" | "email"` for the right mobile keyboard.

## i18n
`admin.organizations.*` and `admin.organizations.publicProfile.{title,consent,enabled,disabled,help.*,field.*,placeholder.*,hint.*,error.*}` in es, en and pt.

## Theming
Uses `--zh-*` spacing, radius, surface, border and text tokens. No hardcoded colors.

## Reuse guidance
Reuse the contact validators for any other contact or social-link form instead of new regexes. Keep the API PUT contract in mind: every profile field must be sent on update.
