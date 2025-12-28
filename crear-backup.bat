@echo off
echo Creando backup de la base de datos...
cd backend
node scripts/backup-prisma.js
cd ..
echo.
echo Backup completado!
pause

