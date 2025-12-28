// Script de backup sin interacción
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function runBackup() {
  try {
    console.log('🔵 Ejecutando backup...');
    
    // Ejecutar backup
    const { stdout, stderr } = await execAsync('node backend/scripts/backup-prisma.js', {
      cwd: process.cwd(),
      shell: true
    });
    
    console.log(stdout);
    if (stderr) console.error(stderr);
    
    console.log('✅ Backup completado');
    
    // Ejecutar git add
    console.log('\n🔵 Agregando archivos a Git...');
    const gitAdd = await execAsync('git add -A');
    console.log(gitAdd.stdout);
    
    // Ejecutar git status
    console.log('\n🔵 Estado de Git:');
    const gitStatus = await execAsync('git status --short');
    console.log(gitStatus.stdout);
    
    // Ejecutar git commit
    console.log('\n🔵 Creando commit...');
    const gitCommit = await execAsync('git commit -m "feat: Implementar Reportes Ejecutivos (Facturacion Mensual y Analisis Comparativo)"');
    console.log(gitCommit.stdout);
    
    console.log('\n✅ TODO COMPLETADO');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.stdout) console.log(error.stdout);
    if (error.stderr) console.error(error.stderr);
  }
}

runBackup();

