# ZhCollectionViewComponent

## Propósito
Renderer genérico de colecciones que permite alternar entre tabla (`app-data-table`) y grilla de cards para el mismo dataset. Persiste la preferencia de vista por `viewKey` en `localStorage`.

## API pública

### Inputs
| Input | Tipo | Default | Uso real |
|---|---:|---:|---|
| `viewKey` | `string` | requerido | Clave estable para guardar modo en `localStorage`. |
| `items` | `T[]` | requerido | Colección a renderizar. |
| `columns` | `DataTableColumn[]` | `[]` | Columnas usadas en modo tabla. |
| `loading` | `boolean` | `false` | Estado loading. |
| `error` | `boolean` | `false` | Estado error. |
| `emptyMessageKey` | `string` | `'table.noData'` | Mensaje para empty en cards; se pasa también a data-table. |
| `paginated` | `boolean` | `false` | Se pasa a data-table y define modo inicial por defecto. |
| `pageSize` | `number` | `10` | Se pasa a data-table. |
| `selectable` | `boolean` | `false` | Se pasa a data-table. |
| `reorderable` | `boolean` | `false` | Se pasa a data-table. |
| `trackByKey` | `string` | `'id'` | Campo para track y selección. |
| `rowActions` | `ZhCollectionRowAction[]` | `[]` | Acciones en tabla y cards. |
| `rowActionsFilter` | `((row: T) => ZhCollectionRowAction[]) \| null` | `null` | Acciones condicionales por fila. Si se provee, reemplaza a `rowActions` para cada fila en tabla y cards; si es `null`, todas las filas usan `rowActions`. |
| `serverSide` | `boolean` | `false` | Opt-in de paginación server controlada. `items` es la página actual y se renderiza tal cual en tabla y cards (sin segundo slice). También fuerza modo inicial `table` si no hay preferencia guardada. |
| `page` | `number` | `1` | Página actual (1-based) en modo `serverSide`; se pasa a data-table y al pager de cards. |
| `totalCount` | `number \| null` | `null` | Total de items en todas las páginas en modo `serverSide`; si es `null` usa `items.length`. |

### Outputs
| Output | Payload | Cuándo emite |
|---|---|---|
| `rowAction` | `{ action: string; row: T }` | Acción de fila en tabla o card. |
| `selectionChanged` | `T[]` | Delegado de data-table. |
| `sorted` | `{ key: string; direction: 'asc' \| 'desc' }` | Delegado de data-table. |
| `retried` | `void` | Retry desde data-table o error state de cards. |
| `pageChange` | `number` | Solo en `serverSide`: página solicitada desde el pager de tabla o de cards. El padre debe actualizar `page` e `items`. |

### Content projection
| Template | Uso |
|---|---|
| `#cardTpl` | Template opcional para cards. Contexto: `{ $implicit: row, row }`. Si falta, renderiza `<pre>{{ row | json }}</pre>`. |

## Dependencias
| Tipo | Dependencia |
|---|---|
| Angular | `CommonModule`, `NgTemplateOutlet`, `ContentChild`, `TemplateRef`, `signal`, `computed`, `effect` |
| Material | `MatIcon` |
| Pipes | `TranslatePipe`, `JsonPipe` vía `CommonModule` |
| Componentes hijos | `DataTableComponent`, `DataTablePaginatorComponent` (`../data-table-paginator/`), `LoadingStateComponent`, `EmptyStateComponent`, `ErrorStateComponent` |
| Browser API | `localStorage` con try/catch |

## Comportamiento de template / estructura UI
- Toolbar con toggle table/cards.
- Modo inicial: valor guardado en `localStorage`; si no existe, `table` cuando `paginated` es true, `cards` cuando no lo es.
- Modo tabla delega render, selección, sort, paginación y estados a `app-data-table`.
- Modo cards gestiona sus propios estados y renderiza cards con template proyectado o JSON fallback.
- Paginación cliente (`paginated` sin `serverSide`): sin cambios; solo la tabla pagina y las cards muestran todos los `items` sin pager.
- Paginación server (`serverSide`): en tabla el pager lo renderiza `app-data-table` (el collection-view no agrega otro, así no hay botones duplicados); en cards el collection-view renderiza el mismo `app-data-table-paginator` debajo de la grilla. Con total 0 se muestra empty state sin pager; con items vacíos y total > 0 (página fuera de rango) se mantiene el pager (rango `0–0`, Siguiente deshabilitado, Anterior emite la última página válida) en tabla y cards.

## Estados y variantes
- View mode: `table` o `cards`.
- Loading en cards: `showLoading = loading && !hasItems`; si hay items y `loading=true`, sigue mostrando cards.
- Error en cards: `showError = error && !loading`.
- Empty en cards: `!hasItems`.
- Row actions con variantes `default`, `primary`, `warn`, `danger`.
- Acciones por card: se resuelven por fila con la misma regla que `app-data-table` (`rowActionsFilter(row)` o, sin filtro, `rowActions`). Si una fila no tiene acciones, la card omite el contenedor `.zh-collection-view__card-actions`.
- Diferencia conocida: `app-data-table` solo renderiza la columna de acciones cuando `rowActions` no está vacío; los callers que usan `rowActionsFilter` deben pasar también `rowActions` para que tabla y cards muestren lo mismo.
- Selected/sorted/reorderable existen solo en modo tabla por delegación.

## Accesibilidad
- Toggle de vista usa `role="group"`, `aria-label`, botones con `aria-pressed` y `aria-label` traducidos.
- Botones de acciones en cards tienen `aria-label` traducido.
- No anuncia persistencia de preferencia ni cambio de modo con live region.
- El pager compartido es un `<nav>` con `aria-label` traducido (`admin.pagination.label`), botones con texto visible y deshabilitados en los límites, e indicador `x / y` con prefijo oculto traducido (`admin.pagination.page`) en `aria-live="polite"`.

## i18n
- Usa keys `common.viewMode`, `common.viewTable`, `common.viewCards`, acciones y `emptyMessageKey`.
- El pager de cards reutiliza las keys `admin.pagination.*` (`showing`, `of`, `prev`, `next`, `label`, `page`) en es/en/pt.
- Fallback `<pre>{{ row | json }}</pre>` no es contenido de producto traducible; debe evitarse en pantallas finales mediante `#cardTpl`.
- No se observaron textos visibles hardcodeados salvo nombres de iconos Material.

## Theming
- Usa tokens `--zh-*` para layout, superficies, textos, bordes, radios, elevación y estados.
- Hardcoded fallback observado en SCSS: `#fff`, `#c19a00`, `#d32f2f` y tamaños fijos en algunos iconos; están detrás de fallback de variables pero conviene reemplazarlos por tokens completos.

## Testing
- `zh-collection-view.component.spec.ts` cubre creación, delegación de `rowActionsFilter` a data-table y acciones en modo cards: sin filtro, filtradas por fila, fila sin acciones y emisión de `rowAction`.
- Paginación: cards cliente sin pager (default sin cambios); en `serverSide` con 25 items y `pageSize` 20, un único pager en tabla, 25 cards + pager en cards, `pageChange` al avanzar, página controlada reflejada y total 0 sin pager.
- Pendiente: modo inicial, persistencia localStorage y estados loading/error/empty en cards.

## Guía de reutilización
- Usar en listados que necesitan alternativa cards/table sin duplicar lógica.
- Proveer siempre `viewKey` estable por pantalla y `#cardTpl` para UI final.
- No usar si la colección requiere edición inline compleja o child collection con FormArray; en ese caso debe estabilizarse el patrón master-detail reusable.

## Compliance gaps
- Cobertura de spec parcial (ver Testing).
- El fallback JSON no es apropiado para UI final de producto.
- Algunos fallbacks de color hardcodeados permanecen en SCSS.
