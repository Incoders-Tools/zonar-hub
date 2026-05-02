# Diagnóstico: Cambio de Organización No Recargaba Datos

## 🐛 Problema Reportado

- **Síntoma**: Al cambiar de Organization A a Organization B, los datos siguen mostrando información de Organization A
- **Ejemplo**: 
  - Organization A: Deporte Pádel INACTIVO
  - Organization B: Deporte Pádel ACTIVO
  - Al cambiar de A → B, seguía mostrando "Pádel INACTIVO"

## 🔍 Causa Raíz

Había **dos servicios desconectados** manejando el contexto de organización:

1. **`ActiveOrganizationService`** - Nuevo servicio con selector de organización
   - Maneja el estado interno de la organización activa
   - Emite eventos de cambio vía `organizationChanged()` signal

2. **`OrganizationContextService`** - Servicio existente usado por facades
   - Lee la organización desde `auth.session().organizationId`
   - Los facades llaman `organizationContext.organizationId()` en su método `resolveScope()`

### El Bug
Cuando cambiabas de organización:
```typescript
// ActiveOrganizationService.switchOrganization() ANTES DEL FIX:
switchOrganization(orgId: string): void {
  this.activeOrgIdState.set(orgId);  // ✅ Actualiza estado interno
  this.persistActiveOrgId(orgId);     // ✅ Guarda en localStorage
  
  // ❌ NO ACTUALIZABA auth.session()
  
  this.organizationChangeCounter.update(count => count + 1); // ✅ Emite cambio
}
```

**Resultado**:
- ✅ El effect() en los componentes detectaba el cambio y llamaba `facade.load()`
- ❌ Pero `facade.load()` → `resolveScope()` → `organizationContext.organizationId()` seguía leyendo el ID viejo de `auth.session()`
- ❌ Los datos se recargaban **pero de la organización incorrecta**

## ✅ Solución Implementada

Sincronizar ambos servicios al cambiar de organización:

```typescript
// ActiveOrganizationService.switchOrganization() DESPUÉS DEL FIX:
switchOrganization(orgId: string): void {
  const manageable = this.manageableOrganizations();
  const exists = manageable.some(o => o.id === orgId);
  if (!exists) return;

  const previousOrgId = this.activeOrgIdState();
  const org = manageable.find(o => o.id === orgId);
  
  this.activeOrgIdState.set(orgId);
  this.persistActiveOrgId(orgId);

  // ✅ NUEVO: Sincronizar con sesión de auth
  if (org) {
    this.auth.updateCurrentOrganization(orgId, org.name);
  }

  if (previousOrgId !== orgId) {
    this.organizationChangeCounter.update(count => count + 1);
  }
}
```

## 🔄 Flujo Correcto Completo

### Cuando el usuario cambia de organización:

1. **Usuario selecciona nueva organización** en el selector
   - `OrgSelectorComponent` llama `activeOrg.switchOrganization(orgId)`

2. **ActiveOrganizationService actualiza estado**
   ```typescript
   this.activeOrgIdState.set(orgId);           // Estado interno
   this.auth.updateCurrentOrganization(orgId); // ✅ Sesión de auth
   this.organizationChangeCounter.update(...); // Signal de cambio
   ```

3. **Componentes detectan el cambio vía effect()**
   ```typescript
   constructor() {
     effect(() => {
       this.activeOrg.organizationChanged(); // Detecta cambio en counter
       void this.facade.load();               // Recarga datos
     });
   }
   ```

4. **Facade carga datos de la organización correcta**
   ```typescript
   async load(): Promise<void> {
     const scope = this.resolveScope();
     // resolveScope() llama organizationContext.organizationId()
     // que AHORA lee el valor actualizado de auth.session()
     
     const data = await this.repository.getForOrganization(scope.id);
     this.entitiesState.set(data); // ✅ Datos correctos
   }
   ```

## 📋 Páginas Afectadas (Ahora Funcionan Correctamente)

Todas estas páginas ahora recargan automáticamente al cambiar de organización:

- ✅ Sports
- ✅ Organizations
- ✅ Users
- ✅ Tournaments
- ✅ Complexes
- ✅ Categories
- ✅ Players
- ✅ Teams
- ✅ Registrations

## 🧪 Cómo Verificar

### Prueba Manual

1. **Login como sysadmin**
   - `sysadmin@zonarhub.com`

2. **Crear datos de prueba en Organization A**
   - Navegar a Sports
   - Marcar "Pádel" como INACTIVO

3. **Crear datos diferentes en Organization B**
   - Cambiar a Organization B desde el selector
   - Navegar a Sports
   - Marcar "Pádel" como ACTIVO

4. **Verificar cambio de organización**
   - Cambiar de A → B en el selector
   - **Resultado esperado**: Inmediatamente se recarga y muestra "Pádel ACTIVO"
   - Cambiar de B → A en el selector
   - **Resultado esperado**: Inmediatamente se recarga y muestra "Pádel INACTIVO"

### Con DevTools

Abrir consola del navegador y ejecutar:
```javascript
// Ver organización actual en sesión
JSON.parse(localStorage.getItem('zh_auth_session')).organizationId

// Cambiar organización desde consola
// (para pruebas sin UI)
```

## 📊 Indicadores Visuales

Durante el cambio de organización verás:
- ⏳ Loader/skeleton en las tablas (estado loading)
- 🔄 Animaciones slideDown cuando los datos se actualizan
- ✨ Contenido actualizado para la nueva organización

No se requieren progress bars adicionales - el sistema ya tiene feedback visual apropiado.

## 🔧 Archivos Modificados

- `src/app/core/services/active-organization.service.ts` - Agregada sincronización con auth
- Todas las páginas admin - Agregado effect() para detectar cambios
