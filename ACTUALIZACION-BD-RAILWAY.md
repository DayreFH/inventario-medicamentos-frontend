# 🔄 ACTUALIZACIÓN DE BASE DE DATOS EN RAILWAY

**Fecha:** 28 de diciembre de 2025
**Estado:** ⚠️ PENDIENTE - Cambios importantes en el schema

---

## ⚠️ CAMBIOS CRÍTICOS EN LA BASE DE DATOS

Sí, **hay cambios importantes** que deben aplicarse a la base de datos de Railway:

---

## 📋 NUEVAS TABLAS AGREGADAS

### **1. `company_settings` (Configuración de Empresa)**
```sql
CREATE TABLE `company_settings` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `companyName` VARCHAR(191) NOT NULL DEFAULT 'Mi Empresa',
  `rnc` VARCHAR(191),
  `address` TEXT,
  `phone` VARCHAR(191),
  `email` VARCHAR(191),
  `logo` TEXT,
  `invoicePrefix` VARCHAR(191) NOT NULL DEFAULT 'FAC',
  `invoiceSequence` INT NOT NULL DEFAULT 1,
  `taxRate` DECIMAL(5,2) NOT NULL DEFAULT 0,
  `footerText` TEXT,
  `autoGenerateNCF` BOOLEAN NOT NULL DEFAULT true,
  `ncfType` VARCHAR(191) NOT NULL DEFAULT 'B01',
  `ncfSequence` INT NOT NULL DEFAULT 1,
  `ncfPrefix` VARCHAR(191) NOT NULL DEFAULT 'B01',
  `ncfRangeStart` VARCHAR(191),
  `ncfRangeEnd` VARCHAR(191),
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`)
);
```

### **2. `payment_methods` (Métodos de Pago)**
```sql
CREATE TABLE `payment_methods` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(191) NOT NULL UNIQUE,
  `displayName` VARCHAR(191) NOT NULL,
  `isActive` BOOLEAN NOT NULL DEFAULT true,
  `sortOrder` INT NOT NULL DEFAULT 0,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`)
);
```

### **3. `invoices` (Facturas)**
```sql
CREATE TABLE `invoices` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `saleId` INT NOT NULL UNIQUE,
  `ncf` VARCHAR(191) NOT NULL,
  `subtotal` DECIMAL(10,2) NOT NULL,
  `itbis` DECIMAL(5,2) NOT NULL DEFAULT 0,
  `itbisAmount` DECIMAL(10,2) NOT NULL DEFAULT 0,
  `discount` DECIMAL(5,2) NOT NULL DEFAULT 0,
  `discountAmount` DECIMAL(10,2) NOT NULL DEFAULT 0,
  `total` DECIMAL(10,2) NOT NULL,
  `notes` TEXT,
  `status` VARCHAR(191) NOT NULL DEFAULT 'emitida',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `invoices_saleId_idx` (`saleId`),
  INDEX `invoices_ncf_idx` (`ncf`),
  CONSTRAINT `invoices_saleId_fkey` FOREIGN KEY (`saleId`) REFERENCES `sale`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE
);
```

---

## 🔧 MODIFICACIONES A TABLAS EXISTENTES

### **1. Tabla `customer` (Clientes)**
**Nuevas columnas:**
```sql
ALTER TABLE `customer` 
ADD COLUMN `rnc` VARCHAR(191),
ADD COLUMN `fiscalAddress` TEXT;
```

### **2. Tabla `sale` (Ventas)**
**Nueva columna:**
```sql
ALTER TABLE `sale` 
ADD COLUMN `paymentMethod` VARCHAR(191) DEFAULT 'efectivo';
```

### **3. Tabla `roles` (Roles)**
**Modificación:**
```sql
ALTER TABLE `roles` 
MODIFY COLUMN `permissions` JSON NOT NULL;
```

---

## 📊 DATOS INICIALES REQUERIDOS

### **1. Métodos de Pago (Obligatorio)**
```sql
INSERT INTO `payment_methods` (`name`, `displayName`, `isActive`, `sortOrder`) VALUES
('efectivo', 'Efectivo', 1, 1),
('tarjeta', 'Tarjeta de Crédito/Débito', 1, 2),
('transferencia', 'Transferencia Bancaria', 1, 3),
('cheque', 'Cheque', 1, 4),
('credito', 'Crédito', 1, 5);
```

### **2. Configuración de Empresa (Opcional pero recomendado)**
```sql
INSERT INTO `company_settings` (
  `companyName`, 
  `rnc`, 
  `address`, 
  `phone`, 
  `email`, 
  `invoicePrefix`, 
  `invoiceSequence`, 
  `taxRate`,
  `autoGenerateNCF`,
  `ncfType`,
  `ncfSequence`,
  `ncfPrefix`,
  `updated_at`
) VALUES (
  'Tu Empresa', 
  '000-0000000-0', 
  'Tu Dirección', 
  '(809) 000-0000', 
  'tu@email.com', 
  'FAC', 
  1, 
  18.00,
  true,
  'B01',
  1,
  'B01',
  NOW()
);
```

---

## 🚀 MÉTODOS PARA APLICAR LOS CAMBIOS

### **OPCIÓN 1: Usar Prisma Migrate (RECOMENDADO)**

#### **Paso 1: Conectar a Railway desde local**

Necesitas la URL de conexión de Railway. En Railway:
1. Ve a tu base de datos MySQL
2. Click en "Variables"
3. Copia el valor de `DATABASE_URL`

#### **Paso 2: Configurar localmente**

Crear archivo `backend/.env.railway`:
```env
DATABASE_URL="mysql://usuario:password@host:puerto/database"
```

#### **Paso 3: Aplicar cambios**

```bash
cd backend

# Aplicar cambios al schema (esto actualiza la BD)
npx prisma db push --schema=./prisma/schema.prisma

# O si prefieres crear una migración
npx prisma migrate deploy
```

---

### **OPCIÓN 2: Ejecutar SQL Manualmente en Railway**

#### **Paso 1: Acceder a la base de datos**

En Railway:
1. Click en tu servicio MySQL
2. Click en "Data"
3. O usa un cliente MySQL externo con las credenciales

#### **Paso 2: Ejecutar el script SQL completo**

Crear archivo `backend/scripts/update-railway-db.sql`:

```sql
-- ============================================================
-- SCRIPT DE ACTUALIZACIÓN DE BASE DE DATOS
-- Fecha: 28 de diciembre de 2025
-- ============================================================

-- 1. Crear tabla company_settings
CREATE TABLE IF NOT EXISTS `company_settings` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `companyName` VARCHAR(191) NOT NULL DEFAULT 'Mi Empresa',
  `rnc` VARCHAR(191),
  `address` TEXT,
  `phone` VARCHAR(191),
  `email` VARCHAR(191),
  `logo` TEXT,
  `invoicePrefix` VARCHAR(191) NOT NULL DEFAULT 'FAC',
  `invoiceSequence` INT NOT NULL DEFAULT 1,
  `taxRate` DECIMAL(5,2) NOT NULL DEFAULT 0,
  `footerText` TEXT,
  `autoGenerateNCF` BOOLEAN NOT NULL DEFAULT true,
  `ncfType` VARCHAR(191) NOT NULL DEFAULT 'B01',
  `ncfSequence` INT NOT NULL DEFAULT 1,
  `ncfPrefix` VARCHAR(191) NOT NULL DEFAULT 'B01',
  `ncfRangeStart` VARCHAR(191),
  `ncfRangeEnd` VARCHAR(191),
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Crear tabla payment_methods
CREATE TABLE IF NOT EXISTS `payment_methods` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(191) NOT NULL UNIQUE,
  `displayName` VARCHAR(191) NOT NULL,
  `isActive` BOOLEAN NOT NULL DEFAULT true,
  `sortOrder` INT NOT NULL DEFAULT 0,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Crear tabla invoices
CREATE TABLE IF NOT EXISTS `invoices` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `saleId` INT NOT NULL UNIQUE,
  `ncf` VARCHAR(191) NOT NULL,
  `subtotal` DECIMAL(10,2) NOT NULL,
  `itbis` DECIMAL(5,2) NOT NULL DEFAULT 0,
  `itbisAmount` DECIMAL(10,2) NOT NULL DEFAULT 0,
  `discount` DECIMAL(5,2) NOT NULL DEFAULT 0,
  `discountAmount` DECIMAL(10,2) NOT NULL DEFAULT 0,
  `total` DECIMAL(10,2) NOT NULL,
  `notes` TEXT,
  `status` VARCHAR(191) NOT NULL DEFAULT 'emitida',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `invoices_saleId_idx` (`saleId`),
  INDEX `invoices_ncf_idx` (`ncf`),
  CONSTRAINT `invoices_saleId_fkey` FOREIGN KEY (`saleId`) REFERENCES `sale`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Modificar tabla customer (agregar columnas si no existen)
ALTER TABLE `customer` 
ADD COLUMN IF NOT EXISTS `rnc` VARCHAR(191),
ADD COLUMN IF NOT EXISTS `fiscalAddress` TEXT;

-- 5. Modificar tabla sale (agregar columna si no existe)
ALTER TABLE `sale` 
ADD COLUMN IF NOT EXISTS `paymentMethod` VARCHAR(191) DEFAULT 'efectivo';

-- 6. Insertar métodos de pago por defecto
INSERT IGNORE INTO `payment_methods` (`name`, `displayName`, `isActive`, `sortOrder`) VALUES
('efectivo', 'Efectivo', 1, 1),
('tarjeta', 'Tarjeta de Crédito/Débito', 1, 2),
('transferencia', 'Transferencia Bancaria', 1, 3),
('cheque', 'Cheque', 1, 4),
('credito', 'Crédito', 1, 5);

-- 7. Insertar configuración de empresa por defecto
INSERT IGNORE INTO `company_settings` (
  `id`,
  `companyName`, 
  `invoicePrefix`, 
  `invoiceSequence`, 
  `taxRate`,
  `autoGenerateNCF`,
  `ncfType`,
  `ncfSequence`,
  `ncfPrefix`,
  `updated_at`
) VALUES (
  1,
  'Mi Empresa', 
  'FAC', 
  1, 
  18.00,
  true,
  'B01',
  1,
  'B01',
  NOW()
);

-- ============================================================
-- FIN DEL SCRIPT
-- ============================================================
```

---

### **OPCIÓN 3: Usar Railway CLI (Avanzado)**

```bash
# Instalar Railway CLI
npm install -g @railway/cli

# Login
railway login

# Conectar al proyecto
railway link

# Ejecutar el script
railway run npx prisma db push
```

---

## ✅ VERIFICACIÓN DESPUÉS DE APLICAR

### **1. Verificar que las tablas existen:**

```sql
SHOW TABLES;
```

Deberías ver:
```
company_settings
payment_methods
invoices
(y todas las demás tablas existentes)
```

### **2. Verificar estructura de `invoices`:**

```sql
DESCRIBE invoices;
```

### **3. Verificar datos iniciales:**

```sql
SELECT * FROM payment_methods;
SELECT * FROM company_settings;
```

### **4. Verificar columnas nuevas:**

```sql
DESCRIBE customer;  -- Debe tener rnc y fiscalAddress
DESCRIBE sale;      -- Debe tener paymentMethod
```

---

## 🔄 DESPUÉS DE ACTUALIZAR LA BD

### **1. Reiniciar el servicio de Railway**

El backend debería reiniciarse automáticamente después de detectar los cambios en GitHub.

### **2. Verificar logs en Railway**

```
Settings → Logs
```

Buscar:
- ✅ "Server running on port..."
- ✅ Sin errores de Prisma
- ❌ Errores de tablas faltantes

### **3. Probar endpoints nuevos**

```bash
# Probar configuración de empresa
GET https://tu-backend.railway.app/api/company-settings

# Probar métodos de pago
GET https://tu-backend.railway.app/api/payment-methods

# Probar facturas
GET https://tu-backend.railway.app/api/invoices/pending-sales
```

---

## ⚠️ IMPORTANTE - BACKUP

### **Antes de aplicar cambios:**

```sql
-- Hacer backup de las tablas que se van a modificar
CREATE TABLE customer_backup AS SELECT * FROM customer;
CREATE TABLE sale_backup AS SELECT * FROM sale;
```

O mejor aún, usar la función de backup de Railway:
1. Railway Dashboard → MySQL → Backups
2. Create Backup

---

## 🐛 SOLUCIÓN DE PROBLEMAS

### **Error: "Table already exists"**
```sql
-- Verificar si la tabla existe
SHOW TABLES LIKE 'invoices';

-- Si existe, eliminarla y recrearla
DROP TABLE IF EXISTS invoices;
-- Luego ejecutar el CREATE TABLE
```

### **Error: "Column already exists"**
```sql
-- Verificar columnas existentes
DESCRIBE customer;

-- Si la columna ya existe, omitir el ALTER TABLE
```

### **Error: "Foreign key constraint fails"**
```sql
-- Verificar que la tabla 'sale' existe
SHOW TABLES LIKE 'sale';

-- Verificar índices
SHOW INDEX FROM sale;
```

---

## 📋 CHECKLIST DE ACTUALIZACIÓN

- [ ] Hacer backup de la base de datos en Railway
- [ ] Copiar `DATABASE_URL` de Railway
- [ ] Ejecutar `npx prisma db push` o script SQL
- [ ] Verificar que las tablas se crearon correctamente
- [ ] Verificar que los datos iniciales se insertaron
- [ ] Reiniciar servicio de backend en Railway
- [ ] Verificar logs de Railway
- [ ] Probar endpoints de facturación
- [ ] Probar creación de facturas desde el frontend

---

## 🎯 RESUMEN

**Cambios críticos:**
- ✅ 3 tablas nuevas (company_settings, payment_methods, invoices)
- ✅ 3 columnas nuevas (customer.rnc, customer.fiscalAddress, sale.paymentMethod)
- ✅ Datos iniciales requeridos (métodos de pago)

**Método recomendado:**
- 🥇 **Opción 1:** `npx prisma db push` (más seguro)
- 🥈 **Opción 2:** Script SQL manual (más control)

**Tiempo estimado:**
- ⏱️ 5-10 minutos

---

**¿Necesitas ayuda para ejecutar la actualización?** 🚀

