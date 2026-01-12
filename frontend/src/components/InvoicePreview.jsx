import { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import api from '../api/http';

const InvoicePreview = ({ invoice, onClose, onDownloadPDF }) => {
  const [companySettings, setCompanySettings] = useState(null);
  const [loadingSettings, setLoadingSettings] = useState(true);

  useEffect(() => {
    loadCompanySettings();
  }, []);

  const loadCompanySettings = async () => {
    try {
      const { data } = await api.get('/company');
      setCompanySettings(data);
    } catch (error) {
      console.error('Error cargando datos de la empresa:', error);
      // Usar valores por defecto si falla
      setCompanySettings({
        companyName: 'Inventario Meds',
        rnc: '',
        address: '',
        phone: '(809) 000-0000',
        email: 'info@inventariomeds.com',
        footerText: 'Gracias por su preferencia'
      });
    } finally {
      setLoadingSettings(false);
    }
  };

  if (!invoice) return null;
  if (loadingSettings) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '40px',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <p style={{ margin: 0, fontSize: '16px', color: '#64748b' }}>
            Cargando vista previa...
          </p>
        </div>
      </div>
    );
  }

  const formatCurrency = (value, tipoVenta = 'USD') => {
    const formatted = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
    
    return tipoVenta === 'MN' ? `MN ${formatted}` : `USD ${formatted}`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const generatePDF = () => {
    try {
      console.log('🔵 Iniciando generación de PDF...');
      console.log('📄 Datos de factura:', invoice);
      
      const tipoVenta = invoice.sale?.tipoVenta || 'USD';
      
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      
      // Configuración de colores
      const primaryColor = [59, 130, 246]; // Azul
      const secondaryColor = [100, 116, 139]; // Gris
      
      // ENCABEZADO
      doc.setFillColor(59, 130, 246);
      doc.rect(0, 0, pageWidth, 40, 'F');
      
      // Título
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text('FACTURA', 15, 20);
      
      // Información de la empresa (lado derecho)
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      let yCompany = 15;
      doc.text(companySettings.companyName || 'Mi Empresa', pageWidth - 15, yCompany, { align: 'right' });
      yCompany += 5;
      
      if (companySettings.rnc) {
        doc.text(`RNC: ${companySettings.rnc}`, pageWidth - 15, yCompany, { align: 'right' });
        yCompany += 5;
      }
      if (companySettings.phone) {
        doc.text(`Tel: ${companySettings.phone}`, pageWidth - 15, yCompany, { align: 'right' });
        yCompany += 5;
      }
      if (companySettings.email) {
        doc.text(`Email: ${companySettings.email}`, pageWidth - 15, yCompany, { align: 'right' });
      }
    
    // INFORMACIÓN DE LA FACTURA
    let yPos = 50;
    
    // NCF y Fecha
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('NCF:', 15, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(invoice.ncf, 35, yPos);
    
    doc.setFont('helvetica', 'bold');
    doc.text('Fecha:', pageWidth - 75, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(formatDate(invoice.createdAt), pageWidth - 15, yPos, { align: 'right' });
    
    yPos += 7;
    doc.setFont('helvetica', 'bold');
    doc.text('Factura #:', 15, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(invoice.id.toString(), 35, yPos);
    
    doc.setFont('helvetica', 'bold');
    doc.text('Estado:', pageWidth - 75, yPos);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(invoice.status === 'emitida' ? 22 : 153, invoice.status === 'emitida' ? 163 : 27, invoice.status === 'emitida' ? 74 : 27);
    doc.text(invoice.status === 'emitida' ? 'EMITIDA' : 'ANULADA', pageWidth - 15, yPos, { align: 'right' });
    doc.setTextColor(0, 0, 0);
    
    // INFORMACIÓN DEL CLIENTE
    yPos += 15;
    doc.setFillColor(248, 250, 252);
    doc.rect(15, yPos - 5, pageWidth - 30, 25, 'F');
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('CLIENTE', 20, yPos);
    
    yPos += 7;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Nombre: ${invoice.sale?.customer?.name || 'N/A'}`, 20, yPos);
    
    yPos += 5;
    if (invoice.sale?.customer?.email) {
      doc.text(`Email: ${invoice.sale.customer.email}`, 20, yPos);
      yPos += 5;
    }
    
    doc.text(`Forma de Pago: ${invoice.sale?.paymentMethod || 'efectivo'}`, 20, yPos);
    
    // TABLA DE ITEMS
    yPos += 10;
    
    console.log('📋 Items de la venta:', invoice.sale?.saleitem);
    
    const tableData = invoice.sale?.saleitem?.map(item => {
      const precio = tipoVenta === 'MN' 
        ? (Number(item.precio_venta_mn) || 0)
        : (Number(item.precio_propuesto_usd) || 0);
      const cantidad = Number(item.qty) || 0;
      const subtotal = precio * cantidad;
      
      if (tipoVenta === 'USD') {
        // Para facturas USD, incluir Precio Compra DOP
        const precioCompraDOP = Number(item.precio_compra_dop) || 0;
        return [
          item.medicines?.nombreComercial || 'N/A',
          cantidad.toString(),
          `DOP ${precioCompraDOP.toFixed(2)}`,
          formatCurrency(precio, tipoVenta),
          formatCurrency(subtotal, tipoVenta)
        ];
      } else {
        // Para facturas MN, mantener estructura original
        return [
          item.medicines?.nombreComercial || 'N/A',
          cantidad.toString(),
          formatCurrency(precio, tipoVenta),
          formatCurrency(subtotal, tipoVenta)
        ];
      }
    }) || [];
    
    console.log('📊 Datos de tabla procesados:', tableData);
    
    // Configurar encabezados y columnas según tipo de venta
    const tableHeaders = tipoVenta === 'USD'
      ? [['Medicamento', 'Cantidad', 'Precio Compra DOP', 'Precio Unit.', 'Subtotal']]
      : [['Medicamento', 'Cantidad', 'Precio Unit.', 'Subtotal']];
    
    const columnStyles = tipoVenta === 'USD'
      ? {
          0: { cellWidth: 60 },
          1: { cellWidth: 25, halign: 'center' },
          2: { cellWidth: 35, halign: 'right' },
          3: { cellWidth: 30, halign: 'right' },
          4: { cellWidth: 30, halign: 'right' }
        }
      : {
          0: { cellWidth: 80 },
          1: { cellWidth: 30, halign: 'center' },
          2: { cellWidth: 35, halign: 'right' },
          3: { cellWidth: 35, halign: 'right' }
        };
    
    autoTable(doc, {
      startY: yPos,
      head: tableHeaders,
      body: tableData,
      theme: 'striped',
      headStyles: {
        fillColor: [59, 130, 246],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 10
      },
      bodyStyles: {
        fontSize: 9
      },
      columnStyles: columnStyles,
      margin: { left: 15, right: 15 }
    });
    
    // TOTALES
    yPos = doc.lastAutoTable.finalY + 10;
    const totalsX = pageWidth - 80;
    
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    
    // Subtotal
    doc.setFont('helvetica', 'normal');
    doc.text('Subtotal:', totalsX, yPos);
    doc.text(formatCurrency(Number(invoice.subtotal) || 0, tipoVenta), pageWidth - 15, yPos, { align: 'right' });
    
    // ITBIS
    const itbisValue = Number(invoice.itbis) || 0;
    if (itbisValue > 0) {
      yPos += 6;
      doc.text(`ITBIS (${itbisValue}%):`, totalsX, yPos);
      doc.text(formatCurrency(Number(invoice.itbisAmount) || 0, tipoVenta), pageWidth - 15, yPos, { align: 'right' });
    }
    
    // Descuento
    const discountValue = Number(invoice.discount) || 0;
    if (discountValue > 0) {
      yPos += 6;
      doc.text(`Descuento (${discountValue}%):`, totalsX, yPos);
      doc.setTextColor(239, 68, 68);
      doc.text(`-${formatCurrency(Number(invoice.discountAmount) || 0, tipoVenta)}`, pageWidth - 15, yPos, { align: 'right' });
      doc.setTextColor(0, 0, 0);
    }
    
    // Línea separadora
    yPos += 3;
    doc.setDrawColor(100, 116, 139);
    doc.setLineWidth(0.5);
    doc.line(totalsX, yPos, pageWidth - 15, yPos);
    
    // Total
    yPos += 7;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL:', totalsX, yPos);
    doc.text(formatCurrency(Number(invoice.total) || 0, tipoVenta), pageWidth - 15, yPos, { align: 'right' });
    
    // NOTAS
    if (invoice.notes) {
      yPos += 15;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('NOTAS:', 15, yPos);
      yPos += 5;
      doc.setFont('helvetica', 'normal');
      const splitNotes = doc.splitTextToSize(invoice.notes, pageWidth - 30);
      doc.text(splitNotes, 15, yPos);
    }
    
    // PIE DE PÁGINA
    const footerY = doc.internal.pageSize.getHeight() - 20;
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'italic');
    const footerMessage = companySettings.footerText || 'Gracias por su preferencia';
    doc.text(footerMessage, pageWidth / 2, footerY, { align: 'center' });
    doc.text(`Generado el ${new Date().toLocaleDateString('es-ES')} a las ${new Date().toLocaleTimeString('es-ES')}`, pageWidth / 2, footerY + 4, { align: 'center' });
    
    console.log('✅ PDF generado correctamente');
    
    // Guardar PDF
    const fileName = `Factura_${invoice.ncf}_${invoice.id}.pdf`;
    console.log('💾 Guardando PDF como:', fileName);
    doc.save(fileName);
    
    console.log('🎉 PDF descargado exitosamente');
    alert('✅ PDF descargado correctamente');
    
  } catch (error) {
    console.error('❌ Error generando PDF:', error);
    console.error('Stack:', error.stack);
    alert(`Error al generar PDF: ${error.message}`);
  }
};

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
      padding: '20px',
      overflowY: 'auto'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        maxWidth: '800px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
      }}>
        {/* Header con botones */}
        <div style={{
          padding: '20px',
          borderBottom: '2px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          backgroundColor: 'white',
          zIndex: 10
        }}>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600', color: '#1e293b' }}>
            Vista Previa de Factura
          </h2>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={generatePDF}
              style={{
                padding: '8px 16px',
                backgroundColor: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              📄 Descargar PDF
            </button>
            <button
              onClick={onClose}
              style={{
                padding: '8px 16px',
                backgroundColor: '#64748b',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              ✕ Cerrar
            </button>
          </div>
        </div>

        {/* Contenido de la factura */}
        <div style={{ padding: '40px' }}>
          {/* Encabezado */}
          <div style={{
            backgroundColor: '#3b82f6',
            padding: '20px',
            borderRadius: '8px 8px 0 0',
            marginBottom: '30px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
              <div>
                <h1 style={{ margin: 0, color: 'white', fontSize: '32px', fontWeight: 'bold' }}>
                  FACTURA
                </h1>
              </div>
              <div style={{ textAlign: 'right', color: 'white', fontSize: '12px' }}>
                <div style={{ fontWeight: '600', fontSize: '14px' }}>
                  {companySettings.companyName || 'Mi Empresa'}
                </div>
                {companySettings.rnc && <div>RNC: {companySettings.rnc}</div>}
                {companySettings.phone && <div>Tel: {companySettings.phone}</div>}
                {companySettings.email && <div>Email: {companySettings.email}</div>}
              </div>
            </div>
          </div>

          {/* Información de la factura */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '20px',
            marginBottom: '30px'
          }}>
            <div>
              <div style={{ marginBottom: '8px' }}>
                <span style={{ fontWeight: '600', color: '#475569' }}>NCF:</span>
                <span style={{ marginLeft: '8px', color: '#1e293b' }}>{invoice.ncf}</span>
              </div>
              <div>
                <span style={{ fontWeight: '600', color: '#475569' }}>Factura #:</span>
                <span style={{ marginLeft: '8px', color: '#1e293b' }}>{invoice.id}</span>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ marginBottom: '8px' }}>
                <span style={{ fontWeight: '600', color: '#475569' }}>Fecha:</span>
                <span style={{ marginLeft: '8px', color: '#1e293b' }}>{formatDate(invoice.createdAt)}</span>
              </div>
              <div>
                <span style={{ fontWeight: '600', color: '#475569' }}>Estado:</span>
                <span style={{
                  marginLeft: '8px',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: '500',
                  backgroundColor: invoice.status === 'emitida' ? '#dcfce7' : '#fee2e2',
                  color: invoice.status === 'emitida' ? '#166534' : '#991b1b'
                }}>
                  {invoice.status === 'emitida' ? '✅ EMITIDA' : '❌ ANULADA'}
                </span>
              </div>
            </div>
          </div>

          {/* Información del cliente */}
          <div style={{
            backgroundColor: '#f8fafc',
            padding: '20px',
            borderRadius: '8px',
            marginBottom: '30px'
          }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '600', color: '#1e293b' }}>
              CLIENTE
            </h3>
            <div style={{ fontSize: '14px', color: '#475569', lineHeight: '1.6' }}>
              <div><strong>Nombre:</strong> {invoice.sale?.customer?.name || 'N/A'}</div>
              {invoice.sale?.customer?.email && (
                <div><strong>Email:</strong> {invoice.sale.customer.email}</div>
              )}
              <div><strong>Forma de Pago:</strong> {invoice.sale?.paymentMethod || 'efectivo'}</div>
            </div>
          </div>

          {/* Tabla de items */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '30px' }}>
            <thead>
              <tr style={{ backgroundColor: '#3b82f6', color: 'white' }}>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600' }}>
                  Medicamento
                </th>
                <th style={{ padding: '12px', textAlign: 'center', fontSize: '12px', fontWeight: '600' }}>
                  Cantidad
                </th>
                {(invoice.sale?.tipoVenta || 'USD') === 'USD' && (
                  <th style={{ padding: '12px', textAlign: 'right', fontSize: '12px', fontWeight: '600' }}>
                    Precio Compra DOP
                  </th>
                )}
                <th style={{ padding: '12px', textAlign: 'right', fontSize: '12px', fontWeight: '600' }}>
                  Precio Unit.
                </th>
                <th style={{ padding: '12px', textAlign: 'right', fontSize: '12px', fontWeight: '600' }}>
                  Subtotal
                </th>
              </tr>
            </thead>
            <tbody>
              {invoice.sale?.saleitem?.map((item, index) => {
                const tipoVenta = invoice.sale?.tipoVenta || 'USD';
                const precio = tipoVenta === 'MN' 
                  ? (item.precio_venta_mn || 0)
                  : (item.precio_propuesto_usd || 0);
                const precioCompraDOP = Number(item.precio_compra_dop) || 0;
                return (
                  <tr key={index} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '12px', fontSize: '14px', color: '#1e293b' }}>
                      {item.medicines?.nombreComercial || 'N/A'}
                    </td>
                    <td style={{ padding: '12px', fontSize: '14px', color: '#475569', textAlign: 'center' }}>
                      {item.qty}
                    </td>
                    {tipoVenta === 'USD' && (
                      <td style={{ padding: '12px', fontSize: '14px', color: '#dc3545', textAlign: 'right', fontWeight: '500' }}>
                        DOP {precioCompraDOP.toFixed(2)}
                      </td>
                    )}
                    <td style={{ padding: '12px', fontSize: '14px', color: '#475569', textAlign: 'right' }}>
                      {formatCurrency(precio, tipoVenta)}
                    </td>
                    <td style={{ padding: '12px', fontSize: '14px', color: '#1e293b', fontWeight: '600', textAlign: 'right' }}>
                      {formatCurrency(precio * item.qty, tipoVenta)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Totales */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '30px' }}>
            <div style={{ minWidth: '300px' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '8px 0',
                fontSize: '14px',
                color: '#475569'
              }}>
                <span>Subtotal:</span>
                <span>{formatCurrency(invoice.subtotal, invoice.sale?.tipoVenta || 'USD')}</span>
              </div>
              
              {invoice.itbis > 0 && (
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '8px 0',
                  fontSize: '14px',
                  color: '#475569'
                }}>
                  <span>ITBIS ({invoice.itbis}%):</span>
                  <span>{formatCurrency(invoice.itbisAmount, invoice.sale?.tipoVenta || 'USD')}</span>
                </div>
              )}
              
              {invoice.discount > 0 && (
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '8px 0',
                  fontSize: '14px',
                  color: '#ef4444'
                }}>
                  <span>Descuento ({invoice.discount}%):</span>
                  <span>-{formatCurrency(invoice.discountAmount, invoice.sale?.tipoVenta || 'USD')}</span>
                </div>
              )}
              
              <div style={{
                borderTop: '2px solid #cbd5e1',
                marginTop: '8px',
                paddingTop: '12px',
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '18px',
                fontWeight: '700',
                color: '#1e293b'
              }}>
                <span>TOTAL:</span>
                <span>{formatCurrency(invoice.total, invoice.sale?.tipoVenta || 'USD')}</span>
              </div>
            </div>
          </div>

          {/* Notas */}
          {invoice.notes && (
            <div style={{
              backgroundColor: '#fef3c7',
              border: '1px solid #fbbf24',
              padding: '16px',
              borderRadius: '6px'
            }}>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600', color: '#92400e' }}>
                NOTAS:
              </h4>
              <p style={{ margin: 0, fontSize: '13px', color: '#78350f', lineHeight: '1.5' }}>
                {invoice.notes}
              </p>
            </div>
          )}

          {/* Pie de página */}
          <div style={{
            marginTop: '40px',
            paddingTop: '20px',
            borderTop: '1px solid #e2e8f0',
            textAlign: 'center',
            fontSize: '12px',
            color: '#64748b'
          }}>
            <p style={{ margin: '0 0 4px 0', fontStyle: 'italic' }}>
              {companySettings.footerText || 'Gracias por su preferencia'}
            </p>
            <p style={{ margin: 0 }}>
              Generado el {new Date().toLocaleDateString('es-ES')} a las {new Date().toLocaleTimeString('es-ES')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoicePreview;

