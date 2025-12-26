# 🔴 PROBLEMA CRÍTICO ENCONTRADO - SCHEMA DE BASE DE DATOS

**Fecha:** 25 de diciembre de 2025
**Estado:** ❌ CRÍTICO - CONFLICTO ENTRE SCHEMA Y CÓDIGO

---

## 🚨 **EL PROBLEMA:**

**El schema de Prisma NO tiene la tabla `Role` ni el campo `roleId` en el modelo `User`.**

---

## 📊 **ANÁLISIS EXHAUSTIVO:**

### **1. LO QUE DICE EL SCHEMA (`schema.prisma`):**

```prisma
enum UserRole {
  admin
  user
}

model User {
  id        Int       @id @default(autoincrement())
  email     String    @unique
  password  String
  name      String
  role      UserRole  @default(user)  // ❌ ENUM, NO RELACIÓN
  isActive  Boolean   @default(true)
  created_at DateTime @default(now())
  updated_at DateTime @updatedAt
}
```

**Características:**
- ✅ Tiene campo `role` de tipo `UserRole` (ENUM)
- ❌ NO tiene campo `roleId`
- ❌ NO tiene relación con tabla `Role`
- ❌ NO existe modelo `Role` en el schema
- ✅ Solo permite 2 valores: `admin` o `user`

---

### **2. LO QUE HACE EL CÓDIGO DEL FRONTEND:**

**En `UserModal.jsx` (línea 69):**
```javascript
roleId: formData.roleId ? parseInt(formData.roleId) : undefined
```

**En `UserModal.jsx` (línea 21):**
```javascript
roleId: user.roleId || user.role?.id || ''
```

**En `UserModal.jsx` (línea 200):**
```javascript
<select value={formData.roleId} onChange={...}>
  <option value="">Sin rol asignado</option>
  {roles.map((role) => (
    <option key={role.id} value={role.id}>
      {role.name}
    </option>
  ))}
</select>
```

**El frontend está intentando:**
- ❌ Enviar `roleId` (campo que NO existe en el schema)
- ❌ Leer `user.roleId` (campo que NO existe)
- ❌ Leer `user.role.id` (role es ENUM, no tiene `.id`)
- ❌ Mostrar roles de una tabla `Role` (que NO existe)

---

### **3. LO QUE HACE EL CÓDIGO DEL BACKEND:**

**En `users.js` (línea 69):**
```javascript
roleId: formData.roleId ? parseInt(formData.roleId) : undefined
```

**En `users.js` (línea 143-155):**
```javascript
const user = await prisma.user.update({
  where: { id: parseInt(id) },
  data: updateData,  // ❌ Incluye roleId que NO existe
  include: {
    role: {  // ❌ Intenta hacer join con tabla Role que NO existe
      select: {
        id: true,
        name: true,
        permissions: true,
        startPanel: true
      }
    }
  }
});
```

**El backend está intentando:**
- ❌ Actualizar campo `roleId` (que NO existe en el schema)
- ❌ Hacer `include` de tabla `Role` (que NO existe)
- ❌ Leer `role.id`, `role.name`, `role.permissions`, `role.startPanel` (NO existen)

---

### **4. LO QUE EXISTE EN LA BASE DE DATOS:**

**Hay 2 escenarios posibles:**

#### **ESCENARIO A: Base de datos sigue el schema.prisma**
```sql
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(255) UNIQUE,
  password VARCHAR(255),
  name VARCHAR(255),
  role ENUM('admin', 'user') DEFAULT 'user',  -- ❌ ENUM
  isActive BOOLEAN DEFAULT true,
  created_at DATETIME DEFAULT NOW(),
  updated_at DATETIME DEFAULT NOW()
);

-- ❌ NO existe tabla `roles`
```

**Resultado:**
- ✅ El schema coincide con la base de datos
- ❌ El código NO coincide con el schema
- ❌ Intentar actualizar `roleId` da error de Prisma
- ❌ Intentar hacer `include: { role }` da error

#### **ESCENARIO B: Base de datos tiene tabla `roles` pero schema NO**
```sql
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(255) UNIQUE,
  password VARCHAR(255),
  name VARCHAR(255),
  roleId INT,  -- ✅ Relación con roles
  isActive BOOLEAN DEFAULT true,
  created_at DATETIME DEFAULT NOW(),
  updated_at DATETIME DEFAULT NOW(),
  FOREIGN KEY (roleId) REFERENCES roles(id)
);

CREATE TABLE roles (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255),
  permissions JSON,
  startPanel VARCHAR(255),
  description TEXT,
  created_at DATETIME DEFAULT NOW(),
  updated_at DATETIME DEFAULT NOW()
);
```

**Resultado:**
- ✅ El código coincide con la base de datos
- ❌ El schema NO coincide con la base de datos
- ❌ Prisma está usando un schema desactualizado
- ❌ Hay "drift" entre schema y base de datos

---

## 🔍 **¿CUÁL ES EL ESCENARIO REAL?**

### **Evidencias:**

1. **El código del frontend y backend usa `roleId` y tabla `Role`**
   - Esto sugiere que en algún momento se implementó un sistema de roles con tabla separada

2. **El schema.prisma tiene ENUM `UserRole`**
   - Esto sugiere que es un schema antiguo o no actualizado

3. **Existe archivo `backend/src/routes/roles.js`**
   - Esto confirma que SÍ existe una tabla `roles` en la base de datos

4. **El usuario ve "Sin rol" en la interfaz**
   - Esto sugiere que el usuario tiene `roleId: null` en la base de datos

5. **Los cambios no se guardan**
   - Esto sugiere que Prisma está rechazando el campo `roleId` porque NO está en el schema

---

## 🎯 **CONCLUSIÓN:**

### **PROBLEMA PRINCIPAL:**

**El `schema.prisma` está desactualizado y NO refleja la estructura real de la base de datos.**

**Situación actual:**
```
Base de datos real:
- Tabla `users` con campo `roleId` (INT)
- Tabla `roles` con campos `id`, `name`, `permissions`, `startPanel`

Schema Prisma:
- Model `User` con campo `role` (ENUM)
- NO existe model `Role`

Código frontend/backend:
- Usa `roleId` y tabla `Role`
- Intenta hacer relaciones con tabla `Role`
```

**Resultado:**
- ❌ Prisma genera un cliente basado en el schema desactualizado
- ❌ El código intenta usar campos que Prisma no conoce
- ❌ Las actualizaciones fallan silenciosamente o dan error
- ❌ Los includes de `role` no funcionan

---

## ✅ **SOLUCIÓN:**

### **Opción 1: Actualizar el schema.prisma para reflejar la base de datos real**

**Hacer "introspection" de la base de datos:**
```bash
cd backend
npx prisma db pull
```

**Esto generará un schema.prisma basado en la estructura real de la base de datos.**

**Luego regenerar el cliente Prisma:**
```bash
npx prisma generate
```

---

### **Opción 2: Verificar qué hay en la base de datos**

**Script para verificar:**
```javascript
// backend/scripts/check-database-structure.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkStructure() {
  // Intentar buscar usuarios con roleId
  try {
    const users = await prisma.$queryRaw`
      SELECT * FROM users LIMIT 1
    `;
    console.log('Estructura de users:', Object.keys(users[0]));
  } catch (e) {
    console.error('Error:', e);
  }

  // Intentar buscar tabla roles
  try {
    const roles = await prisma.$queryRaw`
      SELECT * FROM roles LIMIT 1
    `;
    console.log('Estructura de roles:', Object.keys(roles[0]));
  } catch (e) {
    console.error('Tabla roles no existe:', e.message);
  }
}

checkStructure()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
  });
```

---

## 📋 **PASOS PARA ARREGLAR:**

### **1. Verificar estructura de base de datos:**
```bash
cd backend
npx prisma db pull
```

### **2. Revisar el schema generado:**
```bash
# Abrir backend/prisma/schema.prisma
# Verificar que tenga:
# - model Role { ... }
# - model User { roleId Int? ... }
```

### **3. Regenerar cliente Prisma:**
```bash
npx prisma generate
```

### **4. Reiniciar el servidor backend:**
```bash
npm run dev
```

### **5. Probar actualizar usuario:**
- Editar usuario Dayre
- Asignar rol "Vendedor"
- Guardar
- Verificar logs del backend

---

## 🔴 **RESUMEN:**

### **Problema:**
El `schema.prisma` tiene un modelo `User` con campo `role` de tipo ENUM, pero el código y la base de datos real usan `roleId` con relación a tabla `Role`.

### **Causa:**
El schema NO fue actualizado después de implementar el sistema de roles avanzado.

### **Consecuencia:**
Prisma no conoce el campo `roleId` ni la tabla `Role`, por lo que las actualizaciones fallan.

### **Solución:**
Ejecutar `npx prisma db pull` para actualizar el schema y luego `npx prisma generate` para regenerar el cliente.

---

**Este es el problema raíz de por qué no se guardan los cambios en los usuarios.** 🎯

