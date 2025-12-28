# 🔍 DIAGNÓSTICO EXHAUSTIVO: FÓRMULA DE SUBTOTAL USD

**Fecha:** 27 de Diciembre 2025  
**Problema:** El subtotal USD en Salidas NO suma el precio de venta propuesto, suma el costo unitario

---

## 📊 RESUMEN EJECUTIVO

### ❌ ERROR CRÍTICO ENCONTRADO:
**Archivo:** `frontend/src/components/SaleFormAdvanced.jsx`  
**Líneas:** 398 y 446  
**Impacto:** ALTO - Afecta la visualización de subtotales en el formulario de salidas

### Fórmula Incorrecta:
```javascript
const subtotalUSD = costoUnitarioUSDRounded * newTotalQuantity;
```

### Fórmula Correcta:
```javascript
const subtotalUSD = precioVentaPropuestoUSD * newTotalQuantity;
```

---

## 🔎 ANÁLISIS DETALLADO POR ARCHIVO

### ✅ ARCHIVOS CORRECTOS (NO REQUIEREN CAMBIOS):

#### 1. **backend/src/routes/invoices.js** - ✅ CORRECTO
- **Línea 116:** `sum + (item.precio_propuesto_usd * item.qty)`
- **Uso:** Cálculo de subtotal al crear factura
- **Estado:** Multiplica correctamente precio × cantidad

#### 2. **frontend/src/pages/InvoiceManager.jsx** - ✅ CORRECTO (3 lugares)
- **Línea 79:** `sum + (item.precio_propuesto_usd * item.qty)` - Función calculateSubtotal()
- **Línea 208:** `sum + (item.precio_propuesto_usd * item.qty)` - Total en tabla de ventas pendientes
- **Línea 345:** `item.precio_propuesto_usd * item.qty` - Subtotal por item en detalle
- **Uso:** Cálculo de totales en módulo de facturación
- **Estado:** Todos correctos

#### 3. **backend/src/routes/dashboard.js** - ✅ CORRECTO (4 lugares)
- **Línea 101:** `Number(item.precio_propuesto_usd || 0) * item.qty` - Revenue del período
- **Línea 159:** `Number(item.precio_propuesto_usd || 0) * item.qty` - Revenue período anterior
- **Línea 224:** `Number(item.precio_propuesto_usd || 0) * item.qty` - Revenue por medicamento
- **Línea 261:** `Number(item.precio_propuesto_usd || 0) * item.qty` - Revenue por día (tendencia)
- **Uso:** Cálculo de ingresos en dashboard unificado
- **Estado:** Todos correctos

#### 4. **backend/src/routes/profitability.js** - ✅ CORRECTO (6 lugares)
- **Líneas 70, 156, 258, 285, 381, 485:** Todos usan `precio_propuesto_usd` y lo multiplican por `qty`
- **Uso:** Análisis de rentabilidad por medicamento, cliente y proveedor
- **Estado:** Todos correctos

#### 5. **backend/src/routes/sales.js** - ⚠️ NO CALCULA SUBTOTALES
- No realiza cálculos de subtotales, solo guarda datos
- **Estado:** No aplica

#### 6. **frontend/src/pages/FinanceReports.jsx** - ⚠️ NO MUESTRA SUBTOTALES
- Solo muestra cantidades, no calcula subtotales USD
- **Estado:** No aplica

---

### ❌ ARCHIVO CON ERROR (REQUIERE CORRECCIÓN):

#### **frontend/src/components/SaleFormAdvanced.jsx** - ❌ ERROR CRÍTICO

**ERROR 1 - Línea 398:**
```javascript
// ❌ INCORRECTO - Usa COSTO en lugar de PRECIO DE VENTA
const subtotalUSD = costoUnitarioUSDRounded * newTotalQuantity;
```

**Contexto:**
- Función: `addItemToSale()` - Caso cuando el item YA EXISTE en la tabla
- Propósito: Actualizar cantidad de un item existente
- Variables disponibles:
  - `precioVentaPropuestoUSD` - Precio de venta propuesto (línea 394) ✅
  - `costoUnitarioUSDRounded` - Costo unitario (línea 392) ❌ (usado incorrectamente)
  - `newTotalQuantity` - Nueva cantidad total

**Corrección Línea 398:**
```javascript
// ✅ CORRECTO - Usar PRECIO DE VENTA PROPUESTO
const subtotalUSD = precioVentaPropuestoUSD * newTotalQuantity;
```

---

**ERROR 2 - Línea 446:**
```javascript
// ❌ INCORRECTO - Usa COSTO en lugar de PRECIO DE VENTA
const subtotalUSD = costoUnitarioUSDRounded * currentItem.quantity;
```

**Contexto:**
- Función: `addItemToSale()` - Caso cuando el item es NUEVO
- Propósito: Agregar un nuevo item a la tabla
- Variables disponibles:
  - `precioVentaPropuestoUSD` - Precio de venta propuesto (línea 442) ✅
  - `costoUnitarioUSDRounded` - Costo unitario (línea 440) ❌ (usado incorrectamente)
  - `currentItem.quantity` - Cantidad del nuevo item

**Corrección Línea 446:**
```javascript
// ✅ CORRECTO - Usar PRECIO DE VENTA PROPUESTO
const subtotalUSD = precioVentaPropuestoUSD * currentItem.quantity;
```

---

**NOTA IMPORTANTE - Subtotal MN:**

Las líneas 401 y 449 calculan `subtotalMN` correctamente:
```javascript
// ✅ CORRECTO - Usa precioVentaMN que YA incluye el precio de venta propuesto
const subtotalMN = precioVentaMN * newTotalQuantity;
```

Esto es correcto porque `precioVentaMN` se calcula como:
```javascript
const precioVentaMN = (costoUnitarioUSDRounded + precioVentaPropuestoUSD) * exchangeRateMN;
```

---

## 🎯 IMPACTO DEL ERROR

### Impacto Directo:
1. ❌ **Subtotal USD mostrado en tabla de salidas es INCORRECTO**
   - Muestra el costo × cantidad en lugar del precio de venta × cantidad
   - El usuario ve un subtotal menor al real

2. ❌ **Total USD mostrado en el footer es INCORRECTO**
   - Suma de subtotales incorrectos
   - Línea 504: `saleItems.reduce((total, item) => total + item.subtotalUSD, 0)`

### Impacto Indirecto:
3. ✅ **Los datos guardados en la base de datos SON CORRECTOS**
   - El backend guarda `precio_propuesto_usd` correctamente
   - La columna `precio_propuesto_usd` en `saleitem` tiene el valor correcto

4. ✅ **Los reportes, dashboard y análisis de rentabilidad SON CORRECTOS**
   - Todos leen directamente de la base de datos
   - Usan `precio_propuesto_usd` de la tabla `saleitem`

### Conclusión del Impacto:
- **Error VISUAL únicamente** en el formulario de creación de salidas
- **NO afecta datos guardados** en base de datos
- **NO afecta reportes** ni análisis posteriores
- **SÍ confunde al usuario** al mostrar valores incorrectos durante la creación

---

## 📋 ARCHIVOS QUE REQUIEREN CAMBIOS

### Total de Archivos a Modificar: **1**

1. `frontend/src/components/SaleFormAdvanced.jsx`
   - Línea 398: Cambiar `costoUnitarioUSDRounded` por `precioVentaPropuestoUSD`
   - Línea 446: Cambiar `costoUnitarioUSDRounded` por `precioVentaPropuestoUSD`

---

## ✅ ARCHIVOS QUE NO REQUIEREN CAMBIOS

### Total de Archivos Correctos: **5**

1. `backend/src/routes/invoices.js` - 1 cálculo correcto
2. `frontend/src/pages/InvoiceManager.jsx` - 3 cálculos correctos
3. `backend/src/routes/dashboard.js` - 4 cálculos correctos
4. `backend/src/routes/profitability.js` - 6 cálculos correctos
5. `backend/src/routes/sales.js` - No aplica

---

## 🧪 PLAN DE PRUEBAS POST-CORRECCIÓN

### 1. Prueba en Formulario de Salidas:
- [ ] Crear una nueva salida
- [ ] Agregar un medicamento con precio de venta propuesto = $10 USD
- [ ] Cantidad = 5
- [ ] **Verificar:** Subtotal USD debe mostrar $50.00 (no el costo × 5)

### 2. Prueba de Item Existente:
- [ ] Agregar el mismo medicamento nuevamente
- [ ] Cantidad adicional = 3
- [ ] **Verificar:** Subtotal USD debe mostrar $80.00 ($10 × 8)

### 3. Prueba de Total:
- [ ] Agregar varios medicamentos
- [ ] **Verificar:** Total USD en el footer suma correctamente todos los subtotales

### 4. Prueba de Guardado:
- [ ] Guardar la salida
- [ ] Ir a Facturación
- [ ] **Verificar:** El total mostrado coincide con el del formulario

### 5. Prueba de Reportes:
- [ ] Ir a Dashboard
- [ ] **Verificar:** Las ventas del día reflejan los valores correctos
- [ ] Ir a Análisis de Rentabilidad
- [ ] **Verificar:** Los ingresos coinciden con los precios de venta

---

## 📊 ESTADÍSTICAS DEL ANÁLISIS

- **Archivos analizados:** 12
- **Archivos con código relevante:** 6
- **Archivos correctos:** 5
- **Archivos con error:** 1
- **Líneas con error:** 2
- **Líneas correctas:** 14
- **Tasa de error:** 12.5% (2 de 16 cálculos)

---

## 🚀 RECOMENDACIÓN

**Prioridad:** ALTA  
**Complejidad:** BAJA  
**Tiempo estimado:** 5 minutos  
**Riesgo:** BAJO (solo cambio visual, no afecta datos)

### Orden de Implementación:
1. ✅ Corregir líneas 398 y 446 en `SaleFormAdvanced.jsx`
2. ✅ Probar creación de salida
3. ✅ Verificar que subtotales se muestran correctamente
4. ✅ Confirmar que el guardado sigue funcionando
5. ✅ Validar que reportes no se afectaron (ya están correctos)

---

## 📝 NOTAS ADICIONALES

### ¿Por qué el error no afectó los datos guardados?

El formulario calcula `subtotalUSD` incorrectamente para MOSTRAR, pero al guardar:

```javascript
// En handleSaveSale() - línea ~550
items: saleItems.map(item => ({
  medicineId: item.medicineId,
  qty: item.quantity,
  precioVentaPropuestoUSD: item.precioVentaPropuestoUSD || 0  // ✅ Guarda el valor correcto
}))
```

El backend NO usa `subtotalUSD` del frontend, recalcula todo desde `precio_propuesto_usd`:

```javascript
// backend/src/routes/sales.js - línea ~72
precio_propuesto_usd: itemData.precioVentaPropuestoUSD || 0
```

Por eso los datos en la base de datos y todos los reportes están correctos.

---

**FIN DEL DIAGNÓSTICO**

