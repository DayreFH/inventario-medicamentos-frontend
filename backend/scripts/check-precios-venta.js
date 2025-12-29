import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Verificando precios de venta MN para medicineId 5...\n');
  
  const precios = await prisma.medicinePriceVentaMN.findMany({
    where: { medicineId: 5 },
    orderBy: { created_at: 'desc' }
  });
  
  console.log(`Total de registros encontrados: ${precios.length}\n`);
  
  precios.forEach((precio, index) => {
    console.log(`Precio ${index + 1}:`);
    console.log(`  ID: ${precio.id}`);
    console.log(`  Precio: MN $${precio.precioVentaMN}`);
    console.log(`  Activo: ${precio.activo ? 'SÍ' : 'NO'}`);
    console.log(`  Creado: ${precio.created_at}`);
    console.log('');
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

