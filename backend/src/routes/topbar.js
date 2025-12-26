import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/topbar/metrics - Obtener métricas rápidas
router.get('/metrics', authenticate, async (req, res) => {
  try {
    // Contar total de medicamentos
    const totalMedicines = await prisma.medicines.count();

    // Contar alertas activas (medicamentos con stock bajo o próximos a vencer)
    const lowStockCount = await prisma.medicines.count({
      where: {
        stock: {
          lte: 10 // Stock mínimo por defecto
        }
      }
    });

    // Medicamentos próximos a vencer (30 días)
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const expiringCount = await prisma.medicines.count({
      where: {
        fechaVencimiento: {
          lte: thirtyDaysFromNow,
          gte: new Date()
        }
      }
    });

    const activeAlerts = lowStockCount + expiringCount;

    res.json({
      success: true,
      data: {
        totalMedicines,
        activeAlerts,
        lowStockCount,
        expiringCount
      }
    });
  } catch (error) {
    console.error('Error fetching metrics:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener métricas',
      error: error.message
    });
  }
});

// GET /api/topbar/notifications - Obtener notificaciones
router.get('/notifications', authenticate, async (req, res) => {
  try {
    const notifications = [];

    // Medicamentos próximos a vencer (7 días)
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    const expiringMedicines = await prisma.medicines.findMany({
      where: {
        fechaVencimiento: {
          lte: sevenDaysFromNow,
          gte: new Date()
        }
      },
      take: 5,
      orderBy: {
        fechaVencimiento: 'asc'
      }
    });

    if (expiringMedicines.length > 0) {
      notifications.push({
        id: `expiring-${Date.now()}`,
        type: 'warning',
        icon: '⚠️',
        title: `${expiringMedicines.length} medicamentos por vencer`,
        message: 'Vencen en los próximos 7 días',
        time: 'Ahora',
        read: false,
        link: '/expiry-alerts'
      });
    }

    // Medicamentos con stock bajo
    const lowStockMedicines = await prisma.medicines.findMany({
      where: {
        stock: {
          lte: 10 // Stock mínimo por defecto
        }
      },
      take: 5,
      orderBy: {
        stock: 'asc'
      }
    });

    lowStockMedicines.forEach((med) => {
      notifications.push({
        id: `low-stock-${med.id}`,
        type: 'danger',
        icon: '📉',
        title: `Stock bajo: ${med.nombre}`,
        message: `Solo quedan ${med.stock} unidades`,
        time: 'Hace 1 hora',
        read: false,
        link: `/medicines/${med.id}`
      });
    });

    // Limitar a 10 notificaciones
    const limitedNotifications = notifications.slice(0, 10);

    res.json({
      success: true,
      data: limitedNotifications
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener notificaciones',
      error: error.message
    });
  }
});

// GET /api/topbar/search - Búsqueda global
router.get('/search', authenticate, async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim().length < 2) {
      return res.json({
        success: true,
        data: []
      });
    }

    const searchTerm = q.trim().toLowerCase();
    const results = [];

    // Buscar medicamentos
    const medicines = await prisma.medicines.findMany({
      where: {
        OR: [
          { nombre: { contains: searchTerm, mode: 'insensitive' } },
          { codigo: { contains: searchTerm, mode: 'insensitive' } }
        ]
      },
      take: 5
    });

    medicines.forEach((med) => {
      results.push({
        type: 'medicine',
        icon: '💊',
        title: med.nombre,
        subtitle: `Código: ${med.codigo} | Stock: ${med.stock}`,
        path: `/medicines/${med.id}`
      });
    });

    // Buscar clientes
    const customers = await prisma.customer.findMany({
      where: {
        OR: [
          { nombre: { contains: searchTerm, mode: 'insensitive' } },
          { email: { contains: searchTerm, mode: 'insensitive' } }
        ]
      },
      take: 5
    });

    customers.forEach((customer) => {
      results.push({
        type: 'customer',
        icon: '👤',
        title: customer.nombre,
        subtitle: `Email: ${customer.email || 'N/A'}`,
        path: `/customers/${customer.id}`
      });
    });

    // Buscar ventas (por número de factura)
    if (!isNaN(searchTerm)) {
      const sales = await prisma.sale.findMany({
        where: {
          id: parseInt(searchTerm)
        },
        include: {
          customer: true
        },
        take: 5
      });

      sales.forEach((sale) => {
        results.push({
          type: 'sale',
          icon: '📄',
          title: `Venta #${sale.id}`,
          subtitle: `Cliente: ${sale.customer?.nombre || 'N/A'} | $${sale.total}`,
          path: `/sales/${sale.id}`
        });
      });
    }

    res.json({
      success: true,
      data: results.slice(0, 10) // Limitar a 10 resultados
    });
  } catch (error) {
    console.error('Error searching:', error);
    res.status(500).json({
      success: false,
      message: 'Error en la búsqueda',
      error: error.message
    });
  }
});

// PUT /api/topbar/notifications/:id/read - Marcar notificación como leída
router.put('/notifications/:id/read', authenticate, async (req, res) => {
  try {
    // Por ahora solo retornamos éxito
    // En el futuro se puede implementar una tabla de notificaciones
    res.json({
      success: true,
      message: 'Notificación marcada como leída'
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      message: 'Error al marcar notificación',
      error: error.message
    });
  }
});

export default router;

