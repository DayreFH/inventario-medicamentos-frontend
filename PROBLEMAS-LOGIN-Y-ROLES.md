# 🐛 PROBLEMAS IDENTIFICADOS Y SOLUCIONES

**Fecha:** 28 de diciembre de 2024

---

## ❌ PROBLEMA 1: Entra a "Salidas" en lugar de "Dashboard"

### **Causa:**
El startPanel ya está configurado como `/dashboard` en la base de datos, pero el frontend está redirigiendo a `/sales`.

### **Solución Temporal:**
1. Cierra sesión
2. Vuelve a iniciar sesión
3. El sistema debería redirigirte a `/dashboard`

### **Si persiste:**
El problema está en `Login.jsx` línea 46:
```javascript
const startPanel = result.user?.role?.startPanel || result.user?.roles?.startPanel || '/dashboard';
```

Está buscando `result.user?.role?.startPanel` pero debería ser `result.user?.roles?.startPanel`.

---

## ❌ PROBLEMA 2: Página en blanco al editar rol Administrador

### **Causa Probable:**
Los permisos del rol Administrador están guardados como OBJETO:
```json
{
  "users": { "view": true, "create": true, ... },
  "medicines": { "view": true, "create": true, ... }
}
```

Pero `RoleModalHierarchical.jsx` espera un ARRAY:
```json
["users", "medicines", "sales", ...]
```

### **Línea problemática:**
`RoleModalHierarchical.jsx` línea 44:
```javascript
setSelectedPermissions(Array.isArray(perms) ? perms : []);
```

Si `perms` es un objeto, lo convierte a array vacío `[]`, perdiendo todos los permisos.

### **Solución:**
Necesito convertir el objeto de permisos a array de permisos seleccionados.

---

## 🔧 SOLUCIONES A APLICAR:

1. ✅ Corregir `Login.jsx` para que lea correctamente `roles.startPanel`
2. ✅ Corregir `RoleModalHierarchical.jsx` para manejar permisos como objeto
3. ✅ Cerrar sesión y volver a entrar

---

**¿Procedemos con los fixes?**

