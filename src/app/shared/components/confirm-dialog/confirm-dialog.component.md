# ConfirmDialogComponent

## Propósito
Diálogo/overlay compartido para confirmaciones, especialmente acciones destructivas. Estandariza título, mensaje, advertencia, cancelación y confirmación con `app-async-button`.

## API pública

### Inputs
| Input | Tipo | Default | Uso real |
|---|---:|---:|---|
| `titleKey` | `string` | `'confirm.deleteTitle'` | Título traducido del diálogo. |
| `messageKey` | `string` | `'confirm.deleteMessage'` | Mensaje principal traducido. |
| `warningKey` | `string` | `'confirm.deleteWarning'` | Advertencia traducida opcional; si es falsy no se renderiza. |
| `confirmLabelKey` | `string` | `'common.confirm'` | Label del botón confirmar. |
| `cancelLabelKey` | `string` | `'common.cancel'` | Label del botón cancelar. |
| `confirmVariant` | `'primary' \| 'danger'` | `'danger'` | Variante enviada a `app-async-button`. |
| `loading` | `boolean` | `false` | Estado loading del botón confirmar. |
| `dangerous` | `boolean` | `false` | Declarado pero no usado en template/estilos. |

### Outputs
| Output | Payload | Cuándo emite |
|---|---|---|
| `confirmed` | `void` | Al click de confirmar en `app-async-button`. |
| `cancelled` | `void` | Al click en overlay o botón cancelar. |

## Dependencias
| Tipo | Dependencia |
|---|---|
| Angular | `input`, `output`, standalone component, inline template |
| Pipes | `TranslatePipe` |
| Componentes hijos | `AsyncButtonComponent` |

## Comportamiento de template / estructura UI
- El template está inline en `confirm-dialog.component.ts`; no existe `confirm-dialog.component.html`.
- Overlay completo captura click para cancelar; el contenedor interno detiene propagación.
- Renderiza título, mensaje, advertencia opcional y acciones.
- No usa Angular Material Dialog/CDK Overlay; es un overlay propio.

## Estados y variantes
- Loading: se delega al `app-async-button` de confirmar.
- Danger/primary: por `confirmVariant`.
- Cancelled: overlay o botón cancelar.
- Disabled: no hay input disabled explícito para bloquear confirmación salvo `loading`.
- Success/error: deben manejarse fuera del diálogo.

## Accesibilidad
- Usa `role="dialog"` y `aria-label` traducido desde el título.
- Falta `aria-modal="true"`, gestión de foco, cierre con Escape y focus trap.
- Botón cancelar es nativo; confirmar usa `AsyncButtonComponent`.

## i18n
- Todas las copias visibles pasan por `TranslatePipe` vía keys.
- No se observaron textos visibles hardcodeados en el template.

## Theming
- SCSS local con clases `confirm-*`; debe mantenerse con tokens semánticos.
- No usar estilos ad-hoc de confirmación en features; extender este primitivo si falta una variante.

## Testing
- `confirm-dialog.component.spec.ts` cubre creación y emisión de cancelación por método `onCancel()`.
- Faltan pruebas de render de keys, advertencia opcional, confirmación, loading, click overlay vs click interno y accesibilidad básica.

## Guía de reutilización
- Usar para delete/destructive confirmations y acciones administrativas sensibles.
- El consumidor debe ejecutar la acción real solo después de `confirmed` y manejar éxito/error/loading.
- No crear confirmaciones locales si este contrato alcanza; extenderlo para necesidades compartidas.

## Compliance gaps
- Falta archivo externo `.component.html`; usa template inline.
- No usa CDK Overlay/Dialog ni focus trap; accesibilidad modal incompleta.
- Input `dangerous` no tiene efecto actual.
- Tests superficiales para un primitivo canónico destructivo.
