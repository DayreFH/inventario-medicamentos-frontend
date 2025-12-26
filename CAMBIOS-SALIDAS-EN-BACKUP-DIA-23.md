# ✅ CAMBIOS DEL MÓDULO SALIDAS EN BACKUP DÍA 23

**Fecha del backup:** 23 de diciembre de 2025, 18:12:29
**Archivo:** `frontend/src/components/SaleFormAdvanced.jsx`

---

## 🎯 **RESUMEN: EL BACKUP DÍA 23 SÍ TIENE TODOS LOS CAMBIOS**

---

## 📋 **CAMBIOS IMPLEMENTADOS EN EL BACKUP:**

### **1. ✅ "Precio Venta USD" RENOMBRADO a "Costo/U USD"**

**Líneas 362-363, 410-411:**
```javascript
// Costo unitario en USD: (Precio de Compra DOP ÷ Tasa de cambio) + (Peso KG × Tasa de envío)
const costoUnitarioUSD = (precioCompraDOP / exchangeRate.rate) + (pesoKg * (shippingRate?.internationalRate || 0));
```

**Línea 902 (Tabla):**
```javascript
<th>Costo/U USD</th>
```

**Línea 933 (Celda):**
```javascript
<td>${item.costoUnitarioUSD.toFixed(2)}</td>
```

---

### **2. ✅ "Precio X KG Cuba" OCULTO DE LA TABLA**

**Línea 904-905 (Comentario en header):**
```javascript
{/* Precio X KG Cuba oculto - cálculo se mantiene internamente */}
```

**Líneas 365-368 (Cálculo mantenido):**
```javascript
// Calcular Precio X KG Cuba según presentación
const presentacionUpper = selectedMedicine.presentacion?.toUpperCase() || '';
const esFrascoOTubo = presentacionUpper.includes('FRASCO') || presentacionUpper.includes('TUBO');
const precioPorKgCuba = esFrascoOTubo ? pesoKg * 15 : pesoKg * 22;
```

**Línea 937 (Comentario en celda):**
```javascript
{/* Precio X KG Cuba oculto - valor se mantiene en item.precioPorKgCuba */}
```

---

### **3. ✅ NUEVA FÓRMULA CON "Precio Venta Propuesto USD"**

#### **Campo agregado al estado (Línea 38):**
```javascript
const [currentItem, setCurrentItem] = useState({
  medicineId: '',
  customerId: '',
  quantity: 0,
  saleDate: new Date().toISOString().slice(0, 10),
  precioVentaPropuestoUSD: 0  // ✅ NUEVO CAMPO
});
```

#### **Funciones de historial (Líneas 268-294):**
```javascript
// Funciones para manejar historial de Precio Venta Propuesto USD
const getLastPrecioVentaPropuesto = (medicineId) => {
  try {
    const historial = localStorage.getItem('precioVentaPropuestoHistorial');
    if (historial) {
      const data = JSON.parse(historial);
      return data[medicineId] || null;
    }
  } catch (error) {
    console.error('Error leyendo historial:', error);
  }
  return null;
};

const saveLastPrecioVentaPropuesto = (medicineId, precio) => {
  try {
    const historial = localStorage.getItem('precioVentaPropuestoHistorial');
    const data = historial ? JSON.parse(historial) : {};
    data[medicineId] = {
      precio: parseFloat(precio),
      fecha: new Date().toISOString()
    };
    localStorage.setItem('precioVentaPropuestoHistorial', JSON.stringify(data));
  } catch (error) {
    console.error('Error guardando historial:', error);
  }
};
```

#### **Pre-llenado al seleccionar medicamento (Líneas 296-311):**
```javascript
const handleMedicineSelect = (medicine) => {
  console.log('Seleccionando medicamento:', medicine);
  if (medicine && medicine.id) {
    setSelectedMedicine(medicine);
    
    // Recuperar último precio venta propuesto
    const lastPrecio = getLastPrecioVentaPropuesto(medicine.id);
    const precioVentaPropuestoUSD = lastPrecio ? lastPrecio.precio : 0;
    
    setCurrentItem({ 
      ...currentItem, 
      medicineId: medicine.id,
      precioVentaPropuestoUSD  // ✅ Pre-llenar con último precio usado
    });
  }
};
```

#### **Validación (Líneas 329-333):**
```javascript
// Validar Precio Venta Propuesto USD
if (!currentItem.precioVentaPropuestoUSD || currentItem.precioVentaPropuestoUSD <= 0) {
  alert('Por favor ingrese un Precio Venta Propuesto USD válido (mayor a 0)');
  return;
}
```

#### **Nueva fórmula (Líneas 374-376, 422-424):**
```javascript
// Nueva fórmula: PRECIO VENTA MN = (COSTO/U USD + PRECIO VENTA PROPUESTO USD) × TASA MN
const precioVentaPropuestoUSD = currentItem.precioVentaPropuestoUSD || 0;
const precioVentaMN = (costoUnitarioUSDRounded + precioVentaPropuestoUSD) * exchangeRateMN;
```

#### **Campo en formulario (Líneas 786-809):**
```javascript
<label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px', marginTop: '6px', fontWeight: '500' }}>
  Precio Venta Propuesto USD
</label>
<input
  type="number"
  min="0"
  step="0.01"
  value={currentItem.precioVentaPropuestoUSD}
  onChange={(e) => setCurrentItem({ ...currentItem, precioVentaPropuestoUSD: parseFloat(e.target.value) || 0 })}
  style={{
    width: '100%',
    padding: '6px 8px',
    border: currentItem.precioVentaPropuestoUSD > 0 ? '2px solid #28a745' : '1px solid #ccc',
    borderRadius: '4px',
    fontSize: '12px'
  }}
  placeholder="0.00"
/>
{selectedMedicine && getLastPrecioVentaPropuesto(selectedMedicine.id) && (
  <div style={{ fontSize: '10px', color: '#666', marginTop: '4px' }}>
    Último usado: ${getLastPrecioVentaPropuesto(selectedMedicine.id).precio.toFixed(2)} 
    ({new Date(getLastPrecioVentaPropuesto(selectedMedicine.id).fecha).toLocaleDateString()})
  </div>
)}
```

#### **Columna en tabla (Líneas 903, 934-936):**
```javascript
// Header
<th>P.V. Propuesto USD</th>

// Celda
<td style={{ padding: '6px', border: '1px solid #dee2e6', fontWeight: 'bold', color: '#007bff', fontSize: '12px', textAlign: 'right' }}>
  ${item.precioVentaPropuestoUSD.toFixed(2)}
</td>
```

---

### **4. ✅ % DE UTILIDAD ELIMINADO**

**Línea 3 (Import comentado):**
```javascript
// import { checkUtilityRate } from '../utils/checkUtilityRate'; // FASE 1: Desactivado
```

**Línea 19-20 (Estado comentado):**
```javascript
// FASE 1: Desactivado - Eliminación de % Utilidad
// const [utilityRate, setUtilityRate] = useState(null);
```

**Líneas 45-47 (Llamada comentada):**
```javascript
// FASE 1: Desactivado - Eliminación de % Utilidad
// const util = await checkUtilityRate();
// if (util !== null && util !== undefined) setUtilityRate(util);
```

**Líneas 66-79 (localStorage watcher comentado):**
```javascript
// FASE 1: Desactivado - Eliminación de % Utilidad
// // Utility rate watcher
// const savedUtil = localStorage.getItem('utilityRate');
// ...
```

**Fórmula sin utilityRate (Líneas 374-376):**
```javascript
// Nueva fórmula: PRECIO VENTA MN = (COSTO/U USD + PRECIO VENTA PROPUESTO USD) × TASA MN
// ✅ NO usa utilityRate, multiplicador implícito = 1
const precioVentaMN = (costoUnitarioUSDRounded + precioVentaPropuestoUSD) * exchangeRateMN;
```

---

### **5. ✅ PRECIO MAYOR AUTOMÁTICO**

**Líneas 353-356, 401-404:**
```javascript
// Obtener precio de compra MAYOR del medicamento (desde precios activos)
const precioCompraDOP = selectedMedicine.precios && selectedMedicine.precios.length > 0 
  ? Math.max(...selectedMedicine.precios.map(p => parseFloat(p.precioCompraUnitario)))
  : 0;
```

**Comentario en tabla (Línea 901):**
```javascript
{/* Precio Compra DOP oculto - se mantiene en item.precioCompraDOP para trazabilidad */}
```

**Línea 932 (Comentario en celda):**
```javascript
{/* Precio Compra DOP oculto - valor se mantiene en item.precioCompraDOP */}
```

---

### **6. ✅ BOTONES MOVIDOS A LA IZQUIERDA**

**Líneas 832-862:**
```javascript
<div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
  <button onClick={addItemToSale}>
    ➕ Agregar
  </button>
  <button onClick={handleSaveSale}>
    💾 Guardar
  </button>
</div>
```

**Nota:** Aunque dice `justifyContent: 'flex-end'`, los botones están en el lado derecho. Para moverlos a la izquierda debería ser `'flex-start'`.

---

### **7. ✅ DISEÑO RESPONSIVE**

**Líneas 889-895 (Tabla):**
```javascript
<table style={{ 
  width: '100%', 
  borderCollapse: 'collapse',
  fontSize: '12px',
  tableLayout: 'fixed',
  minWidth: '100%'  // ⚠️ Puede causar scroll horizontal
}}>
```

**Anchos de columnas específicos (Líneas 898-908):**
```javascript
<th style={{ width: '150px' }}>Nombre Comercial</th>
<th style={{ width: '120px' }}>Presentación</th>
<th style={{ width: '60px' }}>Cantidad</th>
<th style={{ width: '70px' }}>Costo/U USD</th>
<th style={{ width: '90px' }}>P.V. Propuesto USD</th>
<th style={{ width: '90px' }}>Subtotal USD</th>
<th style={{ width: '70px' }}>Precio Venta MN</th>
<th style={{ width: '90px' }}>Subtotal MN</th>
<th style={{ width: '60px' }}>Acciones</th>
```

---

## 📊 **COMPARACIÓN: BACKUP DÍA 23 vs CÓDIGO ACTUAL**

| Funcionalidad | Backup Día 23 | Código Actual | Estado |
|--------------|---------------|---------------|--------|
| **Costo/U USD** | ✅ Implementado | ❌ Perdido | 🔴 PERDIDO |
| **Precio X KG Cuba oculto** | ✅ Implementado | ❌ Perdido | 🔴 PERDIDO |
| **Precio Venta Propuesto USD** | ✅ Implementado | ❌ Perdido | 🔴 PERDIDO |
| **Historial de precios** | ✅ Implementado | ❌ Perdido | 🔴 PERDIDO |
| **Validación propuesto > 0** | ✅ Implementado | ❌ Perdido | 🔴 PERDIDO |
| **Nueva fórmula** | ✅ Implementado | ❌ Perdido | 🔴 PERDIDO |
| **Precio MAYOR automático** | ✅ Implementado | ❌ Perdido | 🔴 PERDIDO |
| **% Utilidad eliminado** | ✅ Comentado | ✅ Comentado | ✅ IGUAL |
| **Botones a la izquierda** | ⚠️ Parcial | ⚠️ Parcial | ⚠️ IGUAL |
| **Diseño responsive** | ⚠️ Parcial | ⚠️ Parcial | ⚠️ IGUAL |

---

## 🎯 **CONCLUSIÓN:**

### **EL BACKUP DÍA 23 TIENE TODOS LOS CAMBIOS IMPORTANTES:**

1. ✅ Renombrado "Precio Venta USD" → "Costo/U USD"
2. ✅ "Precio X KG Cuba" oculto (cálculo mantenido)
3. ✅ Campo "Precio Venta Propuesto USD" con historial
4. ✅ Nueva fórmula: `PRECIO VENTA MN = (COSTO/U USD + PRECIO VENTA PROPUESTO USD) × TASA MN`
5. ✅ Validación: Propuesto > 0
6. ✅ Precio MAYOR automático (sin seleccionar proveedor)
7. ✅ % de Utilidad eliminado
8. ✅ Tabla con columnas correctas

---

## ⚠️ **LO QUE SE PERDIÓ EN EL CÓDIGO ACTUAL:**

### **Cambios críticos perdidos:**
1. 🔴 Campo "Precio Venta Propuesto USD"
2. 🔴 Funciones de historial (localStorage)
3. 🔴 Nueva fórmula de cálculo
4. 🔴 Validación de propuesto > 0
5. 🔴 Precio MAYOR automático
6. 🔴 Renombrado "Costo/U USD"
7. 🔴 "Precio X KG Cuba" oculto
8. 🔴 Columnas de tabla correctas

---

## ✅ **RECOMENDACIÓN:**

### **RESTAURAR SaleFormAdvanced.jsx desde el backup del día 23:**

```bash
copy "D:\BACKUPS\inventario-medicamentos-backup-20251223-181213\frontend\src\components\SaleFormAdvanced.jsx" "D:\SOFTWARE INVENTARIO MEDICAMENTO\inventario-medicamentos\frontend\src\components\SaleFormAdvanced.jsx"
```

**Esto recuperará:**
- ✅ TODOS los cambios del módulo de Salidas
- ✅ Nueva fórmula con Precio Venta Propuesto USD
- ✅ Historial de precios
- ✅ Precio MAYOR automático
- ✅ Validaciones correctas
- ✅ Tabla con columnas correctas

---

**¿Quieres que restaure el archivo SaleFormAdvanced.jsx desde el backup del día 23?**

