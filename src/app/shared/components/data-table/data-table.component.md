# DataTableComponent

## Propósito
Tabla compartida para listados administrativos y colecciones reutilizables. Renderiza columnas declarativas, filas genéricas y estados de lista sin que el consumidor implemente una tabla ad-hoc.

## API pública

### Inputs
| Input | Tipo | Default | Uso real |
|---|---:|---:|---|
| `columns` | `DataTableColumn[]` | requerido | Define columnas, etiqueta i18n, ordenamiento y tipo de render. |
| `data` | `T[]` | requerido | Filas renderizadas; `T extends Record<string, unknown>`. |
| `loading` | `boolean` | `false` | Muestra `app-loading-state` y oculta la tabla. |
| `error` | `boolean` | `false` | Muestra `app-error-state` con acción retry. |
| `emptyMessageKey` | `string` | `'table.noData'` | Mensaje del empty state; lo traduce el consumidor. |
| `selectable` | `boolean` | `false` | Agrega checkbox por fila y checkbox de selección de página. |
| `paginated` | `boolean` | `false` | Activa paginación cliente sobre `data`. |
| `paginationPosition` | `'top' \| 'bottom' \| 'both'` | `'bottom'` | Ubicación de los controles de paginación. |
| `pageSize` | `number` | `10` | Tamaño de página para paginación cliente. |
| `trackByKey` | `string` | `'id'` | Campo usado para identificar filas, selección y `track`. |
| `reorderable` | `boolean` | `false` | Permite drag/drop de encabezados; solo reordena columnas localmente. |
| `rowActions` | `{ icon; labelKey; action; variant? }[]` | `[]` | Acciones por fila con icono Material. |
| `rowActionsFilter` | `(row: T) => actions[] \| null` | `null` | Permite acciones condicionales por fila. |
| `activeRowId` | `string \| null` | `null` | Marca una fila como activa si coincide con `trackByKey`. |
| `serverSide` | `boolean` | `false` | Opt-in de paginación server controlada: `data` es la página actual y se renderiza tal cual (sin segundo slice). Muestra el pager aunque `paginated` sea false. |
| `page` | `number` | `1` | Página actual (1-based) en modo `serverSide`. Ignorado en modo cliente (usa `currentPage` interno). |
| `totalCount` | `number \| null` | `null` | Total de items en todas las páginas en modo `serverSide`; si es `null` usa `data.length`. |

### Outputs
| Output | Payload | Cuándo emite |
|---|---|---|
| `rowSelected` | `T` | Al alternar una fila individual. |
| `selectionChanged` | `T[]` | Al alternar una fila, seleccionar página completa o limpiar selección. |
| `sorted` | `{ key: string; direction: 'asc' \| 'desc' }` | Al hacer click en una columna `sortable`. No ordena datos internamente. |
| `rowAction` | `{ action: string; row: T }` | Al accionar botón de fila o toggle de columna. |
| `retried` | `void` | Desde `app-error-state`. |
| `pageChange` | `number` | Solo en `serverSide`: página solicitada por prev/next. No cambia la página internamente; el padre debe actualizar `page` y `data`. En modo cliente no emite. |

### Modelo auxiliar
`DataTableColumn` soporta `renderType: 'text' | 'pill' | 'date' | 'toggle' | 'icon'`, `translate`, `pillVariantKey`, `sortable`, `order` y `toggleAction`.

### Pager compartido (`DataTablePaginatorComponent`)
Componente propio en `../data-table-paginator/` (selector `app-data-table-paginator`; ver `data-table-paginator.component.md`). Es el único patrón de pager: lo usa la tabla y el modo cards de `zh-collection-view`. La tabla le pasa `page` (`currentPage` interno en cliente, `page` input en server), `pageSize`, `totalCount`, `visibleCount` (filas renderizadas) y escucha `pageChange` vía `goToPage`. Los estilos `data-table__pagination*` viven en `data-table-paginator.component.scss`.

## Dependencias
| Tipo | Dependencia |
|---|---|
| Angular | `input`, `output`, `signal`, `computed`, `NgTemplateOutlet` |
| Material | `MatIcon`, `MatSlideToggle` |
| Pipes | `TranslatePipe`, `FormatDatePipe` |
| Componentes hijos | `LoadingStateComponent`, `EmptyStateComponent`, `ErrorStateComponent`, `DataTablePaginatorComponent` |

## Comportamiento de template / estructura UI
- Renderiza wrapper scrollable con `<table role="grid">`.
- Prioridad de estados: `loading` > `error` > `empty` > tabla.
- Las columnas con key `actions` se omiten como columna de datos; las acciones salen de `rowActions`/`rowActionsFilter`.
- `pill` usa `data-variant` desde la fila (`pillVariantKey ?? key`). Si el valor de la celda es `null`, `undefined` o string vacío/en blanco, no se renderiza pill (celda vacía), lo que permite marcadores exclusivos como "principal" sin pills vacías en el resto de filas. `false` y `0` siguen renderizándose como pill. `toggle` emite acción pero revierte visualmente el slide-toggle al valor original; `date` usa `formatDate`; `icon` muestra `mat-icon` y nombre.
- Paginación cliente (default, `paginated`): calculada sobre `data` con `currentPage` interno; sin cambios para consumidores existentes.
- Paginación server (`serverSide`): renderiza `data` completo, rango y páginas desde `page`/`totalCount`, y emite `pageChange`. Al cambiar `page` se limpia `selectedIds` y se emite `selectionChanged([])` si había selección; `selectionChanged` siempre contiene solo filas de la página visible. El padre puede limpiar explícitamente con `clearSelection()`.
- Con `serverSide`, `data` vacío y `totalCount` 0 se muestra empty state sin pager; si `totalCount` > 0 (página fuera de rango) se mantiene el pager con rango `0–0 de total`, Siguiente deshabilitado y Anterior emitiendo `pageChange` con la última página válida.

## Estados y variantes
- Loading: `app-loading-state`.
- Error: `app-error-state` con `retried`.
- Empty: `app-empty-state` con el mensaje de `emptyMessageKey` (default `table.noData`).
- Selected: clase `data-table__row--selected`.
- Active: clase `data-table__row--active`.
- Disabled: solo en botones de paginación cuando están en límite (primera/última página, también con total 0); acciones no tienen disabled por API.
- Variantes visuales: acciones `primary`, `warn`, `danger`; pills por valores como `active`, `inactive`, `warning`, `danger`, `completed`, etc.

## Accesibilidad
- La tabla declara `role="grid"`.
- Checkbox global tiene `aria-label="Select all rows"`; checkbox de fila tiene texto hardcodeado `Select row`.
- Los botones de acción por fila son icon-only: el texto del `mat-icon` (p. ej. `star`) no debe ser el nombre accesible, por eso exponen `[attr.aria-label]` con la etiqueta traducida (`labelKey | t`) y conservan `title` traducido como tooltip nativo.
- Columnas ordenables se activan por click, sin soporte de teclado documentado en template.
- El pager es un `<nav>` con `aria-label` traducido (`admin.pagination.label`); botones `type="button"` con texto visible; el indicador `x / y` tiene prefijo visualmente oculto (`admin.pagination.page`) y `aria-live="polite"`.
- Drag/drop de columnas no expone instrucciones accesibles.

## i18n
- Encabezados (`labelKey`), acciones, paginación y celdas con `translate` usan `TranslatePipe`.
- Keys de paginación: `admin.pagination.showing`, `.of`, `.prev`, `.next`, `.label`, `.page` (es/en/pt).
- Textos hardcodeados observados: `Select all rows`, `Select row`, símbolos de sort `▲/▼` y dash de icono vacío.
- `emptyMessageKey` se pasa al `app-empty-state`; los mensajes traducidos los provee el consumidor.

## Theming
- Usa tokens `--zh-*` para superficies, borde, texto, estados, radios, espacios, transición y elevación.
- Hay `color-mix` con tokens semánticos.
- Hardcoded styles observados: sombra mobile `rgba(0, 0, 0, 0.06)`; tamaños fijos de checkbox/iconos/botones; el resto se apoya mayormente en tokens.

## Testing
- `data-table.component.spec.ts` cubre creación y el render type `pill`: sin pill para valores vacíos/nulos/en blanco, pill solo en la fila con valor, `false`/`0` visibles y `data-variant` desde `pillVariantKey`.
- También verifica que los botones de acción por fila exponen la etiqueta traducida como `aria-label` y `title`.
- Paginación: cliente default (slice local, `currentPage`, sin `pageChange`) y server (25 items con `pageSize` 20 sin segundo slice, `pageChange`, página controlada, prev/next disabled, labels accesibles, limpieza de selección al cambiar página, total 0).
- Prueba del empty state con `emptyMessageKey` personalizado (default `table.noData`).
- Faltan pruebas de loading/error, sort, acciones, resto de render types, retry y reorder.

## Guía de reutilización
- Usar para listados/tablas compartidas de administración antes de crear tablas específicas.
- Usar con `zh-collection-view` cuando la pantalla necesita alternar tabla/cards.
- No usar para edición de filas complejas o master-detail con FormArray hasta que exista/adapte el patrón de child collection.
- El consumidor debe ordenar datos ante `sorted`; el componente no modifica el orden de `data`.

## Compliance gaps
- Cobertura de tests parcial para un primitivo canónico (solo `pill` cubierto en profundidad).
- Algunos textos/labels accesibles están hardcodeados y no pasan por i18n.
- Acciones no soportan estado disabled.
- Reorder por drag/drop no es plenamente accesible.
