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
| `emptyMessageKey` | `string` | `'table.noData'` | Declarado, pero el template actual usa `app-empty-state` sin pasar este input. |
| `selectable` | `boolean` | `false` | Agrega checkbox por fila y checkbox de selección de página. |
| `paginated` | `boolean` | `false` | Activa paginación cliente sobre `data`. |
| `paginationPosition` | `'top' \| 'bottom' \| 'both'` | `'bottom'` | Ubicación de los controles de paginación. |
| `pageSize` | `number` | `10` | Tamaño de página para paginación cliente. |
| `trackByKey` | `string` | `'id'` | Campo usado para identificar filas, selección y `track`. |
| `reorderable` | `boolean` | `false` | Permite drag/drop de encabezados; solo reordena columnas localmente. |
| `rowActions` | `{ icon; labelKey; action; variant? }[]` | `[]` | Acciones por fila con icono Material. |
| `rowActionsFilter` | `(row: T) => actions[] \| null` | `null` | Permite acciones condicionales por fila. |
| `activeRowId` | `string \| null` | `null` | Marca una fila como activa si coincide con `trackByKey`. |

### Outputs
| Output | Payload | Cuándo emite |
|---|---|---|
| `rowSelected` | `T` | Al alternar una fila individual. |
| `selectionChanged` | `T[]` | Al alternar una fila, seleccionar página completa o limpiar selección. |
| `sorted` | `{ key: string; direction: 'asc' \| 'desc' }` | Al hacer click en una columna `sortable`. No ordena datos internamente. |
| `rowAction` | `{ action: string; row: T }` | Al accionar botón de fila o toggle de columna. |
| `retried` | `void` | Desde `app-error-state`. |

### Modelo auxiliar
`DataTableColumn` soporta `renderType: 'text' | 'pill' | 'date' | 'toggle' | 'icon'`, `translate`, `pillVariantKey`, `sortable`, `order` y `toggleAction`.

## Dependencias
| Tipo | Dependencia |
|---|---|
| Angular | `input`, `output`, `signal`, `computed`, `NgTemplateOutlet` |
| Material | `MatIcon`, `MatSlideToggle` |
| Pipes | `TranslatePipe`, `FormatDatePipe` |
| Componentes hijos | `LoadingStateComponent`, `EmptyStateComponent`, `ErrorStateComponent` |

## Comportamiento de template / estructura UI
- Renderiza wrapper scrollable con `<table role="grid">`.
- Prioridad de estados: `loading` > `error` > `empty` > tabla.
- Las columnas con key `actions` se omiten como columna de datos; las acciones salen de `rowActions`/`rowActionsFilter`.
- `pill` usa `data-variant` desde la fila; `toggle` emite acción pero revierte visualmente el slide-toggle al valor original; `date` usa `formatDate`; `icon` muestra `mat-icon` y nombre.
- La paginación es cliente, calculada sobre `data`, no server-side.

## Estados y variantes
- Loading: `app-loading-state`.
- Error: `app-error-state` con `retried`.
- Empty: `app-empty-state` sin mensaje personalizado efectivo actualmente.
- Selected: clase `data-table__row--selected`.
- Active: clase `data-table__row--active`.
- Disabled: solo en botones de paginación cuando están en límite; acciones no tienen disabled por API.
- Variantes visuales: acciones `primary`, `warn`, `danger`; pills por valores como `active`, `inactive`, `warning`, `danger`, `completed`, etc.

## Accesibilidad
- La tabla declara `role="grid"`.
- Checkbox global tiene `aria-label="Select all rows"`; checkbox de fila tiene texto hardcodeado `Select row`.
- Acciones usan `title` traducido, pero no `aria-label` explícito.
- Columnas ordenables se activan por click, sin soporte de teclado documentado en template.
- Drag/drop de columnas no expone instrucciones accesibles.

## i18n
- Encabezados (`labelKey`), acciones, paginación y celdas con `translate` usan `TranslatePipe`.
- Textos hardcodeados observados: `Select all rows`, `Select row`, símbolos de sort `▲/▼` y dash de icono vacío.
- `emptyMessageKey` está declarado pero no se pasa al empty state.

## Theming
- Usa tokens `--zh-*` para superficies, borde, texto, estados, radios, espacios, transición y elevación.
- Hay `color-mix` con tokens semánticos.
- Hardcoded styles observados: sombra mobile `rgba(0, 0, 0, 0.06)`; tamaños fijos de checkbox/iconos/botones; el resto se apoya mayormente en tokens.

## Testing
- `data-table.component.spec.ts` solo cubre creación del componente.
- Faltan pruebas de loading/error/empty, selección, sort, paginación, acciones, render types, retry y reorder.

## Guía de reutilización
- Usar para listados/tablas compartidas de administración antes de crear tablas específicas.
- Usar con `zh-collection-view` cuando la pantalla necesita alternar tabla/cards.
- No usar para edición de filas complejas o master-detail con FormArray hasta que exista/adapte el patrón de child collection.
- El consumidor debe ordenar datos ante `sorted`; el componente no modifica el orden de `data`.

## Compliance gaps
- Cobertura de tests superficial para un primitivo canónico.
- Algunos textos/labels accesibles están hardcodeados y no pasan por i18n.
- `emptyMessageKey` no se aplica en el template actual.
- Acciones no tienen disabled/aria-label completo.
- Reorder por drag/drop no es plenamente accesible.
