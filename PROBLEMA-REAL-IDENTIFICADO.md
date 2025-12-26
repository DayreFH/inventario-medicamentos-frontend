# 🚨 PROBLEMA REAL IDENTIFICADO

**Fecha:** 25 de diciembre de 2025
**Problema:** Usuario "Vendedor" puede acceder a TODO sin restricciones

---

## ❌ **EL PROBLEMA REAL:**

### **Las rutas NO están protegidas por permisos**

**`frontend/src/App.jsx` - Líneas 56-195:**

```javascript
// ❌ TODAS las rutas solo usan PrivateRoute
// PrivateRoute solo verifica si está AUTENTICADO
// NO verifica PERMISOS

<Route path="/receipts" element={
  <PrivateRoute>  {/* ❌ Solo verifica login */}
    <ProtectedLayout>
      <Receipts />
    </ProtectedLayout>
  </PrivateRoute>
} />

<Route path="/sales" element={
  <PrivateRoute>  {/* ❌ Solo verifica login */}
    <ProtectedLayout>
      <Sales />
    </ProtectedLayout>
  </PrivateRoute>
} />
```

### **`frontend/src/components/PrivateRoute.jsx` - Líneas 8-54:**

```javascript
export default function PrivateRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Cargando...</div>;
  }

  // ❌ Solo verifica si hay usuario
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // ✅ Usuario autenticado → Permite acceso
  // ❌ NO verifica permisos
  return children;
}
```

---

## 🔍 **CONSECUENCIA:**

**Cualquier usuario autenticado puede acceder a TODO:**
- ✅ Está logueado → Puede ver TODO
- ❌ No importa si es Vendedor, Usuario o Admin

**Usuario "Vendedor":**
- Debería ver solo: Salidas
- Puede acceder a: TODO (Entradas, Medicamentos, Usuarios, etc.)

---

## ✅ **SOLUCIÓN:**

### **Opción 1: Usar ProtectedRoute con permisos** ⭐⭐⭐⭐⭐

**Crear componente `ProtectedRoute` (diferente a `PrivateRoute`):**

```javascript
// frontend/src/components/ProtectedRoute.jsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children, requiredPermission }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Cargando...</div>;
  }

  // Verificar autenticación
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Si no requiere permiso específico, permitir
  if (!requiredPermission) {
    return children;
  }

  // Verificar si es admin (acceso total)
  const isAdmin = 
    user?.role === 'admin' ||
    user?.role?.name === 'Administrador' ||
    user?.email === 'admin@admin.com' ||
    user?.email === 'admin@inventario.com';
  
  if (isAdmin) {
    return children;
  }

  // Verificar permisos
  const userPermissions = user?.role?.permissions || [];
  
  // Manejar permisos como string o array
  let permissions = [];
  if (typeof userPermissions === 'string') {
    try {
      permissions = JSON.parse(userPermissions);
    } catch {
      permissions = [];
    }
  } else if (Array.isArray(userPermissions)) {
    permissions = userPermissions;
  }

  const hasPermission = permissions.includes(requiredPermission);

  if (!hasPermission) {
    // Redirigir a página de "sin permisos"
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h1>🔒 Acceso Denegado</h1>
        <p>No tienes permisos para acceder a esta página.</p>
        <p>Permiso requerido: <strong>{requiredPermission}</strong></p>
        <button onClick={() => window.history.back()}>
          Volver
        </button>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
```

**Actualizar `App.jsx`:**

```javascript
import ProtectedRoute from './components/ProtectedRoute';

// Ejemplo de rutas protegidas:

{/* PANEL DE DATOS - Requiere permiso 'dashboard' */}
<Route path="/dashboard" element={
  <ProtectedRoute requiredPermission="dashboard">
    <ProtectedLayout>
      <Dashboard />
    </ProtectedLayout>
  </ProtectedRoute>
} />

{/* ENTRADAS - Requiere permiso 'receipts' */}
<Route path="/receipts" element={
  <ProtectedRoute requiredPermission="receipts">
    <ProtectedLayout>
      <Receipts />
    </ProtectedLayout>
  </ProtectedRoute>
} />

{/* SALIDAS - Requiere permiso 'sales' */}
<Route path="/sales" element={
  <ProtectedRoute requiredPermission="sales">
    <ProtectedLayout>
      <Sales />
    </ProtectedLayout>
  </ProtectedRoute>
} />

{/* USUARIOS - Requiere permiso 'users' */}
<Route path="/users" element={
  <ProtectedRoute requiredPermission="users">
    <ProtectedLayout>
      <Users />
    </ProtectedLayout>
  </ProtectedRoute>
} />

{/* MEDICAMENTOS - Requiere permiso 'medicines' */}
<Route path="/medicines" element={
  <ProtectedRoute requiredPermission="medicines">
    <ProtectedLayout>
      <Medicines />
    </ProtectedLayout>
  </ProtectedRoute>
} />
```

---

### **Opción 2: Modificar PrivateRoute para aceptar permisos** ⭐⭐⭐⭐

**Actualizar `PrivateRoute.jsx`:**

```javascript
export default function PrivateRoute({ children, requiredPermission }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Cargando...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Si no requiere permiso, permitir acceso
  if (!requiredPermission) {
    return children;
  }

  // Verificar si es admin
  const isAdmin = 
    user?.role === 'admin' ||
    user?.role?.name === 'Administrador';
  
  if (isAdmin) {
    return children;
  }

  // Verificar permisos
  const userPermissions = user?.role?.permissions || [];
  let permissions = [];
  
  if (typeof userPermissions === 'string') {
    try {
      permissions = JSON.parse(userPermissions);
    } catch {
      permissions = [];
    }
  } else if (Array.isArray(userPermissions)) {
    permissions = userPermissions;
  }

  const hasPermission = permissions.includes(requiredPermission);

  if (!hasPermission) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h1>🔒 Acceso Denegado</h1>
        <p>No tienes permisos para acceder a esta página.</p>
        <button onClick={() => window.history.back()}>Volver</button>
      </div>
    );
  }

  return children;
}
```

**Actualizar `App.jsx`:**

```javascript
<Route path="/receipts" element={
  <PrivateRoute requiredPermission="receipts">
    <ProtectedLayout>
      <Receipts />
    </ProtectedLayout>
  </PrivateRoute>
} />

<Route path="/sales" element={
  <PrivateRoute requiredPermission="sales">
    <ProtectedLayout>
      <Sales />
    </ProtectedLayout>
  </PrivateRoute>
} />
```

---

## 📋 **MAPEO DE RUTAS A PERMISOS:**

```javascript
const routePermissions = {
  // Panel de Datos
  '/dashboard': 'dashboard',
  '/top-customers': 'reports',
  '/best-prices': 'reports',
  '/expiry-alerts': 'reports',
  '/idle-medicines': 'reports',
  
  // Administración
  '/admin/dop-usd': 'admin',
  '/admin/usd-mn': 'admin',
  '/admin/shipping': 'admin',
  
  // Gestión de Usuarios
  '/users': 'users',
  '/roles': 'roles',
  
  // Gestión de Datos
  '/medicines': 'medicines',
  '/customers': 'customers',
  '/suppliers': 'suppliers',
  
  // Operaciones
  '/receipts': 'receipts',
  '/sales': 'sales',
  
  // Finanzas
  '/finanzas/reportes': 'reports'
};
```

---

## 🎯 **RESULTADO ESPERADO:**

### **Usuario "Vendedor" (solo permiso: `sales`):**

**Puede acceder:**
- ✅ `/sales` (Salidas)

**NO puede acceder:**
- ❌ `/receipts` (Entradas) → "Acceso Denegado"
- ❌ `/medicines` (Medicamentos) → "Acceso Denegado"
- ❌ `/users` (Usuarios) → "Acceso Denegado"
- ❌ `/dashboard` (Panel) → "Acceso Denegado"

**Ve en el menú:**
- Todas las opciones (como quieres)
- Pero solo puede hacer clic en "Salidas"
- Si hace clic en otras → Mensaje "Acceso Denegado"

---

## 🚀 **MI RECOMENDACIÓN:**

### **OPCIÓN 2 (Modificar PrivateRoute)** ⭐⭐⭐⭐⭐

**Razones:**
1. ✅ Solo modificas 1 archivo (`PrivateRoute.jsx`)
2. ✅ Actualizas `App.jsx` agregando `requiredPermission`
3. ✅ No creas archivos nuevos
4. ✅ Mantiene el menú visible (como quieres)
5. ✅ Bloquea acceso a rutas sin permisos

**Tiempo:** 30 minutos

---

## 📝 **RESUMEN:**

**Problema actual:**
- ❌ `PrivateRoute` solo verifica login
- ❌ NO verifica permisos
- ❌ Cualquier usuario logueado accede a TODO

**Solución:**
- ✅ Agregar parámetro `requiredPermission` a `PrivateRoute`
- ✅ Verificar permisos antes de permitir acceso
- ✅ Mostrar "Acceso Denegado" si no tiene permiso
- ✅ Mantener menú visible (diseño intacto)

**Resultado:**
- ✅ Vendedor ve todo el menú
- ✅ Vendedor solo puede acceder a "Salidas"
- ✅ Otras rutas muestran "Acceso Denegado"

---

**¿Procedo con la OPCIÓN 2?** 🚀

