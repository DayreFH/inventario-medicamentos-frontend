import { Router } from 'express';
import { prisma } from '../db.js';

const router = Router();

/**
 * Test endpoint
 * GET /api/invoices/test
 */
router.get('/test', async (req, res) => {
  res.json({ ok: true, message: 'Invoice routes working' });
});

/**
 * Obtener ventas pendientes de facturar
 * GET /api/invoices/pending-sales
 */
router.get('/pending-sales', async (req, res) => {
  try {
    console.log('[INVOICES] Iniciando búsqueda de ventas pendientes...');
    
    // Paso 1: Obtener facturas existentes
    const invoicedSales = await prisma.invoice.findMany({
      select: { saleId: true }
    });
    console.log('[INVOICES] Facturas encontradas:', invoicedSales.length);
    
    const invoicedSaleIds = invoicedSales.map(inv => inv.saleId);
    console.log('[INVOICES] IDs de ventas facturadas:', invoicedSaleIds);

    // Paso 2: Buscar ventas sin factura (simplificado primero)
    const pendingSales = await prisma.sale.findMany({
      where: invoicedSaleIds.length > 0 ? {
        id: { notIn: invoicedSaleIds }
      } : {},
      include: {
        customer: true,
        saleitem: {
          include: {
            medicines: true
          }
        }
      },
      orderBy: {
        date: 'desc'
      }
    });
    
    console.log('[INVOICES] Ventas pendientes encontradas:', pendingSales.length);

    // Paso 3: Transformar datos
    const transformedSales = pendingSales.map(sale => ({
      ...sale,
      items: sale.saleitem.map(item => ({
        ...item,
        medicine: item.medicines
      }))
    }));

    console.log('[INVOICES] Datos transformados correctamente');
    res.json(transformedSales);
    
  } catch (error) {
    console.error('[INVOICES] ERROR:', error);
    console.error('[INVOICES] Stack:', error.stack);
    res.status(500).json({ 
      error: 'No se pudieron obtener las ventas pendientes', 
      detail: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * Crear una factura para una venta
 * POST /api/invoices
 * body: { saleId, ncf, itbis?, discount?, notes? }
 */
router.post('/', async (req, res) => {
  const { saleId, ncf, itbis, discount, notes } = req.body;

  // Validaciones
  if (!saleId || !ncf) {
    return res.status(400).json({ 
      error: 'Datos incompletos', 
      detail: 'Se requiere saleId y ncf' 
    });
  }

  try {
    // Verificar que la venta existe y no tiene factura
    const sale = await prisma.sale.findUnique({
      where: { id: Number(saleId) },
      include: {
        invoice: true,
        saleitem: true
      }
    });

    if (!sale) {
      return res.status(404).json({ 
        error: 'Venta no encontrada', 
        detail: `No existe una venta con ID ${saleId}` 
      });
    }

    if (sale.invoice) {
      return res.status(400).json({ 
        error: 'Venta ya facturada', 
        detail: `Esta venta ya tiene la factura #${sale.invoice.id}` 
      });
    }

    // Calcular totales
    const subtotal = sale.saleitem.reduce((sum, item) => {
      const precio = Number(item.precio_propuesto_usd) || 0;
      const cantidad = Number(item.qty) || 0;
      return sum + (precio * cantidad);
    }, 0);

    const itbisAmount = subtotal * (parseFloat(itbis || 0) / 100);
    const discountAmount = subtotal * (parseFloat(discount || 0) / 100);
    const total = subtotal + itbisAmount - discountAmount;

    // Crear la factura
    const invoice = await prisma.invoice.create({
      data: {
        saleId: Number(saleId),
        ncf: ncf.trim(),
        subtotal: Number(subtotal),
        itbis: Number(parseFloat(itbis || 0)),
        itbisAmount: Number(itbisAmount),
        discount: Number(parseFloat(discount || 0)),
        discountAmount: Number(discountAmount),
        total: Number(total),
        notes: notes?.trim() || null,
        status: 'emitida'
      },
      include: {
        sale: {
          include: {
            customer: true,
            saleitem: {
              include: {
                medicines: true
              }
            }
          }
        }
      }
    });

    res.status(201).json({ 
      ok: true, 
      invoice: invoice 
    });
  } catch (error) {
    console.error('Error creando factura:', error);
    res.status(500).json({ 
      error: 'No se pudo crear la factura', 
      detail: error.message 
    });
  }
});

/**
 * Listar todas las facturas
 * GET /api/invoices
 */
router.get('/', async (req, res) => {
  try {
    const invoices = await prisma.invoice.findMany({
      include: {
        sale: {
          include: {
            customer: {
              select: {
                id: true,
                name: true,
                email: true
              }
            },
            saleitem: {
              include: {
                medicines: {
                  select: {
                    id: true,
                    nombreComercial: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(invoices);
  } catch (error) {
    console.error('Error listando facturas:', error);
    res.status(500).json({ 
      error: 'No se pudieron listar las facturas', 
      detail: error.message 
    });
  }
});

/**
 * Obtener una factura por ID
 * GET /api/invoices/:id
 */
router.get('/:id', async (req, res) => {
  const id = Number(req.params.id);

  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        sale: {
          include: {
            customer: true,
            saleitem: {
              include: {
                medicines: true
              }
            }
          }
        }
      }
    });

    if (!invoice) {
      return res.status(404).json({ 
        error: 'Factura no encontrada', 
        detail: `No existe una factura con ID ${id}` 
      });
    }

    res.json(invoice);
  } catch (error) {
    console.error('Error obteniendo factura:', error);
    res.status(500).json({ 
      error: 'No se pudo obtener la factura', 
      detail: error.message 
    });
  }
});

/**
 * Anular una factura
 * PUT /api/invoices/:id/cancel
 */
router.put('/:id/cancel', async (req, res) => {
  const id = Number(req.params.id);
  const { reason } = req.body;

  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id }
    });

    if (!invoice) {
      return res.status(404).json({ 
        error: 'Factura no encontrada', 
        detail: `No existe una factura con ID ${id}` 
      });
    }

    if (invoice.status === 'anulada') {
      return res.status(400).json({ 
        error: 'Factura ya anulada', 
        detail: 'Esta factura ya fue anulada previamente' 
      });
    }

    const updatedInvoice = await prisma.invoice.update({
      where: { id },
      data: {
        status: 'anulada',
        notes: invoice.notes 
          ? `${invoice.notes}\n\nANULADA: ${reason || 'Sin motivo especificado'}`
          : `ANULADA: ${reason || 'Sin motivo especificado'}`
      }
    });

    res.json({ 
      ok: true, 
      invoice: updatedInvoice 
    });
  } catch (error) {
    console.error('Error anulando factura:', error);
    res.status(500).json({ 
      error: 'No se pudo anular la factura', 
      detail: error.message 
    });
  }
});

export default router;

