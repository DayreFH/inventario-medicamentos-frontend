# 📊 ANÁLISIS COMPLETO: MÓDULO "ANÁLISIS DE RENTABILIDAD"

**Fecha:** 27 de diciembre de 2024  
**Módulo:** FINANZAS → Análisis de Rentabilidad  
**Objetivo:** Analizar rentabilidad por medicamento, cliente y proveedor

---

## 🎯 OBJETIVO DEL MÓDULO

Crear un submódulo en FINANZAS que permita:
1. Ver métricas generales de rentabilidad
2. Analizar rentabilidad por medicamento
3. Analizar rentabilidad por cliente
4. Analizar rentabilidad por proveedor
5. Identificar medicamentos con margen bajo o negativo
6. Exportar datos a CSV

---

## 📋 ESTRUCTURA DE DATOS DISPONIBLE

### **Tablas relevantes en BD:**

#### 1. **`saleitem`** (Items de venta)
```sql
- id
- saleId
- medicineId
- qty (cantidad vendida)
- costo_unitario_usd (costo de compra)
- precio_propuesto_usd (precio de venta)
- supplierId
```

#### 2. **`sale`** (Ventas)
```sql
- id
- customerId
- date
- notes
```

#### 3. **`receiptitem`** (Items de compra)
```sql
- id
- receiptId
- medicineId
- qty (cantidad comprada)
- unit_cost (costo unitario)
```

#### 4. **`Medicine`** (Medicamentos)
```sql
- id
- codigo
- nombreComercial
- nombreGenerico
- stock
```

#### 5. **`MedicinePrice`** (Precios de medicamentos)
```sql
- id
- medicineId
- precioCompraUnitario
- margenUtilidad
- precioVentaUnitario
- supplierId
```

#### 6. **`customer`** (Clientes)
```sql
- id
- name
```

#### 7. **`supplier`** (Proveedores)
```sql
- id
- name
```

---

## 🔍 ANÁLISIS DE DATOS NECESARIOS

### **CÁLCULOS PRINCIPALES:**

#### **Por Medicamento:**
```javascript
// Datos de saleitem
costoTotal = SUM(saleitem.costo_unitario_usd * saleitem.qty)
ingresoTotal = SUM(saleitem.precio_propuesto_usd * saleitem.qty)
cantidadVendida = SUM(saleitem.qty)

// Cálculos
ganancia = ingresoTotal - costoTotal
margen% = (ganancia / ingresoTotal) * 100
```

#### **Por Cliente:**
```javascript
// Join: saleitem → sale → customer
costoTotal = SUM(saleitem.costo_unitario_usd * saleitem.qty) WHERE sale.customerId = X
ingresoTotal = SUM(saleitem.precio_propuesto_usd * saleitem.qty) WHERE sale.customerId = X
numeroCompras = COUNT(DISTINCT sale.id) WHERE sale.customerId = X

// Cálculos
ganancia = ingresoTotal - costoTotal
margen% = (ganancia / ingresoTotal) * 100
```

#### **Por Proveedor:**
```javascript
// Opción 1: Desde saleitem (si tiene supplierId)
costoTotal = SUM(saleitem.costo_unitario_usd * saleitem.qty) WHERE saleitem.supplierId = X
ingresoTotal = SUM(saleitem.precio_propuesto_usd * saleitem.qty) WHERE saleitem.supplierId = X

// Opción 2: Desde MedicinePrice
// Medicamentos de un proveedor específico
medicineIds = MedicinePrice.medicineId WHERE MedicinePrice.supplierId = X
// Luego filtrar saleitem por esos medicineIds

// Cálculos
ROI% = ((ingresoTotal - costoTotal) / costoTotal) * 100
```

---

## 🛠️ ENDPOINTS DE BACKEND A CREAR

### **1. GET `/api/profitability/summary`**
**Descripción:** Métricas generales de rentabilidad  
**Query params:** `?start=YYYY-MM-DD&end=YYYY-MM-DD`

**Respuesta:**
```json
{
  "totalRevenue": 50000.00,
  "totalCost": 30000.00,
  "totalProfit": 20000.00,
  "profitMargin": 40.00,
  "totalSales": 150,
  "totalItemsSold": 1200
}
```

**Query Prisma:**
```javascript
const saleitems = await prisma.saleitem.findMany({
  where: {
    sale: {
      date: { gte: startDate, lte: endDate }
    }
  },
  include: { sale: true }
});

// Calcular métricas en JavaScript
```

---

### **2. GET `/api/profitability/by-medicine`**
**Descripción:** Rentabilidad por medicamento  
**Query params:** `?start=YYYY-MM-DD&end=YYYY-MM-DD&limit=50`

**Respuesta:**
```json
[
  {
    "medicineId": 1,
    "medicineCode": "MED001",
    "medicineName": "Paracetamol 500mg",
    "quantitySold": 150,
    "totalCost": 300.00,
    "totalRevenue": 600.00,
    "profit": 300.00,
    "profitMargin": 50.00,
    "status": "high" // high, medium, low, negative
  }
]
```

**Query Prisma:**
```javascript
const saleitems = await prisma.saleitem.findMany({
  where: {
    sale: {
      date: { gte: startDate, lte: endDate }
    }
  },
  include: {
    medicines: {
      select: {
        id: true,
        codigo: true,
        nombreComercial: true
      }
    },
    sale: true
  }
});

// Agrupar por medicineId y calcular métricas
```

---

### **3. GET `/api/profitability/by-customer`**
**Descripción:** Rentabilidad por cliente  
**Query params:** `?start=YYYY-MM-DD&end=YYYY-MM-DD&limit=50`

**Respuesta:**
```json
[
  {
    "customerId": 1,
    "customerName": "Farmacia Central",
    "totalSales": 25,
    "totalCost": 5000.00,
    "totalRevenue": 8000.00,
    "profit": 3000.00,
    "profitMargin": 37.50
  }
]
```

**Query Prisma:**
```javascript
const sales = await prisma.sale.findMany({
  where: {
    date: { gte: startDate, lte: endDate }
  },
  include: {
    customer: {
      select: {
        id: true,
        name: true
      }
    },
    saleitem: {
      select: {
        qty: true,
        costo_unitario_usd: true,
        precio_propuesto_usd: true
      }
    }
  }
});

// Agrupar por customerId y calcular métricas
```

---

### **4. GET `/api/profitability/by-supplier`**
**Descripción:** Rentabilidad por proveedor  
**Query params:** `?start=YYYY-MM-DD&end=YYYY-MM-DD&limit=50`

**Respuesta:**
```json
[
  {
    "supplierId": 1,
    "supplierName": "Distribuidora XYZ",
    "totalCost": 10000.00,
    "totalRevenue": 15000.00,
    "profit": 5000.00,
    "roi": 50.00
  }
]
```

**Query Prisma:**
```javascript
// Opción: Usar saleitem.supplierId
const saleitems = await prisma.saleitem.findMany({
  where: {
    sale: {
      date: { gte: startDate, lte: endDate }
    },
    supplierId: { not: null }
  },
  include: {
    supplier: {
      select: {
        id: true,
        name: true
      }
    },
    sale: true
  }
});

// Agrupar por supplierId y calcular métricas
```

---

### **5. GET `/api/profitability/low-margin`**
**Descripción:** Medicamentos con margen bajo o negativo  
**Query params:** `?start=YYYY-MM-DD&end=YYYY-MM-DD&threshold=10`

**Respuesta:**
```json
[
  {
    "medicineId": 5,
    "medicineCode": "MED005",
    "medicineName": "Losartán 50mg",
    "profitMargin": 9.09,
    "status": "low",
    "alert": "Margen bajo (<10%)"
  },
  {
    "medicineId": 8,
    "medicineCode": "MED008",
    "medicineName": "Metformina 850mg",
    "profitMargin": -20.00,
    "status": "negative",
    "alert": "Pérdida - Revisar precio"
  }
]
```

---

## 📁 ARCHIVOS A CREAR/MODIFICAR

### **BACKEND:**

#### 1. **`backend/src/routes/profitability.js`** (NUEVO)
- Crear todos los endpoints mencionados
- Usar Prisma para consultas
- Calcular métricas en JavaScript
- Validar fechas con Zod
- Manejo de errores

#### 2. **`backend/src/app.js`** (MODIFICAR)
- Registrar nueva ruta: `app.use('/api/profitability', authenticate, profitability);`

---

### **FRONTEND:**

#### 3. **`frontend/src/pages/ProfitabilityAnalysis.jsx`** (NUEVO)
- Componente principal del módulo
- Diseño con pestañas:
  - 📊 Resumen General
  - 💊 Por Medicamento
  - 👥 Por Cliente
  - 🏢 Por Proveedor
  - ⚠️ Alertas
- Filtros de fecha
- Tablas con datos
- Exportación CSV
- Diseño estándar (PAGE_CONTAINER, DARK_HEADER, etc.)

#### 4. **`frontend/src/components/Navigation.jsx`** (MODIFICAR)
- Agregar "Análisis de Rentabilidad" en FINANZAS

#### 5. **`frontend/src/App.jsx`** (MODIFICAR)
- Agregar ruta `/finanzas/rentabilidad`
- Agregar permiso `reports.profitability`

#### 6. **`frontend/src/config/permissionsConfig.js`** (MODIFICAR)
- Agregar nuevo permiso `reports.profitability` en `reports.children`

---

## 🔐 PERMISOS Y RUTAS

### **Permiso nuevo:**
```javascript
{
  id: 'reports.profitability',
  name: 'Análisis de Rentabilidad',
  route: '/finanzas/rentabilidad',
  description: 'Análisis de rentabilidad por medicamento, cliente y proveedor'
}
```

### **Ruta frontend:**
```
/finanzas/rentabilidad
```

### **Rutas backend:**
```
/api/profitability/summary
/api/profitability/by-medicine
/api/profitability/by-customer
/api/profitability/by-supplier
/api/profitability/low-margin
```

---

## ⚠️ VALIDACIONES Y CONSIDERACIONES

### **1. Datos NULL:**
- ✅ `saleitem.costo_unitario_usd` puede ser NULL → Usar `|| 0`
- ✅ `saleitem.precio_propuesto_usd` puede ser NULL → Usar `|| 0`
- ✅ `saleitem.supplierId` puede ser NULL → Filtrar con `{ not: null }`

### **2. Fechas:**
- ✅ Validar formato `YYYY-MM-DD` con Zod
- ✅ Normalizar a inicio/fin del día:
  ```javascript
  startDate = new Date(`${start}T00:00:00`)
  endDate = new Date(`${end}T23:59:59.999`)
  ```

### **3. División por cero:**
- ✅ Si `totalRevenue === 0`, `profitMargin = 0`
- ✅ Si `totalCost === 0`, `roi = 0`

### **4. Valores hardcodeados a EVITAR:**
- ❌ NO usar valores fijos para umbrales (ej: `10%`)
- ✅ Pasar como query param: `?threshold=10`
- ❌ NO usar IDs fijos de medicamentos/clientes
- ✅ Consultar dinámicamente desde BD

### **5. Nombres de modelos (CRÍTICO):**
- ✅ `prisma.Medicine` (PascalCase)
- ✅ `prisma.sale` (lowercase)
- ✅ `prisma.saleitem` (lowercase)
- ✅ `prisma.customer` (lowercase)
- ✅ `prisma.supplier` (lowercase)
- ✅ Relación: `medicines` (plural) en `saleitem`
- ✅ Relación: `customer` (singular) en `sale`

---

## 📊 ESTRUCTURA DEL COMPONENTE FRONTEND

### **Estados:**
```javascript
const [activeTab, setActiveTab] = useState('summary');
const [start, setStart] = useState(''); // Fecha inicio
const [end, setEnd] = useState(''); // Fecha fin
const [summaryData, setSummaryData] = useState(null);
const [medicineData, setMedicineData] = useState([]);
const [customerData, setCustomerData] = useState([]);
const [supplierData, setSupplierData] = useState([]);
const [alertsData, setAlertsData] = useState([]);
const [loading, setLoading] = useState(false);
```

### **Pestañas:**
1. **Resumen General** (`summary`)
   - Métricas en cards
   - Gráfico de barras (opcional)

2. **Por Medicamento** (`medicine`)
   - Tabla con medicamentos
   - Ordenar por ganancia/margen
   - Indicadores de color

3. **Por Cliente** (`customer`)
   - Tabla con clientes
   - Ordenar por ganancia

4. **Por Proveedor** (`supplier`)
   - Tabla con proveedores
   - Ordenar por ROI

5. **Alertas** (`alerts`)
   - Medicamentos con margen bajo
   - Medicamentos con margen negativo

---

## 🎨 DISEÑO VISUAL

### **Colores para indicadores:**
```javascript
const getMarginColor = (margin) => {
  if (margin < 0) return '#dc3545'; // Rojo (negativo)
  if (margin < 10) return '#ffc107'; // Amarillo (bajo)
  if (margin < 30) return '#17a2b8'; // Azul (medio)
  return '#28a745'; // Verde (alto)
};
```

### **Iconos:**
- 📊 Resumen General
- 💊 Por Medicamento
- 👥 Por Cliente
- 🏢 Por Proveedor
- ⚠️ Alertas

---

## 🧪 CASOS DE PRUEBA

### **1. Sin datos en el período:**
- ✅ Mostrar mensaje: "No hay datos en el período seleccionado"
- ✅ No mostrar tablas vacías

### **2. Medicamento sin ventas:**
- ✅ No debe aparecer en la lista

### **3. Cliente sin compras:**
- ✅ No debe aparecer en la lista

### **4. Margen negativo:**
- ✅ Mostrar en rojo
- ✅ Aparecer en "Alertas"

### **5. Fechas inválidas:**
- ✅ Backend: Retornar 400 con mensaje de error
- ✅ Frontend: Mostrar mensaje de error

---

## 📝 ORDEN DE IMPLEMENTACIÓN

### **FASE 1: Backend (30-40 min)**
1. ✅ Crear `backend/src/routes/profitability.js`
2. ✅ Implementar endpoint `/summary`
3. ✅ Implementar endpoint `/by-medicine`
4. ✅ Implementar endpoint `/by-customer`
5. ✅ Implementar endpoint `/by-supplier`
6. ✅ Implementar endpoint `/low-margin`
7. ✅ Registrar ruta en `app.js`
8. ✅ Probar con Postman/Thunder Client

### **FASE 2: Frontend (40-50 min)**
1. ✅ Crear `frontend/src/pages/ProfitabilityAnalysis.jsx`
2. ✅ Implementar estructura básica (header, tabs)
3. ✅ Implementar pestaña "Resumen General"
4. ✅ Implementar pestaña "Por Medicamento"
5. ✅ Implementar pestaña "Por Cliente"
6. ✅ Implementar pestaña "Por Proveedor"
7. ✅ Implementar pestaña "Alertas"
8. ✅ Agregar exportación CSV

### **FASE 3: Integración (10-15 min)**
1. ✅ Agregar en `Navigation.jsx`
2. ✅ Agregar ruta en `App.jsx`
3. ✅ Agregar permiso en `permissionsConfig.js`
4. ✅ Probar acceso con usuario Administrador
5. ✅ Probar acceso con usuario sin permisos

---

## ✅ CHECKLIST FINAL

### **Backend:**
- [ ] Archivo `profitability.js` creado
- [ ] 5 endpoints implementados
- [ ] Validación de fechas con Zod
- [ ] Manejo de errores
- [ ] Sin valores hardcodeados
- [ ] Nombres de modelos correctos (PascalCase/lowercase)
- [ ] Ruta registrada en `app.js`

### **Frontend:**
- [ ] Archivo `ProfitabilityAnalysis.jsx` creado
- [ ] 5 pestañas implementadas
- [ ] Filtros de fecha funcionando
- [ ] Tablas con datos
- [ ] Exportación CSV
- [ ] Diseño estándar aplicado
- [ ] Sin valores hardcodeados

### **Integración:**
- [ ] Entrada en menú `Navigation.jsx`
- [ ] Ruta en `App.jsx`
- [ ] Permiso en `permissionsConfig.js`
- [ ] Acceso controlado por permisos

### **Pruebas:**
- [ ] Backend responde correctamente
- [ ] Frontend muestra datos
- [ ] Filtros funcionan
- [ ] Exportación funciona
- [ ] Permisos funcionan
- [ ] Sin errores en consola

---

## 🚀 TIEMPO ESTIMADO TOTAL

- **Backend:** 30-40 minutos
- **Frontend:** 40-50 minutos
- **Integración:** 10-15 minutos
- **Pruebas:** 10-15 minutos

**TOTAL:** 1.5 - 2 horas

---

## ✅ LISTO PARA IMPLEMENTAR

Este análisis cubre:
- ✅ Estructura de datos
- ✅ Endpoints necesarios
- ✅ Queries Prisma
- ✅ Componentes frontend
- ✅ Rutas y permisos
- ✅ Validaciones
- ✅ Sin código hardcodeado
- ✅ Nombres correctos de modelos
- ✅ Orden de implementación

**¿Procedo con la implementación?** 🚀

