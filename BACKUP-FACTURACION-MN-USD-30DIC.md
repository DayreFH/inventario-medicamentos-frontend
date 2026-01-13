# 💾 BACKUP - Sistema de Facturación MN/USD
**Fecha:** 30 de Diciembre 2025, 15:21:59  
**Commit:** `acaaca5` - feat: Implementar sistema de facturacion con soporte MN y USD

---

## 📋 RESUMEN DE CAMBIOS

Este backup contiene la implementación completa del sistema de facturación con soporte para dos monedas: **Moneda Nacional (MN)** y **Dólares Estadounidenses (USD)**.

---

## ✅ FUNCIONALIDADES IMPLEMENTADAS

### 1. **Sistema de Ventas Dual (MN y USD)**
- ✅ Rutas separadas: `/sales/mn` y `/sales/usd`
- ✅ Componentes independientes: `SaleFormAdvanced` (MN) y `SaleFormUSD` (USD)
- ✅ Cálculos específicos para cada tipo de moneda
- ✅ Validaciones y manejo de errores por tipo de venta

### 2. **Base de Datos Actualizada**
- ✅ Campo `tipoVenta` en modelo `Sale` (enum: MN, USD)
- ✅ Campo `precio_venta_mn` en modelo `SaleItem`
- ✅ Campo `precio_propuesto_usd` en modelo `SaleItem`
- ✅ Modelo `MedicinePriceVentaMN` para gestionar precios de venta en MN
- ✅ Relación `preciosVentaMN` en modelo `Medicine`

### 3. **Gestión de Precios**
- ✅ Pestaña "Precios" actualizada en Gestión de Datos
- ✅ Dos columnas separadas: "Precio de Compra DOP" y "Precio de Venta MN"
- ✅ Historial de precios para ambos tipos
- ✅ Activar/Desactivar precios históricos
- ✅ Endpoints del backend para CRUD de precios MN

### 4. **Sistema de Facturación Mejorado**
- ✅ Vista previa de factura con moneda correcta (MN o USD)
- ✅ Badge de moneda en tabla de ventas pendientes
- ✅ Cálculo correcto de totales según tipo de venta
- ✅ Formato de moneda: `MN 600.00` o `USD 12.20` (sin símbolo $)
- ✅ PDF de factura con moneda correcta
- ✅ Funcionalidad para eliminar ventas no facturadas

### 5. **Fórmulas Implementadas**

#### **Salidas USD:**
```
Costo/u USD = (Precio Compra DOP / TC DOP-USD) + (Peso Kg × Tasa Envío)
Precio X Kg Cuba = Peso Kg × (5 si es FRASCO/TUBO, 15 si no)
Precio de Venta USD = Costo/u USD + Precio X Kg Cuba
Subtotal USD = Precio de Venta USD × Cantidad
```

#### **Salidas MN:**
```
Costo/u USD = (Precio Compra DOP / TC DOP-USD) + (Peso Kg × Tasa Envío)
Costo/u MN = Costo/u USD × TC MN
Precio de Venta MN = Desde Base de Datos (tabla MedicinePriceVentaMN)
Subtotal Costo MN = Costo/u MN × Cantidad
Subtotal Venta MN = Precio de Venta MN × Cantidad
```

---

## 📁 ARCHIVOS MODIFICADOS

### **Backend:**
- `backend/prisma/schema.prisma` - Modelos actualizados
- `backend/src/routes/sales.js` - Endpoints de ventas con tipoVenta
- `backend/src/routes/medicines.js` - Endpoints de precios MN
- `backend/src/routes/invoices.js` - Facturación con soporte MN/USD
- `backend/src/routes/exchangeRatesMN.js` - Endpoint `/latest`
- `backend/src/routes/shippingRates.js` - Endpoint `/latest`

### **Frontend:**
- `frontend/src/components/SaleFormAdvanced.jsx` - Salidas MN
- `frontend/src/components/SaleFormUSD.jsx` - Salidas USD
- `frontend/src/pages/InvoiceManager.jsx` - Facturación con monedas
- `frontend/src/components/InvoicePreview.jsx` - Vista previa con MN/USD
- `frontend/src/components/Medicines/PreciosTab.jsx` - Gestión de precios
- `frontend/src/App.jsx` - Rutas actualizadas
- `frontend/src/components/Navigation.jsx` - Menú actualizado

---

## 🔧 CORRECCIONES APLICADAS

### **Problema 1: API Endpoints Duplicados**
- **Error:** Llamadas a `/api/api/medicines` (doble `/api`)
- **Solución:** Corregir todas las llamadas a `/medicines` (sin `/api` duplicado)

### **Problema 2: Vista Previa sin Precios**
- **Error:** Vista previa mostraba $0.00 en Precio Unit. y Subtotal
- **Solución:** Mapear correctamente `precio_venta_mn` y `precio_propuesto_usd` en `handlePreviewBeforeCreate`

### **Problema 3: Moneda Hardcodeada**
- **Error:** Vista previa usaba solo `precio_propuesto_usd` sin considerar `tipoVenta`
- **Solución:** Implementar lógica condicional según `tipoVenta` en tabla de items

### **Problema 4: Símbolo $ en Facturas**
- **Error:** Facturas mostraban `$600.00` sin distinguir moneda
- **Solución:** Implementar `formatCurrencyByType` que muestra `MN` o `USD`

---

## 📊 ESTADO ACTUAL

### **Ventas en Base de Datos:**
- Venta #34 (MN): 10 × ACETAMINOFEN @ MN 600.00 = MN 6,000.00
- Venta #31 (MN): 10 × ACETAMINOFEN @ MN 600.00 = MN 6,000.00 (Facturada)
- Venta #30 (USD): 10 × ACETAMINOFEN @ USD 1.22 = USD 12.20 (Facturada)

### **Facturas Emitidas:**
- Factura #5: Venta #31 (MN)
- Factura #4: Venta #30 (USD)

---

## 🚀 PRÓXIMOS PASOS

1. **Probar Vista Previa de Factura:**
   - Recargar frontend (F5)
   - Ir a Facturación → Ventas Pendientes
   - Seleccionar venta #34 (MN)
   - Verificar que muestre `MN 600.00` en Precio Unit. y Subtotal

2. **Crear Factura de Prueba:**
   - Facturar venta #34
   - Verificar PDF descargado
   - Confirmar formato de moneda correcto

3. **Pruebas de Integración:**
   - Crear nueva venta USD
   - Crear nueva venta MN
   - Facturar ambas
   - Verificar reportes

---

## 💾 UBICACIONES DE BACKUP

### **Git:**
- Commit: `acaaca5`
- Mensaje: "feat: Implementar sistema de facturacion con soporte MN y USD"
- Rama: `main`

### **Disco Duro:**
- Ruta: `D:\BACKUPS\inventario-medicamentos_20251230_152159`
- Tamaño: ~25 archivos principales + carpetas backend/frontend
- Excluye: node_modules, dist, .git, frontend_temp

---

## 📝 NOTAS IMPORTANTES

1. **Migraciones de Base de Datos:**
   - Ejecutar `npx prisma db push` si hay cambios en schema.prisma
   - Ejecutar `npx prisma generate` después de cambios en modelos

2. **Reinicio de Servicios:**
   - Backend: `Ctrl+C` → `npm run dev`
   - Frontend: Recargar navegador (F5)

3. **Valores por Defecto:**
   - `tipoVenta` por defecto: `USD`
   - Ventas antiguas sin `tipoVenta` se asumen como `USD`

4. **Campos Opcionales:**
   - `precio_venta_mn`: Solo para ventas MN
   - `precio_propuesto_usd`: Solo para ventas USD
   - `supplierId`: Opcional (para tracking de proveedor)

---

## ✅ CHECKLIST DE VERIFICACIÓN

- [x] Commit creado en Git
- [x] Backup en disco duro
- [x] Schema de BD actualizado
- [x] Endpoints del backend funcionando
- [x] Frontend con rutas separadas
- [x] Vista previa de factura corregida
- [x] Formato de moneda implementado
- [x] Fórmulas de cálculo correctas
- [x] Eliminación de ventas implementada
- [ ] Pruebas de usuario completadas
- [ ] Documentación actualizada

---

**Desarrollado por:** AI Assistant  
**Usuario:** Dayre  
**Proyecto:** Sistema de Inventario de Medicamentos


