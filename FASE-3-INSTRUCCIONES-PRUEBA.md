# 🧪 FASE 3: INSTRUCCIONES DE PRUEBA - UI JERÁRQUICA

**Fecha:** 25 de diciembre de 2025  
**Hora:** 22:56  
**Estado:** ✅ **CÓDIGO IMPLEMENTADO - LISTO PARA PRUEBAS**

---

## 📦 ARCHIVOS CREADOS/MODIFICADOS

### **Archivos Nuevos:**
1. ✅ `frontend/src/components/RoleModalHierarchical.jsx` (650 líneas)
   - Componente completamente nuevo
   - UI jerárquica con módulos expandibles
   - Selección inteligente (padre → hijos)
   - Checkboxes con estado indeterminado
   - Contador de permisos
   - Animaciones suaves

### **Archivos Modificados:**
2. ✅ `frontend/src/config/featureFlags.js`
   - Agregado `HIERARCHICAL_ROLE_UI: false`
   - Feature flag para activar/desactivar nueva UI

3. ✅ `frontend/src/pages/Roles.jsx`
   - Imports agregados
   - Condicional para usar nuevo componente
   - Código viejo intacto como fallback

### **Backup:**
4. ✅ `D:\BACKUPS\inventario-pre-fase3-20251225-225341`
   - Backup completo antes de Fase 3
   - Punto de restauración disponible

---

## 🎯 CARACTERÍSTICAS IMPLEMENTADAS

### **1. Módulos Expandibles** 📂
- Click en flecha (▶) → expande/colapsa módulo
- Click en nombre del módulo → expande/colapsa
- Auto-expande módulos con permisos seleccionados al editar

### **2. Selección Inteligente** 🎯

#### **Módulo Padre:**
- ☐ Ningún hijo seleccionado → Checkbox vacío
- ☑ Todos los hijos seleccionados → Checkbox marcado
- ☑ Algunos hijos seleccionados → Checkbox indeterminado (-)

#### **Comportamiento:**
- Click en checkbox padre con todos deseleccionados → Selecciona TODOS los hijos
- Click en checkbox padre con todos seleccionados → Deselecciona TODOS los hijos
- Click en checkbox padre con algunos seleccionados → Selecciona los faltantes

#### **Módulo Hijo:**
- Click en checkbox hijo → Selecciona/deselecciona solo ese hijo
- Si todos los hijos se seleccionan → Checkbox padre se marca automáticamente

### **3. UI Visual** 🎨

#### **Colores:**
- Módulo/hijo seleccionado → Borde azul (`#3b82f6`)
- Módulo parcialmente seleccionado → Borde amarillo (`#fbbf24`)
- Módulo/hijo no seleccionado → Borde gris (`#e2e8f0`)

#### **Iconos:**
- Cada módulo tiene su icono (📊, ⚙️, 💊, etc.)
- Flecha de expansión (▶) rota 90° al expandir

#### **Contador:**
- Muestra: "X de Y permisos seleccionados"
- Botón "Seleccionar todos" / "Deseleccionar todos"
- Contador por módulo: "(2/5)" junto al nombre

### **4. Descripción de Permisos** 📝
- Cada módulo y sub-módulo muestra su descripción
- Texto en gris debajo del nombre
- Ayuda al usuario a entender qué hace cada permiso

---

## 🧪 CÓMO PROBAR

### **FASE A: PROBAR CON FEATURE FLAG DESACTIVADO (ACTUAL)**

**Estado actual:** `HIERARCHICAL_ROLE_UI: false`

**Pasos:**
1. Recarga el navegador (Ctrl+Shift+R)
2. Ve a `/roles`
3. Haz click en "Nuevo Rol" o "Editar" en un rol existente
4. **Resultado esperado:** Ves el modal VIEJO (lista plana de checkboxes)

**✅ Si ves el modal viejo:** El fallback funciona correctamente

---

### **FASE B: ACTIVAR NUEVA UI Y PROBAR**

#### **PASO 1: Activar Feature Flag**

Edita el archivo:
```
frontend/src/config/featureFlags.js
```

Cambia:
```javascript
HIERARCHICAL_ROLE_UI: false
```

A:
```javascript
HIERARCHICAL_ROLE_UI: true
```

#### **PASO 2: Recarga el Navegador**
- Ctrl+Shift+R (recarga forzada)

#### **PASO 3: Ir a Roles**
- Navega a `/roles`
- Haz click en "Nuevo Rol"

#### **PASO 4: Verificar UI Nueva**

**Deberías ver:**
- ✅ Módulos con iconos (📊, ⚙️, 💊, etc.)
- ✅ Flechas (▶) para expandir/colapsar
- ✅ Módulos colapsados por defecto
- ✅ Contador de permisos en la parte inferior
- ✅ Botón "Seleccionar todos"

---

### **FASE C: PRUEBAS FUNCIONALES**

#### **PRUEBA 1: Expandir/Colapsar Módulos**

**Pasos:**
1. Haz click en la flecha (▶) de "Panel de Datos"
2. Observa que se expande mostrando 5 sub-módulos
3. Haz click de nuevo en la flecha
4. Observa que se colapsa

**✅ Resultado esperado:** Animación suave, flecha rota 90°

---

#### **PRUEBA 2: Seleccionar Módulo Completo**

**Pasos:**
1. Expande "Panel de Datos"
2. Haz click en el checkbox del módulo padre (Panel de Datos)
3. Observa los 5 sub-módulos

**✅ Resultado esperado:**
- Todos los 5 sub-módulos se seleccionan
- Borde del módulo padre cambia a azul
- Contador muestra "5 de 20 permisos seleccionados"

---

#### **PRUEBA 3: Seleccionar Sub-módulo Individual**

**Pasos:**
1. Deselecciona todos (botón "Deseleccionar todos")
2. Expande "Panel de Datos"
3. Haz click SOLO en "Alertas de Stock"

**✅ Resultado esperado:**
- Solo "Alertas de Stock" se selecciona
- Checkbox padre muestra estado indeterminado (-)
- Borde del módulo padre cambia a amarillo
- Contador muestra "(1/5)" junto a "Panel de Datos"
- Contador inferior muestra "1 de 20 permisos seleccionados"

---

#### **PRUEBA 4: Seleccionar Todos los Hijos Manualmente**

**Pasos:**
1. Deselecciona todos
2. Expande "Panel de Datos"
3. Selecciona uno por uno los 5 sub-módulos

**✅ Resultado esperado:**
- Al seleccionar el 5to hijo, el checkbox padre se marca automáticamente
- Borde cambia de amarillo a azul
- Contador muestra "(5/5)"

---

#### **PRUEBA 5: Módulo Sin Hijos**

**Pasos:**
1. Haz click en el checkbox de "Medicamentos" (no tiene hijos)

**✅ Resultado esperado:**
- Se selecciona directamente
- No hay flecha de expansión
- Borde cambia a azul
- Contador aumenta en 1

---

#### **PRUEBA 6: Crear Rol Nuevo**

**Pasos:**
1. Llena el nombre: "Analista"
2. Descripción: "Solo reportes"
3. Selecciona:
   - Panel de Datos → Top Customers
   - Panel de Datos → Mejores Precios
   - Reportes → Reporte Financiero
4. Haz click en "Crear Rol"

**✅ Resultado esperado:**
- Rol se crea correctamente
- Permisos guardados: `["dashboard.top-customers", "dashboard.best-prices", "reports.financial"]`
- Aparece en la lista de roles

---

#### **PRUEBA 7: Editar Rol Existente**

**Pasos:**
1. Haz click en "Editar" en el rol "Vendedor"
2. Observa los permisos pre-seleccionados

**✅ Resultado esperado:**
- Módulos con permisos seleccionados están auto-expandidos
- Checkboxes correctos están marcados
- Contador muestra el número correcto

---

#### **PRUEBA 8: Botón "Seleccionar Todos"**

**Pasos:**
1. Haz click en "Seleccionar todos"
2. Observa todos los módulos

**✅ Resultado esperado:**
- Todos los checkboxes se marcan
- Todos los bordes cambian a azul
- Contador muestra "20 de 20 permisos seleccionados"
- Botón cambia a "Deseleccionar todos"

---

#### **PRUEBA 9: Validaciones**

**Pasos:**
1. Intenta crear un rol sin nombre
2. Intenta crear un rol sin permisos

**✅ Resultado esperado:**
- Muestra error: "El nombre del rol es requerido"
- Muestra error: "Debe seleccionar al menos un permiso"
- No permite guardar

---

### **FASE D: PRUEBAS DE INTEGRACIÓN**

#### **PRUEBA 10: Verificar Permisos en Sistema**

**Pasos:**
1. Crea rol "Analista" con solo `dashboard.top-customers`
2. Asigna ese rol a un usuario de prueba
3. Inicia sesión con ese usuario
4. Intenta acceder a diferentes rutas

**✅ Resultado esperado:**
- Solo puede acceder a `/top-customers`
- Las demás rutas muestran "Acceso Denegado"

---

## 🛡️ PLAN DE ROLLBACK

### **Si algo falla:**

#### **Opción 1: Desactivar Feature Flag (10 segundos)**
```javascript
// frontend/src/config/featureFlags.js
HIERARCHICAL_ROLE_UI: false
```
**Resultado:** Vuelve al modal viejo inmediatamente

---

#### **Opción 2: Restaurar desde Backup (2 minutos)**
```bash
# Copiar desde:
D:\BACKUPS\inventario-pre-fase3-20251225-225341
```

---

## 📊 CHECKLIST DE PRUEBAS

- [ ] Modal viejo funciona con flag en false
- [ ] Modal nuevo aparece con flag en true
- [ ] Expandir/colapsar módulos funciona
- [ ] Seleccionar módulo padre selecciona hijos
- [ ] Seleccionar hijo individual funciona
- [ ] Checkbox indeterminado funciona
- [ ] Contador de permisos correcto
- [ ] Botón "Seleccionar todos" funciona
- [ ] Crear rol nuevo funciona
- [ ] Editar rol existente funciona
- [ ] Permisos se guardan correctamente
- [ ] Permisos se aplican en el sistema
- [ ] Validaciones funcionan
- [ ] UI responsive y bonita
- [ ] Sin errores en consola

---

## ⚠️ IMPORTANTE

**NO ACTIVES EL FEATURE FLAG HASTA:**
1. ✅ Leer estas instrucciones completamente
2. ✅ Estar listo para probar exhaustivamente
3. ✅ Tener tiempo para hacer rollback si es necesario

---

## 🎯 ESTADO ACTUAL

**Feature Flag:** `HIERARCHICAL_ROLE_UI: false` ✅ DESACTIVADO

**Sistema:** ✅ Funcionando con modal viejo

**Nuevo Componente:** ✅ Implementado y listo

**Backup:** ✅ Creado

**Próximo Paso:** Activar flag y probar

---

**Preparado por:** AI Assistant  
**Fecha:** 25 de diciembre de 2025  
**Hora:** 22:58

