# 📋 FASE 1: FACTURACIÓN - INSTRUCCIONES DE EJECUCIÓN

## ✅ ARCHIVOS CREADOS/MODIFICADOS:

### **Backend:**
- ✅ `backend/prisma/schema.prisma` - Actualizado con nuevos modelos
- ✅ `backend/scripts/init-invoicing-data.sql` - Script de datos iniciales
- ✅ `backend/src/routes/companySettings.js` - Endpoint de configuración empresa
- ✅ `backend/src/routes/paymentMethods.js` - Endpoint de métodos de pago
- ✅ `backend/src/app.js` - Registradas las nuevas rutas

---

## 🚀 PASOS A EJECUTAR:

### **PASO 1: Aplicar cambios a la base de datos**

Abre una terminal en la carpeta `backend` y ejecuta:

```bash
cd backend
npx prisma db push
```

**¿Qué hace este comando?**
- Lee el archivo `schema.prisma`
- Crea las nuevas tablas en MySQL:
  - `company_settings`
  - `payment_methods`
  - `invoices`
  - `invoice_items`
- Agrega los nuevos campos a tablas existentes:
  - `customer.rnc`
  - `customer.fiscalAddress`
  - `sale.paymentMethod`

**Resultado esperado:**
```
✔ Your database is now in sync with your Prisma schema.
```

---

### **PASO 2: Generar el cliente de Prisma**

En la misma terminal, ejecuta:

```bash
npx prisma generate
```

**¿Qué hace este comando?**
- Genera el cliente de Prisma actualizado
- Permite usar los nuevos modelos en el código

**Resultado esperado:**
```
✔ Generated Prisma Client
```

---

### **PASO 3: Insertar datos iniciales**

Ejecuta el script SQL para insertar los datos iniciales:

**Opción A: Desde MySQL Workbench o phpMyAdmin**
1. Abre el archivo `backend/scripts/init-invoicing-data.sql`
2. Copia todo el contenido
3. Pégalo en MySQL Workbench
4. Ejecuta el script

**Opción B: Desde la terminal (si tienes mysql CLI)**
```bash
mysql -u root -p inventario_medicamentos < backend/scripts/init-invoicing-data.sql
```

**¿Qué hace este script?**
- Inserta 4 métodos de pago por defecto:
  - Efectivo
  - Tarjeta de Crédito/Débito
  - Transferencia Bancaria
  - Crédito
- Crea la configuración inicial de la empresa:
  - Nombre: "Mi Empresa"
  - Prefijo de factura: "FAC"
  - Secuencia inicial: 1
  - Tasa de impuesto: 0%

---

### **PASO 4: Reiniciar el backend**

Si el backend está corriendo, detenlo (Ctrl+C) y vuelve a iniciarlo:

```bash
npm run dev
```

**Resultado esperado:**
```
🚀 Servidor corriendo en puerto 4000
```

---

### **PASO 5: Probar los nuevos endpoints**

Puedes probar los endpoints con Postman, Thunder Client o desde el navegador:

#### **A) Obtener configuración de empresa:**
```
GET http://localhost:4000/api/company-settings
```

**Respuesta esperada:**
```json
{
  "id": 1,
  "companyName": "Mi Empresa",
  "rnc": null,
  "address": null,
  "phone": null,
  "email": null,
  "logo": null,
  "invoicePrefix": "FAC",
  "invoiceSequence": 1,
  "taxRate": "0.00",
  "footerText": null,
  "created_at": "...",
  "updated_at": "..."
}
```

#### **B) Obtener métodos de pago:**
```
GET http://localhost:4000/api/payment-methods
```

**Respuesta esperada:**
```json
[
  {
    "id": 1,
    "name": "efectivo",
    "displayName": "Efectivo",
    "isActive": true,
    "sortOrder": 1,
    "created_at": "..."
  },
  {
    "id": 2,
    "name": "tarjeta",
    "displayName": "Tarjeta de Crédito/Débito",
    "isActive": true,
    "sortOrder": 2,
    "created_at": "..."
  },
  ...
]
```

#### **C) Obtener próximo número de factura:**
```
GET http://localhost:4000/api/company-settings/next-invoice-number
```

**Respuesta esperada:**
```json
{
  "nextNumber": "FAC-00001",
  "prefix": "FAC",
  "sequence": 1
}
```

---

## ⚠️ VERIFICACIÓN DE QUE TODO SIGUE FUNCIONANDO:

### **1. Probar que las ventas siguen funcionando:**
- Ve a **OPERACIONES → Salidas**
- Intenta hacer una salida normal
- Debe funcionar exactamente igual que antes

### **2. Probar que los reportes siguen funcionando:**
- Ve a **FINANZAS → Reporte Financiero**
- Consulta ventas de un período
- Debe mostrar los datos normalmente

### **3. Probar el Dashboard:**
- Ve a **Dashboard Principal**
- Verifica que las métricas se cargan correctamente

---

## 🐛 POSIBLES ERRORES Y SOLUCIONES:

### **Error: "Can't reach database server"**
**Solución:** Verifica que MySQL esté corriendo

### **Error: "Table already exists"**
**Solución:** Las tablas ya existen, puedes continuar

### **Error: "Foreign key constraint fails"**
**Solución:** Ejecuta primero `npx prisma db push` antes del script SQL

### **Error: "Prisma Client not found"**
**Solución:** Ejecuta `npx prisma generate`

---

## 📊 TABLAS CREADAS:

### **1. company_settings**
Almacena la configuración de la empresa para facturación

### **2. payment_methods**
Lista de métodos de pago disponibles

### **3. invoices**
Facturas generadas (aún no se usan, preparadas para FASE 3)

### **4. invoice_items**
Items de cada factura (aún no se usan, preparadas para FASE 3)

---

## ✅ CHECKLIST DE VERIFICACIÓN:

- [ ] Ejecuté `npx prisma db push` exitosamente
- [ ] Ejecuté `npx prisma generate` exitosamente
- [ ] Ejecuté el script SQL de datos iniciales
- [ ] Reinicié el backend
- [ ] Probé GET `/api/company-settings` y funciona
- [ ] Probé GET `/api/payment-methods` y funciona
- [ ] Probé que las Salidas siguen funcionando
- [ ] Probé que el Dashboard sigue funcionando
- [ ] No hay errores en la consola del backend

---

## 🎯 SIGUIENTE PASO:

Una vez que hayas completado todos los pasos y verificado que todo funciona:

**Avísame y procederemos con la FASE 2:**
- Agregar selector de forma de pago en el módulo de Salidas
- Modificar el backend para guardar el método de pago

---

**¿Algún error o duda? Comparte el mensaje de error completo para ayudarte.** 🚀

