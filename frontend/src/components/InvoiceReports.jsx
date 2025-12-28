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
    paymentMethod: 'todas'
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
      paymentMethod: 'todas'
    });
  };

  const handleExportExcel = () => {
    if (!reportData || !reportData.detalleFacturas || reportData.detalleFacturas.length === 0) {
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
      'Subtotal',
      'ITBIS %',
      'ITBIS Monto',
      'Descuento %',
      'Descuento Monto',
      'Total',
      'Estado',
      'Forma de Pago'
    ];

    const rows = reportData.detalleFacturas.map(inv => [
      inv.id,
      inv.ncf,
      new Date(inv.fecha).toLocaleDateString('es-ES'),
      inv.cliente,
      inv.rncCliente,
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

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value);
  };

  if (loading && !reportData) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
        Cargando reportes...
      </div>
    );
  }

  // Preparar datos para gráfico de dona (Forma de Pago)
  const paymentMethodData = reportData ? {
    labels: ['Efectivo', 'Tarjeta', 'Transferencia', 'Crédito'],
    datasets: [{
      data: [
        reportData.porFormaPago.efectivo,
        reportData.porFormaPago.tarjeta,
        reportData.porFormaPago.transferencia,
        reportData.porFormaPago.credito
      ],
      backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'],
      borderWidth: 2,
      borderColor: '#fff'
    }]
  } : null;

  // Preparar datos para gráfico de barras (Facturas por Día)
  const dailyData = reportData && reportData.facturasPorDia.length > 0 ? {
    labels: reportData.facturasPorDia.map(d => {
      const date = new Date(d.fecha);
      return `${date.getDate()} ${['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'][date.getMonth()]}`;
    }),
    datasets: [{
      label: 'Monto Facturado',
      data: reportData.facturasPorDia.map(d => d.monto),
      backgroundColor: '#3b82f6',
      borderRadius: 4
    }]
  } : null;

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
            disabled={!reportData || reportData.detalleFacturas.length === 0}
            style={{
              padding: '8px 16px',
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: (!reportData || reportData.detalleFacturas.length === 0) ? 'not-allowed' : 'pointer',
              opacity: (!reportData || reportData.detalleFacturas.length === 0) ? 0.6 : 1
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
              <div style={{ fontSize: '28px', fontWeight: '700', color: '#10b981' }}>
                {formatCurrency(reportData.summary.totalFacturado)}
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
          {reportData.topClientes.length > 0 && (
            <div style={{
              backgroundColor: 'white',
              padding: '20px',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              marginBottom: '24px'
            }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b', marginBottom: '16px' }}>
                👥 Top 10 Clientes Facturados
              </h3>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#475569' }}>#</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#475569' }}>Cliente</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#475569' }}>RNC</th>
                    <th style={{ padding: '12px', textAlign: 'right', fontSize: '12px', fontWeight: '600', color: '#475569' }}>Total Facturado</th>
                    <th style={{ padding: '12px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: '#475569' }}>Facturas</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.topClientes.map((cliente, index) => (
                    <tr key={cliente.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '12px', fontSize: '14px', color: '#64748b' }}>{index + 1}</td>
                      <td style={{ padding: '12px', fontSize: '14px', color: '#1e293b', fontWeight: '500' }}>{cliente.name}</td>
                      <td style={{ padding: '12px', fontSize: '14px', color: '#64748b' }}>{cliente.rnc}</td>
                      <td style={{ padding: '12px', fontSize: '14px', color: '#10b981', fontWeight: '600', textAlign: 'right' }}>
                        {formatCurrency(cliente.totalFacturado)}
                      </td>
                      <td style={{ padding: '12px', fontSize: '14px', color: '#64748b', textAlign: 'center' }}>
                        {cliente.cantidadFacturas}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Tabla Detallada */}
          {reportData.detalleFacturas.length > 0 && (
            <div style={{
              backgroundColor: 'white',
              padding: '20px',
              borderRadius: '8px',
              border: '1px solid #e2e8f0'
            }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b', marginBottom: '16px' }}>
                📋 Detalle de Facturas ({reportData.detalleFacturas.length})
              </h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                      <th style={{ padding: '10px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#475569' }}>ID</th>
                      <th style={{ padding: '10px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#475569' }}>NCF</th>
                      <th style={{ padding: '10px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#475569' }}>Fecha</th>
                      <th style={{ padding: '10px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#475569' }}>Cliente</th>
                      <th style={{ padding: '10px', textAlign: 'right', fontSize: '11px', fontWeight: '600', color: '#475569' }}>Subtotal</th>
                      <th style={{ padding: '10px', textAlign: 'right', fontSize: '11px', fontWeight: '600', color: '#475569' }}>ITBIS</th>
                      <th style={{ padding: '10px', textAlign: 'right', fontSize: '11px', fontWeight: '600', color: '#475569' }}>Desc.</th>
                      <th style={{ padding: '10px', textAlign: 'right', fontSize: '11px', fontWeight: '600', color: '#475569' }}>Total</th>
                      <th style={{ padding: '10px', textAlign: 'center', fontSize: '11px', fontWeight: '600', color: '#475569' }}>Estado</th>
                      <th style={{ padding: '10px', textAlign: 'center', fontSize: '11px', fontWeight: '600', color: '#475569' }}>Pago</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.detalleFacturas.map((inv) => (
                      <tr key={inv.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '10px', color: '#64748b' }}>#{inv.id}</td>
                        <td style={{ padding: '10px', color: '#1e293b', fontWeight: '500' }}>{inv.ncf}</td>
                        <td style={{ padding: '10px', color: '#64748b' }}>
                          {new Date(inv.fecha).toLocaleDateString('es-ES')}
                        </td>
                        <td style={{ padding: '10px', color: '#1e293b' }}>{inv.cliente}</td>
                        <td style={{ padding: '10px', color: '#64748b', textAlign: 'right' }}>
                          {formatCurrency(inv.subtotal)}
                        </td>
                        <td style={{ padding: '10px', color: '#64748b', textAlign: 'right' }}>
                          {formatCurrency(inv.itbisAmount)}
                        </td>
                        <td style={{ padding: '10px', color: '#64748b', textAlign: 'right' }}>
                          {formatCurrency(inv.discountAmount)}
                        </td>
                        <td style={{ padding: '10px', color: '#10b981', fontWeight: '600', textAlign: 'right' }}>
                          {formatCurrency(inv.total)}
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
          )}

          {reportData.detalleFacturas.length === 0 && (
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


