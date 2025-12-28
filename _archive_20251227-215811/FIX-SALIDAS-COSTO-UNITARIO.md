# ✅ FIX COMPLETADO - NULL CONSTRAINT EN SALIDAS

## 🎯 PROBLEMA RESUELTO

**Error original:**
```
Invalid 'prisma.saleitem.create()' invocation:
Null constraint violation on the fields: ('costo_unitario_usd')
```

**Causa raíz:** 
La tabla `saleitem` en la base de datos tiene el campo `costo_unitario_usd` como **NOT NULL**, pero el código no estaba enviando ese valor al crear los items de venta.

---

## 🔍 ANÁLISIS DEL PROBLEMA

### **Schema vs Base de Datos:**

```prisma
model saleitem {
  id                   Int       @id @default(autoincrement())
  saleId               Int
  medicineId           Int
  qty                  Int
  costo_unitario_usd   Decimal?  @db.Decimal(10, 2)  // ← Schema dice "opcional"
  // ...
}
```

**Pero en la BD:** El campo `costo_unitario_usd` es **NOT NULL** (obligatorio).

### **Código anterior:**

```javascript
// ❌ INCORRECTO: No enviaba costo_unitario_usd
await tx.saleitem.create({
  data: { 
    saleId: sale.id, 
    medicineId: it.medicineId, 
    qty: it.qty
    // ← Faltaba: costo_unitario_usd
  }
});
```

---

## 🔧 SOLUCIÓN IMPLEMENTADA

### **1. POST /api/sales (Crear salida)**

**Cambio:** Obtener el costo unitario del medicamento antes de crear los items.

```javascript
// ✅ CORRECTO: Obtener costos de MedicinePrice
const medicinesData = [];
for (const it of items) {
  const med = await tx.Medicine.findUnique({ 
    where: { id: it.medicineId },
    include: {
      MedicinePrice: {
        orderBy: { created_at: 'desc' },
        take: 1
      }
    }
  });
  if (!med || med.stock < it.qty) {
    throw new Error(`Stock insuficiente para ${med?.nombreComercial ?? 'medicamento ' + it.medicineId}`);
  }
  medicinesData.push({
    medicineId: it.medicineId,
    qty: it.qty,
    costoUnitarioUsd: med.MedicinePrice?.[0]?.precioCompraUnitario || 0
  });
}

// Crear items con costo_unitario_usd
for (const medData of medicinesData) {
  await tx.saleitem.create({
    data: { 
      saleId: sale.id, 
      medicineId: medData.medicineId, 
      qty: medData.qty,
      costo_unitario_usd: medData.costoUnitarioUsd  // ← Agregado
    }
  });
  // ...
}
```

---

### **2. PUT /api/sales/:id (Editar salida)**

**Cambio:** Obtener costos antes de reemplazar items.

```javascript
// ✅ CORRECTO: Obtener costos antes de crear items
await tx.saleitem.deleteMany({ where: { saleId: id } });
if (items.length) {
  const itemsWithCost = [];
  for (const it of items) {
    const med = await tx.Medicine.findUnique({
      where: { id: it.medicineId },
      include: {
        MedicinePrice: {
          orderBy: { created_at: 'desc' },
          take: 1
        }
      }
    });
    itemsWithCost.push({
      saleId: id,
      medicineId: it.medicineId,
      qty: it.qty,
      costo_unitario_usd: med?.MedicinePrice?.[0]?.precioCompraUnitario || 0  // ← Agregado
    });
  }
  await tx.saleitem.createMany({
    data: itemsWithCost
  });
}
```

---

### **3. Corrección adicional: `tx.saleItem` → `tx.saleitem`**

También se corrigió la referencia al modelo en el PUT:

```javascript
// ❌ INCORRECTO:
const prevItems = await tx.saleItem.findMany({ ... });

// ✅ CORRECTO:
const prevItems = await tx.saleitem.findMany({ ... });
```

---

## 📋 RESUMEN DE CAMBIOS

### **Archivo modificado:** `backend/src/routes/sales.js`

| Endpoint | Cambio | Líneas |
|----------|--------|--------|
| POST /api/sales | Agregado: Obtener `costo_unitario_usd` de `MedicinePrice` | 36-78 |
| PUT /api/sales/:id | Agregado: Obtener `costo_unitario_usd` de `MedicinePrice` | 134-156 |
| PUT /api/sales/:id | Corregido: `tx.saleItem` → `tx.saleitem` | 96 |

---

## ✅ RESULTADO ESPERADO

Después de estos cambios:

- ✅ Las salidas (ventas) se pueden **crear correctamente**
- ✅ Las salidas se pueden **editar correctamente**
- ✅ El campo `costo_unitario_usd` se **guarda automáticamente** con el último precio de compra
- ✅ Si no hay precio de compra, se guarda **0** como valor por defecto
- ✅ No más errores de "Null constraint violation"

---

## 🧪 CÓMO PROBAR

### **Paso 1: El backend debería reiniciarse automáticamente**

Verifica en la consola del backend que no haya errores.

### **Paso 2: Intentar crear una salida**

1. Ve a **Operaciones → Salidas**
2. Selecciona un medicamento (que tenga entrada previa con precio)
3. Selecciona un cliente
4. Ingresa cantidad
5. Haz clic en **Guardar**
6. **Debería funcionar correctamente** ✅

### **Paso 3: Verificar en la base de datos**

```sql
SELECT * FROM inventario_meds.saleitem ORDER BY id DESC LIMIT 5;
```

Deberías ver que el campo `costo_unitario_usd` tiene valores (no NULL).

---

## 📝 NOTAS IMPORTANTES

### **¿De dónde viene el costo_unitario_usd?**

El sistema obtiene el **último precio de compra** del medicamento desde la tabla `medicine_prices`:

```javascript
med.MedicinePrice?.[0]?.precioCompraUnitario || 0
```

- Si el medicamento tiene entradas previas → Usa el último `precioCompraUnitario`
- Si el medicamento NO tiene entradas → Usa `0` como valor por defecto

### **¿Por qué es importante guardar el costo?**

El `costo_unitario_usd` es necesario para:
1. Calcular la utilidad de cada venta (precio venta - costo)
2. Generar reportes financieros precisos
3. Análisis de rentabilidad por producto

### **¿Qué pasa si un medicamento no tiene precio de compra?**

El sistema guardará `0` como costo, lo cual es válido para:
- Medicamentos donados
- Muestras médicas
- Casos especiales

---

## 🔍 VERIFICACIONES REALIZADAS

- ✅ No quedan referencias a `tx.saleItem` (camelCase)
- ✅ Todos los `create` y `createMany` de `saleitem` incluyen `costo_unitario_usd`
- ✅ No hay errores de linter
- ✅ El código maneja casos donde no hay `MedicinePrice` (usa 0)
- ✅ La transacción sigue siendo atómica (todo o nada)

---

**Fecha:** 26 de diciembre de 2025  
**Archivo modificado:** 1 (`backend/src/routes/sales.js`)  
**Total de correcciones:** 3 (POST, PUT, modelo)  
**Estado:** ✅ COMPLETADO Y LISTO PARA PROBAR

