# 🚀 INSTRUCCIONES RÁPIDAS - SUBIR A GITHUB

**Fecha:** 28 de diciembre de 2025

---

## ⚡ OPCIÓN 1: USAR SCRIPTS AUTOMÁTICOS (RECOMENDADO)

### **Backend:**
```powershell
.\subir-backend-github.ps1
```

### **Frontend:**
```powershell
.\subir-frontend-github.ps1
```

---

## 📝 OPCIÓN 2: MANUAL PASO A PASO

### **BACKEND:**

```bash
# 1. Ir al directorio backend
cd "D:\SOFTWARE INVENTARIO MEDICAMENTO\inventario-medicamentos\backend"

# 2. Ver estado actual
git status

# 3. Agregar todos los archivos
git add -A

# 4. Crear commit
git commit -m "feat: Sistema completo - Facturacion, Reportes, Dashboard"

# 5. Subir a GitHub
git push
```

### **FRONTEND:**

```bash
# 1. Ir al directorio frontend
cd "D:\SOFTWARE INVENTARIO MEDICAMENTO\inventario-medicamentos\frontend"

# 2. Ver estado actual
git status

# 3. Agregar todos los archivos
git add -A

# 4. Crear commit
git commit -m "feat: Sistema completo - Facturacion, Reportes, Dashboard"

# 5. Subir a GitHub
git push
```

---

## 🔐 SI PIDE AUTENTICACIÓN

### **Opción A: Personal Access Token**

1. Ve a: https://github.com/settings/tokens
2. Click en **"Generate new token (classic)"**
3. Marca: `repo` (Full control)
4. Copia el token
5. Cuando Git pida password, usa el **token** (no tu contraseña de GitHub)

### **Opción B: GitHub CLI**

```bash
# Instalar
winget install GitHub.cli

# Autenticar
gh auth login

# Luego ejecutar git push normalmente
```

---

## ✅ VERIFICAR QUE SE SUBIÓ

### **Backend:**
```bash
cd backend
git log --oneline -3
git remote -v
```

### **Frontend:**
```bash
cd frontend
git log --oneline -3
git remote -v
```

---

## 🔍 ESTADO ACTUAL

### **Backend:**
- ✅ Git inicializado
- ✅ Conectado a repositorio remoto
- ⏳ Cambios pendientes de subir

### **Frontend:**
- ✅ Git inicializado
- ✅ Conectado a repositorio remoto
- ⏳ Cambios pendientes de subir

---

## 📦 ARCHIVOS QUE SE SUBIRÁN

### **Backend:**
- ✅ Nuevas rutas (invoices, reports, dashboard, etc.)
- ✅ Scripts de backup
- ✅ Configuración actualizada
- ✅ Schema de Prisma actualizado

### **Frontend:**
- ✅ Componentes nuevos (ExecutiveReports, InventoryReports, etc.)
- ✅ Páginas actualizadas
- ✅ Configuración de permisos
- ✅ Estilos y utilidades

---

## ⚠️ IMPORTANTE - ANTES DE SUBIR

### **Verificar que NO se suban:**
```bash
# Backend
cd backend
git status | grep .env
# No debería mostrar nada

# Frontend
cd frontend
git status | grep .env
# No debería mostrar nada
```

Si aparece `.env`, ejecutar:
```bash
git restore --staged .env
```

---

## 🎯 RESUMEN

1. **Backend:** Ejecutar `.\subir-backend-github.ps1`
2. **Frontend:** Ejecutar `.\subir-frontend-github.ps1`
3. **Verificar:** Revisar en GitHub que los cambios aparezcan

---

## 📚 DOCUMENTACIÓN COMPLETA

Para más detalles, ver: `GUIA-SUBIR-A-GITHUB.md`

---

**¿Listo para subir?** 🚀

