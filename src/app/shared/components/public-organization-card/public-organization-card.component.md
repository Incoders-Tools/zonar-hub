# PublicOrganizationCardComponent

## Purpose

Shows the public profile of an organization next to its public tournaments: logo, display name, type, description and links (website, Instagram, Facebook, TikTok, YouTube, WhatsApp, contact email).

## Feature context

Public tournament showcase (S5, S6): `/tournaments` cards, the home upcoming-tournaments section and the public tournament detail.

## Business intent

Organizations that turn on their public profile in the backoffice gain visibility, and ZonarHub shows visitors that real organizations use it. The API sends `organization` only when that consent is on, so the parent renders this component only when `tournament.organization` is not null. No organization data appears without consent.

## Inputs

| Input | Type | Default | Description |
| --- | --- | --- | --- |
| `organization` | `PublicOrganization` (required) | — | Public organization block from `GET /api/public/tournaments`. |
| `compact` | `boolean` | `false` | Tournament-card variant: smaller logo, no description. |

## Outputs

None.

## Dependencies

- `I18nService` and `TranslatePipe` (type label and link labels)
- `MatIcon` (Material Symbols only, per the icon-system skill)
- `PublicOrganization` model (`core/models/public-tournament.model.ts`)

## Variants and states

| State | Rendering |
| --- | --- |
| Logo present | `<img>` with empty `alt` (the name is shown next to it) |
| No logo | `apartment` icon fallback |
| `compact = false` | Description shown when present |
| `compact = true` | Description hidden |
| No links (`links` is `{}`) | Links list not rendered |

## Link rules

| Link | `href` | Opens |
| --- | --- | --- |
| Website, Instagram, Facebook, TikTok, YouTube | Stored URL, only when it starts with `http://` or `https://` | New tab, `rel="noopener noreferrer"` |
| WhatsApp | `https://wa.me/<digits>` (every non-digit removed from the phone) | New tab, `rel="noopener noreferrer"` |
| Contact email | `mailto:<email>` | Same tab |

Links appear in this order and only when the API sends them.

## Accessibility notes

- The block is a `section` labelled "Organized by".
- Each icon link has an `aria-label` (and `title`) naming the network and the organization, and says when it opens a new tab. Icons are `aria-hidden`.
- Links have a visible focus ring.

## i18n considerations

- Keys: `publicOrganization.organizedBy`, `publicOrganization.links.listLabel`, `publicOrganization.links.<website|instagram|facebook|tiktok|youtube|whatsapp|email>` (with a `{name}` placeholder) and the existing `organization.type.<type>`.
- Labels recompute when the locale changes.

## Theming considerations

Only `--zh-*` tokens (surface, border, text, primary, focus). Works in court-energy, clay-match and night-arena.

## Reuse guidance

Use it wherever an organization's public profile is shown. Do not render organization data from other sources with it: it assumes the public-profile consent the API already enforced.
