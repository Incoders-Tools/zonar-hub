# FilterPanelComponent

## Propósito
Panel compartido para filtros simples y construcción de reglas de ordenamiento multi-criterio en pantallas administrativas/listados.

## API pública

### Inputs
| Input | Tipo | Default | Uso real |
|---|---:|---:|---|
| `fields` | `FilterField[]` | requerido | Campos renderizados como texto o select. |
| `sortFields` | `SortOption[]` | `[]` | Campos disponibles para reglas de ordenamiento. |
| `defaultSortRules` | `SortRule[]` | `[]` | Copiadas a `sortRules` en `ngOnInit`. |
| `collapsible` | `boolean` | `false` | Muestra botón de colapsar/expandir. |
| `defaultCollapsed` | `boolean` | `false` | Inicializa el panel colapsado en `ngOnInit`. |

### Outputs
| Output | Payload | Cuándo emite |
|---|---|---|
| `filtersApplied` | `Record<string, string>` | Al hacer click en aplicar. |
| `filtersCleared` | `void` | Al limpiar filtros. |
| `sortRulesChanged` | `SortRule[]` | Al agregar, remover, cambiar o reordenar reglas; también emite `[]` al limpiar. |

### Modelos auxiliares
| Modelo | Campos |
|---|---|
| `FilterField` | `key`, `labelKey`, `type: 'text' | 'select'`, `options?: { value; labelKey }[]` |
| `SortOption` | `key`, `labelKey` |
| `SortRule` | `field`, `dir: 'asc' | 'desc'` |

## Dependencias
| Tipo | Dependencia |
|---|---|
| Angular | `input`, `output`, `signal`, `FormsModule` con `ngModel` |
| CDK | `CdkDropList`, `CdkDrag`, `CdkDragHandle`, `moveItemInArray` |
| Pipes | `TranslatePipe` |

## Comportamiento de template / estructura UI
- Renderiza un contenedor `.filter-panel` con cuerpo de campos y acciones.
- Soporta campos `text` y `select`; no soporta fechas, multiselect ni autocomplete en el estado actual.
- El subpanel `sort-builder` permite abrir/cerrar reglas, agregar reglas sin repetir campo, cambiar dirección, remover y reordenar por drag/drop.
- `values` y `sortRules` son estado mutable público del componente; filtros no se aplican automáticamente al tipear.

## Estados y variantes
- Collapsed/expanded por `collapsible` + `collapsed`.
- Sort panel abierto/cerrado por `sortsOpen`.
- Empty de sort rules: muestra `filter.noSortRules`.
- Active filters: getter `hasActiveFilters`, actualmente no usado visualmente en template.
- Disabled: no hay inputs/buttons disabled salvo que no haya campos disponibles para agregar regla.
- Loading/error/success: no forman parte de este primitivo.

## Accesibilidad
- Labels asociados con `for="filter-{key}"`.
- Botón remover sort rule usa `aria-label` traducido.
- Botones de toggle no declaran `aria-expanded` ni `type="button"`.
- Drag handle no tiene texto/instrucciones accesibles.

## i18n
- Usa keys para labels de campos/opciones y acciones (`filter.title`, `filter.search`, `common.viewAll`, `filter.clear`, etc.).
- Textos/símbolos hardcodeados observados: iconos visuales `▸`, `✕`, `⠿` y prefijo `+`; son símbolos, no copias traducibles completas.
- El spec usa labelKeys de ejemplo como `Name`, `Level`, `Date`, pero eso no afecta runtime.

## Theming
- SCSS usa tokens `--zh-*` para superficies, texto, bordes, spacing, radio y estados.
- Se observan tamaños fijos y símbolos; revisar SCSS si se requiere densidad configurable global.

## Testing
- `filter-panel.component.spec.ts` cubre creación y lógica del sort builder: agregar/remover reglas, emisión, no exceder campos, campos disponibles, clear, defaults y toggle.
- Faltan pruebas de template para filtros text/select, aplicar, colapsable, drag/drop real y accesibilidad.

## Guía de reutilización
- Usar como panel estándar de filtros en CRUD/listados antes de crear filtros locales.
- Mantenerlo para filtros simples. Si la pantalla requiere fechas/rangos, autocomplete o multiselect, extender este primitivo o un componente compartido relacionado en vez de crear un patrón paralelo.
- El consumidor es responsable de ejecutar la consulta o filtrar datos al recibir `filtersApplied`/`sortRulesChanged`.

## Compliance gaps
- No cubre loading/empty/error/success porque es un panel de control, pero las pantallas consumidoras sí deben cubrir esos estados.
- Falta soporte actual para rangos de fechas y validación cruzada global de date ranges.
- Accesibilidad de colapsado y drag/drop incompleta.
- Tests aún no cubren interacciones DOM principales.
