# 📋 GUÍA: SISTEMA DE NCF AUTOMÁTICO

## ✅ IMPLEMENTACIÓN COMPLETADA

Se ha implementado exitosamente el sistema de generación automática de NCF (Número de Comprobante Fiscal) para cumplir con los requisitos de la DGII en República Dominicana.

---

## 🎯 CARACTERÍSTICAS IMPLEMENTADAS

### **FASE 1: Vista Previa de Factura**
- ✅ Botón "👁️ Vista Previa" antes de crear la factura
- ✅ Modal con vista completa de cómo quedará la factura
- ✅ Marca de agua "VISTA PREVIA" para evitar confusión
- ✅ No guarda nada en la base de datos (solo visualización)

### **FASE 2: Configuración de NCF**
- ✅ Nueva sección en "Administración → Datos de la Empresa"
- ✅ Activar/desactivar generación automática
- ✅ Selector de tipo de NCF (B01, B02, B14, B15)
- ✅ Configuración de rango autorizado por DGII
- ✅ Validaciones y advertencias

### **FASE 3: Generación Automática**
- ✅ El sistema genera el NCF automáticamente al crear factura
- ✅ Formato correcto: Tipo + 8 dígitos (ej: B0100000001)
- ✅ Incremento automático de secuencia
- ✅ Validación de rango autorizado
- ✅ Alertas cuando quedan pocos NCF disponibles

---

## 🚀 CÓMO USAR EL SISTEMA

### **Paso 1: Configurar los Datos de la Empresa**

1. Ve a **Administración → Datos de la Empresa**
2. Completa la información básica:
   - Nombre de la empresa
   - RNC
   - Dirección
   - Teléfono
   - Email

### **Paso 2: Configurar el NCF Automático**

1. En la misma página, busca la sección **"🔢 Configuración de NCF"**
2. Activa el checkbox **"Generar NCF automáticamente"**
3. Selecciona el **Tipo de NCF** según tu autorización de la DGII:
   - **B01** - Crédito Fiscal (para empresas con RNC)
   - **B02** - Consumidor Final (para personas sin RNC)
   - **B14** - Régimen Especial
   - **B15** - Gubernamental
4. **(Opcional pero recomendado)** Ingresa tu rango autorizado:
   - **Rango Inicio**: Ej: `B0100000001`
   - **Rango Fin**: Ej: `B0100001000`
5. Haz clic en **"💾 Guardar Configuración"**

### **Paso 3: Crear Facturas**

1. Ve a **Operaciones → Facturación**
2. En la pestaña **"Ventas Pendientes"**, selecciona una venta
3. El sistema **generará automáticamente el NCF** (verás el indicador "🤖 AUTOMÁTICO")
4. **(Opcional)** Haz clic en **"👁️ Vista Previa"** para ver cómo quedará
5. Ajusta ITBIS, Descuento y Notas si es necesario
6. Haz clic en **"✅ Crear Factura"**
7. El sistema:
   - Creará la factura con el NCF asignado
   - Incrementará automáticamente la secuencia para la próxima factura
   - Te permitirá descargar el PDF

---

## 📊 TIPOS DE NCF Y SU USO

| Tipo | Nombre | Cuándo Usarlo |
|------|--------|---------------|
| **B01** | Crédito Fiscal | Cliente tiene RNC y necesita crédito fiscal |
| **B02** | Consumidor Final | Cliente sin RNC o persona natural |
| **B14** | Régimen Especial | Empresas en régimen especial de tributación |
| **B15** | Gubernamental | Ventas al Estado o instituciones públicas |

---

## ⚠️ ADVERTENCIAS Y VALIDACIONES

### **El sistema te alertará cuando:**
- ✅ Quedan 10 o menos NCF en tu rango autorizado
- ✅ El NCF generado está fuera del rango autorizado
- ✅ La generación automática está desactivada

### **Ejemplo de advertencia:**
```
⚠️ Quedan solo 8 NCF disponibles en el rango autorizado
```

---

## 🔧 CONFIGURACIÓN AVANZADA

### **¿Qué pasa si no configuro el rango autorizado?**
- El sistema seguirá generando NCF secuencialmente
- NO recibirás alertas cuando se agote el rango
- Es **recomendado** configurarlo para mejor control

### **¿Puedo editar el NCF manualmente?**
- Sí, aunque esté activada la generación automática
- Simplemente edita el campo NCF antes de crear la factura
- Útil para casos especiales o correcciones

### **¿Puedo desactivar la generación automática?**
- Sí, desmarca el checkbox en la configuración
- Tendrás que ingresar el NCF manualmente en cada factura

### **¿Qué pasa si cambio el tipo de NCF?**
- La secuencia se reinicia desde el valor actual
- Asegúrate de actualizar también el rango autorizado
- El prefijo se sincroniza automáticamente con el tipo

---

## 🔒 SEGURIDAD Y CONSISTENCIA

### **Transacciones Atómicas**
- La creación de factura e incremento de secuencia es **atómica**
- Si falla algo, **nada** se guarda (previene inconsistencias)
- No se pueden generar NCF duplicados

### **Validaciones**
- ✅ El NCF es obligatorio
- ✅ El tipo de NCF debe ser válido (B01, B02, B14, B15)
- ✅ El formato del rango debe ser correcto (11 caracteres)
- ✅ No se puede facturar una venta dos veces

---

## 📝 EJEMPLO PRÁCTICO

### **Escenario: Farmacia con autorización de DGII**

1. **Configuración inicial:**
   - Tipo: B02 (Consumidor Final)
   - Rango: B0200000001 - B0200001000 (1000 NCF autorizados)
   - Generación automática: ✅ Activada

2. **Primera factura:**
   - Sistema genera: `B0200000001`
   - Secuencia interna: 1 → 2

3. **Segunda factura:**
   - Sistema genera: `B0200000002`
   - Secuencia interna: 2 → 3

4. **Factura #999:**
   - Sistema genera: `B0200000999`
   - ⚠️ Alerta: "Quedan solo 2 NCF disponibles"

5. **Factura #1000:**
   - Sistema genera: `B0200001000`
   - ⚠️ Alerta: "NCF fuera del rango autorizado"
   - **Acción:** Solicitar nuevo rango a la DGII

---

## 🎨 INTERFAZ DE USUARIO

### **Indicadores Visuales**

**NCF Automático:**
```
NCF (Número de Comprobante Fiscal) * [🤖 AUTOMÁTICO]
┌─────────────────────────────────┐
│ B0100000001                     │ ← Borde verde, fondo claro
└─────────────────────────────────┘
💡 NCF generado automáticamente. Tipo: B01
```

**NCF Manual:**
```
NCF (Número de Comprobante Fiscal) *
┌─────────────────────────────────┐
│ Ej: B0100000001                 │ ← Borde gris, fondo blanco
└─────────────────────────────────┘
```

**Con Advertencia:**
```
┌─────────────────────────────────┐
│ B0100000995                     │
└─────────────────────────────────┘
┌─────────────────────────────────┐
│ ⚠️ Quedan solo 5 NCF disponibles│ ← Fondo amarillo
└─────────────────────────────────┘
```

---

## 🐛 SOLUCIÓN DE PROBLEMAS

### **Problema: No se genera el NCF automáticamente**
**Solución:**
1. Verifica que esté activado en "Datos de la Empresa"
2. Revisa que el tipo de NCF esté seleccionado
3. Recarga la página

### **Problema: El NCF generado no es el esperado**
**Solución:**
1. Verifica la secuencia actual en la base de datos
2. Puede que se hayan creado facturas anteriormente
3. Puedes ajustar manualmente la secuencia si es necesario

### **Problema: Aparece advertencia de rango**
**Solución:**
1. Si es legítima: solicita nuevo rango a la DGII
2. Si es error: verifica los valores de rango en la configuración
3. Puedes dejar los rangos vacíos si no los necesitas

---

## 📦 ARCHIVOS MODIFICADOS

### **Backend:**
- `backend/prisma/schema.prisma` - Nuevos campos en `CompanySettings`
- `backend/src/routes/companySettings.js` - Endpoint `/next-ncf`
- `backend/src/routes/invoices.js` - Incremento automático de secuencia

### **Frontend:**
- `frontend/src/pages/CompanySettings.jsx` - Configuración de NCF
- `frontend/src/pages/InvoiceManager.jsx` - Generación automática y vista previa
- `frontend/src/components/InvoicePreview.jsx` - (sin cambios en esta fase)

---

## ✅ CHECKLIST DE CONFIGURACIÓN

- [ ] Completar datos básicos de la empresa
- [ ] Activar generación automática de NCF
- [ ] Seleccionar tipo de NCF correcto
- [ ] Configurar rango autorizado (opcional)
- [ ] Probar creando una factura de prueba
- [ ] Verificar que el PDF se descarga correctamente
- [ ] Verificar que la secuencia se incrementa
- [ ] Configurar alertas de rango bajo (automático)

---

## 🎉 ¡LISTO PARA USAR!

El sistema está completamente funcional y listo para producción. Todas las validaciones, transacciones y alertas están implementadas para garantizar el cumplimiento con la DGII.

**Próximos pasos sugeridos:**
1. Configurar los datos de tu empresa
2. Crear algunas facturas de prueba
3. Verificar que todo funciona correctamente
4. Eliminar datos de prueba si es necesario
5. ¡Empezar a facturar! 🚀

---

**Fecha de implementación:** 27 de diciembre, 2025
**Versión:** 1.0.0
**Estado:** ✅ Producción

