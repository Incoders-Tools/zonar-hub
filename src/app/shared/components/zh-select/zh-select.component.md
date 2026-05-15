# ZhSelectComponent

## Propósito
Control select reutilizable para formularios administrativos. Estandariza markup, estilos, hints, errores, descripción de opción y compatibilidad con Angular Forms mediante `ControlValueAccessor`.

## API pública

### Inputs
| Input | Tipo | Default | Uso real |
|---|---:|---:|---|
| `label` | `string` | `''` | Texto visible del label. Actualmente se renderiza literal, no como key. |
| `required` | `boolean` | `false` | Muestra marcador `*` y `aria-required`. |
| `options` | `ZhSelectOption[]` | `[]` | Opciones del select. |
| `placeholder` | `string` | `''` | Opción inicial con value vacío. Render literal. |
| `hint` | `string` | `''` | Ayuda bajo el control si no hay error. Render literal. |
| `errorMessage` | `string` | `''` | Mensaje de error si `hasError()`. Render literal. |
| `error` | `boolean` | `false` | Fuerza estado inválido. |
| `disabled` | `boolean` | `false` | Alias de `disabledInput`; se combina con disabled del FormControl. |
| `inputId` | `string` | `''` | Id explícito; si falta se genera uno. |

### ControlValueAccessor
| Método | Uso |
|---|---|
| `writeValue(value)` | Sincroniza valor externo; `null/undefined` => `''`. |
| `registerOnChange(fn)` | Propaga cambios del `<select>`. |
| `registerOnTouched(fn)` | Registra touch al `focusout`. |
| `setDisabledState(isDisabled)` | Deshabilita desde Reactive Forms/ngModel. |

### Outputs / two-way
No expone outputs propios. El valor se comunica por CVA (`formControlName`, `ngModel`, etc.).

### Modelo auxiliar
`ZhSelectOption`: `value`, `label`, `description?`, `disabled?`.

## Dependencias
| Tipo | Dependencia |
|---|---|
| Angular | `CommonModule`, `FormsModule`, `ControlValueAccessor`, `NG_VALUE_ACCESSOR`, `input`, `signal`, `computed`, `HostListener` |
| Servicios | Ninguno |

## Comportamiento de template / estructura UI
- Renderiza label opcional, `<select>`, placeholder opcional, opciones, descripción de opción seleccionada, error o hint.
- `selectedDescription` se calcula desde la opción cuyo `value` coincide con el valor actual.
- `hasError` es true si `error` es true o si existe `errorMessage` y el control fue tocado.
- `autoId` se calcula con `Math.random()` cuando no se provee `inputId`.

## Estados y variantes
- Disabled: por input o por FormControl.
- Invalid: clase `zh-select--invalid`, `aria-invalid=true`, mensaje con `role="alert"`.
- Required: marcador visual y `aria-required`.
- Hint vs error: el error desplaza al hint.
- Selected description: muestra descripción de la opción seleccionada si existe.
- Loading/empty/success: no aplican dentro del control; el consumidor gestiona disponibilidad de opciones y estados de formulario.

## Accesibilidad
- Label usa `for` ligado al id generado/provisto.
- Error usa `role="alert"`.
- Usa atributos `aria-invalid` y `aria-required`.
- No usa `aria-describedby` para asociar hint/error/descripción con el select.
- Generar id con `Math.random()` dentro de un `computed` puede cambiar si se reevalúa; se recomienda pasar `inputId` estable en formularios complejos.

## i18n
- `label`, `placeholder`, `hint`, `errorMessage`, `option.label` y `option.description` son strings literales; el componente no aplica `TranslatePipe`.
- Los consumidores deben pasar texto ya traducido o el componente debe evolucionar a API basada en keys para cumplir estrictamente el contrato i18n.
- Marcador `*` no requiere traducción.

## Theming
- Usa tokens `--zh-*` para spacing, fuentes, superficies, bordes y estados.
- Hardcoded/fallbacks observados: color embebido en SVG `fill='%234a6349'`, fallbacks `#d32f2f`, `rgba(59, 130, 246, 0.15)` y `rgba(211, 47, 47, 0.15)`.

## Testing
- No existe `zh-select.component.spec.ts` en el estado actual.
- Deben cubrirse CVA, disabled desde FormControl/input, required, error/hint, descripción seleccionada, ids/labels y opciones disabled.

## Guía de reutilización
- Usar para selects estándar de formularios admin cuando se necesita consistencia visual y CVA.
- En formularios con i18n estricto, preferir pasar valores ya traducidos desde el consumidor hasta que el componente soporte keys.
- No usar para autocomplete, búsqueda asíncrona o multiselect; esos patrones requieren componente compartido específico o extensión controlada.

## Compliance gaps
- Falta `zh-select.component.spec.ts`.
- Falta `zh-select.component.md` previo; este archivo completa la documentación.
- API actual no fuerza translation keys y renderiza strings literales.
- Faltan asociaciones `aria-describedby`.
- Hay fallbacks/colores hardcodeados en SCSS y SVG embebido.
