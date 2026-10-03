# DataTablePaginatorComponent

## Propósito
Pager compartido y controlado (`app-data-table-paginator`). Es el único patrón de paginación de listados: lo usa `app-data-table` (paginación cliente y server) y el modo cards de `zh-collection-view` (paginación server). No guarda estado de página: renderiza `page`/`totalCount` y emite `pageChange`.

## API pública

### Inputs
| Input | Tipo | Default | Uso real |
|---|---:|---:|---|
| `page` | `number` | `1` | Página actual (1-based). |
| `pageSize` | `number` | `10` | Tamaño de página para calcular rango y cantidad de páginas. |
| `totalCount` | `number` | `0` | Total de items en todas las páginas. |
| `visibleCount` | `number \| null` | `null` | Filas realmente renderizadas en la página actual; define el fin del rango. Si es `null` se asume una página completa (`pageSize`). Permite reflejar páginas server que no coinciden con `pageSize` sin volver a recortar datos. |

### Outputs
| Output | Payload | Cuándo emite |
|---|---|---|
| `pageChange` | `number` | Al pulsar Anterior/Siguiente con una página válida (`1..totalPages`). Nunca cambia `page` internamente. |

### Métodos públicos
- `go(page)`: emite `pageChange` solo si `page` está dentro de `1..totalPages`.
- `previous()`: acción de Anterior; emite `min(page - 1, totalPages)`, de modo que desde una página fuera de rango salta a la última página válida.

## Dependencias
| Tipo | Dependencia |
|---|---|
| Angular | `input`, `output`, `computed` |
| Pipes | `TranslatePipe` |
| Estilos | `src/styles/_mixins.scss` (`visually-hidden`) |

## Comportamiento de template / estructura UI
- `<nav class="data-table__pagination">` con info de rango (`Mostrando x–y de total`) y controles prev / indicador `página / totalPages` / next.
- `totalPages = max(1, ceil(totalCount / pageSize))`.
- Rango: inicio `min((page - 1) * pageSize + 1, totalCount)`; fin `inicio + visibleCount - 1` acotado a `totalCount`.
- Rango vacío honesto: si `totalCount` es 0, la página está fuera de rango (`page > totalPages`) o `visibleCount` es 0, muestra `0–0 de total` en lugar de inventar una fila.
- Conserva las clases BEM `data-table__pagination*` del pager original de la tabla para no romper selectores existentes; los estilos viven en `data-table-paginator.component.scss`.

## Estados y variantes
- Primera página: Anterior deshabilitado.
- Última página: Siguiente deshabilitado.
- Fuera de rango (p. ej. `page` 5 con `totalCount` 20 y `pageSize` 10): Siguiente deshabilitado, Anterior habilitado y emite la última página válida (2), rango `0–0 de 20`.
- Total 0: ambos botones deshabilitados, indicador `1 / 1`. Los consumidores normalmente muestran empty state y no renderizan el pager en este caso.
- Mobile (`max-width: 599px`): info y controles se apilan centrados.

## Accesibilidad
- Landmark `<nav>` con `aria-label` traducido (`admin.pagination.label`).
- Botones `type="button"` con texto visible traducido; `disabled` nativo en los límites.
- Indicador de página con prefijo visualmente oculto (`admin.pagination.page`) y `aria-live="polite"` + `aria-atomic="true"` para anunciar cambios de página.

## i18n
- Keys: `admin.pagination.showing`, `admin.pagination.of`, `admin.pagination.prev`, `admin.pagination.next`, `admin.pagination.label`, `admin.pagination.page` (es/en/pt).
- Sin texto visible hardcodeado salvo el separador `–` y `/`.

## Theming
- Solo tokens `--zh-*` (espaciado, bordes, radios, superficies, texto, tipografía). Sin colores hardcodeados.
- `opacity: 0.4` para el estado disabled, igual que el pager previo de la tabla.

## Testing
- `data-table-paginator.component.spec.ts` cubre: rango/total/páginas en la primera página, `visibleCount` mayor que `pageSize` (sin segundo slice), última página con rango acotado y Siguiente deshabilitado, emisión controlada de `pageChange` (la página no cambia sola), recuperación fuera de rango (rango `0–0`, Siguiente deshabilitado, Anterior emite la última página válida), Anterior en rango emite `page - 1`, total 0 sin emisiones y labels accesibles traducidos.
- La integración se cubre además en los specs de `app-data-table` y `zh-collection-view`.

## Guía de reutilización
- Usar este componente para cualquier pager de listados; no crear botones prev/next ad-hoc.
- El consumidor es dueño de la página: escuchar `pageChange` y actualizar `page` (y los datos en modo server).
- En `zh-collection-view` en modo tabla el pager lo renderiza `app-data-table`; no agregar otro para evitar controles duplicados.
