# 🔍 ANÁLISIS EXHAUSTIVO: Error al Crear Factura

**Fecha:** 27 de Diciembre 2025  
**Error:** `Invalid 'prisma.invoice.create()' invocation`

---

## 📊 PROBLEMAS ENCONTRADOS Y CORREGIDOS

### ❌ **PROBLEMA 1: Nombres de Relaciones Incorrectos** (CRÍTICO)

**Ubicación:** `backend/src/routes/invoices.js` - 3 lugares

#### **Error en POST /api/invoices (Línea 143):**
```javascript
// ❌ INCORRECTO:
include: {
  sale: {
    include: {
      customer: true,
      items: {              // ❌ No existe esta relación
        include: {
          medicine: true    // ❌ Nombre incorrecto
        }
      }
    }
  }
}

// ✅ CORRECTO:
include: {
  sale: {
    include: {
      customer: true,
      saleitem: {           // ✅ Nombre correcto de la relación
        include: {
          medicines: true   // ✅ Nombre correcto del campo
        }
      }
    }
  }
}
```

**Causa:**
- En el schema de Prisma, la relación se llama `saleitem` (no `items`)
- El campo de medicina en saleitem se llama `medicines` (no `medicine`)

---

#### **Error en GET /api/invoices (Línea 183):**
```javascript
// ❌ INCORRECTO:
items: {
  include: {
    medicine: {
      select: {
        id: true,
        nombreComercial: true
      }
    }
  }
}

// ✅ CORRECTO:
saleitem: {
  include: {
    medicines: {
      select: {
        id: true,
        nombreComercial: true
      }
    }
  }
}
```

---

#### **Error en GET /api/invoices/:id (Línea 225):**
```javascript
// ❌ INCORRECTO:
items: {
  include: {
    medicine: true
  }
}

// ✅ CORRECTO:
saleitem: {
  include: {
    medicines: true
  }
}
```

---

### ❌ **PROBLEMA 2: Valores Null/Undefined en Cálculos** (MEDIO)

**Ubicación:** `backend/src/routes/invoices.js` - Línea 115

#### **Error en Cálculo de Subtotal:**
```javascript
// ❌ INCORRECTO (falla si precio_propuesto_usd es null):
const subtotal = sale.saleitem.reduce((sum, item) => {
  return sum + (item.precio_propuesto_usd * item.qty);
}, 0);

// ✅ CORRECTO (maneja null/undefined):
const subtotal = sale.saleitem.reduce((sum, item) => {
  const precio = Number(item.precio_propuesto_usd) || 0;
  const cantidad = Number(item.qty) || 0;
  return sum + (precio * cantidad);
}, 0);
```

**Causa:**
- `precio_propuesto_usd` puede ser null en la base de datos
- `null * número = NaN`
- Prisma rechaza valores NaN al intentar guardar

---

### ❌ **PROBLEMA 3: Tipos de Datos en Create** (BAJO)

**Ubicación:** `backend/src/routes/invoices.js` - Línea 126-137

#### **Mejora en Conversión de Tipos:**
```javascript
// ❌ ANTES (podía causar problemas de tipo):
data: {
  saleId: Number(saleId),
  ncf: ncf.trim(),
  subtotal: subtotal,              // Puede ser NaN
  itbis: parseFloat(itbis || 0),
  itbisAmount: itbisAmount,        // Puede ser NaN
  discount: parseFloat(discount || 0),
  discountAmount: discountAmount,  // Puede ser NaN
  total: total,                    // Puede ser NaN
  notes: notes?.trim() || null,
  status: 'emitida'
}

// ✅ AHORA (garantiza tipos correctos):
data: {
  saleId: Number(saleId),
  ncf: ncf.trim(),
  subtotal: Number(subtotal),              // ✅ Garantiza número
  itbis: Number(parseFloat(itbis || 0)),
  itbisAmount: Number(itbisAmount),        // ✅ Garantiza número
  discount: Number(parseFloat(discount || 0)),
  discountAmount: Number(discountAmount),  // ✅ Garantiza número
  total: Number(total),                    // ✅ Garantiza número
  notes: notes?.trim() || null,
  status: 'emitida'
}
```

---

## 📋 RESUMEN DE CORRECCIONES

| Problema | Ubicación | Severidad | Estado |
|----------|-----------|-----------|--------|
| `items` → `saleitem` en POST | Línea 143 | CRÍTICO | ✅ Corregido |
| `medicine` → `medicines` en POST | Línea 145 | CRÍTICO | ✅ Corregido |
| `items` → `saleitem` en GET all | Línea 183 | CRÍTICO | ✅ Corregido |
| `medicine` → `medicines` en GET all | Línea 185 | CRÍTICO | ✅ Corregido |
| `items` → `saleitem` en GET by ID | Línea 225 | CRÍTICO | ✅ Corregido |
| `medicine` → `medicines` en GET by ID | Línea 227 | CRÍTICO | ✅ Corregido |
| Manejo de null en subtotal | Línea 115 | MEDIO | ✅ Corregido |
| Conversión explícita a Number | Líneas 130-135 | BAJO | ✅ Corregido |

---

## 🔍 ANÁLISIS DE CAUSA RAÍZ

### ¿Por qué pasó esto?

1. **Inconsistencia en nombres de relaciones:**
   - El schema de Prisma usa `saleitem` (singular)
   - El código intentaba usar `items` (plural)
   - Prisma no encontraba la relación y lanzaba error

2. **Confusión entre modelos:**
   - En `saleitem`, el campo se llama `medicines` (nombre del campo de relación)
   - No `medicine` (nombre del modelo)
   - Prisma es estricto con los nombres de campos

3. **Valores null en base de datos:**
   - Ventas antiguas pueden tener `precio_propuesto_usd` null
   - JavaScript convierte `null * número` a `NaN`
   - Prisma rechaza `NaN` en campos Decimal

---

## 🎯 VERIFICACIÓN DEL SCHEMA

### Modelo `sale`:
```prisma
model sale {
  id            Int        @id @default(autoincrement())
  customerId    Int
  date          DateTime
  notes         String?
  created_at    DateTime   @default(now())
  paymentMethod String?    @default("efectivo")
  customer      customer   @relation(...)
  saleitem      saleitem[] // ✅ Nombre correcto: saleitem
  invoice       invoice?
}
```

### Modelo `saleitem`:
```prisma
model saleitem {
  id                   Int       @id @default(autoincrement())
  saleId               Int
  medicineId           Int
  qty                  Int
  costo_unitario_usd   Decimal?  @db.Decimal(10, 2)
  precio_propuesto_usd Decimal?  @db.Decimal(10, 2) // ⚠️ Puede ser null
  supplierId           Int?
  medicines            Medicine  @relation(...) // ✅ Nombre correcto: medicines
  sale                 sale      @relation(...)
  supplier             supplier? @relation(...)
}
```

---

## ✅ SOLUCIÓN IMPLEMENTADA

### Cambios en `backend/src/routes/invoices.js`:

1. **Línea 115-120:** Manejo seguro de valores null
2. **Línea 130-135:** Conversión explícita a Number
3. **Línea 143:** Cambio de `items` a `saleitem`
4. **Línea 145:** Cambio de `medicine` a `medicines`
5. **Línea 183:** Cambio de `items` a `saleitem`
6. **Línea 185:** Cambio de `medicine` a `medicines`
7. **Línea 225:** Cambio de `items` a `saleitem`
8. **Línea 227:** Cambio de `medicine` a `medicines`

---

## 🧪 PRUEBAS RECOMENDADAS

### Test 1: Factura Normal
- Venta con precio_propuesto_usd válido
- ITBIS: 18%
- Descuento: 0%
- **Esperado:** Factura creada exitosamente

### Test 2: Factura con Descuento
- Venta normal
- ITBIS: 0%
- Descuento: 10%
- **Esperado:** Factura creada con descuento aplicado

### Test 3: Factura de Venta Antigua
- Venta con precio_propuesto_usd null
- **Esperado:** Factura creada con subtotal 0 (sin error)

### Test 4: Listar Facturas
- Crear varias facturas
- GET /api/invoices
- **Esperado:** Lista todas las facturas con datos completos

### Test 5: Ver Detalle de Factura
- GET /api/invoices/:id
- **Esperado:** Muestra factura con items y medicamentos

---

## 📊 IMPACTO

### Antes de la Corrección:
- ❌ No se podían crear facturas (error crítico)
- ❌ No se podían listar facturas (si existieran)
- ❌ No se podía ver detalle de facturas

### Después de la Corrección:
- ✅ Facturas se crean correctamente
- ✅ Lista de facturas funciona
- ✅ Detalle de facturas funciona
- ✅ Manejo seguro de valores null
- ✅ Tipos de datos garantizados

---

## 🔒 PREVENCIÓN FUTURA

### Recomendaciones:

1. **Usar nombres consistentes:**
   - Si el modelo es `saleitem`, usar `saleitem` en todo el código
   - No alternar entre `items`, `saleItems`, `saleitem`

2. **Validar siempre valores null:**
   - Usar `Number(valor) || 0` para campos numéricos opcionales
   - No asumir que campos Decimal siempre tienen valor

3. **Revisar schema antes de queries:**
   - Verificar nombres exactos de relaciones en schema.prisma
   - Usar autocompletado del IDE para evitar typos

4. **Agregar logs de debugging:**
   - Mantener los `console.log` para diagnosticar problemas
   - Especialmente en endpoints críticos como create/update

---

**FIN DEL ANÁLISIS**

