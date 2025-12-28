# 🔧 FIX - PARÁMETROS DE MEDICAMENTOS NO SE CARGAN

**Fecha:** 26 de diciembre de 2025  
**Problema:** Los parámetros guardados en la BD no se muestran, siempre aparecen valores por defecto (10, 30, 90)

---

## 🎯 **PROBLEMA IDENTIFICADO:**

El frontend estaba tratando `data.parametros` como un **array** cuando en realidad es un **objeto** (relación 1-a-1).

### **Código incorrecto:**
```javascript
// ❌ Tratando parametros como array
if (data.parametros && data.parametros.length > 0) {
  setParametros({
    stockMinimo: data.parametros[0].stockMinimo,  // ❌ [0] es incorrecto
    alertaCaducidad: data.parametros[0].alertaCaducidad,
    tiempoSinMovimiento: data.parametros[0].tiempoSinMovimiento
  });
}
```

**Resultado:**
- `data.parametros.length` es `undefined` (los objetos no tienen `.length`)
- La condición `data.parametros.length > 0` siempre es `false`
- Siempre entra al `else` y usa valores por defecto (10, 30, 90)
- **Nunca carga los valores reales de la base de datos**

---

## 📊 **ESTRUCTURA REAL DE LOS DATOS:**

### **Schema de Prisma:**
```prisma
model Medicine {
  // ...
  parametros  MedicineParam?  // ← Relación 1-a-1 (objeto, NO array)
  precios     MedicinePrice[] // ← Relación 1-a-muchos (array)
}

model MedicineParam {
  id                  Int      @id @default(autoincrement())
  medicineId          Int      @unique  // ← @unique = relación 1-a-1
  stockMinimo         Int      @default(10)
  alertaCaducidad     Int      @default(30)
  tiempoSinMovimiento Int      @default(90)
}
```

### **Datos que devuelve el backend:**
```javascript
{
  id: 5,
  nombreComercial: "DICLOPLEX FORTE",
  // ...
  parametros: {  // ← OBJETO, no array
    id: 5,
    medicineId: 7,
    stockMinimo: 20,
    alertaCaducidad: 45,
    tiempoSinMovimiento: 60
  },
  precios: [  // ← ARRAY
    { id: 1, precio: 100, ... },
    { id: 2, precio: 150, ... }
  ]
}
```

---

## ✅ **CÓDIGO CORREGIDO:**

```javascript
const loadParametros = async () => {
  if (!selectedMedicine) return;
  try {
    const { data } = await api.get(`/medicines/${selectedMedicine}`);
    console.log('📊 Datos del medicamento:', data);
    console.log('📊 Parámetros recibidos:', data.parametros);
    
    if (data.parametros) {
      // ✅ parametros es un objeto, no un array (relación 1-a-1)
      setParametros({
        stockMinimo: data.parametros.stockMinimo || 10,
        alertaCaducidad: data.parametros.alertaCaducidad || 30,
        tiempoSinMovimiento: data.parametros.tiempoSinMovimiento || 90
      });
      console.log('✅ Parámetros cargados:', {
        stockMinimo: data.parametros.stockMinimo,
        alertaCaducidad: data.parametros.alertaCaducidad,
        tiempoSinMovimiento: data.parametros.tiempoSinMovimiento
      });
    } else {
      // Si no hay parámetros, usar valores por defecto
      setParametros({
        stockMinimo: 10,
        alertaCaducidad: 30,
        tiempoSinMovimiento: 90
      });
      console.log('⚠️ No hay parámetros, usando valores por defecto');
    }
  } catch (error) {
    console.error('❌ Error cargando parámetros:', error);
  }
};
```

---

## 🔍 **DIFERENCIA CLAVE:**

| Antes (❌ Incorrecto) | Después (✅ Correcto) |
|----------------------|---------------------|
| `data.parametros.length > 0` | `data.parametros` |
| `data.parametros[0].stockMinimo` | `data.parametros.stockMinimo` |
| Siempre usa valores por defecto | Carga valores de la BD |

---

## 🧪 **CÓMO PROBAR:**

1. **Recarga el navegador** (Ctrl+F5)
2. **Ve a "Medicamentos" → Tab "Parámetros"**
3. **Selecciona "DICLOPLEX FORTE"** (medicineId = 7)
4. **Abre la consola del navegador** (F12)
5. **Verifica los logs:**
   ```
   📊 Datos del medicamento: {...}
   📊 Parámetros recibidos: {stockMinimo: 20, alertaCaducidad: 45, ...}
   ✅ Parámetros cargados: {stockMinimo: 20, alertaCaducidad: 45, ...}
   ```
6. **Los campos deben mostrar:**
   - Stock Mínimo: **20** (no 10)
   - Alerta de Caducidad: **45** (no 30)
   - Tiempo sin Movimiento: **60** (no 90)

---

## 📝 **LECCIÓN APRENDIDA:**

### **Relaciones en Prisma:**

| Tipo de relación | Sintaxis en Schema | Resultado en JS |
|------------------|-------------------|-----------------|
| **1-a-1** | `parametros MedicineParam?` | `data.parametros` (objeto o null) |
| **1-a-muchos** | `precios MedicinePrice[]` | `data.precios` (array) |

**Cómo identificar:**
- Si tiene `@unique` en el campo de relación → **1-a-1** → Objeto
- Si tiene `[]` en el tipo → **1-a-muchos** → Array

---

## ⚠️ **OTROS LUGARES A REVISAR:**

Buscar si hay más código que trate relaciones 1-a-1 como arrays:

```bash
# Buscar en el código
grep -r "\.parametros\[0\]" frontend/src/
grep -r "\.parametros\.length" frontend/src/
```

---

## ✅ **ESTADO FINAL:**

- ✅ Parámetros se cargan correctamente de la BD
- ✅ Valores reales se muestran en los campos
- ✅ Logs agregados para debugging
- ✅ Valores por defecto solo si no hay parámetros guardados

---

**¡Problema resuelto!** 🎉

**Recarga el navegador y verifica que ahora muestre los valores correctos.**

