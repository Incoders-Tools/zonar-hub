---
name: list-and-card-views
description: Mandatory pattern for any admin or operator list. Every listing must use the shared `zh-collection-view` component with a table + cards toggle, the shared `.zh-list-card` styles, and the default-mode rule (paginated → table, otherwise → cards).
---

# List and Card Views Skill

Use this skill whenever you create, refactor, or review any screen that renders a list of records (admin tools, catalog management, dashboards with tabular data, anything with a `<table>`, `<app-data-table>`, or a hand-rolled grid of items).

If a listing exists, this is the canonical pattern.
Do not create a parallel one.

---

## 1. Required component

Every list MUST be rendered through the shared component:

```
src/app/shared/components/zh-collection-view/zh-collection-view.component.ts
```

Selector: `<zh-collection-view>`.

Reference implementation already in production: `/admin/catalogs/tournament-rules` and (after this rollout) `/admin/categories`, `/admin/tournaments`, `/admin/sports`, `/admin/complexes`, `/admin/catalogs/genders`.

Do not:
- create another wrapper around `<app-data-table>`
- render a feature-specific cards grid alongside a table
- ship a list with only a table or only cards — the toggle is part of the contract

---

## 2. Required public API

```html
<zh-collection-view
  viewKey="<page-key>"
  [items]="rows()"
  [columns]="columns()"
  [loading]="facade.loading()"
  [error]="!!facade.error()"
  [selectable]="true | false"
  [reorderable]="true | false"
  [paginated]="true | false"
  [pageSize]="10"
  [trackByKey]="'id'"
  [rowActions]="rowActions"
  emptyMessageKey="<i18n-key>"
  (selectionChanged)="onSelectionChanged($event)"
  (sorted)="onSorted($event)"
  (rowAction)="onRowActionClicked($event)"
  (retried)="facade.load()">
  <ng-template #cardTpl let-row>
    <!-- shared card markup, see section 4 -->
  </ng-template>
</zh-collection-view>
```

Rules:
- `viewKey` is required and unique per page. The user's table/cards choice persists in localStorage under `zh.collection-view.mode.<viewKey>`.
- `cardTpl` is required. A page that ships without a card template breaks the toggle.
- The same `[columns]`, `[rowActions]`, `[selectable]`, `[reorderable]`, `[loading]`, `[error]`, `emptyMessageKey` must drive both modes.

---

## 3. Default mode rule

- If the listing IS paginated → default to **table** (`[paginated]="true"`).
- If the listing is NOT paginated → default to **cards**.
- The user's last choice for this page (saved by `viewKey`) overrides the default on subsequent visits.

This rule is enforced inside `ZhCollectionViewComponent` — do not re-implement it.

---

## 4. Shared card markup

Cards MUST use the shared classes defined in `src/styles.scss` (block prefix `.zh-list-card`):

```html
<div class="zh-list-card">
  <div class="zh-list-card__header">
    <div class="zh-list-card__title">
      <span class="zh-list-card__eyebrow">…optional, e.g. type / sku</span>
      <h3 class="zh-list-card__name">{{ row.name }}</h3>
      <p class="zh-list-card__subtitle">…optional, e.g. address</p>
    </div>
    <span class="zh-list-card__status zh-list-card__status--{{ variant }}">
      {{ row.statusLabel | t }}
    </span>
  </div>

  <div class="zh-list-card__meta">
    <span><strong>{{ 'common.label' | t }}:</strong> {{ row.value }}</span>
    <!-- more meta lines as needed -->
  </div>

  <p class="zh-list-card__description">…optional</p>
</div>
```

Status pill variants available: `--active`, `--inactive`, `--success`, `--info`, `--warning`, `--danger`, `--neutral`. Map them from your row's `statusVariant` field.

Do NOT introduce a feature-local `.foo-card` selector when the shared classes apply. If a page legitimately needs extra slots, extend `.zh-list-card` with BEM modifiers in that page's SCSS — never reinvent header/title/status/meta.

---

## 5. Equivalence rules between table and cards

For each list, the cards view must:
- show the same information density as a table row (no losing fields)
- include the same row actions (edit, delete, activate/inactivate, etc.) — provided through `[rowActions]`
- respect the same permissions (use the same `*ngIf`/`@if` guards you applied to row actions)
- honour pagination, filters, and sorting equally

If you cannot produce a card layout that conveys the same information, the list is not ready for shipping in this pattern; revisit the column set with the product owner.

---

## 6. Page wiring (TS side)

Replace `DataTableComponent` with `ZhCollectionViewComponent` in the page's `imports:[]` array. Keep the `DataTableColumn` import for the columns typing.

```ts
import { DataTableColumn } from '../../../../shared/components/data-table/data-table.component';
import { ZhCollectionViewComponent } from '../../../../shared/components/zh-collection-view/zh-collection-view.component';

@Component({
  …,
  imports: [
    …,
    ZhCollectionViewComponent,
    …
  ]
})
```

Row actions, columns, filters, facades stay identical to the previous data-table flow.

---

## 7. i18n / theming compliance

- Every label inside the card must be a translation key (`| t`).
- No hardcoded colors in card SCSS — use the design tokens (`--zh-text-primary`, `--zh-text-secondary`, `--zh-status-*-bg`, `--zh-status-*-text`, `--zh-radius-pill`, etc.).
- Verify the cards render correctly in all themes (`court-energy`, `clay-match`, `night-arena`).

---

## 8. Testing expectations

For each new or migrated page, the spec MUST cover:
- `zh-collection-view` is wired with the right `viewKey`, `items`, `columns`, `rowActions`, and event handlers.
- Mode toggle reflects the default rule (paginated → table, otherwise → cards) and persists per `viewKey`.
- Card template renders the same data as the table row when toggled.

---

## 9. When this skill applies

Triggers (use this skill):
- adding a new admin or operator list
- migrating an existing `<app-data-table>` page
- replacing a hand-rolled cards grid
- reviewing PRs that touch any admin listing

Skip (this skill does NOT apply):
- read-only single-record screens
- forms without an attached collection
- sub-grids inside a parent form (use the master-detail child-collection pattern instead)

---

## 10. Strict rule

If a page renders a list and does NOT use `<zh-collection-view>` with `cardTpl`, it is not complete.

If a card uses bespoke selectors instead of `.zh-list-card`, it is not consistent.

If both modes are not feature-equivalent (same actions, same permissions, same filters), it is not consistent.

In all three cases the change should be sent back for refactor.
