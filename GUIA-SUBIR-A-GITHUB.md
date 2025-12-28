# 📤 GUÍA PARA SUBIR BACKEND Y FRONTEND A GITHUB

**Fecha:** 28 de diciembre de 2025
**Proyectos:** Backend y Frontend separados

---

## 📋 PREREQUISITOS

Antes de empezar, asegúrate de tener:

- ✅ Cuenta de GitHub activa
- ✅ Git instalado en tu computadora
- ✅ Git configurado con tu usuario:
  ```bash
  git config --global user.name "Tu Nombre"
  git config --global user.email "tu@email.com"
  ```

---

## 🎯 ESTRUCTURA ACTUAL DEL PROYECTO

```
inventario-medicamentos/
├── backend/          # Proyecto independiente
│   ├── .git/        # Ya tiene Git inicializado
│   ├── src/
│   ├── prisma/
│   └── package.json
│
└── frontend/         # Proyecto independiente
    ├── .git/        # Ya tiene Git inicializado
    ├── src/
    └── package.json
```

---

## 🔐 ARCHIVOS SENSIBLES - IMPORTANTE

### **⚠️ ANTES DE SUBIR, VERIFICAR `.gitignore`**

Estos archivos **NUNCA** deben subirse a GitHub:

```
❌ .env
❌ .env.local
❌ .env.production
❌ node_modules/
❌ dist/
❌ build/
❌ *.log
❌ .DS_Store
```

---

## 📦 PARTE 1: SUBIR BACKEND A GITHUB

### **Paso 1: Crear repositorio en GitHub**

1. Ve a https://github.com
2. Click en el botón **"+"** (arriba derecha) → **"New repository"**
3. Configurar:
   - **Repository name:** `inventario-medicamentos-backend`
   - **Description:** "API Backend para sistema de inventario de medicamentos"
   - **Visibility:** Private (recomendado) o Public
   - **⚠️ NO marcar:** "Initialize this repository with a README"
   - **⚠️ NO agregar:** .gitignore ni License (ya los tienes)
4. Click en **"Create repository"**

### **Paso 2: Verificar .gitignore del backend**

```bash
cd "D:\SOFTWARE INVENTARIO MEDICAMENTO\inventario-medicamentos\backend"
```

Verificar que `backend/.gitignore` contenga:

```gitignore
# Node
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Environment variables
.env
.env.local
.env.production
.env.test

# Logs
logs/
*.log

# OS
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/

# Prisma
prisma/.env

# Backups (opcional - decidir si quieres subirlos)
backups/*.json
```

### **Paso 3: Preparar el backend**

```bash
# Ir al directorio backend
cd "D:\SOFTWARE INVENTARIO MEDICAMENTO\inventario-medicamentos\backend"

# Verificar estado de Git
git status

# Ver qué archivos se subirán
git ls-files

# Verificar que .env NO esté en la lista
git ls-files | grep .env
# (No debería mostrar nada)
```

### **Paso 4: Crear archivo README.md para el backend**

Crear `backend/README.md`:

```markdown
# 🏥 Inventario Medicamentos - Backend

API REST para sistema de gestión de inventario de medicamentos.

## 🚀 Tecnologías

- Node.js
- Express.js
- Prisma ORM
- MySQL
- JWT Authentication

## 📦 Instalación

```bash
npm install
```

## ⚙️ Configuración

Crear archivo `.env`:

```env
DATABASE_URL="mysql://user:password@localhost:3306/inventario_meds"
JWT_SECRET="tu-secret-key-aqui"
PORT=3001
```

## 🏃 Ejecutar

```bash
# Desarrollo
npm run dev

# Producción
npm start
```

## 📚 Endpoints

- `/api/auth` - Autenticación
- `/api/medicines` - Medicamentos
- `/api/sales` - Ventas
- `/api/receipts` - Entradas
- `/api/invoices` - Facturación
- `/api/reports` - Reportes

## 🔐 Seguridad

- Autenticación JWT
- Rate limiting
- Validación de datos con Zod
- Roles y permisos granulares
```

### **Paso 5: Commit y preparar para subir**

```bash
# Agregar README
git add README.md

# Commit
git commit -m "docs: Agregar README del backend"

# Ver el historial
git log --oneline -5
```

### **Paso 6: Conectar con GitHub y subir**

```bash
# Agregar el repositorio remoto (reemplaza con tu URL)
git remote add origin https://github.com/TU-USUARIO/inventario-medicamentos-backend.git

# Verificar que se agregó correctamente
git remote -v

# Subir el código (primera vez)
git push -u origin main
# O si tu rama se llama master:
# git push -u origin master

# Si tu rama local se llama diferente, renombrarla:
git branch -M main
git push -u origin main
```

### **⚠️ Si pide autenticación:**

**Opción 1: Personal Access Token (Recomendado)**
1. Ve a GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token
3. Marca: `repo` (Full control of private repositories)
4. Copia el token
5. Cuando Git pida password, usa el token en lugar de tu contraseña

**Opción 2: GitHub CLI**
```bash
# Instalar GitHub CLI
winget install GitHub.cli

# Autenticar
gh auth login

# Subir
git push -u origin main
```

---

## 🎨 PARTE 2: SUBIR FRONTEND A GITHUB

### **Paso 1: Crear repositorio en GitHub**

1. Ve a https://github.com
2. Click en **"+"** → **"New repository"**
3. Configurar:
   - **Repository name:** `inventario-medicamentos-frontend`
   - **Description:** "Frontend React para sistema de inventario de medicamentos"
   - **Visibility:** Private o Public
   - **⚠️ NO marcar:** "Initialize this repository with a README"
4. Click en **"Create repository"**

### **Paso 2: Verificar .gitignore del frontend**

```bash
cd "D:\SOFTWARE INVENTARIO MEDICAMENTO\inventario-medicamentos\frontend"
```

Verificar que `frontend/.gitignore` contenga:

```gitignore
# Dependencies
node_modules/

# Build
dist/
build/
.next/

# Environment
.env
.env.local
.env.production

# Logs
npm-debug.log*
yarn-debug.log*

# OS
.DS_Store

# IDE
.vscode/
.idea/

# Testing
coverage/
```

### **Paso 3: Preparar el frontend**

```bash
# Ir al directorio frontend
cd "D:\SOFTWARE INVENTARIO MEDICAMENTO\inventario-medicamentos\frontend"

# Verificar estado
git status

# Verificar archivos
git ls-files

# Verificar que .env NO esté
git ls-files | grep .env
```

### **Paso 4: Crear README.md para el frontend**

Crear `frontend/README.md`:

```markdown
# 🏥 Inventario Medicamentos - Frontend

Aplicación web React para gestión de inventario de medicamentos.

## 🚀 Tecnologías

- React 18
- Vite
- React Router
- Axios
- Chart.js
- jsPDF

## 📦 Instalación

```bash
npm install
```

## ⚙️ Configuración

Crear archivo `.env`:

```env
VITE_API_URL=http://localhost:3001
```

## 🏃 Ejecutar

```bash
# Desarrollo
npm run dev

# Build para producción
npm run build

# Preview del build
npm run preview
```

## 🎨 Características

- ✅ Dashboard unificado con métricas
- ✅ Gestión de medicamentos (CRUD)
- ✅ Control de entradas y salidas
- ✅ Sistema de facturación con NCF
- ✅ Reportes ejecutivos e inventario
- ✅ Sistema de roles y permisos
- ✅ Autenticación JWT
- ✅ Búsqueda global

## 🔐 Roles

- **Administrador:** Acceso completo
- **Gerente:** Gestión operativa
- **Vendedor:** Ventas y consultas

## 📱 Páginas

- `/` - Home
- `/dashboard` - Dashboard principal
- `/medicines` - Medicamentos
- `/sales` - Salidas/Ventas
- `/receipts` - Entradas
- `/operaciones/facturacion` - Facturación
- `/reports` - Reportes
- `/users` - Usuarios
- `/roles` - Roles y permisos
```

### **Paso 5: Commit y preparar para subir**

```bash
# Agregar README
git add README.md

# Commit
git commit -m "docs: Agregar README del frontend"

# Ver historial
git log --oneline -5
```

### **Paso 6: Conectar con GitHub y subir**

```bash
# Agregar repositorio remoto (reemplaza con tu URL)
git remote add origin https://github.com/TU-USUARIO/inventario-medicamentos-frontend.git

# Verificar
git remote -v

# Subir
git branch -M main
git push -u origin main
```

---

## 📝 CREAR ARCHIVO .env.example

### **Para Backend:**

Crear `backend/.env.example`:

```env
# Database
DATABASE_URL="mysql://user:password@localhost:3306/database_name"

# JWT
JWT_SECRET="your-secret-key-here"

# Server
PORT=3001
NODE_ENV=development

# CORS (opcional)
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

### **Para Frontend:**

Crear `frontend/.env.example`:

```env
# API URL
VITE_API_URL=http://localhost:3001
```

Luego commitear:

```bash
# Backend
cd backend
git add .env.example
git commit -m "docs: Agregar .env.example"
git push

# Frontend
cd ../frontend
git add .env.example
git commit -m "docs: Agregar .env.example"
git push
```

---

## 🔄 COMANDOS ÚTILES DESPUÉS DE SUBIR

### **Ver repositorios remotos:**
```bash
git remote -v
```

### **Subir cambios nuevos:**
```bash
git add .
git commit -m "feat: descripción del cambio"
git push
```

### **Bajar cambios del repositorio:**
```bash
git pull
```

### **Ver estado:**
```bash
git status
```

### **Ver historial:**
```bash
git log --oneline -10
```

### **Crear nueva rama:**
```bash
git checkout -b feature/nueva-funcionalidad
git push -u origin feature/nueva-funcionalidad
```

---

## 🌐 CONFIGURAR DEPLOYMENT

### **Backend (Railway/Render):**

1. Conectar repositorio de GitHub
2. Configurar variables de entorno:
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `PORT`
3. Build command: `npm install`
4. Start command: `npm start`

### **Frontend (Vercel/Netlify):**

1. Conectar repositorio de GitHub
2. Configurar variables de entorno:
   - `VITE_API_URL`
3. Build command: `npm run build`
4. Output directory: `dist`

---

## 🔐 SEGURIDAD - CHECKLIST

Antes de subir, verificar:

- [ ] ✅ `.env` está en `.gitignore`
- [ ] ✅ `.env.example` está creado (sin valores reales)
- [ ] ✅ `node_modules/` está en `.gitignore`
- [ ] ✅ No hay contraseñas en el código
- [ ] ✅ No hay API keys hardcodeadas
- [ ] ✅ JWT_SECRET no está en el código
- [ ] ✅ URLs de producción configurables

---

## 📊 RESUMEN DE REPOSITORIOS

| Repositorio | URL | Descripción |
|-------------|-----|-------------|
| **Backend** | `github.com/TU-USUARIO/inventario-medicamentos-backend` | API REST + Prisma + MySQL |
| **Frontend** | `github.com/TU-USUARIO/inventario-medicamentos-frontend` | React + Vite + Chart.js |

---

## 🆘 SOLUCIÓN DE PROBLEMAS

### **Error: "remote origin already exists"**
```bash
git remote remove origin
git remote add origin https://github.com/TU-USUARIO/repo.git
```

### **Error: "failed to push some refs"**
```bash
# Bajar cambios primero
git pull origin main --rebase
git push
```

### **Error: "Authentication failed"**
- Usar Personal Access Token en lugar de contraseña
- O usar GitHub CLI: `gh auth login`

### **Subir archivos grandes (>100MB)**
```bash
# Usar Git LFS
git lfs install
git lfs track "*.json"
git add .gitattributes
git commit -m "chore: Configurar Git LFS"
```

---

## 📚 RECURSOS ADICIONALES

- [GitHub Docs](https://docs.github.com)
- [Git Cheat Sheet](https://education.github.com/git-cheat-sheet-education.pdf)
- [Personal Access Tokens](https://github.com/settings/tokens)
- [GitHub CLI](https://cli.github.com/)

---

## ✅ CHECKLIST FINAL

### **Backend:**
- [ ] Repositorio creado en GitHub
- [ ] `.gitignore` configurado
- [ ] `.env.example` creado
- [ ] README.md agregado
- [ ] Código subido
- [ ] Variables de entorno documentadas

### **Frontend:**
- [ ] Repositorio creado en GitHub
- [ ] `.gitignore` configurado
- [ ] `.env.example` creado
- [ ] README.md agregado
- [ ] Código subido
- [ ] Variables de entorno documentadas

### **Seguridad:**
- [ ] `.env` NO está en GitHub
- [ ] No hay contraseñas en el código
- [ ] Tokens y secrets en variables de entorno
- [ ] `.gitignore` correctamente configurado

---

**¡Listo para subir a GitHub!** 🚀

**Fecha:** 28 de diciembre de 2025
**Versión:** 1.0

