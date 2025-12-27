import { useState, useEffect } from 'react';
import api from '../api/http';
import { DARK_HEADER } from '../styles/standardLayout';

const InvoiceManager = () => {
  // Estados para pestañas
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'emitted'
  
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
  
  // Estados para el formulario de factura
  const [invoiceData, setInvoiceData] = useState({
    ncf: '',
    itbis: 0,
    discount: 0,
    notes: ''
  });

  useEffect(() => {
    if (activeTab === 'pending') {
      loadPendingSales();
    } else if (activeTab === 'emitted') {
      loadEmittedInvoices();
    }
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

  const handleSelectSale = (sale) => {
    setSelectedSale(sale);
    setShowInvoiceForm(true);
    setInvoiceData({
      ncf: '',
      itbis: 0,
      discount: 0,
      notes: ''
    });
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

  const calculateSubtotal = () => {
    if (!selectedSale) return 0;
    return selectedSale.items.reduce((sum, item) => sum + (item.precio_propuesto_usd * item.qty), 0);
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
                      <th style={{ padding: '12px', textAlign: 'right', fontSize: '12px', fontWeight: '600', color: '#475569' }}>
                        Items
                      </th>
                      <th style={{ padding: '12px', textAlign: 'right', fontSize: '12px', fontWeight: '600', color: '#475569' }}>
                        Total USD
                      </th>
                      <th style={{ padding: '12px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: '#475569' }}>
                        Acción
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingSales.map((sale) => {
                      const total = sale.items.reduce((sum, item) => sum + (item.precio_propuesto_usd * item.qty), 0);
                      return (
                        <tr key={sale.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                          <td style={{ padding: '12px', fontSize: '14px', color: '#1e293b' }}>
                            #{sale.id}
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
                          <td style={{ padding: '12px', fontSize: '14px', color: '#475569', textAlign: 'right' }}>
                            {sale.items.length}
                          </td>
                          <td style={{ padding: '12px', fontSize: '14px', color: '#1e293b', fontWeight: '600', textAlign: 'right' }}>
                            {formatCurrency(total)}
                          </td>
                          <td style={{ padding: '12px', textAlign: 'center' }}>
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
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
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
                  </label>
                  <input
                    type="text"
                    value={invoiceData.ncf}
                    onChange={(e) => setInvoiceData({ ...invoiceData, ncf: e.target.value })}
                    placeholder="Ej: B0100000001"
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
                      {formatCurrency(calculateSubtotal())}
                    </span>
                  </div>
                  
                  {parseFloat(invoiceData.itbis) > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '14px', color: '#64748b' }}>
                        ITBIS ({invoiceData.itbis}%):
                      </span>
                      <span style={{ fontSize: '14px', color: '#10b981', fontWeight: '500' }}>
                        + {formatCurrency(calculateITBIS())}
                      </span>
                    </div>
                  )}
                  
                  {parseFloat(invoiceData.discount) > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '14px', color: '#64748b' }}>
                        Descuento ({invoiceData.discount}%):
                      </span>
                      <span style={{ fontSize: '14px', color: '#ef4444', fontWeight: '500' }}>
                        - {formatCurrency(calculateDiscount())}
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
                      {formatCurrency(calculateTotal())}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleCreateInvoice}
                  disabled={loading || !invoiceData.ncf.trim()}
                  style={{
                    width: '100%',
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
    </div>
  );
};

export default InvoiceManager;

