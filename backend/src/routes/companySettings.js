import { Router } from 'express';
import { prisma } from '../db.js';

const router = Router();

/**
 * GET /api/company-settings
 * Obtiene la configuración de la empresa
 */
router.get('/', async (req, res) => {
  try {
    // Buscar la configuración (solo debe haber un registro)
    let settings = await prisma.companySettings.findFirst();
    
    // Si no existe, crear una por defecto
    if (!settings) {
      settings = await prisma.companySettings.create({
        data: {
          companyName: 'Mi Empresa',
          invoicePrefix: 'FAC',
          invoiceSequence: 1,
          taxRate: 0
        }
      });
    }
    
    res.json(settings);
  } catch (error) {
    console.error('Error obteniendo configuración de empresa:', error);
    res.status(500).json({ 
      error: 'Error obteniendo configuración de empresa', 
      detail: error.message 
    });
  }
});

/**
 * PUT /api/company-settings
 * Actualiza la configuración de la empresa
 */
router.put('/', async (req, res) => {
  try {
    const {
      companyName,
      rnc,
      address,
      phone,
      email,
      logo,
      invoicePrefix,
      taxRate,
      footerText
    } = req.body;
    
    // Validaciones básicas
    if (companyName && companyName.trim().length === 0) {
      return res.status(400).json({ error: 'El nombre de la empresa es obligatorio' });
    }
    
    if (invoicePrefix && invoicePrefix.trim().length === 0) {
      return res.status(400).json({ error: 'El prefijo de factura es obligatorio' });
    }
    
    if (taxRate !== undefined && (taxRate < 0 || taxRate > 100)) {
      return res.status(400).json({ error: 'La tasa de impuesto debe estar entre 0 y 100' });
    }
    
    // Buscar configuración existente
    const existing = await prisma.companySettings.findFirst();
    
    let settings;
    if (existing) {
      // Actualizar existente
      settings = await prisma.companySettings.update({
        where: { id: existing.id },
        data: {
          ...(companyName !== undefined && { companyName: companyName.trim() }),
          ...(rnc !== undefined && { rnc: rnc?.trim() || null }),
          ...(address !== undefined && { address: address?.trim() || null }),
          ...(phone !== undefined && { phone: phone?.trim() || null }),
          ...(email !== undefined && { email: email?.trim() || null }),
          ...(logo !== undefined && { logo: logo || null }),
          ...(invoicePrefix !== undefined && { invoicePrefix: invoicePrefix.trim().toUpperCase() }),
          ...(taxRate !== undefined && { taxRate }),
          ...(footerText !== undefined && { footerText: footerText?.trim() || null })
        }
      });
    } else {
      // Crear nuevo
      settings = await prisma.companySettings.create({
        data: {
          companyName: companyName?.trim() || 'Mi Empresa',
          rnc: rnc?.trim() || null,
          address: address?.trim() || null,
          phone: phone?.trim() || null,
          email: email?.trim() || null,
          logo: logo || null,
          invoicePrefix: invoicePrefix?.trim().toUpperCase() || 'FAC',
          invoiceSequence: 1,
          taxRate: taxRate || 0,
          footerText: footerText?.trim() || null
        }
      });
    }
    
    res.json(settings);
  } catch (error) {
    console.error('Error actualizando configuración de empresa:', error);
    res.status(500).json({ 
      error: 'Error actualizando configuración de empresa', 
      detail: error.message 
    });
  }
});

/**
 * GET /api/company-settings/next-invoice-number
 * Obtiene el próximo número de factura disponible
 */
router.get('/next-invoice-number', async (req, res) => {
  try {
    const settings = await prisma.companySettings.findFirst();
    
    if (!settings) {
      return res.status(404).json({ error: 'Configuración de empresa no encontrada' });
    }
    
    // Formatear número con ceros a la izquierda (5 dígitos)
    const paddedNumber = String(settings.invoiceSequence).padStart(5, '0');
    const nextNumber = `${settings.invoicePrefix}-${paddedNumber}`;
    
    res.json({ 
      nextNumber,
      prefix: settings.invoicePrefix,
      sequence: settings.invoiceSequence
    });
  } catch (error) {
    console.error('Error obteniendo próximo número de factura:', error);
    res.status(500).json({ 
      error: 'Error obteniendo próximo número de factura', 
      detail: error.message 
    });
  }
});

export default router;

