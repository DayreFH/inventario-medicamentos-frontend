# Script para subir frontend a GitHub
Write-Host "=== SUBIR FRONTEND A GITHUB ===" -ForegroundColor Green
Write-Host ""

# Ir al directorio frontend
cd "D:\SOFTWARE INVENTARIO MEDICAMENTO\inventario-medicamentos\frontend"

Write-Host "1. Verificando estado actual..." -ForegroundColor Cyan
git status

Write-Host ""
Write-Host "2. Agregando todos los archivos..." -ForegroundColor Cyan
git add -A

Write-Host ""
Write-Host "3. Creando commit..." -ForegroundColor Cyan
$fecha = Get-Date -Format "dd-MMM-yyyy HH:mm"
git commit -m "feat: Sistema completo - Facturacion, Reportes, Dashboard ($fecha)"

Write-Host ""
Write-Host "4. Subiendo a GitHub..." -ForegroundColor Cyan
git push

Write-Host ""
Write-Host "=== FRONTEND SUBIDO EXITOSAMENTE ===" -ForegroundColor Green
Write-Host ""
Write-Host "Repositorio: " -NoNewline
git remote get-url origin

