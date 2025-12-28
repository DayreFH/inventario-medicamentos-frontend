# Script para crear backup completo del sistema
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$projectPath = "D:\SOFTWARE INVENTARIO MEDICAMENTO\inventario-medicamentos"
$backupPath = "D:\BACKUPS\inventario-medicamentos-backup-$timestamp"

Write-Host "=== BACKUP COMPLETO DEL SISTEMA ===" -ForegroundColor Green
Write-Host ""
Write-Host "Origen: $projectPath" -ForegroundColor Cyan
Write-Host "Destino: $backupPath" -ForegroundColor Cyan
Write-Host ""

# Crear directorio de backup
Write-Host "1. Creando directorio de backup..." -ForegroundColor Yellow
New-Item -ItemType Directory -Path $backupPath -Force | Out-Null

# Copiar todo el proyecto (excluyendo node_modules y .git)
Write-Host "2. Copiando archivos del proyecto..." -ForegroundColor Yellow
Write-Host "   (Esto puede tomar varios minutos...)" -ForegroundColor Gray

# Copiar frontend (sin node_modules)
Write-Host "   - Copiando frontend..." -ForegroundColor Gray
robocopy "$projectPath\frontend" "$backupPath\frontend" /E /XD node_modules .next /NFL /NDL /NJH /NJS /nc /ns /np

# Copiar backend (sin node_modules)
Write-Host "   - Copiando backend..." -ForegroundColor Gray
robocopy "$projectPath\backend" "$backupPath\backend" /E /XD node_modules /NFL /NDL /NJH /NJS /nc /ns /np

# Copiar archivos raíz
Write-Host "   - Copiando archivos de configuración..." -ForegroundColor Gray
Copy-Item "$projectPath\*.md" -Destination $backupPath -Force -ErrorAction SilentlyContinue
Copy-Item "$projectPath\*.js" -Destination $backupPath -Force -ErrorAction SilentlyContinue
Copy-Item "$projectPath\*.bat" -Destination $backupPath -Force -ErrorAction SilentlyContinue
Copy-Item "$projectPath\.gitignore" -Destination $backupPath -Force -ErrorAction SilentlyContinue

# Crear archivo de información del backup
Write-Host "3. Creando archivo de información..." -ForegroundColor Yellow
$backupInfo = @"
# BACKUP COMPLETO DEL SISTEMA
Fecha: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
Origen: $projectPath
Destino: $backupPath

## CONTENIDO DEL BACKUP:
- ✅ Código fuente completo (frontend + backend)
- ✅ Archivos de configuración
- ✅ Base de datos (JSON backup)
- ✅ Documentación (.md)
- ✅ Scripts de utilidad
- ❌ node_modules (excluido - reinstalar con npm install)
- ❌ .git (excluido - usar repositorio Git)

## CÓMO RESTAURAR:
1. Copiar todo el contenido a la ubicación deseada
2. cd frontend && npm install
3. cd backend && npm install
4. Configurar archivos .env
5. npm run dev

## TAMAÑO DEL BACKUP:
"@

$backupInfo | Out-File -FilePath "$backupPath\BACKUP-INFO.md" -Encoding UTF8

# Calcular tamaño
Write-Host "4. Calculando tamaño del backup..." -ForegroundColor Yellow
$size = (Get-ChildItem -Path $backupPath -Recurse | Measure-Object -Property Length -Sum).Sum
$sizeMB = [math]::Round($size / 1MB, 2)

Write-Host ""
Write-Host "=== BACKUP COMPLETADO ===" -ForegroundColor Green
Write-Host ""
Write-Host "📁 Ubicación: $backupPath" -ForegroundColor Cyan
Write-Host "📊 Tamaño: $sizeMB MB" -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ Backup completo del sistema creado exitosamente!" -ForegroundColor Green
Write-Host ""

# Abrir carpeta de backup
Start-Process explorer.exe -ArgumentList $backupPath

