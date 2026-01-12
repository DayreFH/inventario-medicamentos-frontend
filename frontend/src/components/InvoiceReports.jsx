import { useState, useEffect } from 'react';
import api from '../api/http';
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';

// Registrar componentes de Chart.js
ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const InvoiceReports = () => {
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [customers, setCustomers] = useState([]);
  
  // Filtros
  const [filters, setFilters] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    customerId: 'todos',
    status: 'todas',
    paymentMethod: 'todas',
    currency: 'BOTH' // NUEVO: Filtro de moneda (USD | MN | BOTH)
  });

  useEffect(() => {
    loadCustomers();
    loadReportData();
  }, []);

  const loadCustomers = async () => {
    try {
      const { data } = await api.get('/customers');
      setCustomers(data);
    } catch (error) {
      console.error('Error cargando clientes:', error);
    }
  };

  const loadReportData = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/invoices/reports', { params: filters });
      setReportData(data);
    } catch (error) {
      console.error('Error cargando reportes:', error);
      alert('Error al cargar los reportes de facturación');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleApplyFilters = () => {
    loadReportData();
  };

  const handleClearFilters = () => {
    setFilters({
      startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      customerId: 'todos',
      status: 'todas',
      paymentMethod: 'todas',
      currency: 'BOTH'
    });
  };

  const handleExportExcel = () => {
    const filteredInvoices = getFilteredInvoices();
    
    if (!filteredInvoices || filteredInvoices.length === 0) {
      alert('No hay datos para exportar');
      return;
    }

    // Crear CSV con BOM y delimitador de punto y coma
    const BOM = '\uFEFF';
    const headers = [
      'ID',
      'NCF',
      'Fecha',
      'Cliente',
      'RNC Cliente',
      'Moneda',
      'Subtotal',
      'ITBIS %',
      'ITBIS Monto',
      'Descuento %',
      'Descuento Monto',
      'Total',
      'Estado',
      'Forma de Pago'
    ];

    const rows = filteredInvoices.map(inv => [
      inv.id,
      inv.ncf,
      new Date(inv.fecha).toLocaleDateString('es-ES'),
      inv.cliente,
      inv.rncCliente,
      inv.tipoVenta || 'USD',
      inv.subtotal.toFixed(2),
      inv.itbis.toFixed(2),
      inv.itbisAmount.toFixed(2),
      inv.discount.toFixed(2),
      inv.discountAmount.toFixed(2),
      inv.total.toFixed(2),
      inv.status === 'emitida' ? 'Emitida' : 'Anulada',
      inv.paymentMethod
    ]);

    const csvContent = BOM + [
      headers.join(';'),
      ...rows.map(row => row.join(';'))
    ].join('\n');

    // Descargar archivo
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `Reporte_Facturas_${filters.startDate}_${filters.endDate}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Función helper para obtener el summary correcto según la moneda seleccionada
  const getSummary = () => {
    if (!reportData) return null;
    
    // Si hay datos nuevos (summaryUSD/summaryMN), usarlos
    if (reportData.summaryUSD && reportData.summaryMN) {
      if (filters.currency === 'USD') return reportData.summaryUSD;
      if (filters.currency === 'MN') return reportData.summaryMN;
      // Para 'BOTH', devolver estructura especial
      return {
        isBoth: true,
        USD: reportData.summaryUSD,
        MN: reportData.summaryMN
      };
    }
    
    // Fallback a estructura antigua
    return reportData.summary;
  };

  // Función helper para filtrar facturas por tipo de moneda
  const getFilteredInvoices = () => {
    if (!reportData || !reportData.detalleFacturas) return [];
    
    // Si no se seleccionó filtro específico, mostrar todas
    if (filters.currency === 'BOTH') {
      return reportData.detalleFacturas;
    }
    
    // Filtrar por tipoVenta
    return reportData.detalleFacturas.filter(inv => inv.tipoVenta === filters.currency);
  };

  // Función helper para formatear moneda
  const formatCurrency = (value, currency = null) => {
    const curr = currency || filters.currency;
    const numValue = Number(value) || 0;
    const formatted = numValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    
    if (curr === 'MN') {
      return `MN $${formatted}`;
    }
    
    return `USD $${formatted}`;
  };

  // Función helper para formatear cuando se muestran ambas monedas
  const formatBothCurrencies = (valueUSD, valueMN) => {
    return (
      <div>
        <div style={{ fontSize: '20px', color: '#10b981' }}>
          {formatCurrency(valueUSD, 'USD')}
        </div>
        <div style={{ fontSize: '14px', color: '#6c757d', marginTop: '4px' }}>
          {formatCurrency(valueMN, 'MN')}
        </div>
      </div>
    );
  };

  if (loading && !reportData) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
        Cargando reportes...
      </div>
    );
  }

  // Preparar datos para gráfico de dona (Forma de Pago)
  const paymentMethodData = reportData ? (() => {
    let porFormaPagoData = reportData.porFormaPago;
    
    // Si hay datos nuevos y se seleccionó una moneda específica
    if (filters.currency === 'USD' && reportData.porFormaPagoUSD) {
      porFormaPagoData = reportData.porFormaPagoUSD;
    } else if (filters.currency === 'MN' && reportData.porFormaPagoMN) {
      porFormaPagoData = reportData.porFormaPagoMN;
    }
    
    return {
      labels: ['Efectivo', 'Tarjeta', 'Transferencia', 'Crédito'],
      datasets: [{
        data: [
          porFormaPagoData.efectivo,
          porFormaPagoData.tarjeta,
          porFormaPagoData.transferencia,
          porFormaPagoData.credito
        ],
        backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'],
        borderWidth: 2,
        borderColor: '#fff'
      }]
    };
  })() : null;

  // Preparar datos para gráfico de barras (Facturas por Día)
  const dailyData = reportData ? (() => {
    let facturasPorDiaData = reportData.facturasPorDia || [];
    
    // Si hay datos nuevos y se seleccionó una moneda específica
    if (filters.currency === 'USD' && reportData.facturasPorDiaUSD) {
      facturasPorDiaData = reportData.facturasPorDiaUSD;
    } else if (filters.currency === 'MN' && reportData.facturasPorDiaMN) {
      facturasPorDiaData = reportData.facturasPorDiaMN;
    }
    
    return facturasPorDiaData.length > 0 ? {
      labels: facturasPorDiaData.map(d => {
        const date = new Date(d.fecha);
        return `${date.getDate()} ${['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'][date.getMonth()]}`;
      }),
      datasets: [{
        label: `Monto Facturado (${filters.currency === 'MN' ? 'MN' : 'USD'})`,
        data: facturasPorDiaData.map(d => d.monto),
        backgroundColor: '#3b82f6',
        borderRadius: 4
      }]
    } : null;
  })() : null;

  // Helper para obtener top clientes según filtro de moneda
  const getTopClientes = () => {
    if (!reportData) return [];
    
    if (filters.currency === 'USD' && reportData.topClientesUSD) {
      return reportData.topClientesUSD;
    } else if (filters.currency === 'MN' && reportData.topClientesMN) {
      return reportData.topClientesMN;
    }
    
    // Para 'BOTH' o si no hay datos separados, usar topClientes general
    return reportData.topClientes || [];
  };

  // Helper para combinar clientes de ambas monedas (para vista BOTH)
  const getTopClientesCombined = () => {
    if (!reportData || !reportData.topClientesUSD || !reportData.topClientesMN) {
      return [];
    }

    // Crear un mapa combinado de clientes
    const clientesMap = {};

    // Agregar clientes USD
    reportData.topClientesUSD.forEach(cliente => {
      if (!clientesMap[cliente.id]) {
        clientesMap[cliente.id] = {
          id: cliente.id,
          name: cliente.name,
          rnc: cliente.rnc,
          totalUSD: 0,
          totalMN: 0,
          facturasUSD: 0,
          facturasMN: 0
        };
      }
      clientesMap[cliente.id].totalUSD = cliente.totalFacturado;
      clientesMap[cliente.id].facturasUSD = cliente.cantidadFacturas;
    });

    // Agregar clientes MN
    reportData.topClientesMN.forEach(cliente => {
      if (!clientesMap[cliente.id]) {
        clientesMap[cliente.id] = {
          id: cliente.id,
          name: cliente.name,
          rnc: cliente.rnc,
          totalUSD: 0,
          totalMN: 0,
          facturasUSD: 0,
          facturasMN: 0
        };
      }
      clientesMap[cliente.id].totalMN = cliente.totalFacturado;
      clientesMap[cliente.id].facturasMN = cliente.cantidadFacturas;
    });

    // Convertir a array y ordenar por total combinado (USD + MN convertido)
    return Object.values(clientesMap)
      .sort((a, b) => {
        const totalA = a.totalUSD + a.totalMN;
        const totalB = b.totalUSD + b.totalMN;
        return totalB - totalA;
      })
      .slice(0, 10);
  };

  return (
    <div>
      {/* Filtros */}
      <div style={{
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '8px',
        border: '1px solid #e2e8f0',
        marginBottom: '24px'
      }}>
        <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b', marginBottom: '16px' }}>
          🔍 Filtros
        </h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          {/* Fecha Inicio */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#475569', marginBottom: '6px' }}>
              Fecha Inicio
            </label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
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

          {/* Fecha Fin */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#475569', marginBottom: '6px' }}>
              Fecha Fin
            </label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
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

          {/* Cliente */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#475569', marginBottom: '6px' }}>
              Cliente
            </label>
            <select
              value={filters.customerId}
              onChange={(e) => handleFilterChange('customerId', e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            >
              <option value="todos">Todos los clientes</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Estado */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#475569', marginBottom: '6px' }}>
              Estado
            </label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            >
              <option value="todas">Todas</option>
              <option value="emitida">Emitidas</option>
              <option value="anulada">Anuladas</option>
            </select>
          </div>

          {/* Forma de Pago */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#475569', marginBottom: '6px' }}>
              Forma de Pago
            </label>
            <select
              value={filters.paymentMethod}
              onChange={(e) => handleFilterChange('paymentMethod', e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            >
              <option value="todas">Todas</option>
              <option value="efectivo">Efectivo</option>
              <option value="tarjeta">Tarjeta</option>
              <option value="transferencia">Transferencia</option>
              <option value="credito">Crédito</option>
            </select>
          </div>

          {/* Moneda */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#475569', marginBottom: '6px' }}>
              Moneda
            </label>
            <select
              value={filters.currency}
              onChange={(e) => handleFilterChange('currency', e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                fontSize: '14px',
                boxSizing: 'border-box',
                fontWeight: '500'
              }}
            >
              <option value="USD">💵 USD</option>
              <option value="MN">💴 MN</option>
              <option value="BOTH">💵💴 Ambas</option>
            </select>
          </div>
        </div>

        {/* Botones */}
        <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
          <button
            onClick={handleApplyFilters}
            disabled={loading}
            style={{
              padding: '8px 16px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1
            }}
          >
            🔍 Filtrar
          </button>
          <button
            onClick={handleClearFilters}
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
            🔄 Limpiar
          </button>
          <button
            onClick={handleExportExcel}
            disabled={!reportData || getFilteredInvoices().length === 0}
            style={{
              padding: '8px 16px',
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: (!reportData || getFilteredInvoices().length === 0) ? 'not-allowed' : 'pointer',
              opacity: (!reportData || getFilteredInvoices().length === 0) ? 0.6 : 1
            }}
          >
            📥 Exportar Excel
          </button>
        </div>
      </div>

      {reportData && (
        <>
          {/* Métricas Principales */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '16px',
            marginBottom: '24px'
          }}>
            {/* Total Facturado */}
            <div style={{
              backgroundColor: 'white',
              padding: '20px',
              borderRadius: '8px',
              border: '1px solid #e2e8f0'
            }}>
              <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '8px', fontWeight: '500' }}>
                💰 Total Facturado
              </div>
              <div style={{ fontSize: filters.currency === 'BOTH' ? '20px' : '28px', fontWeight: '700', color: '#10b981' }}>
                {(() => {
                  const summary = getSummary();
                  if (!summary) return '$0.00';
                  if (summary.isBoth) {
                    return formatBothCurrencies(summary.USD.totalFacturado, summary.MN.totalFacturado);
                  }
                  return formatCurrency(summary.totalFacturado);
                })()}
              </div>
            </div>

            {/* Facturas Emitidas */}
            <div style={{
              backgroundColor: 'white',
              padding: '20px',
              borderRadius: '8px',
              border: '1px solid #e2e8f0'
            }}>
              <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '8px', fontWeight: '500' }}>
                📊 Facturas Emitidas
              </div>
              <div style={{ fontSize: '28px', fontWeight: '700', color: '#3b82f6' }}>
                {reportData.summary.facturasEmitidas}
              </div>
            </div>

            {/* Facturas Anuladas */}
            <div style={{
              backgroundColor: 'white',
              padding: '20px',
              borderRadius: '8px',
              border: '1px solid #e2e8f0'
            }}>
              <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '8px', fontWeight: '500' }}>
                ❌ Facturas Anuladas
              </div>
              <div style={{ fontSize: '28px', fontWeight: '700', color: '#ef4444' }}>
                {reportData.summary.facturasAnuladas}
                <span style={{ fontSize: '14px', marginLeft: '8px', color: '#64748b' }}>
                  ({reportData.summary.tasaAnulacion.toFixed(1)}%)
                </span>
              </div>
            </div>

            {/* Monto Anulado */}
            <div style={{
              backgroundColor: 'white',
              padding: '20px',
              borderRadius: '8px',
              border: '1px solid #e2e8f0'
            }}>
              <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '8px', fontWeight: '500' }}>
                💸 Monto Anulado
              </div>
              <div style={{ fontSize: '28px', fontWeight: '700', color: '#ef4444' }}>
                {formatCurrency(reportData.summary.totalAnulado)}
              </div>
            </div>

            {/* Promedio por Factura */}
            <div style={{
              backgroundColor: 'white',
              padding: '20px',
              borderRadius: '8px',
              border: '1px solid #e2e8f0'
            }}>
              <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '8px', fontWeight: '500' }}>
                📈 Promedio/Factura
              </div>
              <div style={{ fontSize: '28px', fontWeight: '700', color: '#1e293b' }}>
                {formatCurrency(reportData.summary.promedioFactura)}
              </div>
            </div>

            {/* ITBIS Cobrado */}
            <div style={{
              backgroundColor: 'white',
              padding: '20px',
              borderRadius: '8px',
              border: '1px solid #e2e8f0'
            }}>
              <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '8px', fontWeight: '500' }}>
                🧾 ITBIS Cobrado
              </div>
              <div style={{ fontSize: '28px', fontWeight: '700', color: '#f59e0b' }}>
                {formatCurrency(reportData.summary.totalITBIS)}
              </div>
            </div>

            {/* Descuentos */}
            <div style={{
              backgroundColor: 'white',
              padding: '20px',
              borderRadius: '8px',
              border: '1px solid #e2e8f0'
            }}>
              <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '8px', fontWeight: '500' }}>
                💰 Descuentos
              </div>
              <div style={{ fontSize: '28px', fontWeight: '700', color: '#8b5cf6' }}>
                {formatCurrency(reportData.summary.totalDescuentos)}
              </div>
            </div>

            {/* NCF Consumidos */}
            <div style={{
              backgroundColor: 'white',
              padding: '20px',
              borderRadius: '8px',
              border: '1px solid #e2e8f0'
            }}>
              <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '8px', fontWeight: '500' }}>
                🔢 NCF Consumidos
              </div>
              <div style={{ fontSize: '28px', fontWeight: '700', color: '#1e293b' }}>
                {reportData.summary.ncfConsumidos}
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                {reportData.summary.primerNCF} → {reportData.summary.ultimoNCF}
              </div>
            </div>
          </div>

          {/* Gráficos */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 2fr',
            gap: '24px',
            marginBottom: '24px'
          }}>
            {/* Gráfico de Dona - Forma de Pago */}
            {paymentMethodData && (
              <div style={{
                backgroundColor: 'white',
                padding: '20px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0'
              }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b', marginBottom: '16px' }}>
                  💳 Por Forma de Pago
                </h3>
                <div style={{ maxWidth: '300px', margin: '0 auto' }}>
                  <Doughnut data={paymentMethodData} options={{ maintainAspectRatio: true }} />
                </div>
                <div style={{ marginTop: '16px', fontSize: '13px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span>💵 Efectivo:</span>
                    <strong>{formatCurrency(reportData.porFormaPago.efectivo)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span>💳 Tarjeta:</span>
                    <strong>{formatCurrency(reportData.porFormaPago.tarjeta)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span>🏦 Transferencia:</span>
                    <strong>{formatCurrency(reportData.porFormaPago.transferencia)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>📝 Crédito:</span>
                    <strong>{formatCurrency(reportData.porFormaPago.credito)}</strong>
                  </div>
                </div>
              </div>
            )}

            {/* Gráfico de Barras - Facturas por Día */}
            {dailyData && (
              <div style={{
                backgroundColor: 'white',
                padding: '20px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0'
              }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b', marginBottom: '16px' }}>
                  📊 Facturas por Día
                </h3>
                <Bar data={dailyData} options={{ maintainAspectRatio: true, responsive: true }} />
              </div>
            )}
          </div>

          {/* Top 10 Clientes */}
          {(() => {
            const topClientes = filters.currency === 'BOTH' ? getTopClientesCombined() : getTopClientes();
            const showBothCurrencies = filters.currency === 'BOTH';
            
            return topClientes.length > 0 && (
              <div style={{
                backgroundColor: 'white',
                padding: '20px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                marginBottom: '24px'
              }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b', marginBottom: '16px' }}>
                  👥 Top 10 Clientes Facturados
                  {filters.currency !== 'BOTH' && (
                    <span style={{ fontSize: '14px', fontWeight: '400', color: '#64748b', marginLeft: '8px' }}>
                      ({filters.currency})
                    </span>
                  )}
                </h3>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                        <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#475569' }}>#</th>
                        <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#475569' }}>Cliente</th>
                        <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#475569' }}>RNC</th>
                        {showBothCurrencies ? (
                          <>
                            <th style={{ padding: '12px', textAlign: 'right', fontSize: '12px', fontWeight: '600', color: '#475569' }}>Total USD</th>
                            <th style={{ padding: '12px', textAlign: 'right', fontSize: '12px', fontWeight: '600', color: '#475569' }}>Total MN</th>
                            <th style={{ padding: '12px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: '#475569' }}>Facturas USD</th>
                            <th style={{ padding: '12px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: '#475569' }}>Facturas MN</th>
                          </>
                        ) : (
                          <>
                            <th style={{ padding: '12px', textAlign: 'right', fontSize: '12px', fontWeight: '600', color: '#475569' }}>Total Facturado</th>
                            <th style={{ padding: '12px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: '#475569' }}>Facturas</th>
                          </>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {topClientes.map((cliente, index) => (
                        <tr key={cliente.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                          <td style={{ padding: '12px', fontSize: '14px', color: '#64748b' }}>{index + 1}</td>
                          <td style={{ padding: '12px', fontSize: '14px', color: '#1e293b', fontWeight: '500' }}>{cliente.name}</td>
                          <td style={{ padding: '12px', fontSize: '14px', color: '#64748b' }}>{cliente.rnc}</td>
                          {showBothCurrencies ? (
                            <>
                              <td style={{ padding: '12px', fontSize: '14px', color: '#3b82f6', fontWeight: '600', textAlign: 'right' }}>
                                {formatCurrency(cliente.totalUSD, 'USD')}
                              </td>
                              <td style={{ padding: '12px', fontSize: '14px', color: '#f59e0b', fontWeight: '600', textAlign: 'right' }}>
                                {formatCurrency(cliente.totalMN, 'MN')}
                              </td>
                              <td style={{ padding: '12px', fontSize: '14px', color: '#64748b', textAlign: 'center' }}>
                                {cliente.facturasUSD}
                              </td>
                              <td style={{ padding: '12px', fontSize: '14px', color: '#64748b', textAlign: 'center' }}>
                                {cliente.facturasMN}
                              </td>
                            </>
                          ) : (
                            <>
                              <td style={{ padding: '12px', fontSize: '14px', color: '#10b981', fontWeight: '600', textAlign: 'right' }}>
                                {formatCurrency(cliente.totalFacturado, filters.currency)}
                              </td>
                              <td style={{ padding: '12px', fontSize: '14px', color: '#64748b', textAlign: 'center' }}>
                                {cliente.cantidadFacturas}
                              </td>
                            </>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}

          {/* Tabla Detallada */}
          {(() => {
            const filteredInvoices = getFilteredInvoices();
            return filteredInvoices.length > 0 && (
              <div style={{
                backgroundColor: 'white',
                padding: '20px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0'
              }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b', marginBottom: '16px' }}>
                  📋 Detalle de Facturas ({filteredInvoices.length})
                </h3>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                        <th style={{ padding: '10px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#475569' }}>ID</th>
                        <th style={{ padding: '10px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#475569' }}>NCF</th>
                        <th style={{ padding: '10px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#475569' }}>Fecha</th>
                        <th style={{ padding: '10px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#475569' }}>Cliente</th>
                        <th style={{ padding: '10px', textAlign: 'center', fontSize: '11px', fontWeight: '600', color: '#475569' }}>Moneda</th>
                        <th style={{ padding: '10px', textAlign: 'right', fontSize: '11px', fontWeight: '600', color: '#475569' }}>Subtotal</th>
                        <th style={{ padding: '10px', textAlign: 'right', fontSize: '11px', fontWeight: '600', color: '#475569' }}>ITBIS</th>
                        <th style={{ padding: '10px', textAlign: 'right', fontSize: '11px', fontWeight: '600', color: '#475569' }}>Desc.</th>
                        <th style={{ padding: '10px', textAlign: 'right', fontSize: '11px', fontWeight: '600', color: '#475569' }}>Total</th>
                        <th style={{ padding: '10px', textAlign: 'center', fontSize: '11px', fontWeight: '600', color: '#475569' }}>Estado</th>
                        <th style={{ padding: '10px', textAlign: 'center', fontSize: '11px', fontWeight: '600', color: '#475569' }}>Pago</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredInvoices.map((inv) => (
                      <tr key={inv.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '10px', color: '#64748b' }}>#{inv.id}</td>
                        <td style={{ padding: '10px', color: '#1e293b', fontWeight: '500' }}>{inv.ncf}</td>
                        <td style={{ padding: '10px', color: '#64748b' }}>
                          {new Date(inv.fecha).toLocaleDateString('es-ES')}
                        </td>
                        <td style={{ padding: '10px', color: '#1e293b' }}>{inv.cliente}</td>
                        <td style={{ padding: '10px', textAlign: 'center' }}>
                          <span style={{
                            padding: '3px 8px',
                            borderRadius: '4px',
                            fontSize: '10px',
                            fontWeight: '600',
                            backgroundColor: inv.tipoVenta === 'USD' ? '#dbeafe' : '#fef3c7',
                            color: inv.tipoVenta === 'USD' ? '#1e40af' : '#92400e'
                          }}>
                            {inv.tipoVenta || 'USD'}
                          </span>
                        </td>
                        <td style={{ padding: '10px', color: '#64748b', textAlign: 'right' }}>
                          {formatCurrency(inv.subtotal, inv.tipoVenta)}
                        </td>
                        <td style={{ padding: '10px', color: '#64748b', textAlign: 'right' }}>
                          {formatCurrency(inv.itbisAmount, inv.tipoVenta)}
                        </td>
                        <td style={{ padding: '10px', color: '#64748b', textAlign: 'right' }}>
                          {formatCurrency(inv.discountAmount, inv.tipoVenta)}
                        </td>
                        <td style={{ padding: '10px', color: '#10b981', fontWeight: '600', textAlign: 'right' }}>
                          {formatCurrency(inv.total, inv.tipoVenta)}
                        </td>
                        <td style={{ padding: '10px', textAlign: 'center' }}>
                          <span style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: '500',
                            backgroundColor: inv.status === 'emitida' ? '#dcfce7' : '#fee2e2',
                            color: inv.status === 'emitida' ? '#166534' : '#991b1b'
                          }}>
                            {inv.status === 'emitida' ? 'Emitida' : 'Anulada'}
                          </span>
                        </td>
                        <td style={{ padding: '10px', color: '#64748b', textAlign: 'center' }}>
                          {inv.paymentMethod}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            );
          })()}

          {getFilteredInvoices().length === 0 && (
            <div style={{
              backgroundColor: 'white',
              padding: '40px',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              textAlign: 'center'
            }}>
              <p style={{ fontSize: '16px', color: '#64748b', margin: 0 }}>
                📊 No hay facturas en el período seleccionado
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default InvoiceReports;


