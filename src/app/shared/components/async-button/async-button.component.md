# AsyncButtonComponent

## Propósito
Botón compartido para acciones asíncronas. Evita doble emisión mientras está deshabilitado o en loading y estandariza variantes visuales de acción.

## API pública

### Inputs
| Input | Tipo | Default | Uso real |
|---|---:|---:|---|
| `type` | `'button' \| 'submit'` | `'button'` | Tipo nativo del `<button>`. |
| `variant` | `'primary' \| 'secondary' \| 'danger'` | `'primary'` | Clase visual `async-btn--{variant}`. |
| `disabled` | `boolean` | `false` | Deshabilita botón y bloquea emisión. |
| `loading` | `boolean` | `false` | Deshabilita botón, muestra spinner y oculta visualmente el texto. |

### Outputs
| Output | Payload | Cuándo emite |
|---|---|---|
| `clicked` | `void` | Al click si `disabled === false` y `loading === false`. |

### Content projection
El label del botón se provee por `ng-content`.

## Dependencias
| Tipo | Dependencia |
|---|---|
| Angular | `input`, `output`, standalone component, inline template |
| Hijos/servicios | Ninguno |

## Comportamiento de template / estructura UI
- El template está inline en `async-button.component.ts`; no existe `async-button.component.html`.
- Renderiza un `<button>` con clase base `async-btn` y variante.
- En loading renderiza spinner `<span role="status" aria-label="loading">` y aplica clase para ocultar texto.

## Estados y variantes
- Variantes: `primary`, `secondary`, `danger`.
- Disabled: por input `disabled` o por `loading`.
- Loading: bloquea click y muestra spinner.
- Success/error: no se modelan en el componente; el consumidor debe cambiar copy/estado externo.

## Accesibilidad
- Usa botón nativo y `disabled` real.
- Spinner tiene `role="status"`, pero `aria-label="loading"` está hardcodeado en inglés.
- No setea `aria-busy`; puede añadirse si se extiende.

## i18n
- El texto visible llega por contenido proyectado; el consumidor debe usar translation keys.
- Texto hardcodeado observado: `aria-label="loading"`.

## Theming
- SCSS define clases `async-btn` y variantes; debe mantenerse con tokens semánticos del sistema.
- No añadir variantes locales fuera del primitivo.

## Testing
- `async-button.component.spec.ts` cubre creación y emisión de `clicked` en estado habilitado.
- Faltan pruebas de no emisión cuando `disabled` o `loading`, atributos disabled, spinner y variantes.

## Guía de reutilización
- Usar para submits y acciones primarias/secundarias que disparan procesos asíncronos.
- En formularios admin, combinar con `form-shell` y deshabilitar hasta cumplir validación técnica + prerequisitos de negocio.
- No usar para links de navegación simples si no hay proceso asíncrono.

## Compliance gaps
- Falta archivo externo `.component.html`; usa template inline.
- Loading label no está internacionalizado.
- Tests no cubren los estados críticos anti-doble-submit.
