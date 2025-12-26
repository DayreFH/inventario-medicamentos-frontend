# 🧪 GUÍA DE PRUEBA - SISTEMA DE PERMISOS

**Fecha:** 25 de diciembre de 2025
**Estado:** Listo para probar

---

## ✅ **ESTADO ACTUAL DEL SISTEMA:**

### **Usuarios configurados:**

**1. Vendedor (dayrefh@gmail.com)**
- Rol: Vendedor
- Permisos: `sales` (solo ventas)
- Debe poder: Solo acceder a "Salidas"

**2. Administrador (admin@inventario.com)**
- Rol: Administrador
- Permisos: Todos (10 permisos)
- Debe poder: Acceder a TODO

---

## 🧪 **PRUEBA 1: Usuario VENDEDOR**

### **Paso 1: Cerrar sesión actual**
```
1. Si estás logueado, haz clic en tu nombre (arriba a la derecha)
2. Clic en "Cerrar sesión"
3. O simplemente ve a: http://localhost:3000/login
```

### **Paso 2: Iniciar sesión como Vendedor**
```
Email: dayrefh@gmail.com
Contraseña: (tu contraseña)
```

### **Paso 3: Verificar el menú**
```
✅ Debes ver TODO el menú lateral:
   📊 PANEL DE DATOS
   ⚙️ ADMINISTRACIÓN
   👥 GESTIÓN DE USUARIOS
   📋 GESTIÓN DE DATOS
   🔄 OPERACIONES
   💰 FINANZAS
```

### **Paso 4: Probar acceso a "Salidas" (DEBE FUNCIONAR)**
```
1. Clic en "OPERACIONES" en el menú
2. Clic en "Salidas"
3. ✅ DEBE FUNCIONAR - Debes ver la página de ventas
4. ✅ Debes poder crear una venta
```

### **Paso 5: Probar acceso a "Entradas" (DEBE BLOQUEAR)**
```
1. Clic en "OPERACIONES" en el menú
2. Clic en "Entradas"
3. ❌ DEBE MOSTRAR:
   ┌─────────────────────────────┐
   │         🔒                  │
   │   Acceso Denegado           │
   │                             │
   │ No tienes permisos para     │
   │ acceder a esta página.      │
   │                             │
   │ Usuario: Dayre              │
   │ Rol: Vendedor               │
   │ Permiso requerido: receipts │
   │                             │
   │   [← Volver]                │
   └─────────────────────────────┘
```

### **Paso 6: Probar otros módulos (TODOS DEBEN BLOQUEAR)**

**Probar cada uno:**
- [ ] Dashboard → ❌ Debe bloquear (permiso: dashboard)
- [ ] Principales Clientes → ❌ Debe bloquear (permiso: reports)
- [ ] Tasa de Cambio → ❌ Debe bloquear (permiso: admin)
- [ ] Usuarios → ❌ Debe bloquear (permiso: users)
- [ ] Roles → ❌ Debe bloquear (permiso: roles)
- [ ] Medicamentos → ❌ Debe bloquear (permiso: medicines)
- [ ] Clientes → ❌ Debe bloquear (permiso: customers)
- [ ] Proveedores → ❌ Debe bloquear (permiso: suppliers)
- [ ] Reportes → ❌ Debe bloquear (permiso: reports)

### **Paso 7: Verificar logs en consola**
```
1. Presiona F12 para abrir la consola del navegador
2. Ve a la pestaña "Console"
3. Debes ver logs como:
   🔒 PrivateRoute: { user: "Dayre", requiredPermission: "receipts" }
   🔍 PrivateRoute: Verificando permiso { requiredPermission: "receipts", userPermissions: ["sales"] }
   ❌ PrivateRoute: Sin permiso, mostrando acceso denegado
```

---

## 🧪 **PRUEBA 2: Usuario ADMINISTRADOR**

### **Paso 1: Cerrar sesión**
```
1. Clic en tu nombre (arriba a la derecha)
2. Clic en "Cerrar sesión"
```

### **Paso 2: Iniciar sesión como Administrador**
```
Email: admin@inventario.com
Contraseña: (tu contraseña)
```

### **Paso 3: Probar TODOS los módulos (TODOS DEBEN FUNCIONAR)**

**Verificar cada uno:**
- [ ] Dashboard → ✅ Debe funcionar
- [ ] Principales Clientes → ✅ Debe funcionar
- [ ] Tasa de Cambio → ✅ Debe funcionar
- [ ] Usuarios → ✅ Debe funcionar
- [ ] Roles → ✅ Debe funcionar
- [ ] Medicamentos → ✅ Debe funcionar
- [ ] Clientes → ✅ Debe funcionar
- [ ] Proveedores → ✅ Debe funcionar
- [ ] Entradas → ✅ Debe funcionar
- [ ] Salidas → ✅ Debe funcionar
- [ ] Reportes → ✅ Debe funcionar

### **Paso 4: Verificar logs en consola**
```
Debes ver:
🔒 PrivateRoute: { user: "Administrador", requiredPermission: "..." }
✅ PrivateRoute: Usuario es admin, acceso total
```

---

## 🧪 **PRUEBA 3: Crear rol personalizado "Almacenista"**

### **Paso 1: Ir a Gestión de Roles**
```
1. Login como Administrador
2. Clic en "GESTIÓN DE USUARIOS" → "Roles"
```

### **Paso 2: Crear nuevo rol**
```
1. Clic en "Crear Rol"
2. Llenar datos:
   - Nombre: Almacenista
   - Descripción: Gestiona inventario y entradas
   - Panel inicial: /dashboard
   - Permisos: Seleccionar:
     ✓ medicines
     ✓ receipts
     ✓ suppliers
3. Guardar
```

### **Paso 3: Crear usuario con ese rol**
```
1. Ir a "GESTIÓN DE USUARIOS" → "Usuarios"
2. Clic en "Nuevo Usuario"
3. Llenar datos:
   - Nombre: Test Almacenista
   - Email: almacenista@test.com
   - Contraseña: Test1234
   - Rol: Almacenista
4. Guardar
```

### **Paso 4: Probar con el nuevo usuario**
```
1. Cerrar sesión
2. Login con: almacenista@test.com / Test1234
3. Verificar accesos:
   ✅ Medicamentos → Debe funcionar
   ✅ Entradas → Debe funcionar
   ✅ Proveedores → Debe funcionar
   ❌ Salidas → Debe bloquear
   ❌ Clientes → Debe bloquear
   ❌ Usuarios → Debe bloquear
```

---

## 🐛 **SI ALGO NO FUNCIONA:**

### **Problema 1: Todos los usuarios pueden acceder a todo**

**Solución:**
```
1. Verifica que el frontend se haya recargado:
   - Presiona Ctrl + Shift + R (recarga forzada)
   
2. Limpia el localStorage:
   - F12 → Console → Ejecuta:
     localStorage.clear();
     location.reload();
```

### **Problema 2: Administrador no puede acceder a nada**

**Solución:**
```
1. Verifica en consola (F12) los logs
2. Busca errores en rojo
3. Verifica que el rol sea "Administrador" exactamente
```

### **Problema 3: No se muestra "Acceso Denegado"**

**Solución:**
```
1. Verifica que PrivateRoute.jsx tenga el código actualizado
2. Verifica que App.jsx tenga requiredPermission en las rutas
3. Recarga el navegador con Ctrl + Shift + R
```

### **Problema 4: Error en consola**

**Buscar:**
```
- "Cannot read property 'permissions' of undefined"
  → El usuario no tiene rol asignado
  
- "JSON.parse error"
  → Los permisos no están en formato correcto
  
- "requiredPermission is undefined"
  → Falta agregar requiredPermission en App.jsx
```

---

## 📊 **CHECKLIST FINAL:**

### **Usuario Vendedor:**
- [ ] Ve el menú completo
- [ ] Solo puede acceder a "Salidas"
- [ ] Ve "Acceso Denegado" en otros módulos
- [ ] Botón "Volver" funciona
- [ ] Puede crear ventas sin problema

### **Usuario Administrador:**
- [ ] Puede acceder a TODOS los módulos
- [ ] No ve "Acceso Denegado" nunca
- [ ] Puede gestionar usuarios y roles

### **Rol Personalizado:**
- [ ] Se puede crear desde /roles
- [ ] Los permisos se respetan
- [ ] Funciona correctamente

### **Diseño:**
- [ ] Menú lateral visible siempre
- [ ] Página "Acceso Denegado" se ve bien
- [ ] No hay errores visuales

---

## 🎯 **RESULTADO ESPERADO:**

```
✅ Vendedor → Solo "Salidas"
✅ Administrador → TODO
✅ Roles personalizados → Funcionan
✅ Menú visible → Siempre
✅ Acceso Denegado → Diseño profesional
```

---

**¿Listo para empezar las pruebas?** 🚀

**Dime qué resultado obtienes en cada paso.**

