# Admin Roles Page

## Descripción

Componente de administración de roles del sistema. Permite crear, editar y eliminar roles personalizados, mientras protege los roles del sistema (system_admin, admin, user, viewer) de cualquier modificación.

## Características

### Gestión de Roles
- **Crear roles**: Nuevo rol con nombre, descripción y estado activo
- **Editar roles**: Modificar descripción y estado (el nombre está bloqueado para roles del sistema)
- **Eliminar roles**: Solo roles personalizados pueden ser eliminados
- **Protección de roles del sistema**: No se pueden renombrar ni eliminar los roles predefinidos

### Interfaz
- **Tabla responsive** con columnas: nombre, descripción, estado y acciones
- **Formulario inline** con animación slide-down
- **Badges** para identificar roles del sistema
- **Estados visuales** para roles activos/inactivos
- **Confirmación de delete** con dialog

### Validaciones
- Nombre: requerido, mínimo 3 caracteres
- Descripción: requerido, mínimo 10 caracteres
- Prevención de edición de roles del sistema

## Arquitectura

```
admin-roles-page/
├── admin-roles-page.component.ts        # Page component con lógica
├── admin-roles-page.component.html      # Template principal
├── admin-roles-page.component.scss      # Estilos responsive
├── admin-roles-page.component.spec.ts   # Tests
├── role-facade.service.ts               # Servicio facade (state management)
└── roles-form/
    ├── roles-form.component.ts          # Componente de formulario reutilizable
    ├── roles-form.component.html        # Template del formulario
    ├── roles-form.component.scss        # Estilos del formulario
    └── roles-form.component.spec.ts     # Tests del formulario
```

## Componentes Utilizados

### Componentes Propios
- `AsyncButtonComponent`: Botones con estado async/loading
- `ConfirmDialogComponent`: Confirmación de acciones destructivas
- `LoaderOverlayComponent`: Indicador de carga global
- `RolesFormComponent`: Formulario standalone con validaciones

### Angular Material
- `MatButtonModule`: Botones
- `MatIconModule`: Iconos
- `MatTableModule`: Tabla de datos
- `MatFormFieldModule`: Campos de formulario
- `MatInputModule`: Inputs de texto
- `MatCheckboxModule`: Checkbox para isActive
- `MatChipsModule`: Badges de estado
- `MatTooltipModule`: Tooltips en botones

## Estados de Componente

### Page Component
```typescript
isFormOpen: signal<boolean>              // Muestra/oculta panel de formulario
editingRole: signal<Role | null>         // Rol en edición (null = crear)
showDeleteDialog: signal<boolean>        // Confirmación de delete
deletingId: signal<string | null>        // ID del rol a eliminar
isSubmitting: signal<boolean>            // Loading durante submit
```

### Facade Service
```typescript
roles: signal<Role[]>                    // Todos los roles
loading: signal<boolean>                 // Estado de carga
error: signal<string | null>             // Mensajes de error
filteredRoles: computed<Role[]>          // Roles aplicados con filtros
```

## Flujos de Interacción

### Crear Rol
1. Click en "Nuevo Rol"
2. `openCreateForm()` abre panel con formulario vacío
3. Usuario completa: name, description, isActive
4. Click "Guardar" → `onFormSubmitted()` → `facade.createRole()`
5. Si éxito → cierra form, recarga tabla
6. Si error → muestra mensaje

### Editar Rol
1. Click "edit" en fila
2. `openEditForm()` abre panel con datos precargados
3. Si es rol del sistema: nombre deshabilitado, warning visual
4. Usuario modifica: description, isActive
5. Click "Guardar" → `onFormSubmitted()` → `facade.updateRole()`
6. Si éxito → cierra form, recarga tabla

### Eliminar Rol
1. Click "delete" en fila
2. `confirmDelete()` abre dialog de confirmación
3. Si rol es del sistema: botón delete deshabilitado
4. Click "Eliminar" → `executeDelete()` → `facade.deleteRole()`
5. Si éxito → cierra dialog, remueve fila

## Protecciones de Roles del Sistema

```typescript
const SYSTEM_ROLE_NAMES = ['system_admin', 'admin', 'user', 'viewer'];

// Validaciones en la UI
canEditRow(row): boolean      // Devuelve false para roles del sistema
canDeleteRow(row): boolean    // Devuelve false para roles del sistema

// Visual indicators
- Badge "Sistema" en nombre
- Botones edit/delete deshabilitados
- Tooltip explicativo
- Warning en form si intenta editar
```

## Traducciones Requeridas

```
admin.roles.title                      = "Gestión de Roles"
admin.roles.subtitle                   = "Administra los roles y permisos del sistema"
admin.roles.action.new                 = "Nuevo Rol"
admin.roles.column.name                = "Nombre"
admin.roles.column.description         = "Descripción"
admin.roles.column.status              = "Estado"
admin.roles.status.active              = "Activo"
admin.roles.status.inactive            = "Inactivo"
admin.roles.badge.system               = "Sistema"
admin.roles.tooltip.systemRole         = "No se pueden modificar roles del sistema"
admin.roles.form.create                = "Nuevo Rol"
admin.roles.form.edit                  = "Editar Rol"
admin.roles.form.systemRoleWarning     = "⚠️ Este es un rol del sistema. No se pueden cambiar sus datos básicos"
admin.roles.field.name                 = "Nombre del Rol"
admin.roles.field.description          = "Descripción"
admin.roles.field.isActive             = "Rol Activo"
admin.roles.placeholder.name           = "ej: moderator, manager"
admin.roles.placeholder.description    = "Descripción detallada del rol"
admin.roles.error.name.required        = "El nombre es requerido"
admin.roles.error.name.minlength       = "El nombre debe tener al menos 3 caracteres"
admin.roles.error.description.required = "La descripción es requerida"
admin.roles.error.description.minlength = "La descripción debe tener al menos 10 caracteres"
admin.roles.dialog.deleteTitle         = "Eliminar Rol"
admin.roles.dialog.deleteMessage       = "¿Estás seguro de que deseas eliminar este rol? Esta acción no se puede deshacer."
admin.roles.empty                      = "No hay roles para mostrar"
```

## Comportamiento Responsivo

- **Desktop (>1024px)**: Tabla completa con todas las columnas
- **Tablet (768px-1024px)**: Oculta descripción, redimensiona columnas
- **Mobile (<768px)**: Form y botones en 100% ancho, tabla compacta

## Testing

Todos los componentes incluyen tests unitarios con Jasmine:
- `admin-roles-page.component.spec.ts`: 12+ tests
- `roles-form.component.spec.ts`: 8+ tests
- Cobertura: Create, Update, Delete, Validaciones, Estados

## Dependencias

```typescript
// Models
import { Role, isSystemRole, SYSTEM_ROLE_NAMES } from '../../../../core/models';

// Repositories
import { RoleRepository } from '../../../../core/repositories/role.repository';
import { MockRoleRepository } from '../../../../core/repositories/mock/mock-role.repository';

// Services
import { RoleFacadeService } from './role-facade.service';

// Components
import { RolesFormComponent } from './roles-form/roles-form.component';
```

## Performance

- `computed()` para tableData evita recálculos innecesarios
- `structuredClone()` en mock repository previene mutaciones
- Lazy loading de animaciones con `@slideDown`
- Debounce en filtros (si se implementan)

## Notas de Implementación

1. El Mock Repository simula un delay de 300ms para replicar latencia de API
2. Los roles del sistema incluyen audit logging
3. Error handling centralizado en facade service
4. Animaciones CSS3 para mejor UX
5. Accessible: ARIA labels, keyboard navigation, high contrast
