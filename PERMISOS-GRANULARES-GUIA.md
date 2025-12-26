# 🔐 Guía de Permisos Granulares

## 📋 Índice

1. [Introducción](#introducción)
2. [Estructura de Permisos](#estructura-de-permisos)
3. [Fases de Implementación](#fases-de-implementación)
4. [Cómo Usar](#cómo-usar)
5. [Migración de Permisos](#migración-de-permisos)
6. [Rollback](#rollback)
7. [Troubleshooting](#troubleshooting)

---

## 🎯 Introducción

El sistema de **permisos granulares** permite un control más fino sobre qué puede ver y hacer cada usuario en el sistema.

### **Antes (Permisos Simples):**
```json
{
  "permissions": ["dashboard", "sales"]
}
```
✅ Acceso a TODO el módulo dashboard (5 sub-páginas)  
✅ Acceso a TODO el módulo sales

### **Ahora (Permisos Granulares):**
```json
{
  "permissions": ["dashboard.alerts", "dashboard.top-customers", "sales"]
}
```
✅ Acceso solo a 2 sub-páginas específicas de dashboard  
✅ Acceso a TODO el módulo sales

---

## 🏗️ Estructura de Permisos

### **Módulos con Sub-Permisos:**

#### 📊 **Panel de Datos (`dashboard`)**
- `dashboard.alerts` → Alertas de Stock (`/dashboard`)
- `dashboard.top-customers` → Principales Clientes (`/top-customers`)
- `dashboard.best-prices` → Mejores Precios (`/best-prices`)
- `dashboard.expiry` → Alertas de Caducidad (`/expiry-alerts`)
- `dashboard.idle` → Tiempo sin Movimiento (`/idle-medicines`)

#### ⚙️ **Administración (`admin`)**
- `admin.dop-usd` → Tasa DOP-USD (`/admin/dop-usd`)
- `admin.usd-mn` → Tasa USD-MN (`/admin/usd-mn`)
- `admin.shipping` → Tasa de Envío (`/admin/shipping`)

#### 💰 **Reportes (`reports`)**
- `reports.financial` → Reporte Financiero (`/finanzas/reportes`)

#### 🔐 **Gestión de Usuarios (`users`)**
- `users.list` → Lista de Usuarios (`/users`)
- `users.roles` → Gestión de Roles (`/roles`)

### **Módulos sin Sub-Permisos:**

Estos módulos NO tienen sub-divisiones:
- `medicines` → Medicamentos
- `customers` → Clientes
- `suppliers` → Proveedores
- `receipts` → Entradas
- `sales` → Salidas

---

## 🚀 Fases de Implementación

### **✅ FASE 1: PREPARACIÓN (COMPLETADA)**
- [x] Crear `permissionsConfig.js`
- [x] Crear `featureFlags.js`
- [x] Crear script de migración
- [x] Crear documentación

**Estado:** Sistema funcionando normal, sin cambios visibles

---

### **⏳ FASE 2: BACKEND Y LÓGICA (PENDIENTE)**

**Archivos a modificar:**
1. `frontend/src/components/PrivateRoute.jsx`
2. `frontend/src/App.jsx`
3. Base de datos (ejecutar migración)

**Pasos:**
1. Detener backend y frontend
2. Ejecutar script de migración: `node backend/scripts/migrate-permissions-to-granular.js migrate`
3. Actualizar código de `PrivateRoute.jsx`
4. Actualizar rutas en `App.jsx`
5. Cambiar `GRANULAR_PERMISSIONS: true` en `featureFlags.js`
6. Reiniciar y probar

**Resultado esperado:** Permisos granulares funcionando, UI de roles aún simple

---

### **⏳ FASE 3: UI JERÁRQUICA (PENDIENTE)**

**Archivos a modificar:**
1. `frontend/src/components/RoleModal.jsx` (reescritura mayor)
2. `frontend/src/pages/Roles.jsx` (ajustes menores)

**Resultado esperado:** UI con módulos expandibles y selección jerárquica

---

### **⏳ FASE 4: PULIDO (PENDIENTE)**

**Mejoras opcionales:**
- Búsqueda/filtrado en modal de roles
- Tooltips explicativos
- Validaciones adicionales
- Optimizaciones de performance

---

## 💡 Cómo Usar

### **Ejemplo 1: Vendedor con acceso limitado**

**Requisito:** Solo puede ver Salidas y Alertas de Stock

```json
{
  "name": "Vendedor",
  "permissions": ["sales", "dashboard.alerts"]
}
```

**Resultado:**
- ✅ Puede acceder a `/sales`
- ✅ Puede acceder a `/dashboard`
- ❌ NO puede acceder a `/top-customers`, `/best-prices`, etc.

---

### **Ejemplo 2: Analista con acceso a reportes**

**Requisito:** Solo puede ver reportes y métricas

```json
{
  "name": "Analista",
  "permissions": [
    "dashboard.top-customers",
    "dashboard.best-prices",
    "reports.financial"
  ]
}
```

**Resultado:**
- ✅ Puede ver 2 sub-páginas de dashboard
- ✅ Puede ver reportes financieros
- ❌ NO puede acceder a ventas, medicamentos, etc.

---

### **Ejemplo 3: Gerente con acceso completo a dashboard**

**Requisito:** Acceso a TODO el módulo de dashboard

**Opción A (Manual):**
```json
{
  "permissions": [
    "dashboard.alerts",
    "dashboard.top-customers",
    "dashboard.best-prices",
    "dashboard.expiry",
    "dashboard.idle"
  ]
}
```

**Opción B (Usando permiso padre):**
```json
{
  "permissions": ["dashboard"]
}
```

**Ambas opciones dan el mismo resultado:**
- ✅ Acceso a TODAS las 5 sub-páginas de dashboard

---

## 🔄 Migración de Permisos

### **Ejecutar Migración:**

```bash
cd backend
node scripts/migrate-permissions-to-granular.js migrate
```

### **Qué hace:**

1. Lee todos los roles de la base de datos
2. Convierte permisos simples a granulares:
   - `"dashboard"` → `["dashboard.alerts", "dashboard.top-customers", ...]`
   - `"admin"` → `["admin.dop-usd", "admin.usd-mn", "admin.shipping"]`
   - `"sales"` → `["sales"]` (sin cambios, no tiene hijos)
3. Actualiza la base de datos
4. Muestra resumen de cambios

### **Ejemplo de salida:**

```
🚀 Iniciando migración de permisos...

📋 Roles encontrados: 2

🔍 Procesando rol: "Administrador" (ID: 1)
   📌 Permisos actuales: ["dashboard","admin","medicines","sales"]
   🔄 "dashboard" → ["dashboard.alerts","dashboard.top-customers",...]
   🔄 "admin" → ["admin.dop-usd","admin.usd-mn","admin.shipping"]
   📌 Permisos nuevos: ["dashboard.alerts","dashboard.top-customers",...]
   ✅ Migrado exitosamente

🔍 Procesando rol: "Vendedor" (ID: 3)
   📌 Permisos actuales: ["sales","dashboard"]
   🔄 "sales" → ["sales"]
   🔄 "dashboard" → ["dashboard.alerts","dashboard.top-customers",...]
   📌 Permisos nuevos: ["sales","dashboard.alerts",...]
   ✅ Migrado exitosamente

============================================================
✅ MIGRACIÓN COMPLETADA
============================================================
📊 Resumen:
   - Roles migrados: 2
   - Roles omitidos (ya migrados): 0
   - Total procesados: 2

🎯 Siguiente paso:
   Cambiar GRANULAR_PERMISSIONS a true en frontend/src/config/featureFlags.js
```

---

## ⏪ Rollback

Si algo sale mal, puedes revertir los cambios:

### **1. Revertir Base de Datos:**

```bash
cd backend
node scripts/migrate-permissions-to-granular.js rollback
```

### **2. Desactivar Feature Flag:**

```javascript
// frontend/src/config/featureFlags.js
export const FEATURES = {
  GRANULAR_PERMISSIONS: false  // ← Cambiar a false
};
```

### **3. Reiniciar Sistema:**

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

---

## 🔧 Troubleshooting

### **Problema: Usuario no puede acceder a ningún módulo**

**Causa:** Permisos no migrados correctamente

**Solución:**
1. Verificar permisos en base de datos:
   ```sql
   SELECT id, name, permissions FROM roles;
   ```
2. Ejecutar migración de nuevo
3. Verificar que `GRANULAR_PERMISSIONS` esté en `true`

---

### **Problema: Modal de roles no muestra sub-módulos**

**Causa:** Fase 3 aún no implementada

**Solución:**
- Esperar a completar Fase 3
- Mientras tanto, editar permisos manualmente en base de datos

---

### **Problema: Error "Cannot read property 'permissions' of undefined"**

**Causa:** Usuario sin rol asignado

**Solución:**
1. Ir a `/users`
2. Editar usuario
3. Asignar un rol
4. Guardar

---

### **Problema: Cambios no se reflejan**

**Solución:**
1. Limpiar caché del navegador (Ctrl+Shift+R)
2. Cerrar sesión y volver a iniciar
3. Verificar que el backend esté corriendo
4. Verificar consola del navegador (F12) para errores

---

## 📞 Soporte

Si encuentras problemas:

1. Revisar logs de consola (F12 en navegador)
2. Revisar logs del backend
3. Verificar que todos los archivos de Fase 1 existan
4. Verificar que el feature flag esté configurado correctamente

---

## 🎯 Estado Actual

**Fase Actual:** FASE 1 - PREPARACIÓN ✅ COMPLETADA

**Próximo Paso:** Implementar FASE 2 - BACKEND Y LÓGICA

**Feature Flag:** `GRANULAR_PERMISSIONS: false` (Sistema antiguo activo)

---

**Última actualización:** 25 de diciembre de 2025

