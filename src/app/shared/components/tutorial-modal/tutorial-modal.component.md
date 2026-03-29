# TutorialModal

## Purpose
Floating, minimizable tutorial/help modal that supports YouTube embeds and HTML5 video. Used for contextual help in wizard flows and admin tools.

## Inputs
| Input | Type | Default | Description |
|-------|------|---------|-------------|
| titleKey | `string` | `'tutorial.title'` | i18n key for modal title |
| videoUrl | `string` | `''` | HTML5 video URL |
| youtubeUrl | `string` | `''` | YouTube embed URL |
| htmlContent | `string` | `''` | HTML help content |

## Outputs
| Output | Type | Description |
|--------|------|-------------|
| closed | `void` | User closed/dismissed the modal |

## Features
- Minimizable (collapses to header bar only)
- Fixed position bottom-right
- Scrollable content area
- YouTube embed priority over HTML5 video

## Accessibility
`role="dialog"` with `aria-label`. Close and minimize buttons have `aria-label`.

## Theming
Uses `--zh-primary`, `--zh-surface-elevated`, `--zh-elevation-lg` tokens.

## i18n
All text uses translation keys.
