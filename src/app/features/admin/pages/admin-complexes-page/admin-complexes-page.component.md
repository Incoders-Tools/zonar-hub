# Admin Complexes Page Component

## Propósito

`AdminComplexesPageComponent` es la pantalla principal de administración de complejos. Orquesta el CRUD de complejos, filtros, selección masiva, acciones destructivas, panel inline de alta/edición, gestión de canchas por complejo y edición básica de disponibilidad de una cancha.

## API pública

Componente standalone sin `@Input()` ni `@Output()` públicos: se consume por routing/página. Su estado externo entra por servicios inyectados.

| Tipo | Nombre | Descripción |
| --- | --- | --- |
| Servicio | `ComplexesFacadeService` | Boundary de orquestación para complejos, canchas, disponibilidad y deportes. Proveído a nivel componente. |
| Servicio | `AuthService` | Expone `isSystemAdmin` para mostrar columnas/campos técnicos. |
| Servicio | `ActiveOrganizationService` | Dispara recarga y reseteo de UI cuando cambia la organización activa. |
| Signal | `showFormPanel`, `editingComplex` | Controlan alta/edición inline. |
| Signal | `selectedComplexes` | Filas seleccionadas para bulk delete. |
| Signal | `courtsComplexId`, `courtsComplexName` | Controlan panel master-detail de canchas. |
| Signal | `availabilityCourtId` | Controla grilla de disponibilidad activa. |

## Dependencias

| Categoría | Dependencias |
| --- | --- |
| Angular | `CommonModule`, `OnInit`, `signal`, `computed`, `effect`, animación `slideDown`. |
| Material/CDK | `MatIcon`. |
| Shared UI | `zh-collection-view`, `filter-panel`, `confirm-dialog`, `async-button`, `help-button`. |
| Child components | `app-complexes-form-panel`, `app-complex-courts-panel`, `app-court-availability-grid`. |
| Pipes | `TranslatePipe` (`t`). |
| Modelos | `Complex`; `ComplexRow` local para render. |
| Services | `ComplexesFacadeService`, `AuthService`, `ActiveOrganizationService`. |

## Template behavior / estructura UI

- Header con título, subtítulo, botón de ayuda, bulk delete condicional y acción primaria de crear.
- Panel inline de alta/edición con `app-complexes-form-panel`; se cierra al guardar o cancelar.
- `app-filter-panel` colapsable con filtros por nombre y estado activo/inactivo.
- Vista principal en `zh-collection-view` con `viewKey="admin-complexes"`, selección, reordenamiento, acciones por fila, loading, empty y error.
- Card template custom para vista de tarjetas usando clases compartidas `.zh-list-card`.
- Panel de canchas debajo de la colección cuando se invoca la acción `courts`.
- Si la lectura de canchas falla, la sección de canchas reemplaza `app-complex-courts-panel` por una alerta compacta `.complexes-page__courts-alert` (`role="alert"`, key propia de la página `admin.complexes.courts.listLoadError`; no reutiliza `admin.complexes.courts.loadError`, cuyo texto "reintente antes de guardar" es exclusivo del formulario editable) con un `app-async-button` secundario `type="button"` (`common.retry`) que invoca `retryCourts()`. Así un fallo nunca se muestra como "sin canchas".
- Grilla de disponibilidad debajo del panel de canchas cuando se selecciona una cancha.
- Diálogos `app-confirm-dialog` para delete individual y bulk delete.

## States and variants

| Estado | Implementación actual |
| --- | --- |
| Loading | `facade.loading()` en `zh-collection-view`; `facade.loadingCourts()` en panel de canchas y en el botón retry de la alerta de canchas. |
| Empty | `emptyMessageKey="admin.complexes.emptyState"` en la colección; el empty de canchas solo aparece cuando la lectura de canchas fue exitosa y vacía. |
| Error | `zh-collection-view` recibe `[error]="!!facade.error()"` y emite retry hacia `facade.load()`. |
| Error de canchas | `facade.courtsError()` es un estado propio de las lecturas de canchas: no toca `facade.error()`, por lo que la colección de complejos sigue visible y sin error. Muestra la alerta acotada con retry y oculta el empty de canchas. Se limpia al reintentar, al cargar con éxito, al invalidar (cambio de organización) y al abrir otro complejo; las respuestas obsoletas (secuencia u organización activa distinta) se ignoran. |
| Success | Cierre del panel tras `saved`; la fachada actualiza signals locales tras create/update/delete. No hay toast local en este componente. |
| Disabled | Botón bulk delete solo aparece con selección; create se oculta mientras el form está abierto. |
| Selected | `selectedComplexes` se actualiza desde `selectionChanged`; habilita bulk delete. |
| Submitting/deleting | `facade.saving()` y `facade.deleting()` alimentan botones/diálogos. |
| Bulk selection/delete | Selección habilitada en `zh-collection-view`; `executeBulkDelete()` elimina ids seleccionados y limpia selección si success. |
| System admin | Agrega columnas `key`, `sortOrder`, `preponderance`. |
| Master-detail | Alterna panel de canchas por complejo y panel de disponibilidad por cancha. |

## Accessibility notes

- Botones de cierre tienen `aria-label` traducido con `common.close`.
- El componente delega semántica de tabla/tarjetas, selección y retry a `zh-collection-view`.
- Acciones destructivas requieren confirmación antes de ejecutarse.
- El template combina el nombre del complejo en el título de la sección de canchas; no define `aria-live` para cambios dinámicos.
- La alerta de fallo de canchas usa `role="alert"` para anunciarse; el retry es un botón nativo `type="button"` (no envía formularios) y queda deshabilitado mientras la lectura está en curso.

## i18n considerations

- Los textos principales usan translation keys vía `TranslatePipe` o inputs `*Key`.
- La alerta de fallo de canchas usa `admin.complexes.courts.listLoadError` (es/en/pt), texto corto sin referencia a guardar porque la sección de canchas de la página es de solo lectura/disponibilidad.
- Keys observadas: `admin.complexes.*`, `admin.bulkDelete`, `admin.confirmBulkDelete`, `common.*`.
- Texto dinámico no traducido observado: el separador literal ` - ` entre título de canchas y nombre del complejo.
- Los valores de estado se guardan como keys (`admin.complexes.status.active/inactive`) y se traducen al renderizar.

## Theming considerations

- SCSS usa tokens semánticos `--zh-*` para superficie, texto, borde, espaciado, radios y transiciones.
- Se reutilizan clases compartidas `.zh-list-card` para cards.
- No se observaron colores hardcodeados relevantes en el template; revisar SCSS si se cambia animación/estado visual.
- La alerta de canchas usa `--zh-danger`, `--zh-danger-soft`, `--zh-space-*`, `--zh-radius-sm` y `--zh-font-size-sm`, igual que la alerta de carga de canchas del formulario.

## Testing notes

`admin-complexes-page.component.spec.ts` cubre:

- creación del componente;
- carga inicial de complejos;
- abrir/cerrar form;
- alternar panel de canchas;
- fallo de lectura de canchas: alerta acotada con retry secundario `type="button"`, sin empty de canchas ni error de colección, y recuperación tras retry;
- empty genuino de canchas sin alerta;
- un fallo de canchas no se hereda al abrir otro complejo;
- aplicar/limpiar filtros;
- confirm/cancel delete;
- selección y sort.

No cubre en detalle: render real de dialogs, bulk delete exitoso/fallido, retry de error, cambio de organización activa, columnas condicionales por system admin, integración visual de disponibilidad.

## Admin CRUD compliance

Respecto de `.github/instructions/10-admin-crud.instructions.md` sección 5:

| Requisito Complexes CRUD | Estado actual |
| --- | --- |
| Help button | Cumple: `app-help-button`. |
| New button | Cumple: `app-async-button` de crear. |
| Filter panel | Cumple: `app-filter-panel`. |
| Sorting area dentro/asociada a filtros | Parcial: sort existe vía `zh-collection-view`/columnas, no como área visible específica dentro del panel de filtros. |
| Paginated management view | Depende de `zh-collection-view`; el componente lo consume. |
| Edit/delete | Cumple mediante acciones por fila. |
| Bulk selection/delete | Cumple mediante selección y diálogo bulk. |
| Loading/empty/error | Cumple para la colección principal; success se refleja por cierre/actualización local sin notificación visible local. |
| Mock repository/contracts si falta backend | Parcial/no actual: usa `ApiComplexRepository`; disponibilidad retorna arrays vacíos porque API no está implementada. |
| No bare table | Cumple: usa `zh-collection-view`, ayuda, filtros y paneles. |

## Reuse guidance

- Usar esta página como composición feature-first del CRUD de complejos, no como componente reutilizable genérico.
- Para nuevas listas admin, preferir `zh-collection-view` con `viewKey` persistente y no reintroducir tablas feature-specific.
- Para child collections tipo canchas, evaluar migración al patrón shared child-collection cuando esté disponible.

## Compliance gaps

- El panel de canchas usa `app-data-table` en su subcomponente, no el patrón `zh-collection-view` ni un shared child-collection para master-detail.
- La sección de disponibilidad contiene rango de fechas disabled/future-ready; al habilitarlo debe cumplir date-range safety: validación cruzada, mensajes traducidos y submit deshabilitado.
- No hay notificación de success explícita en esta página.
- Disponibilidad no tiene integración API real: `ApiComplexRepository.getAvailabilityByCourtId/saveAvailability` devuelven `[]`.
