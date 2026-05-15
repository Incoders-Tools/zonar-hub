# FormShellComponent

## Propósito
Shell visual compartido para formularios. Centraliza título, descripción, área de contenido y slot de acciones para evitar layouts de formulario ad-hoc.

## API pública

### Inputs
| Input | Tipo | Default | Uso real |
|---|---:|---:|---|
| `titleKey` | `string` | `''` | Si existe, renderiza título traducido. |
| `descriptionKey` | `string` | `''` | Si existe, renderiza descripción traducida. |

### Content projection
| Slot | Uso |
|---|---|
| default `ng-content` | Campos, secciones y helper content del formulario. |
| `[formActions]` | Acciones primarias/secundarias del formulario. |

### Outputs / two-way
No expone outputs ni modelos two-way.

## Dependencias
| Tipo | Dependencia |
|---|---|
| Angular | `input`, content projection, standalone component |
| Pipes | `TranslatePipe` |

## Comportamiento de template / estructura UI
- El template está inline en `form-shell.component.ts`; no existe `form-shell.component.html`.
- Renderiza `.form-shell`, título opcional, descripción opcional, `.form-shell__content` y `.form-shell__actions`.
- No crea `<form>` ni maneja Reactive Forms por sí mismo; el consumidor debe proveer el formulario y submit.

## Estados y variantes
- Variantes reales: con/sin título y con/sin descripción.
- Loading/submitting/success/error/disabled: no son gestionados por el shell; deben implementarse en el formulario consumidor, normalmente con `app-async-button` para submit y estados de página/formulario.

## Accesibilidad
- Usa `<h2>` para título si `titleKey` está presente.
- No enlaza automáticamente `aria-describedby`, errores globales ni regiones live.
- La estructura accesible del `<form>` y sus controles queda a cargo del consumidor.

## i18n
- `titleKey` y `descriptionKey` pasan por `TranslatePipe`.
- No hay textos hardcodeados visibles en el template.
- El contenido proyectado debe seguir las reglas i18n del repositorio.

## Theming
- SCSS usa clases `.form-shell*`; verificar tokens en estilos antes de extender.
- No debe introducir colores hardcodeados en consumidores; extender con tokens semánticos.

## Testing
- `form-shell.component.spec.ts` solo cubre creación.
- Faltan pruebas de render de título/descripción, proyección de contenido y slot `[formActions]`.

## Guía de reutilización
- Usar como envoltorio estándar de formularios CRUD/admin.
- No usar como sustituto de `ReactiveFormsModule`; es solo shell visual.
- Combinar con validadores compartidos y `app-async-button` para acciones primarias.

## Compliance gaps
- Falta archivo externo `.component.html`; el componente usa template inline, lo que incumple la regla de completitud para primitivos no triviales.
- Tests superficiales.
- No gestiona estados de submit por sí mismo; los consumidores deben documentarlos/implementarlos.
