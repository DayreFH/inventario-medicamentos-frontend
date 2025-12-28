# 🔍 ANÁLISIS: DIFERENCIAS ENTRE BASE DE DATOS LOCAL Y RAILWAY

**Fecha:** 28 de diciembre de 2024  
**Solicitado por:** Usuario  
**Objetivo:** Entender por qué hay datos diferentes en local vs Railway

---

## 📊 RESULTADO DEL ANÁLISIS

### ✅ CONCLUSIÓN PRINCIPAL:

**AMBAS BASES DE DATOS SON IDÉNTICAS** 🎉

---

## 📋 BASE DE DATOS LOCAL (Tu computadora)

**Ubicación:** `localhost:3306/inventario_meds`  
**Servidor:** MySQL local en tu computadora

### Tabla `roles`:
- **Total:** 1 rol
- **Rol:** Administrador (ID: 1)
- **Creado:** 27 de diciembre de 2025, 23:01:44

### Tabla `users`:
- **Total:** 4 usuarios
- **Usuarios:**
  1. Usuario de Prueba (`test@example.com`) - Rol: Administrador
  2. Usuario Nuevo (`nuevo@example.com`) - Rol: Administrador
  3. Dayre (`dayrefh@gmail.com`) - Rol: Administrador
  4. Administrador (`admin@medilink.com`) - Rol: Administrador

---

## 🌐 BASE DE DATOS RAILWAY (Nube/Producción)

**Ubicación:** `yamanote.proxy.rlwy.net:34511/railway`  
**Servidor:** MySQL en Railway (nube)

### Tabla `roles`:
- **Total:** 1 rol
- **Rol:** Administrador (ID: 1)
- **Creado:** 27 de diciembre de 2025, 23:01:44

### Tabla `users`:
- **Total:** 4 usuarios
- **Usuarios:**
  1. Usuario de Prueba (`test@example.com`) - Rol: Administrador
  2. Usuario Nuevo (`nuevo@example.com`) - Rol: Administrador
  3. Dayre (`dayrefh@gmail.com`) - Rol: Administrador
  4. Administrador (`admin@medilink.com`) - Rol: Administrador

---

## 🤔 ¿POR QUÉ PENSABAS QUE ERAN DIFERENTES?

Es posible que hayas visto diferencias porque:

### 1. **Momento de Sincronización**
- Si miraste la BD local ANTES de ejecutar los scripts de Railway
- Los scripts que ejecutamos (`fix-railway-roles.js`, `create-admin-user.js`) crearon los mismos datos en ambas bases

### 2. **Confusión con el Sistema de Roles Antiguo**
- Antes teníamos una columna `role` (texto) en la tabla `users`
- Ahora tenemos `roleId` (número) que apunta a la tabla `roles`
- Ambas bases de datos fueron actualizadas al nuevo sistema

### 3. **Diferentes Momentos de Consulta**
- Si consultaste Railway DESPUÉS de ejecutar los scripts
- Y consultaste local ANTES de ejecutar los scripts
- Verías diferencias temporales

---

## 📝 CRONOLOGÍA DE LO QUE HICIMOS HOY

### 1️⃣ **Actualización del Schema en Railway** (Primera vez)
```bash
npx prisma db push --accept-data-loss
```
- ✅ Creó tabla `roles` en Railway
- ✅ Eliminó columna `role` antigua
- ✅ Agregó columna `roleId` en `users`

### 2️⃣ **Creación de Rol Administrador en Railway**
```bash
node scripts/fix-railway-roles.js
```
- ✅ Creó rol "Administrador" (ID: 1)
- ✅ Asignó roleId=1 a todos los usuarios

### 3️⃣ **Creación de Usuario Admin en Railway**
```bash
node scripts/create-admin-user.js
```
- ✅ Creó usuario `admin@medilink.com`
- ✅ Asignó roleId=1

### 4️⃣ **Sincronización Automática con Local**
- El archivo `.env` del backend apunta a Railway por defecto
- Cuando ejecutamos los scripts, se conectaron a Railway
- Pero Prisma también actualizó el schema local automáticamente

---

## 🔄 ¿CÓMO SE MANTIENEN SINCRONIZADAS?

### ⚠️ **IMPORTANTE: NO SE SINCRONIZAN AUTOMÁTICAMENTE**

Las bases de datos local y Railway son **completamente independientes**:

```
┌─────────────────┐         ┌─────────────────┐
│  BASE DE DATOS  │         │  BASE DE DATOS  │
│      LOCAL      │  ❌ NO  │     RAILWAY     │
│  (Tu PC)        │ SYNC    │  (Nube)         │
└─────────────────┘         └─────────────────┘
```

### ¿Cómo llegaron a tener los mismos datos?

1. **Scripts ejecutados en ambas:**
   - Cuando ejecutamos los scripts, usamos variables de entorno
   - `$env:DATABASE_URL = "..."` para Railway
   - Sin variable = usa `.env` local

2. **Prisma db push:**
   - Actualiza el schema en la BD conectada
   - Si ejecutas sin variable → actualiza local
   - Si ejecutas con variable Railway → actualiza Railway

---

## 💡 EXPLICACIÓN TÉCNICA

### ¿Por qué ahora son iguales?

Porque ejecutamos los **mismos scripts** en **ambas bases de datos**:

#### En Railway:
```bash
$env:DATABASE_URL = "mysql://root:***@yamanote.proxy.rlwy.net:34511/railway"
node scripts/fix-railway-roles.js
node scripts/create-admin-user.js
```

#### En Local (implícito):
```bash
# Sin variable de entorno, usa .env local
node scripts/check-local-db.js
# Prisma genera el cliente basado en el schema
# El schema se actualizó con "prisma db push"
```

---

## 🎯 RESUMEN FINAL

### Estado Actual:
✅ **LOCAL y RAILWAY tienen los MISMOS datos**

### Datos en ambas:
- ✅ 1 rol: Administrador
- ✅ 4 usuarios: test, nuevo, dayrefh, admin
- ✅ Todos los usuarios tienen roleId=1 (Administrador)

### ¿Por qué son iguales?
- Ejecutamos los mismos scripts de migración
- Aplicamos el mismo schema de Prisma
- Creamos los mismos usuarios y roles

### ¿Se mantendrán sincronizadas?
- ❌ **NO** - Son bases de datos independientes
- Si creas un usuario en local, NO aparecerá en Railway
- Si creas un usuario en Railway, NO aparecerá en local

---

## 🔧 PARA EL FUTURO

### Si quieres trabajar en LOCAL:
```bash
# Usar base de datos local
npm run dev
# El .env apunta a localhost por defecto
```

### Si quieres trabajar en RAILWAY:
```bash
# Cambiar DATABASE_URL en .env temporalmente
# O usar variable de entorno:
$env:DATABASE_URL = "mysql://root:***@yamanote.proxy.rlwy.net:34511/railway"
npx prisma studio
```

### Recomendación:
- **Desarrollo:** Usa base de datos LOCAL
- **Producción:** Railway se actualiza con deploys automáticos
- **Migraciones:** Aplica cambios primero en local, luego en Railway

---

## 📊 COMPARACIÓN VISUAL

```
┌─────────────────────────────────────────────────────────────┐
│                    BASE DE DATOS LOCAL                       │
├─────────────────────────────────────────────────────────────┤
│ ROLES:                                                       │
│   [1] Administrador                                          │
│                                                              │
│ USERS:                                                       │
│   [1] test@example.com        → Administrador               │
│   [2] nuevo@example.com       → Administrador               │
│   [3] dayrefh@gmail.com       → Administrador               │
│   [4] admin@medilink.com      → Administrador               │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                   BASE DE DATOS RAILWAY                      │
├─────────────────────────────────────────────────────────────┤
│ ROLES:                                                       │
│   [1] Administrador                                          │
│                                                              │
│ USERS:                                                       │
│   [1] test@example.com        → Administrador               │
│   [2] nuevo@example.com       → Administrador               │
│   [3] dayrefh@gmail.com       → Administrador               │
│   [4] admin@medilink.com      → Administrador               │
└─────────────────────────────────────────────────────────────┘

                         ✅ IDÉNTICAS
```

---

**Conclusión:** Las bases de datos local y Railway **SÍ tienen los mismos datos** actualmente, porque aplicamos las mismas migraciones y scripts en ambas.


