# Complex Courts Panel Component

## Propósito

`ComplexCourtsPanelComponent` presenta canchas en dos modos: `draftMode` dentro del formulario agregado permite crear, editar y eliminar borradores sin persistirlos directamente; `availabilityOnly` en la lista separada muestra canchas persistidas y permite abrir su disponibilidad, sin mutaciones de canchas. El formulario padre es dueño del guardado atómico de complejo y canchas.

## API pública

### Inputs

| Input | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `complexId` | `string` | No | Id del complejo padre para nuevas canchas; predeterminado `''` antes de crear el complejo. |
| `courts` | `Court[]` | Sí | Colección de canchas a renderizar. |
| `draftMode` | `boolean` | No | Edición local de borradores; oculta disponibilidad. |
| `availabilityOnly` | `boolean` | No | Solo disponibilidad para canchas persistidas; oculta y bloquea crear, editar y eliminar. |
| `mutationsBlocked` | `boolean` | No | Bloquea cambios de borrador durante la carga o el guardado agregado. |
| `loading` | `boolean` | No | Estado de carga de canchas. Default `false`. |
| `saving` | `boolean` | No | Estado de guardado/eliminación de cancha. Default `false`. |
| `activeCourtId` | `string \| null` | No | Id de la cancha cuya disponibilidad está abierta. |
| `sports` | `Sport[]` | No | Deportes disponibles para asignar por checkboxes. |

### Outputs

| Output | Tipo | Descripción |
| --- | --- | --- |
| `courtSaved` | `Court \| Omit<Court, 'id'>` | Emite payload de create/update hacia el padre. |
| `courtDeleted` | `string` | Emite id de cancha confirmada para eliminar. |
| `availabilityRequested` | `string` | Emite id de cancha para abrir/cerrar disponibilidad. |
| `editorOpen` | `boolean` | Informa al formulario padre cuando el editor de borradores se abre o se cierra. |

### Estado interno

| Signal / propiedad | Descripción |
| --- | --- |
| `showForm` | Muestra/oculta form inline. |
| `editingCourt` | Cancha en edición o `null` para creación. |
| `showDeleteDialog`, `deletingId` | Controlan confirmación destructiva. |
| `courtForm` | Reactive Form inicializado al abrir create/edit. |

## Dependencias

| Categoría | Dependencias |
| --- | --- |
| Angular | `CommonModule`, `ReactiveFormsModule`, signals, animación `slideDown`. |
| Material/CDK | `MatIcon`. |
| Shared UI | `DataTableComponent`, `AsyncButtonComponent`, `ConfirmDialogComponent`, `ActiveToggleComponent`. |
| Forms | `FormBuilder`, `FormGroup`, `Validators.required`. |
| Pipes | `TranslatePipe`. |
| Modelos | `Court`, `Sport`; `CourtRow` local. |

## Template behavior / estructura UI

- Header con título y botón de nueva cancha cuando el form no está abierto.
- Form inline animado con campos: nombre, superficie, deportes, indoor y activo.
- Superficies fijas: `synthetic`, `cement`, `grass`, `clay`.
- Deportes se muestran como checkboxes generados desde `sports()`; el texto visible usa `sport.name` directamente.
- Tabla `app-data-table` con columnas nombre, superficie, indoor y estado. En `draftMode` muestra editar/eliminar; en `availabilityOnly` solo disponibilidad. Los cambios de borrador se guardan únicamente con el complejo mediante la operación agregada atómica.
- Confirm dialog para eliminación individual.

## States and variants

| Estado | Implementación actual |
| --- | --- |
| Loading | Pasado a `app-data-table` desde `loading()`. |
| Empty | `emptyMessageKey="admin.complexes.courts.emptyState"`. |
| Error | No recibe error propio; depende del padre/fachada y de `DataTableComponent` si aplica. |
| Success | Emite `courtSaved`/`courtDeleted` y cierra form/dialog local; no muestra toast local. |
| Disabled | Submit deshabilitado si form inválido o si edición no tiene cambios (`!dirty`). |
| Selected/active | `activeCourtId` marca la fila activa en `app-data-table`. No hay selección masiva. |
| Submitting | `saving()` alimenta `app-async-button` y confirm dialog. |
| Delete | Requiere confirmación vía `app-confirm-dialog`. |

## Accessibility notes

- Botón de cierre del form tiene `aria-label` traducido con `common.close`.
- Los inputs nativos tienen labels visibles.
- Checkboxes de deportes usan labels envolventes.
- Falta feedback de error textual bajo el campo `name`: solo aplica clase `.error` cuando está touched/invalid.
- La tabla y acciones delegan semántica a `DataTableComponent`.

## i18n considerations

- Labels, botones, columnas, estados y confirmación usan translation keys `admin.complexes.courts.*` y `common.*`.
- `sport.name` viene del modelo y se renderiza como dato de negocio, no como key traducida.
- No se observaron textos UI hardcodeados relevantes fuera de nombres de datos y comentarios.

## Theming considerations

- SCSS usa tokens `--zh-*` para fondo, borde, texto, spacing, radius, danger/primary y transiciones.
- Usa inputs/selects nativos estilados localmente, no componentes Material para todos los controles.
- No se observaron colores hardcodeados significativos; los estados dependen de tokens semánticos.

## Testing notes

`complex-courts-panel.component.spec.ts` cubre:

- creación;
- transformación de canchas a filas de tabla;
- abrir/cerrar form;
- emisión de `courtDeleted`;
- emisión de `availabilityRequested`;
- modo `availabilityOnly`: solo acciones de disponibilidad y rechazo de mutaciones de canchas.

No cubre: validación/envío completo de create/update, selección de deportes, estado deshabilitado en edición sin cambios, confirmación desde interacción real, loading/empty renderizados, fila activa.

## Admin CRUD compliance

- Sección 11: cumple estructura completa del componente (`.ts`, `.html`, `.scss`, `.spec.ts`, `.md`).
- Sección 13: cumplimiento parcial. Este subcomponente implementa una child collection específica para canchas con form inline y tabla local; no usa un patrón shared child-collection con `FormArray`, reorder/drag-drop, columnas configurables reutilizables o validación de fila reusable.
- Como child collection del CRUD de complejos, debería converger a un patrón compartido si el comportamiento se repite en otros módulos.

## Reuse guidance

- Reutilizar solo dentro de Complexes mientras no exista una abstracción shared child-collection.
- No copiar este patrón para nuevas colecciones hijas; extraer o consumir el patrón shared child-collection requerido por las instrucciones admin.
- Si se amplía la gestión de canchas, preferir contracts/facade del padre y mantener el componente sin HttpClient directo.

## Compliance gaps

- Usa `app-data-table` en vez de `zh-collection-view` o un child-collection shared.
- No soporta bulk selection/delete ni paginación local de canchas.
- No implementa reorder/drag-drop de canchas.
- Validación visible incompleta para el nombre de cancha.
- No hay error state explícito propio ni notificación de success local.
