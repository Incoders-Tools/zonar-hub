# Court Availability Grid Component

## Propósito

`CourtAvailabilityGridComponent` permite editar disponibilidad semanal de una cancha por bloques horarios. Muestra navegación por días, estados por slot (`available`, `blocked`, `partial`) y acciones para guardar el día actual o toda la semana.

## API pública

### Inputs

| Input | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `courtId` | `string` | Sí | Id de la cancha activa. Actualmente no se usa internamente para mapear slots; el padre lo usa al persistir. |
| `availability` | `Availability[]` | No | Disponibilidad existente desde la fachada/repositorio. Default `[]`. |
| `saving` | `boolean` | No | Estado de guardado para botones. Default `false`. |

### Outputs

| Output | Tipo | Descripción |
| --- | --- | --- |
| `availabilitySaved` | `Omit<Availability, 'id' \| 'courtId'>[]` | Emite slots mapeados para día actual o semana completa. |

### Estado interno

| Signal / propiedad | Descripción |
| --- | --- |
| `selectedDay` | Día activo, 1=lunes a 7=domingo. |
| `allSlots` | Matriz semanal de `GridSlot[][]`, 7 días x 15 horas. |
| `currentDaySlots` | Computed de slots del día activo. |
| `days`, `dayKeys`, `hours` | Configuración fija de navegación y horario 08:00-22:00. |

## Dependencias

| Categoría | Dependencias |
| --- | --- |
| Angular | `CommonModule`, `OnInit`, `OnChanges`, signals, `computed`, animación `slideDown`. |
| Material | `MatIcon`, `MatTooltipModule`. |
| Shared UI | `AsyncButtonComponent`, `DateInputComponent`. |
| Pipes | `TranslatePipe`. |
| Modelos | `Availability`; `GridSlot` local exportado. |

## Template behavior / estructura UI

- Título de disponibilidad.
- Rango de fechas future-ready deshabilitado con dos `app-date-input [externalDisabled]="true"` y tooltip `comingSoon`.
- Barra de navegación por día con botones anterior/siguiente, botones de días y atajo a fin de semana.
- Lista de slots horarios del día seleccionado; cada botón alterna estado en ciclo `available -> blocked -> partial -> available`.
- Leyenda visual de estados.
- Acciones `saveDay()` y `saveAll()` con `app-async-button`.

## States and variants

| Estado | Implementación actual |
| --- | --- |
| Initial/loading | No recibe loading separado; se reconstruye la grilla en `ngOnInit` y cuando cambia `availability`. |
| Empty | Si `availability=[]`, genera todos los slots como `available`. No hay empty state visual porque la grilla siempre tiene 105 slots. |
| Error | No maneja error propio; depende del padre/fachada. |
| Saving | `saving()` alimenta ambos async buttons. |
| Disabled | Date inputs están deshabilitados. Los botones de guardar no se deshabilitan por cambios/validación. |
| Selected | Día activo con clase `availability-grid__day-btn--active`. |
| Slot states | `available`, `blocked`, `partial`, mapeados a `isAvailable` y `overrideType`. |
| Success | Emite slots; no muestra confirmación local. |

## Accessibility notes

- Botones anterior/siguiente tienen `aria-label` traducido.
- Cada slot tiene `aria-label` con rango horario y estado actual; el estado en el aria-label queda en inglés técnico (`available`, `blocked`, `partial`) y no se traduce.
- Los date inputs deshabilitados incluyen tooltip de “coming soon”.
- No se observa `aria-pressed` para botones de día ni slots seleccionables, lo que mejoraría la comunicación de estado.

## i18n considerations

- Título, días, labels de fechas, tooltip, estados, leyenda y acciones usan translation keys `admin.complexes.availability.*` y `common.*`.
- Textos hardcodeados observados: rangos horarios generados (`08:00`) son datos de tiempo; `aria-label` concatena estado técnico sin traducción.
- `dayKeys` fija lunes-domingo con keys traducibles.

## Theming considerations

- SCSS usa tokens semánticos `--zh-*` para superficies, bordes, texto, spacing, radius, success/danger/warning/primary y responsive.
- Hardcoded styles observados: `box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15)`, gaps de `2px`, font-size `10px`, tamaños fijos de swatches/botones. Conviene migrar a tokens si se estandariza la grilla.
- Usa clases BEM locales `availability-grid__*`.

## Testing notes

`court-availability-grid.component.spec.ts` cubre:

- creación;
- día inicial lunes;
- construcción de grilla 7 x 15 = 105 slots;
- inicialización de estados desde `availability`;
- current day slots;
- ciclo de toggle de slots;
- navegación de días con wrap;
- atajo de weekend;
- detección de weekend;
- emisiones de `saveDay` y `saveAll`;
- mapping de estados a payload;
- formato de hora.

No cubre: template de tooltips/date inputs, accesibilidad (`aria-label`, `aria-pressed` ausente), saving disabled/loading visual, cambios posteriores de `availability` con `ngOnChanges` en un caso explícito.

## Admin CRUD compliance

- Sección 11: cumple estructura completa del componente (`.ts`, `.html`, `.scss`, `.spec.ts`, `.md`).
- Sección 13: es parte de una relación master-detail (complejo -> canchas -> disponibilidad), pero no usa patrón shared child-collection; su UX es específica de grilla semanal.
- Sección 14: hay un rango start/end en UI, pero está explícitamente deshabilitado/future-ready. Si se habilita, debe implementar prevención de rango inválido, validación cruzada, mensajes traducidos y bloqueo de guardado.

## Reuse guidance

- Reutilizar solo para disponibilidad semanal por cancha con slots horarios similares.
- Si otras entidades necesitan disponibilidad, considerar extraer una grilla shared parametrizable por días/horarios/estados.
- Mantener el output sin `courtId`; el padre debe seguir resolviendo la cancha activa para persistir.

## Compliance gaps

- API de disponibilidad no está implementada en `ApiComplexRepository`: carga y guardado devuelven `[]`.
- Rango de fechas está deshabilitado; no cumple aún date-range safety porque no está activo.
- No hay error state ni success state visual local.
- Falta `aria-pressed`/estado accesible para slots y días.
- Hay algunos valores visuales hardcodeados en SCSS que podrían tokenizarse.
