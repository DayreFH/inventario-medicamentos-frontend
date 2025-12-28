# Script para backup y commit
Write-Host "=== INICIANDO BACKUP Y COMMIT ===" -ForegroundColor Green

# 1. Crear backup
Write-Host "`n1. Creando backup de base de datos..." -ForegroundColor Cyan
Set-Location backend
node scripts/backup-prisma.js
Set-Location ..

# 2. Git add
Write-Host "`n2. Agregando archivos a Git..." -ForegroundColor Cyan
git add -A

# 3. Git status
Write-Host "`n3. Estado de Git:" -ForegroundColor Cyan
git status

# 4. Git commit
Write-Host "`n4. Creando commit..." -ForegroundColor Cyan
$commitMessage = "feat: Implementar Reportes Ejecutivos (Facturacion Mensual y Analisis Comparativo)"
git commit -m $commitMessage

Write-Host "`n=== PROCESO COMPLETADO ===" -ForegroundColor Green

