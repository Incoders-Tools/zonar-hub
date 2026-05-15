# Complexes Form Panel Component

## Propósito

`ComplexesFormPanelComponent` es el formulario inline para crear o editar complejos desde la pantalla de administración. Maneja datos principales, estado activo, campos técnicos para system admin y carga de logo.

## API pública

### Inputs

| Input | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `complex` | `Complex \| null` | No | Complejo a editar. `null` activa modo creación. |
| `saving` | `boolean` | No | Estado de guardado para el botón submit. |

### Outputs

| Output | Tipo | Descripción |
| --- | --- | --- |
| `saved` | `void` | Emitido cuando `facade.saveComplex()` devuelve success. |
| `cancelled` | `void` | Emitido al cancelar/cerrar. |

### Estado interno y modelo de form

| Propiedad | Descripción |
| --- | --- |
| `form` | Reactive Form con `name`, `key`, `location`, `address`, `sortOrder`, `preponderance`, `description`, `isActive`, imágenes. |
| `isEditing` | Define create vs edit y deshabilita `key` en edición. |
| `submitted` | Controla cuándo mostrar errores. |
| `pendingLogoFile` | Signal con el archivo de logo seleccionado antes de subirlo. |
| `currentLogoUrl` | Getter para preview desde `complex.logoImagePath`. |

## Dependencias

| Categoría | Dependencias |
| --- | --- |
| Angular | `CommonModule`, `ReactiveFormsModule`, `OnInit`, signals, animación `slideDown`. |
| Material | `MatInputModule`, `MatCheckboxModule`. |
| Shared UI | `FormShellComponent`, `AsyncButtonComponent`, `CollapsibleSectionComponent`, `ActiveToggleComponent`, `ImageUploadComponent`. |
| Services | `ComplexesFacadeService`, `AuthService`, `FILE_STORAGE_REPOSITORY`, `ImageOptimizationService`. |
| Forms | `FormBuilder`, `Validators.required`, `pattern`, `min`, `maxLength`. |
| Pipes | `TranslatePipe`. |
| Modelos | `Complex`. |

## Template behavior / estructura UI

- Envuelve el form con `app-form-shell` y títulos/descripciones por modo create/edit.
- Campos principales: nombre, location, address, description y active toggle.
- Sección opcional colapsable para logo upload, cover image path y layout diagram path.
- Sección técnica solo para system admin con `key`, `sortOrder` y `preponderance`.
- En creación autogenera `key` desde `name` normalizando minúsculas, espacios y caracteres no alfanuméricos.
- En edición deshabilita `key` y exige cambios (`dirty`) para habilitar submit.
- Al guardar valida unicidad de key, name y sortOrder desde la fachada antes de persistir.
- Si hay logo pendiente, optimiza con `ImageOptimizationService`, sube a `FILE_STORAGE_REPOSITORY` y reemplaza `logoImagePath` con URL permanente antes de guardar.

## States and variants

| Estado | Implementación actual |
| --- | --- |
| Create | `complex=null`; autocompleta `sortOrder`, `preponderance`, `isActive=true` y genera key desde name. |
| Edit | `complex` definido; patch del form, `key` disabled y submit requiere dirty. |
| Loading/submitting | `saving()` alimenta `app-async-button`. |
| Disabled | Submit deshabilitado por `form.invalid` o edición sin cambios. |
| Error validation | Errores por required, pattern, min, maxlength, key/name/sortOrder duplicados se traducen vía `getErrorMessage`. |
| Success | Emite `saved` solo si la fachada devuelve `true`. |
| Cancelled | Emite `cancelled` sin mutar estado de fachada. |
| File pending | `pendingLogoFile` retiene el archivo hasta submit; `logoImagePath` guarda preview temporal. |

## Accessibility notes

- Labels visibles para todos los campos.
- Mensajes de error se muestran tras submit y usan texto traducido.
- Submit se deshabilita mientras el form es inválido.
- No se observaron `aria-describedby` conectando inputs con hints/errores.
- `ImageUploadComponent`, `ActiveToggleComponent` y `FormShellComponent` concentran parte de la semántica accesible.

## i18n considerations

- Títulos, labels, hints, errores y botones usan keys `admin.complexes.*`, `common.*`.
- No se observaron textos user-facing hardcodeados en el template.
- Los errores devueltos por `getErrorMessage()` son keys, no mensajes literales.

## Theming considerations

- SCSS usa tokens semánticos `--zh-*` para spacing, texto, bordes, superficies, danger, success, primary y elevation.
- Hay estilos locales para inputs y acciones; se integran con tokens del sistema.
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
- `currentLogoUrl` con/sin logo.

No cubre: `onSave()` completo, validaciones async de duplicados, upload/optimización real, errores traducidos por control, disabled del submit en template, system admin visibility.

## Admin CRUD compliance

- Sección 11: cumple estructura completa del componente (`.ts`, `.html`, `.scss`, `.spec.ts`, `.md`).
- Como form CRUD, cumple Reactive Forms, `form-shell`, `async-button`, prevención de duplicados y separación de API mediante fachada/repositorio.
- No contiene rangos de fechas; sección 14 no aplica directamente a este formulario.
- No implementa child collections; las canchas se gestionan en el panel padre/hermano.

## Reuse guidance

- Reutilizable como panel de create/edit de complejo dentro de `AdminComplexesPageComponent`.
- No debe usarse como form genérico para otras entidades; extraer controles compartidos si aparecen patrones repetidos.
- Mantener la persistencia fuera del template y canalizada por `ComplexesFacadeService`.

## Compliance gaps

- Falta conexión explícita `aria-describedby` para hints y errores.
- `onSave()` y flujos de upload no tienen cobertura de test directa.
- El control de `key` se oculta para no system admin, pero el FormControl sigue requerido; validar que el rol no system admin siempre tenga key autogenerada antes de submit.
- No hay notificación visual de success/error local; depende del contenedor/fachada.
