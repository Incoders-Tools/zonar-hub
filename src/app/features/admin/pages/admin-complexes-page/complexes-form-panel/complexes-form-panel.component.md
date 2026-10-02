# Complexes Form Panel Component

## Propósito

`ComplexesFormPanelComponent` es el formulario inline para crear o editar complejos desde la pantalla de administración. Maneja datos principales, estado activo, campos opcionales, campos técnicos para system admin, carga de logo y el borrador local de canchas que se persiste junto al complejo en un único guardado agregado.

## API pública

### Inputs

| Input | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `complex` | `Complex \| null` | No | Complejo a editar. `null` activa modo creación. |
| `saving` | `boolean` | No | Estado de guardado para el botón submit. |
| `sports` | `Sport[]` | No | Deportes disponibles para el panel de canchas. |

### Outputs

| Output | Tipo | Descripción |
| --- | --- | --- |
| `saved` | `void` | Emitido cuando `facade.saveComplexWithCourts()` devuelve success. |
| `cancelled` | `void` | Emitido al cancelar/cerrar. |

### Estado interno y modelo de form

| Propiedad | Descripción |
| --- | --- |
| `form` | Reactive Form con `name`, `key`, `location`, `address`, `sortOrder`, `preponderance`, `description`, `isActive`, imágenes. |
| `isEditing` | Define create vs edit y deshabilita `key` en edición. |
| `submitted` | Controla cuándo mostrar errores. |
| `pendingLogoFile` | Signal con el archivo de logo seleccionado antes de subirlo. |
| `currentLogoUrl` | Getter para preview desde `complex.logoImagePath`. |
| `courtDrafts` / `deletedCourtIds` | Borrador local de canchas y bajas confirmadas; solo se persisten en el guardado agregado. |
| `courtsLoading` / `courtsLoadFailed` | Estado de carga de canchas en edición; bloquean mutaciones de canchas y el submit. |
| `savePending` | Guardado agregado en curso; deshabilita el fieldset principal y las acciones. |

## Dependencias

| Categoría | Dependencias |
| --- | --- |
| Angular | `CommonModule`, `ReactiveFormsModule`, `OnInit`, signals, animación `slideDown`. |
| Material | `MatInputModule`, `MatCheckboxModule`. |
| Shared UI | `FormShellComponent`, `AsyncButtonComponent`, `CollapsibleSectionComponent`, `ActiveToggleComponent`, `ImageUploadComponent`. |
| Feature UI | `ComplexCourtsPanelComponent` en modo borrador (`draftMode`). |
| Services | `ComplexesFacadeService`, `AuthService`, `ActiveOrganizationService`, `FILE_STORAGE_REPOSITORY`, `ImageOptimizationService`. |
| Forms | `FormBuilder`, `Validators.required`, `pattern`, `min`, `maxLength`. |
| Pipes | `TranslatePipe`. |
| Modelos | `Complex`. |

## Template behavior / estructura UI

- Envuelve el form con `app-form-shell` y títulos/descripciones por modo create/edit.
- Campos principales: nombre, location, address, description y active toggle.
- Sección opcional colapsable para logo upload, cover image path y layout diagram path.
- Sección técnica solo para system admin con `key`, `sortOrder` y `preponderance`.
- El `fieldset.parent-fields` es una columna flex con `gap: var(--zh-space-lg)`, igual que el `form-content` exterior, para separar la grilla principal (que termina con el active toggle) de las secciones opcional y técnica.
- Debajo del fieldset se muestra el panel de canchas en modo borrador. Si la carga de canchas falla, aparece una alerta inline compacta (`.courts-load-alert`, `role="alert"`) con tokens danger y un `app-async-button` `variant="secondary"` `type="button"` que llama a `retryCourtsLoad()` sin enviar el formulario. No se usa `app-error-state` porque es un estado de página completa.
- En creación autogenera `key` desde `name` normalizando minúsculas, espacios y caracteres no alfanuméricos.
- En edición deshabilita `key` y exige cambios (`dirty`) para habilitar submit.
- Al guardar valida unicidad de key, name y sortOrder desde la fachada y persiste complejo y canchas con `saveComplexWithCourts()`; aborta si cambió la organización activa durante la validación.
- Si hay logo pendiente, optimiza con `ImageOptimizationService`, sube a `FILE_STORAGE_REPOSITORY` y reemplaza `logoImagePath` con URL permanente antes de guardar.

## States and variants

| Estado | Implementación actual |
| --- | --- |
| Create | `complex=null`; autocompleta `sortOrder`, `preponderance`, `isActive=true` y genera key desde name. |
| Edit | `complex` definido; patch del form, `key` disabled y submit requiere dirty. |
| Loading/submitting | `saving()` alimenta `app-async-button`; `savePending()` bloquea el fieldset durante el guardado agregado. |
| Courts loading | `courtsLoading()` bloquea mutaciones de canchas y submit; el botón de reintento muestra spinner. |
| Courts load error | `courtsLoadFailed()` muestra la alerta inline con reintento no-submit; el submit queda deshabilitado hasta cargar las canchas. |
| Disabled | Submit deshabilitado por `form.invalid`, carga/fallo de canchas, editor de cancha abierto, guardado en curso o edición sin cambios. |
| Error validation | Errores por required, pattern, min, maxlength, key/name/sortOrder duplicados se traducen vía `getErrorMessage`. |
| Success | Emite `saved` solo si la fachada devuelve `true`. |
| Cancelled | Emite `cancelled` sin mutar estado de fachada. |
| File pending | `pendingLogoFile` retiene el archivo hasta submit; `logoImagePath` guarda preview temporal. |

## Accessibility notes

- Labels visibles para todos los campos.
- Mensajes de error se muestran tras submit y usan texto traducido.
- Submit se deshabilita mientras el form es inválido.
- La alerta de carga de canchas usa `role="alert"` y el reintento es un botón nativo `type="button"` con nombre accesible traducido (`common.retry`).
- No se observaron `aria-describedby` conectando inputs con hints/errores.
- `ImageUploadComponent`, `ActiveToggleComponent` y `FormShellComponent` concentran parte de la semántica accesible.

## i18n considerations

- Títulos, labels, hints, errores y botones usan keys `admin.complexes.*`, `common.*` (incluye `admin.complexes.courts.loadError` y `common.retry`).
- No se observaron textos user-facing hardcodeados en el template.
- Los errores devueltos por `getErrorMessage()` son keys, no mensajes literales.

## Theming considerations

- SCSS usa tokens semánticos `--zh-*` para spacing, texto, bordes, superficies, danger, success, primary y elevation.
- Hay estilos locales para inputs y acciones; se integran con tokens del sistema.
- La alerta de carga de canchas usa `--zh-danger`, `--zh-danger-soft`, `--zh-radius-sm`, `--zh-font-size-sm` y spacing `--zh-space-*`; no define colores propios.
- Se observa un fallback hardcodeado dentro de `rgba(var(--zh-primary-rgb, 0, 123, 255), 0.1)` para focus shadow; es fallback técnico, no color primario directo.

## Testing notes

`complexes-form-panel.component.spec.ts` cubre:

- creación del componente;
- inicialización create/edit;
- key disabled en edición;
- cancel emit;
- validación required básica;
- autogeneración de key;
- manejo de logo pending/removed;
- `currentLogoUrl` con/sin logo;
- borrador de canchas, bloqueo durante carga/fallo/guardado y guardado agregado;
- abandono del guardado si cambia la organización activa;
- alerta de carga de canchas: reintento accesible `type="button"` vía `app-async-button` secundario que recarga una vez sin llamar al guardado agregado;
- estructura y spacing del fieldset (grilla con active toggle seguida de secciones colapsables, `gap` = `--zh-space-lg`).

No cubre: upload/optimización real, errores traducidos por control, disabled del submit en template, system admin visibility.

## Admin CRUD compliance

- Sección 11: cumple estructura completa del componente (`.ts`, `.html`, `.scss`, `.spec.ts`, `.md`).
- Como form CRUD, cumple Reactive Forms, `form-shell`, `async-button`, prevención de duplicados y separación de API mediante fachada/repositorio.
- No contiene rangos de fechas; sección 14 no aplica directamente a este formulario.
- Las canchas se editan como borrador local mediante `ComplexCourtsPanelComponent` y se persisten con el complejo en un único guardado.

## Reuse guidance

- Reutilizable como panel de create/edit de complejo dentro de `AdminComplexesPageComponent`.
- No debe usarse como form genérico para otras entidades; extraer controles compartidos si aparecen patrones repetidos.
- Mantener la persistencia fuera del template y canalizada por `ComplexesFacadeService`.

## Compliance gaps

- Falta conexión explícita `aria-describedby` para hints y errores.
- Los flujos de upload de logo no tienen cobertura de test directa.
- El control de `key` se oculta para no system admin, pero el FormControl sigue requerido; validar que el rol no system admin siempre tenga key autogenerada antes de submit.
- No hay notificación visual de success/error local; depende del contenedor/fachada.
