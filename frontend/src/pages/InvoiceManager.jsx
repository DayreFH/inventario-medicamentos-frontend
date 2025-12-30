import { useState, useEffect } from 'react';
import api from '../api/http';
import { DARK_HEADER } from '../styles/standardLayout';
import InvoicePreview from '../components/InvoicePreview';
import InvoiceReports from '../components/InvoiceReports';

const InvoiceManager = () => {
  // Estados para pestañas
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'emitted' | 'reports'
  
  // Estados para ventas pendientes
  const [pendingSales, setPendingSales] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  
  // Estados para facturas emitidas
  const [emittedInvoices, setEmittedInvoices] = useState([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  
  // Estados para anular factura
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  
  // Estados para vista previa de factura
  const [showPreview, setShowPreview] = useState(false);
  const [previewInvoice, setPreviewInvoice] = useState(null);
  const [showPreviewBeforeCreate, setShowPreviewBeforeCreate] = useState(false);
  
  // Estados para el formulario de factura
  const [invoiceData, setInvoiceData] = useState({
    ncf: '',
    itbis: 0,
    discount: 0,
    notes: ''
  });
  
  // Estados para NCF automático
  const [ncfConfig, setNcfConfig] = useState(null);
  const [loadingNCF, setLoadingNCF] = useState(false);
  const [ncfWarning, setNcfWarning] = useState(null);

  useEffect(() => {
    if (activeTab === 'pending') {
      loadPendingSales();
    } else if (activeTab === 'emitted') {
      loadEmittedInvoices();
    }
    // La pestaña 'reports' carga sus propios datos internamente
  }, [activeTab]);

  const loadPendingSales = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/invoices/pending-sales');
      setPendingSales(data);
    } catch (error) {
      console.error('Error cargando ventas pendientes:', error);
      alert('Error al cargar ventas pendientes');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSale = async (sale) => {
    const tipoVenta = sale.tipoVenta || 'USD';
    const total = calculateSaleTotal(sale);
    const confirmMessage = `¿Está seguro de eliminar la venta #${sale.id}?\n\n` +
      `Cliente: ${sale.customer?.name || 'N/A'}\n` +
      `Fecha: ${formatDate(sale.date)}\n` +
      `Total: ${formatCurrencyByType(total, tipoVenta)}\n` +
      `Items: ${sale.items.length}\n\n` +
      `⚠️ Esta acción revertirá el stock de los medicamentos y no se puede deshacer.`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      setLoading(true);
      await api.delete(`/sales/${sale.id}`);
      alert('✅ Venta eliminada exitosamente. El stock ha sido revertido.');
      loadPendingSales();
    } catch (error) {
      console.error('Error eliminando venta:', error);
      const errorMsg = error.response?.data?.detail || error.response?.data?.error || error.message;
      alert(`❌ Error al eliminar venta:\n\n${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const loadEmittedInvoices = async () => {
    setLoadingInvoices(true);
    try {
      const { data } = await api.get('/invoices');
      setEmittedInvoices(data);
    } catch (error) {
      console.error('Error cargando facturas emitidas:', error);
      alert('Error al cargar facturas emitidas');
    } finally {
      setLoadingInvoices(false);
    }
  };

  const loadNextNCF = async () => {
    setLoadingNCF(true);
    setNcfWarning(null);
    try {
      const { data } = await api.get('/company-settings/next-ncf');
      setNcfConfig(data);
      
      if (data.autoGenerate && data.nextNCF) {
        // Autocompletar el NCF
        setInvoiceData(prev => ({
          ...prev,
          ncf: data.nextNCF
        }));
        
        // Mostrar advertencia si existe
        if (data.warning) {
          setNcfWarning(data.warning);
        }
      }
    } catch (error) {
      console.error('Error cargando configuración de NCF:', error);
      // No mostrar alerta, solo log. El usuario puede ingresar NCF manualmente
    } finally {
      setLoadingNCF(false);
    }
  };

  const handleSelectSale = async (sale) => {
    setSelectedSale(sale);
    setShowInvoiceForm(true);
    setInvoiceData({
      ncf: '',
      itbis: 0,
      discount: 0,
      notes: ''
    });
    
    // Cargar próximo NCF automáticamente
    await loadNextNCF();
  };

  const handleCreateInvoice = async () => {
    if (!selectedSale) return;

    if (!invoiceData.ncf.trim()) {
      alert('Debe ingresar un NCF');
      return;
    }

    try {
      setLoading(true);
      await api.post('/invoices', {
        saleId: selectedSale.id,
        ncf: invoiceData.ncf,
        itbis: parseFloat(invoiceData.itbis) || 0,
        discount: parseFloat(invoiceData.discount) || 0,
        notes: invoiceData.notes
      });

      alert('Factura creada exitosamente');
      setShowInvoiceForm(false);
      setSelectedSale(null);
      loadPendingSales();
    } catch (error) {
      console.error('Error creando factura:', error);
      alert(`Error al crear factura: ${error.response?.data?.detail || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelInvoice = (invoice) => {
    setSelectedInvoice(invoice);
    setCancelReason('');
    setShowCancelModal(true);
  };

  const confirmCancelInvoice = async () => {
    if (!selectedInvoice) return;

    if (!cancelReason.trim()) {
      alert('Debe ingresar un motivo de anulación');
      return;
    }

    try {
      setLoadingInvoices(true);
      await api.put(`/invoices/${selectedInvoice.id}/cancel`, {
        reason: cancelReason
      });

      alert('Factura anulada exitosamente');
      setShowCancelModal(false);
      setSelectedInvoice(null);
      setCancelReason('');
      loadEmittedInvoices();
    } catch (error) {
      console.error('Error anulando factura:', error);
      alert(`Error al anular factura: ${error.response?.data?.detail || error.message}`);
    } finally {
      setLoadingInvoices(false);
    }
  };

  const handleViewInvoice = async (invoice) => {
    try {
      setLoadingInvoices(true);
      const { data } = await api.get(`/invoices/${invoice.id}`);
      setPreviewInvoice(data);
      setShowPreview(true);
    } catch (error) {
      console.error('Error cargando factura:', error);
      alert('Error al cargar los detalles de la factura');
    } finally {
      setLoadingInvoices(false);
    }
  };

  const handlePreviewBeforeCreate = () => {
    if (!selectedSale) return;
    if (!invoiceData.ncf.trim()) {
      alert('Debe ingresar un NCF para ver la vista previa');
      return;
    }

    // Crear objeto de factura temporal para vista previa
    const subtotal = calculateSubtotal();
    const itbisAmount = calculateITBIS();
    const discountAmount = calculateDiscount();
    const total = calculateTotal();

    const tempInvoice = {
      id: 'PREVIEW',
      ncf: invoiceData.ncf,
      subtotal: subtotal,
      itbis: parseFloat(invoiceData.itbis) || 0,
      itbisAmount: itbisAmount,
      discount: parseFloat(invoiceData.discount) || 0,
      discountAmount: discountAmount,
      total: total,
      notes: invoiceData.notes,
      status: 'emitida',
      createdAt: new Date().toISOString(),
      sale: {
        ...selectedSale,
        tipoVenta: selectedSale.tipoVenta || 'USD',
        saleitem: selectedSale.items.map(item => ({
          ...item,
          medicines: item.medicine,
          qty: item.qty,
          precio_venta_mn: item.precio_venta_mn,
          precio_propuesto_usd: item.precio_propuesto_usd
        }))
      }
    };

    setPreviewInvoice(tempInvoice);
    setShowPreviewBeforeCreate(true);
  };

  const calculateSubtotal = () => {
    if (!selectedSale) return 0;
    return calculateSaleTotal(selectedSale);
  };

  const calculateITBIS = () => {
    const subtotal = calculateSubtotal();
    return subtotal * (parseFloat(invoiceData.itbis) / 100);
  };

  const calculateDiscount = () => {
    const subtotal = calculateSubtotal();
    return subtotal * (parseFloat(invoiceData.discount) / 100);
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const itbis = calculateITBIS();
    const discount = calculateDiscount();
    return subtotal + itbis - discount;
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value);
  };

  // Calcular total de una venta según su tipo (MN o USD)
  const calculateSaleTotal = (sale) => {
    if (!sale || !sale.items) return 0;
    
    const tipoVenta = sale.tipoVenta || 'USD';
    
    if (tipoVenta === 'MN') {
      // Para ventas MN: usar precio_venta_mn
      return sale.items.reduce((sum, item) => {
        const precio = parseFloat(item.precio_venta_mn) || 0;
        const qty = parseInt(item.qty) || 0;
        return sum + (precio * qty);
      }, 0);
    } else {
      // Para ventas USD: usar precio_propuesto_usd
      return sale.items.reduce((sum, item) => {
        const precio = parseFloat(item.precio_propuesto_usd) || 0;
        const qty = parseInt(item.qty) || 0;
        return sum + (precio * qty);
      }, 0);
    }
  };

  // Formatear moneda según tipo de venta
  const formatCurrencyByType = (amount, tipoVenta = 'USD') => {
    const formatted = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
    
    return tipoVenta === 'MN' ? `MN ${formatted}` : `USD ${formatted}`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={DARK_HEADER}>
        <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '600' }}>
          Operaciones · Facturación
        </h1>
      </div>

      {/* Pestañas */}
      {!showInvoiceForm && (
        <div style={{ 
          display: 'flex', 
          gap: '8px', 
          marginTop: '24px',
          borderBottom: '2px solid #e2e8f0'
        }}>
          <button
            onClick={() => setActiveTab('pending')}
            style={{
              padding: '12px 24px',
              backgroundColor: activeTab === 'pending' ? '#3b82f6' : 'transparent',
              color: activeTab === 'pending' ? 'white' : '#64748b',
              border: 'none',
              borderBottom: activeTab === 'pending' ? '3px solid #3b82f6' : '3px solid transparent',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              transition: 'all 0.2s'
            }}
          >
            📋 Ventas Pendientes
          </button>
          <button
            onClick={() => setActiveTab('emitted')}
            style={{
              padding: '12px 24px',
              backgroundColor: activeTab === 'emitted' ? '#3b82f6' : 'transparent',
              color: activeTab === 'emitted' ? 'white' : '#64748b',
              border: 'none',
              borderBottom: activeTab === 'emitted' ? '3px solid #3b82f6' : '3px solid transparent',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              transition: 'all 0.2s'
            }}
          >
            🧾 Facturas Emitidas
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            style={{
              padding: '12px 24px',
              backgroundColor: activeTab === 'reports' ? '#3b82f6' : 'transparent',
              color: activeTab === 'reports' ? 'white' : '#64748b',
              border: 'none',
              borderBottom: activeTab === 'reports' ? '3px solid #3b82f6' : '3px solid transparent',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              transition: 'all 0.2s'
            }}
          >
            📊 Reportes
          </button>
        </div>
      )}

      {/* Contenido Principal */}
      <div style={{ marginTop: '24px' }}>
        {!showInvoiceForm ? (
          activeTab === 'pending' ? (
            // PESTAÑA: Ventas Pendientes
            <div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px'
              }}>
                <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#1e293b' }}>
                  Ventas Pendientes de Facturar
                </h2>
                <button
                  onClick={loadPendingSales}
                  disabled={loading}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.6 : 1
                  }}
                >
                  🔄 Actualizar
                </button>
              </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                Cargando ventas...
              </div>
            ) : pendingSales.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '40px',
                backgroundColor: 'white',
                borderRadius: '8px',
                border: '1px solid #e2e8f0'
              }}>
                <p style={{ fontSize: '16px', color: '#64748b', margin: 0 }}>
                  ✅ No hay ventas pendientes de facturar
                </p>
              </div>
            ) : (
              <div style={{
                backgroundColor: 'white',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                overflow: 'hidden'
              }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                      <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#475569' }}>
                        ID
                      </th>
                      <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#475569' }}>
                        Fecha
                      </th>
                      <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#475569' }}>
                        Cliente
                      </th>
                      <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#475569' }}>
                        Forma de Pago
                      </th>
                      <th style={{ padding: '12px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: '#475569' }}>
                        Moneda
                      </th>
                      <th style={{ padding: '12px', textAlign: 'right', fontSize: '12px', fontWeight: '600', color: '#475569' }}>
                        Items
                      </th>
                      <th style={{ padding: '12px', textAlign: 'right', fontSize: '12px', fontWeight: '600', color: '#475569' }}>
                        Total
                      </th>
                      <th style={{ padding: '12px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: '#475569' }}>
                        Acción
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingSales.map((sale) => {
                      const tipoVenta = sale.tipoVenta || 'USD';
                      const total = calculateSaleTotal(sale);
                      return (
                        <tr key={sale.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                          <td style={{ padding: '12px', fontSize: '14px', color: '#1e293b' }}>
                            #{sale.id}
                            <span style={{
                              marginLeft: '8px',
                              padding: '2px 6px',
                              backgroundColor: tipoVenta === 'MN' ? '#10b981' : '#3b82f6',
                              color: 'white',
                              borderRadius: '4px',
                              fontSize: '10px',
                              fontWeight: '600'
                            }}>
                              {tipoVenta}
                            </span>
                          </td>
                          <td style={{ padding: '12px', fontSize: '14px', color: '#475569' }}>
                            {formatDate(sale.date)}
                          </td>
                          <td style={{ padding: '12px', fontSize: '14px', color: '#1e293b' }}>
                            {sale.customer?.name || 'N/A'}
                          </td>
                          <td style={{ padding: '12px', fontSize: '14px', color: '#475569' }}>
                            {sale.paymentMethod || 'efectivo'}
                          </td>
                          <td style={{ padding: '12px', fontSize: '14px', color: '#475569', textAlign: 'center' }}>
                            <span style={{
                              padding: '4px 8px',
                              backgroundColor: tipoVenta === 'MN' ? '#d1fae5' : '#dbeafe',
                              color: tipoVenta === 'MN' ? '#065f46' : '#1e40af',
                              borderRadius: '4px',
                              fontSize: '12px',
                              fontWeight: '600'
                            }}>
                              {tipoVenta}
                            </span>
                          </td>
                          <td style={{ padding: '12px', fontSize: '14px', color: '#475569', textAlign: 'right' }}>
                            {sale.items.length}
                          </td>
                          <td style={{ padding: '12px', fontSize: '14px', color: '#1e293b', fontWeight: '600', textAlign: 'right' }}>
                            {formatCurrencyByType(total, tipoVenta)}
                          </td>
                          <td style={{ padding: '12px', textAlign: 'center' }}>
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                              <button
                                onClick={() => handleSelectSale(sale)}
                                style={{
                                  padding: '6px 12px',
                                  backgroundColor: '#10b981',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '4px',
                                  fontSize: '12px',
                                  cursor: 'pointer',
                                  fontWeight: '500'
                                }}
                              >
                                🧾 Facturar
                              </button>
                              <button
                                onClick={() => handleDeleteSale(sale)}
                                disabled={loading}
                                style={{
                                  padding: '6px 12px',
                                  backgroundColor: loading ? '#9ca3af' : '#ef4444',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '4px',
                                  fontSize: '12px',
                                  cursor: loading ? 'not-allowed' : 'pointer',
                                  fontWeight: '500',
                                  opacity: loading ? 0.6 : 1
                                }}
                                title="Eliminar venta y revertir stock"
                              >
                                🗑️ Eliminar
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            </div>
          ) : activeTab === 'emitted' ? (
            // PESTAÑA: Facturas Emitidas
            <div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px'
              }}>
                <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#1e293b' }}>
                  Facturas Emitidas
                </h2>
                <button
                  onClick={loadEmittedInvoices}
                  disabled={loadingInvoices}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    cursor: loadingInvoices ? 'not-allowed' : 'pointer',
                    opacity: loadingInvoices ? 0.6 : 1
                  }}
                >
                  🔄 Actualizar
                </button>
              </div>

              {loadingInvoices ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                  Cargando facturas...
                </div>
              ) : emittedInvoices.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '40px',
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0'
                }}>
                  <p style={{ fontSize: '16px', color: '#64748b', margin: 0 }}>
                    📄 No hay facturas emitidas
                  </p>
                </div>
              ) : (
                <div style={{
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  overflow: 'hidden'
                }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                        <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#475569' }}>
                          ID
                        </th>
                        <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#475569' }}>
                          NCF
                        </th>
                        <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#475569' }}>
                          Fecha
                        </th>
                        <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#475569' }}>
                          Cliente
                        </th>
                        <th style={{ padding: '12px', textAlign: 'right', fontSize: '12px', fontWeight: '600', color: '#475569' }}>
                          Subtotal
                        </th>
                        <th style={{ padding: '12px', textAlign: 'right', fontSize: '12px', fontWeight: '600', color: '#475569' }}>
                          ITBIS
                        </th>
                        <th style={{ padding: '12px', textAlign: 'right', fontSize: '12px', fontWeight: '600', color: '#475569' }}>
                          Descuento
                        </th>
                        <th style={{ padding: '12px', textAlign: 'right', fontSize: '12px', fontWeight: '600', color: '#475569' }}>
                          Total
                        </th>
                        <th style={{ padding: '12px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: '#475569' }}>
                          Estado
                        </th>
                        <th style={{ padding: '12px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: '#475569' }}>
                          Acción
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {emittedInvoices.map((invoice) => {
                        const isVoid = invoice.status === 'anulada';
                        return (
                          <tr key={invoice.id} style={{ 
                            borderBottom: '1px solid #e2e8f0',
                            backgroundColor: isVoid ? '#fef2f2' : 'white',
                            opacity: isVoid ? 0.7 : 1
                          }}>
                            <td style={{ padding: '12px', fontSize: '14px', color: '#1e293b' }}>
                              #{invoice.id}
                            </td>
                            <td style={{ padding: '12px', fontSize: '14px', color: '#1e293b', fontWeight: '500' }}>
                              {invoice.ncf}
                            </td>
                            <td style={{ padding: '12px', fontSize: '14px', color: '#475569' }}>
                              {formatDate(invoice.createdAt)}
                            </td>
                            <td style={{ padding: '12px', fontSize: '14px', color: '#1e293b' }}>
                              {invoice.sale?.customer?.name || 'N/A'}
                            </td>
                            <td style={{ padding: '12px', fontSize: '14px', color: '#475569', textAlign: 'right' }}>
                              {formatCurrency(invoice.subtotal)}
                            </td>
                            <td style={{ padding: '12px', fontSize: '14px', color: '#475569', textAlign: 'right' }}>
                              {invoice.itbis}% ({formatCurrency(invoice.itbisAmount)})
                            </td>
                            <td style={{ padding: '12px', fontSize: '14px', color: '#475569', textAlign: 'right' }}>
                              {invoice.discount}% ({formatCurrency(invoice.discountAmount)})
                            </td>
                            <td style={{ padding: '12px', fontSize: '14px', color: '#1e293b', fontWeight: '600', textAlign: 'right' }}>
                              {formatCurrency(invoice.total)}
                            </td>
                            <td style={{ padding: '12px', textAlign: 'center' }}>
                              <span style={{
                                padding: '4px 8px',
                                borderRadius: '4px',
                                fontSize: '12px',
                                fontWeight: '500',
                                backgroundColor: isVoid ? '#fee2e2' : '#dcfce7',
                                color: isVoid ? '#991b1b' : '#166534'
                              }}>
                                {isVoid ? '❌ Anulada' : '✅ Emitida'}
                              </span>
                            </td>
                            <td style={{ padding: '12px', textAlign: 'center' }}>
                              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                <button
                                  onClick={() => handleViewInvoice(invoice)}
                                  style={{
                                    padding: '6px 12px',
                                    backgroundColor: '#3b82f6',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    fontSize: '12px',
                                    cursor: 'pointer',
                                    fontWeight: '500'
                                  }}
                                >
                                  👁️ Ver Detalle
                                </button>
                                {!isVoid && (
                                  <button
                                    onClick={() => handleCancelInvoice(invoice)}
                                    style={{
                                      padding: '6px 12px',
                                      backgroundColor: '#ef4444',
                                      color: 'white',
                                      border: 'none',
                                      borderRadius: '4px',
                                      fontSize: '12px',
                                      cursor: 'pointer',
                                      fontWeight: '500'
                                    }}
                                  >
                                    ❌ Anular
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            // PESTAÑA: Reportes
            <InvoiceReports />
          )
        ) : (
          // Formulario de factura
          <div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px'
            }}>
              <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#1e293b' }}>
                Crear Factura para Venta #{selectedSale.id}
              </h2>
              <button
                onClick={() => {
                  setShowInvoiceForm(false);
                  setSelectedSale(null);
                }}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#64748b',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                ← Volver
              </button>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '24px'
            }}>
              {/* Columna izquierda: Detalles de la venta */}
              <div style={{
                backgroundColor: 'white',
                padding: '20px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0'
              }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b', marginBottom: '16px' }}>
                  Detalles de la Venta
                </h3>
                
                <div style={{ marginBottom: '12px' }}>
                  <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '500' }}>Cliente:</span>
                  <p style={{ fontSize: '14px', color: '#1e293b', margin: '4px 0' }}>
                    {selectedSale.customer?.name || 'N/A'}
                  </p>
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '500' }}>Fecha:</span>
                  <p style={{ fontSize: '14px', color: '#1e293b', margin: '4px 0' }}>
                    {formatDate(selectedSale.date)}
                  </p>
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '500' }}>Forma de Pago:</span>
                  <p style={{ fontSize: '14px', color: '#1e293b', margin: '4px 0' }}>
                    {selectedSale.paymentMethod || 'efectivo'}
                  </p>
                </div>

                <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b', marginTop: '20px', marginBottom: '12px' }}>
                  Items:
                </h4>
                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  {selectedSale.items.map((item, idx) => (
                    <div key={idx} style={{
                      padding: '8px',
                      backgroundColor: '#f8fafc',
                      borderRadius: '4px',
                      marginBottom: '8px',
                      display: 'flex',
                      justifyContent: 'space-between'
                    }}>
                      <div>
                        <p style={{ fontSize: '13px', color: '#1e293b', margin: '0 0 4px 0', fontWeight: '500' }}>
                          {item.medicine?.nombreComercial || 'N/A'}
                        </p>
                        <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
                          Cantidad: {item.qty} × {formatCurrency(item.precio_propuesto_usd)}
                        </p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: '14px', color: '#1e293b', margin: 0, fontWeight: '600' }}>
                          {formatCurrency(item.precio_propuesto_usd * item.qty)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Columna derecha: Formulario de factura */}
              <div style={{
                backgroundColor: 'white',
                padding: '20px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0'
              }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b', marginBottom: '16px' }}>
                  Datos de la Factura
                </h3>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: '#475569', marginBottom: '6px' }}>
                    NCF (Número de Comprobante Fiscal) *
                    {ncfConfig?.autoGenerate && (
                      <span style={{ 
                        marginLeft: '8px', 
                        fontSize: '11px', 
                        color: '#10b981', 
                        fontWeight: '600',
                        backgroundColor: '#dcfce7',
                        padding: '2px 8px',
                        borderRadius: '4px'
                      }}>
                        🤖 AUTOMÁTICO
                      </span>
                    )}
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      value={invoiceData.ncf}
                      onChange={(e) => setInvoiceData({ ...invoiceData, ncf: e.target.value.toUpperCase() })}
                      placeholder={ncfConfig?.autoGenerate ? "Generado automáticamente..." : "Ej: B0100000001"}
                      disabled={loadingNCF}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: `1px solid ${ncfConfig?.autoGenerate ? '#10b981' : '#cbd5e1'}`,
                        borderRadius: '6px',
                        fontSize: '14px',
                        boxSizing: 'border-box',
                        backgroundColor: ncfConfig?.autoGenerate ? '#f0fdf4' : 'white',
                        fontFamily: 'monospace',
                        fontWeight: ncfConfig?.autoGenerate ? '600' : 'normal'
                      }}
                    />
                    {loadingNCF && (
                      <div style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        fontSize: '12px',
                        color: '#64748b'
                      }}>
                        ⏳
                      </div>
                    )}
                  </div>
                  {ncfWarning && (
                    <div style={{
                      marginTop: '8px',
                      padding: '8px 12px',
                      backgroundColor: '#fef3c7',
                      border: '1px solid #fbbf24',
                      borderRadius: '4px',
                      fontSize: '12px',
                      color: '#92400e'
                    }}>
                      {ncfWarning}
                    </div>
                  )}
                  {ncfConfig?.autoGenerate && (
                    <p style={{ fontSize: '11px', color: '#64748b', margin: '6px 0 0 0' }}>
                      💡 NCF generado automáticamente. Tipo: <strong>{ncfConfig.ncfType}</strong>
                      {ncfConfig.rangeStart && ncfConfig.rangeEnd && (
                        <span> | Rango: {ncfConfig.rangeStart} - {ncfConfig.rangeEnd}</span>
                      )}
                    </p>
                  )}
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: '#475569', marginBottom: '6px' }}>
                    ITBIS (%) - Opcional
                  </label>
                  <input
                    type="number"
                    value={invoiceData.itbis}
                    onChange={(e) => setInvoiceData({ ...invoiceData, itbis: e.target.value })}
                    placeholder="0"
                    min="0"
                    max="100"
                    step="0.01"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #cbd5e1',
                      borderRadius: '6px',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: '#475569', marginBottom: '6px' }}>
                    Descuento (%) - Opcional
                  </label>
                  <input
                    type="number"
                    value={invoiceData.discount}
                    onChange={(e) => setInvoiceData({ ...invoiceData, discount: e.target.value })}
                    placeholder="0"
                    min="0"
                    max="100"
                    step="0.01"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #cbd5e1',
                      borderRadius: '6px',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: '#475569', marginBottom: '6px' }}>
                    Notas - Opcional
                  </label>
                  <textarea
                    value={invoiceData.notes}
                    onChange={(e) => setInvoiceData({ ...invoiceData, notes: e.target.value })}
                    placeholder="Notas adicionales..."
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #cbd5e1',
                      borderRadius: '6px',
                      fontSize: '14px',
                      resize: 'vertical',
                      boxSizing: 'border-box',
                      fontFamily: 'inherit'
                    }}
                  />
                </div>

                {/* Resumen de totales */}
                <div style={{
                  backgroundColor: '#f8fafc',
                  padding: '16px',
                  borderRadius: '6px',
                  marginBottom: '20px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '14px', color: '#64748b' }}>Subtotal:</span>
                    <span style={{ fontSize: '14px', color: '#1e293b', fontWeight: '500' }}>
                      {formatCurrencyByType(calculateSubtotal(), selectedSale?.tipoVenta || 'USD')}
                    </span>
                  </div>
                  
                  {parseFloat(invoiceData.itbis) > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '14px', color: '#64748b' }}>
                        ITBIS ({invoiceData.itbis}%):
                      </span>
                      <span style={{ fontSize: '14px', color: '#10b981', fontWeight: '500' }}>
                        + {formatCurrencyByType(calculateITBIS(), selectedSale?.tipoVenta || 'USD')}
                      </span>
                    </div>
                  )}
                  
                  {parseFloat(invoiceData.discount) > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '14px', color: '#64748b' }}>
                        Descuento ({invoiceData.discount}%):
                      </span>
                      <span style={{ fontSize: '14px', color: '#ef4444', fontWeight: '500' }}>
                        - {formatCurrencyByType(calculateDiscount(), selectedSale?.tipoVenta || 'USD')}
                      </span>
                    </div>
                  )}
                  
                  <div style={{
                    borderTop: '2px solid #cbd5e1',
                    paddingTop: '8px',
                    marginTop: '8px',
                    display: 'flex',
                    justifyContent: 'space-between'
                  }}>
                    <span style={{ fontSize: '16px', color: '#1e293b', fontWeight: '600' }}>Total:</span>
                    <span style={{ fontSize: '18px', color: '#1e293b', fontWeight: '700' }}>
                      {formatCurrencyByType(calculateTotal(), selectedSale?.tipoVenta || 'USD')}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    onClick={handlePreviewBeforeCreate}
                    disabled={loading || !invoiceData.ncf.trim()}
                    style={{
                      flex: 1,
                      padding: '12px',
                      backgroundColor: !invoiceData.ncf.trim() ? '#cbd5e1' : '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '16px',
                      fontWeight: '600',
                      cursor: !invoiceData.ncf.trim() ? 'not-allowed' : 'pointer'
                    }}
                  >
                    👁️ Vista Previa
                  </button>
                  <button
                    onClick={handleCreateInvoice}
                    disabled={loading || !invoiceData.ncf.trim()}
                    style={{
                      flex: 1,
                      padding: '12px',
                      backgroundColor: !invoiceData.ncf.trim() ? '#cbd5e1' : '#10b981',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '16px',
                      fontWeight: '600',
                      cursor: !invoiceData.ncf.trim() ? 'not-allowed' : 'pointer',
                      opacity: loading ? 0.6 : 1
                    }}
                  >
                    {loading ? 'Creando...' : '✅ Crear Factura'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Anulación */}
      {showCancelModal && (
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
            borderRadius: '8px',
            padding: '24px',
            maxWidth: '500px',
            width: '90%',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1e293b', marginBottom: '16px' }}>
              ⚠️ Anular Factura
            </h3>

            <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#fef2f2', borderRadius: '6px', border: '1px solid #fecaca' }}>
              <p style={{ fontSize: '14px', color: '#991b1b', margin: 0 }}>
                <strong>Factura #{selectedInvoice?.id}</strong><br />
                NCF: {selectedInvoice?.ncf}<br />
                Total: {formatCurrency(selectedInvoice?.total || 0)}
              </p>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#475569', marginBottom: '8px' }}>
                Motivo de Anulación *
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Ingrese el motivo por el cual se anula esta factura..."
                rows={4}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  fontSize: '14px',
                  resize: 'vertical',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  setSelectedInvoice(null);
                  setCancelReason('');
                }}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#e2e8f0',
                  color: '#475569',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Cancelar
              </button>
              <button
                onClick={confirmCancelInvoice}
                disabled={!cancelReason.trim() || loadingInvoices}
                style={{
                  padding: '10px 20px',
                  backgroundColor: !cancelReason.trim() ? '#cbd5e1' : '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: !cancelReason.trim() ? 'not-allowed' : 'pointer',
                  opacity: loadingInvoices ? 0.6 : 1
                }}
              >
                {loadingInvoices ? 'Anulando...' : '✅ Confirmar Anulación'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Vista Previa de Factura (después de crear) */}
      {showPreview && previewInvoice && (
        <InvoicePreview
          invoice={previewInvoice}
          onClose={() => {
            setShowPreview(false);
            setPreviewInvoice(null);
          }}
        />
      )}

      {/* Vista Previa ANTES de Crear */}
      {showPreviewBeforeCreate && previewInvoice && (
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
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            position: 'relative'
          }}>
            {/* Marca de agua VISTA PREVIA */}
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%) rotate(-45deg)',
              fontSize: '120px',
              fontWeight: 'bold',
              color: 'rgba(59, 130, 246, 0.1)',
              pointerEvents: 'none',
              zIndex: 1,
              whiteSpace: 'nowrap'
            }}>
              VISTA PREVIA
            </div>

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
              <div>
                <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600', color: '#1e293b' }}>
                  👁️ Vista Previa de Factura
                </h2>
                <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>
                  Esta es una vista previa. La factura aún NO ha sido creada.
                </p>
              </div>
              <button
                onClick={() => {
                  setShowPreviewBeforeCreate(false);
                  setPreviewInvoice(null);
                }}
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

            {/* Contenido de la factura (reutilizar el mismo diseño de InvoicePreview) */}
            <div style={{ padding: '40px', position: 'relative', zIndex: 2 }}>
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
                    <div style={{ fontWeight: '600', fontSize: '14px' }}>Inventario Meds</div>
                    <div>Sistema de Gestión</div>
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
                    <span style={{ marginLeft: '8px', color: '#1e293b' }}>{previewInvoice.ncf}</span>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ marginBottom: '8px' }}>
                    <span style={{ fontWeight: '600', color: '#475569' }}>Fecha:</span>
                    <span style={{ marginLeft: '8px', color: '#1e293b' }}>
                      {new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
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
                  <div><strong>Nombre:</strong> {previewInvoice.sale?.customer?.name || 'N/A'}</div>
                  {previewInvoice.sale?.customer?.email && (
                    <div><strong>Email:</strong> {previewInvoice.sale.customer.email}</div>
                  )}
                  <div><strong>Forma de Pago:</strong> {previewInvoice.sale?.paymentMethod || 'efectivo'}</div>
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
                    <th style={{ padding: '12px', textAlign: 'right', fontSize: '12px', fontWeight: '600' }}>
                      Precio Unit.
                    </th>
                    <th style={{ padding: '12px', textAlign: 'right', fontSize: '12px', fontWeight: '600' }}>
                      Subtotal
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {previewInvoice.sale?.saleitem?.map((item, index) => {
                    const tipoVenta = previewInvoice.sale?.tipoVenta || 'USD';
                    const precio = tipoVenta === 'MN' 
                      ? (item.precio_venta_mn || 0)
                      : (item.precio_propuesto_usd || 0);
                    return (
                      <tr key={index} style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '12px', fontSize: '14px', color: '#1e293b' }}>
                          {item.medicines?.nombreComercial || 'N/A'}
                        </td>
                        <td style={{ padding: '12px', fontSize: '14px', color: '#475569', textAlign: 'center' }}>
                          {item.qty}
                        </td>
                        <td style={{ padding: '12px', fontSize: '14px', color: '#475569', textAlign: 'right' }}>
                          {formatCurrencyByType(precio, tipoVenta)}
                        </td>
                        <td style={{ padding: '12px', fontSize: '14px', color: '#1e293b', fontWeight: '600', textAlign: 'right' }}>
                          {formatCurrencyByType(precio * item.qty, tipoVenta)}
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
                    <span>{formatCurrencyByType(previewInvoice.subtotal, previewInvoice.sale?.tipoVenta || 'USD')}</span>
                  </div>
                  
                  {previewInvoice.itbis > 0 && (
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '8px 0',
                      fontSize: '14px',
                      color: '#475569'
                    }}>
                      <span>ITBIS ({previewInvoice.itbis}%):</span>
                      <span>{formatCurrencyByType(previewInvoice.itbisAmount, previewInvoice.sale?.tipoVenta || 'USD')}</span>
                    </div>
                  )}
                  
                  {previewInvoice.discount > 0 && (
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '8px 0',
                      fontSize: '14px',
                      color: '#ef4444'
                    }}>
                      <span>Descuento ({previewInvoice.discount}%):</span>
                      <span>-{formatCurrencyByType(previewInvoice.discountAmount, previewInvoice.sale?.tipoVenta || 'USD')}</span>
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
                    <span>{formatCurrencyByType(previewInvoice.total, previewInvoice.sale?.tipoVenta || 'USD')}</span>
                  </div>
                </div>
              </div>

              {/* Notas */}
              {previewInvoice.notes && (
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
                    {previewInvoice.notes}
                  </p>
                </div>
              )}
            </div>

            {/* Footer con botones de acción */}
            <div style={{
              padding: '20px',
              borderTop: '2px solid #e2e8f0',
              backgroundColor: '#f8fafc',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              position: 'sticky',
              bottom: 0,
              zIndex: 10
            }}>
              <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                💡 Si todo está correcto, cierra esta ventana y haz clic en "✅ Crear Factura"
              </p>
              <button
                onClick={() => {
                  setShowPreviewBeforeCreate(false);
                  setPreviewInvoice(null);
                }}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                ✕ Cerrar Vista Previa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceManager;

