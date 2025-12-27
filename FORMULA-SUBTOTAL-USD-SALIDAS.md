# 📊 FÓRMULA DE SUBTOTAL USD EN SALIDAS

**Fecha:** 26 de diciembre de 2025  
**Módulo:** Salidas (Sales)  
**Archivo:** `frontend/src/components/SaleFormAdvanced.jsx`

---

## 💰 **FÓRMULA ACTUAL:**

### **Subtotal USD:**
```javascript
subtotalUSD = costoUnitarioUSD × cantidad
```

**Ubicación en código:**
- Línea 379 (al actualizar item existente)
- Línea 427 (al agregar nuevo item)

---

## 🔢 **COMPONENTES DE LA FÓRMULA:**

### **1. Costo Unitario USD (`costoUnitarioUSD`):**

```javascript
// Líneas 359-360 y 407-408
const costoUnitarioUSD = (precioCompraDOP / exchangeRate.rate) + shippingCostPerUnit;
const costoUnitarioUSDRounded = Math.round(costoUnitarioUSD * 100) / 100;
```

**Donde:**
- `precioCompraDOP` = Precio de compra en DOP (del proveedor)
- `exchangeRate.rate` = Tasa de cambio DOP/USD
- `shippingCostPerUnit` = Costo de envío por unidad

**Fórmula expandida:**
```
costoUnitarioUSD = (precioCompraDOP / tasaDOP_USD) + costoEnvíoPorUnidad
```

### **2. Cantidad:**
```javascript
currentItem.quantity  // Cantidad ingresada por el usuario
```

---

## 📋 **EJEMPLO PRÁCTICO:**

### **Datos de entrada:**
- Precio de compra: **$100.00 DOP**
- Tasa de cambio: **62.83 DOP/USD**
- Costo de envío por unidad: **$0.20 USD**
- Cantidad: **8 unidades**

### **Cálculo paso a paso:**

**1. Convertir precio DOP a USD:**
```
100.00 DOP ÷ 62.83 = 1.5917 USD
```

**2. Agregar costo de envío:**
```
1.5917 USD + 0.20 USD = 1.7917 USD
```

**3. Redondear a 2 decimales:**
```
costoUnitarioUSD = 1.79 USD
```

**4. Calcular subtotal:**
```
subtotalUSD = 1.79 USD × 8 = 14.32 USD
```

---

## 🔍 **CÓDIGO COMPLETO:**

### **Al agregar nuevo item (líneas 401-430):**

```javascript
// 1. Obtener precio de compra DOP
const precioCompraDOP = selectedMedicine.precios && selectedMedicine.precios.length > 0 
  ? Math.max(...selectedMedicine.precios.map(p => p.precioCompraUnitario || 0))
  : 0;

// 2. Calcular costo de envío por unidad
const pesoKg = selectedMedicine.pesoKg || 0;
const shippingCostPerUnit = pesoKg * shippingRate.internationalRate;

// 3. Calcular costo unitario USD
const costoUnitarioUSD = (precioCompraDOP / exchangeRate.rate) + shippingCostPerUnit;
const costoUnitarioUSDRounded = Math.round(costoUnitarioUSD * 100) / 100;

// 4. Calcular subtotal USD
const subtotalUSD = costoUnitarioUSDRounded * currentItem.quantity;
```

---

## 💵 **OTRAS FÓRMULAS RELACIONADAS:**

### **Precio de Venta MN:**
```javascript
// Líneas 374-376 y 422-424
const precioVentaPropuestoUSD = currentItem.precioVentaPropuestoUSD || 0;
const precioVentaMN = (costoUnitarioUSD + precioVentaPropuestoUSD) × exchangeRateMN;
```

**Fórmula:**
```
precioVentaMN = (costoUnitarioUSD + precioVentaPropuestoUSD) × tasaMN
```

### **Subtotal MN:**
```javascript
// Líneas 382 y 430
const subtotalMN = precioVentaMN × cantidad;
```

---

## 📊 **RESUMEN DE TODAS LAS FÓRMULAS:**

| Campo | Fórmula |
|-------|---------|
| **Costo Unitario USD** | `(precioCompraDOP / tasaDOP_USD) + costoEnvíoPorUnidad` |
| **Subtotal USD** | `costoUnitarioUSD × cantidad` |
| **Precio Venta MN** | `(costoUnitarioUSD + precioVentaPropuestoUSD) × tasaMN` |
| **Subtotal MN** | `precioVentaMN × cantidad` |
| **Total USD** | `Σ subtotalUSD de todos los items` |
| **Total MN** | `Σ subtotalMN de todos los items` |

---

## 🔧 **FUNCIONES DE CÁLCULO DE TOTALES:**

### **Total USD (línea 485):**
```javascript
const calculateTotalUSD = () => {
  return saleItems.reduce((total, item) => total + item.subtotalUSD, 0);
};
```

### **Total MN (línea 489):**
```javascript
const calculateTotalMN = () => {
  return saleItems.reduce((total, item) => total + item.subtotalMN, 0);
};
```

---

## 📝 **VARIABLES INVOLUCRADAS:**

| Variable | Origen | Descripción |
|----------|--------|-------------|
| `precioCompraDOP` | `selectedMedicine.precios` | Precio de compra en DOP (el mayor de los precios activos) |
| `exchangeRate.rate` | API `/exchange-rates` | Tasa de cambio DOP/USD |
| `shippingRate.internationalRate` | API `/shipping-rates` | Tarifa de envío internacional ($/kg) |
| `pesoKg` | `selectedMedicine.pesoKg` | Peso del medicamento en kg |
| `precioVentaPropuestoUSD` | Input del usuario | Precio de venta propuesto en USD (ganancia) |
| `exchangeRateMN` | API `/exchange-rates-mn` | Tasa de cambio USD/MN (Moneda Nacional) |

---

## ⚠️ **NOTAS IMPORTANTES:**

1. **Redondeo:** El costo unitario USD se redondea a 2 decimales antes de calcular el subtotal
2. **Precio mayor:** Se usa el precio de compra MÁS ALTO de todos los precios activos
3. **Costo de envío:** Se calcula multiplicando el peso del medicamento por la tarifa internacional
4. **Precio venta propuesto:** Es la ganancia adicional que se agrega al costo para calcular el precio de venta en MN

---

## 🎯 **FLUJO COMPLETO:**

```
1. Usuario selecciona medicamento
   ↓
2. Sistema obtiene precioCompraDOP (precio más alto)
   ↓
3. Sistema calcula costoUnitarioUSD:
   = (precioCompraDOP / tasaDOP_USD) + (pesoKg × tarifaEnvío)
   ↓
4. Usuario ingresa cantidad
   ↓
5. Sistema calcula subtotalUSD:
   = costoUnitarioUSD × cantidad
   ↓
6. Sistema calcula precioVentaMN:
   = (costoUnitarioUSD + precioVentaPropuestoUSD) × tasaMN
   ↓
7. Sistema calcula subtotalMN:
   = precioVentaMN × cantidad
```

---

## ✅ **VERIFICACIÓN:**

Para verificar que la fórmula funciona correctamente:

1. Agregar un item a la venta
2. Verificar en consola del navegador (F12):
   ```javascript
   console.log('Precio Compra DOP:', precioCompraDOP);
   console.log('Tasa DOP/USD:', exchangeRate.rate);
   console.log('Costo Envío/Unidad:', shippingCostPerUnit);
   console.log('Costo Unitario USD:', costoUnitarioUSDRounded);
   console.log('Cantidad:', currentItem.quantity);
   console.log('Subtotal USD:', subtotalUSD);
   ```

---

**¡Fórmula documentada!** 📊

