import { useEffect, useState } from 'react';
import api from '../api/http';
import { PAGE_CONTAINER, DARK_HEADER } from '../styles/standardLayout';

const ProfitabilityAnalysis = () => {
  const [activeTab, setActiveTab] = useState('summary');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [currency, setCurrency] = useState('USD'); // 'USD', 'MN', 'BOTH'
  const [summaryData, setSummaryData] = useState(null);
  const [medicineData, setMedicineData] = useState([]);
  const [customerData, setCustomerData] = useState([]);
  const [supplierData, setSupplierData] = useState([]);
  const [alertsData, setAlertsData] = useState([]);
  const [loading, setLoading] = useState(false);

  // Inicializar fechas (últimos 30 días)
  useEffect(() => {
    const today = new Date();
    const from = new Date();
    from.setDate(today.getDate() - 30);
    const toIso = d => d.toISOString().split('T')[0];
    setStart(toIso(from));
    setEnd(toIso(today));
  }, []);

  // Cargar datos cuando cambian las fechas
  useEffect(() => {
    if (start && end) {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [start, end, activeTab]);

  const loadData = async () => {
    try {
      setLoading(true);
      const params = { start, end };

      if (activeTab === 'summary') {
        const { data } = await api.get('/profitability/summary', { params });
        setSummaryData(data);
      } else if (activeTab === 'medicine') {
        const { data } = await api.get('/profitability/by-medicine', { params });
        setMedicineData(data);
      } else if (activeTab === 'customer') {
        const { data } = await api.get('/profitability/by-customer', { params });
        setCustomerData(data);
      } else if (activeTab === 'supplier') {
        const { data } = await api.get('/profitability/by-supplier', { params });
        setSupplierData(data);
      } else if (activeTab === 'alerts') {
        const { data } = await api.get('/profitability/low-margin', { params: { ...params, threshold: 10 } });
        setAlertsData(data);
      }
    } catch (error) {
      console.error('Error cargando datos de rentabilidad:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    let data = [];
    let headers = [];
    let filename = '';

    if (activeTab === 'medicine' && medicineData.length > 0) {
      headers = ['Código', 'Medicamento', 'Cantidad Vendida', 'Costo Total USD', 'Costo Total MN', 'Ingreso Total USD', 'Ingreso Total MN', 'Ganancia USD', 'Ganancia MN', 'Margen %'];
      data = medicineData.map(m => [
        m.medicineCode,
        m.medicineName,
        m.quantitySold,
        m.totalCost.toFixed(2),
        m.totalCostMN.toFixed(2),
        m.totalRevenue.toFixed(2),
        m.totalRevenueMN.toFixed(2),
        m.profit.toFixed(2),
        m.profitMN.toFixed(2),
        m.profitMargin.toFixed(2)
      ]);
      filename = `rentabilidad_medicamentos_${start}_${end}.csv`;
    } else if (activeTab === 'customer' && customerData.length > 0) {
      headers = ['Cliente', 'Ventas', 'Costo Total USD', 'Costo Total MN', 'Ingreso Total USD', 'Ingreso Total MN', 'Ganancia USD', 'Ganancia MN', 'Margen %'];
      data = customerData.map(c => [
        c.customerName,
        c.totalSales,
        c.totalCost.toFixed(2),
        c.totalCostMN.toFixed(2),
        c.totalRevenue.toFixed(2),
        c.totalRevenueMN.toFixed(2),
        c.profit.toFixed(2),
        c.profitMN.toFixed(2),
        c.profitMargin.toFixed(2)
      ]);
      filename = `rentabilidad_clientes_${start}_${end}.csv`;
    } else if (activeTab === 'supplier' && supplierData.length > 0) {
      headers = ['Proveedor', 'Costo Total USD', 'Costo Total MN', 'Ingreso Total USD', 'Ingreso Total MN', 'Ganancia USD', 'Ganancia MN', 'ROI %'];
      data = supplierData.map(s => [
        s.supplierName,
        s.totalCost.toFixed(2),
        s.totalCostMN.toFixed(2),
        s.totalRevenue.toFixed(2),
        s.totalRevenueMN.toFixed(2),
        s.profit.toFixed(2),
        s.profitMN.toFixed(2),
        s.roi.toFixed(2)
      ]);
      filename = `rentabilidad_proveedores_${start}_${end}.csv`;
    } else if (activeTab === 'alerts' && alertsData.length > 0) {
      headers = ['Código', 'Medicamento', 'Margen %', 'Estado', 'Alerta'];
      data = alertsData.map(a => [
        a.medicineCode,
        a.medicineName,
        a.profitMargin.toFixed(2),
        a.status,
        a.alert
      ]);
      filename = `alertas_margen_bajo_${start}_${end}.csv`;
    } else {
      return;
    }

    // Usar punto y coma como separador para compatibilidad con Excel en español
    const lines = [headers.join(';')];
    for (const row of data) {
      lines.push(row.map(cell => `"${cell}"`).join(';'));
    }

    // Agregar BOM (Byte Order Mark) para que Excel reconozca UTF-8
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getMarginColor = (margin) => {
    if (margin < 0) return '#dc3545';
    if (margin < 10) return '#ffc107';
    if (margin < 30) return '#17a2b8';
    return '#28a745';
  };

  // Helper para formatear valores según moneda seleccionada
  const formatCurrency = (valueUSD, valueMN) => {
    if (currency === 'USD') {
      return `USD $${valueUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    } else if (currency === 'MN') {
      return `MN $${valueMN.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    } else {
      // BOTH
      return (
        <div>
          <div>USD ${valueUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          <div style={{ fontSize: '14px', color: '#6c757d', marginTop: '4px' }}>
            MN ${valueMN.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
      );
    }
  };

  return (
    <div style={PAGE_CONTAINER}>
      {/* Header */}
      <div style={DARK_HEADER}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '20px' }}>📈</span>
          <div>
            <div style={{ fontSize: '16px', fontWeight: '600' }}>Finanzas · Análisis de Rentabilidad</div>
            <div style={{ fontSize: '12px', opacity: 0.9 }}>
              Análisis de rentabilidad por medicamento, cliente y proveedor
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div style={{
        backgroundColor: '#ffffff',
        padding: '16px',
        borderBottom: '1px solid #e9ecef',
        display: 'flex',
        gap: '16px',
        alignItems: 'end'
      }}>
        <div>
          <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px', fontWeight: '500' }}>
            Fecha Inicio
          </label>
          <input
            type="date"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            style={{
              padding: '8px 12px',
              border: '1px solid #ced4da',
              borderRadius: '4px',
              fontSize: '12px',
              outline: 'none'
            }}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px', fontWeight: '500' }}>
            Fecha Fin
          </label>
          <input
            type="date"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            style={{
              padding: '8px 12px',
              border: '1px solid #ced4da',
              borderRadius: '4px',
              fontSize: '12px',
              outline: 'none'
            }}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px', fontWeight: '500' }}>
            Moneda
          </label>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            style={{
              padding: '8px 12px',
              border: '1px solid #ced4da',
              borderRadius: '4px',
              fontSize: '12px',
              outline: 'none',
              cursor: 'pointer',
              backgroundColor: 'white'
            }}
          >
            <option value="USD">💵 USD</option>
            <option value="MN">💴 MN</option>
            <option value="BOTH">💵💴 Ambas</option>
          </select>
        </div>
        <button
          onClick={loadData}
          disabled={loading}
          style={{
            padding: '8px 16px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '13px',
            fontWeight: '500',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1
          }}
        >
          {loading ? 'Cargando...' : '🔍 Consultar'}
        </button>
        <button
          onClick={handleExportCSV}
          disabled={loading}
          style={{
            padding: '8px 16px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '13px',
            fontWeight: '500',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1
          }}
        >
          📄 Exportar CSV
        </button>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        backgroundColor: '#f8f9fa',
        borderBottom: '2px solid #e9ecef',
        padding: '0 16px',
        gap: '8px'
      }}>
        {[
          { id: 'summary', label: '📊 Resumen General' },
          { id: 'medicine', label: '💊 Por Medicamento' },
          { id: 'customer', label: '👥 Por Cliente' },
          { id: 'supplier', label: '🏢 Por Proveedor' },
          { id: 'alerts', label: '⚠️ Alertas' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '12px 24px',
              border: 'none',
              backgroundColor: activeTab === tab.id ? '#2c3e50' : 'transparent',
              color: activeTab === tab.id ? 'white' : '#666',
              cursor: 'pointer',
              fontWeight: activeTab === tab.id ? '600' : '400',
              fontSize: '14px',
              borderRadius: '4px 4px 0 0',
              transition: 'all 0.2s'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '24px',
        backgroundColor: '#ffffff'
      }}>
        {loading && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
            Cargando datos...
          </div>
        )}

        {!loading && activeTab === 'summary' && summaryData && (
          <div>
            <h3 style={{ marginTop: 0, marginBottom: '24px', fontSize: '18px', color: '#2c3e50' }}>
              📊 Métricas Generales
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div style={{
                padding: '20px',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px',
                border: '1px solid #e9ecef'
              }}>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>💰 Ingresos Totales</div>
                <div style={{ fontSize: currency === 'BOTH' ? '20px' : '24px', fontWeight: '600', color: '#28a745' }}>
                  {formatCurrency(summaryData.totalRevenue, summaryData.totalRevenueMN)}
                </div>
              </div>
              <div style={{
                padding: '20px',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px',
                border: '1px solid #e9ecef'
              }}>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>💸 Costos Totales</div>
                <div style={{ fontSize: currency === 'BOTH' ? '20px' : '24px', fontWeight: '600', color: '#dc3545' }}>
                  {formatCurrency(summaryData.totalCost, summaryData.totalCostMN)}
                </div>
              </div>
              <div style={{
                padding: '20px',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px',
                border: '1px solid #e9ecef'
              }}>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>💵 Ganancia Bruta</div>
                <div style={{ fontSize: currency === 'BOTH' ? '20px' : '24px', fontWeight: '600', color: '#007bff' }}>
                  {formatCurrency(summaryData.totalProfit, summaryData.totalProfitMN)}
                </div>
              </div>
              <div style={{
                padding: '20px',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px',
                border: '1px solid #e9ecef'
              }}>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>📊 Margen de Ganancia</div>
                <div style={{ fontSize: '24px', fontWeight: '600', color: getMarginColor(summaryData.profitMargin) }}>
                  {summaryData.profitMargin.toFixed(2)}%
                </div>
              </div>
              <div style={{
                padding: '20px',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px',
                border: '1px solid #e9ecef'
              }}>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>📦 Total Ventas</div>
                <div style={{ fontSize: '24px', fontWeight: '600', color: '#6c757d' }}>
                  {summaryData.totalSales}
                </div>
              </div>
              <div style={{
                padding: '20px',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px',
                border: '1px solid #e9ecef'
              }}>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>🔢 Items Vendidos</div>
                <div style={{ fontSize: '24px', fontWeight: '600', color: '#6c757d' }}>
                  {summaryData.totalItemsSold}
                </div>
              </div>
            </div>
          </div>
        )}

        {!loading && activeTab === 'medicine' && (
          <div>
            <h3 style={{ marginTop: 0, marginBottom: '16px', fontSize: '18px', color: '#2c3e50' }}>
              💊 Rentabilidad por Medicamento
            </h3>
            {medicineData.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                No hay datos en el período seleccionado
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                      <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: '600' }}>Código</th>
                      <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: '600' }}>Medicamento</th>
                      <th style={{ padding: '12px 8px', textAlign: 'right', fontWeight: '600' }}>Vendidos</th>
                      <th style={{ padding: '12px 8px', textAlign: 'right', fontWeight: '600' }}>Costo Total</th>
                      <th style={{ padding: '12px 8px', textAlign: 'right', fontWeight: '600' }}>Ingreso Total</th>
                      <th style={{ padding: '12px 8px', textAlign: 'right', fontWeight: '600' }}>Ganancia</th>
                      <th style={{ padding: '12px 8px', textAlign: 'right', fontWeight: '600' }}>Margen %</th>
                      <th style={{ padding: '12px 8px', textAlign: 'center', fontWeight: '600' }}>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {medicineData.map((med, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #dee2e6' }}>
                        <td style={{ padding: '12px 8px' }}>{med.medicineCode}</td>
                        <td style={{ padding: '12px 8px' }}>{med.medicineName}</td>
                        <td style={{ padding: '12px 8px', textAlign: 'right' }}>{med.quantitySold}</td>
                        <td style={{ padding: '12px 8px', textAlign: 'right', fontSize: currency === 'BOTH' ? '11px' : '12px' }}>
                          {formatCurrency(med.totalCost, med.totalCostMN)}
                        </td>
                        <td style={{ padding: '12px 8px', textAlign: 'right', fontSize: currency === 'BOTH' ? '11px' : '12px' }}>
                          {formatCurrency(med.totalRevenue, med.totalRevenueMN)}
                        </td>
                        <td style={{ padding: '12px 8px', textAlign: 'right', color: med.profit >= 0 ? '#28a745' : '#dc3545', fontWeight: '600', fontSize: currency === 'BOTH' ? '11px' : '12px' }}>
                          {formatCurrency(med.profit, med.profitMN)}
                        </td>
                        <td style={{ padding: '12px 8px', textAlign: 'right', color: getMarginColor(med.profitMargin), fontWeight: '600' }}>
                          {med.profitMargin.toFixed(2)}%
                        </td>
                        <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                          <span style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: '600',
                            backgroundColor: med.status === 'high' ? '#d4edda' : med.status === 'medium' ? '#d1ecf1' : med.status === 'low' ? '#fff3cd' : '#f8d7da',
                            color: med.status === 'high' ? '#155724' : med.status === 'medium' ? '#0c5460' : med.status === 'low' ? '#856404' : '#721c24'
                          }}>
                            {med.status === 'high' ? 'Alto' : med.status === 'medium' ? 'Medio' : med.status === 'low' ? 'Bajo' : 'Negativo'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {!loading && activeTab === 'customer' && (
          <div>
            <h3 style={{ marginTop: 0, marginBottom: '16px', fontSize: '18px', color: '#2c3e50' }}>
              👥 Rentabilidad por Cliente
            </h3>
            {customerData.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                No hay datos en el período seleccionado
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                      <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: '600' }}>Cliente</th>
                      <th style={{ padding: '12px 8px', textAlign: 'right', fontWeight: '600' }}>Compras</th>
                      <th style={{ padding: '12px 8px', textAlign: 'right', fontWeight: '600' }}>Costo Total</th>
                      <th style={{ padding: '12px 8px', textAlign: 'right', fontWeight: '600' }}>Ingreso Total</th>
                      <th style={{ padding: '12px 8px', textAlign: 'right', fontWeight: '600' }}>Ganancia</th>
                      <th style={{ padding: '12px 8px', textAlign: 'right', fontWeight: '600' }}>Margen %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customerData.map((cust, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #dee2e6' }}>
                        <td style={{ padding: '12px 8px' }}>{cust.customerName}</td>
                        <td style={{ padding: '12px 8px', textAlign: 'right' }}>{cust.totalSales}</td>
                        <td style={{ padding: '12px 8px', textAlign: 'right', fontSize: currency === 'BOTH' ? '11px' : '12px' }}>
                          {formatCurrency(cust.totalCost, cust.totalCostMN)}
                        </td>
                        <td style={{ padding: '12px 8px', textAlign: 'right', fontSize: currency === 'BOTH' ? '11px' : '12px' }}>
                          {formatCurrency(cust.totalRevenue, cust.totalRevenueMN)}
                        </td>
                        <td style={{ padding: '12px 8px', textAlign: 'right', color: cust.profit >= 0 ? '#28a745' : '#dc3545', fontWeight: '600', fontSize: currency === 'BOTH' ? '11px' : '12px' }}>
                          {formatCurrency(cust.profit, cust.profitMN)}
                        </td>
                        <td style={{ padding: '12px 8px', textAlign: 'right', color: getMarginColor(cust.profitMargin), fontWeight: '600' }}>
                          {cust.profitMargin.toFixed(2)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {!loading && activeTab === 'supplier' && (
          <div>
            <h3 style={{ marginTop: 0, marginBottom: '16px', fontSize: '18px', color: '#2c3e50' }}>
              🏢 Rentabilidad por Proveedor
            </h3>
            {supplierData.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                No hay datos en el período seleccionado
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                      <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: '600' }}>Proveedor</th>
                      <th style={{ padding: '12px 8px', textAlign: 'right', fontWeight: '600' }}>Costo Total</th>
                      <th style={{ padding: '12px 8px', textAlign: 'right', fontWeight: '600' }}>Ingreso Total</th>
                      <th style={{ padding: '12px 8px', textAlign: 'right', fontWeight: '600' }}>Ganancia</th>
                      <th style={{ padding: '12px 8px', textAlign: 'right', fontWeight: '600' }}>ROI %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {supplierData.map((supp, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #dee2e6' }}>
                        <td style={{ padding: '12px 8px' }}>{supp.supplierName}</td>
                        <td style={{ padding: '12px 8px', textAlign: 'right', fontSize: currency === 'BOTH' ? '11px' : '12px' }}>
                          {formatCurrency(supp.totalCost, supp.totalCostMN)}
                        </td>
                        <td style={{ padding: '12px 8px', textAlign: 'right', fontSize: currency === 'BOTH' ? '11px' : '12px' }}>
                          {formatCurrency(supp.totalRevenue, supp.totalRevenueMN)}
                        </td>
                        <td style={{ padding: '12px 8px', textAlign: 'right', color: supp.profit >= 0 ? '#28a745' : '#dc3545', fontWeight: '600', fontSize: currency === 'BOTH' ? '11px' : '12px' }}>
                          {formatCurrency(supp.profit, supp.profitMN)}
                        </td>
                        <td style={{ padding: '12px 8px', textAlign: 'right', color: getMarginColor(supp.roi), fontWeight: '600' }}>
                          {supp.roi.toFixed(2)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {!loading && activeTab === 'alerts' && (
          <div>
            <h3 style={{ marginTop: 0, marginBottom: '16px', fontSize: '18px', color: '#2c3e50' }}>
              ⚠️ Alertas de Margen Bajo
            </h3>
            {alertsData.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#28a745' }}>
                ✅ No hay medicamentos con margen bajo en este período
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                      <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: '600' }}>Código</th>
                      <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: '600' }}>Medicamento</th>
                      <th style={{ padding: '12px 8px', textAlign: 'right', fontWeight: '600' }}>Margen %</th>
                      <th style={{ padding: '12px 8px', textAlign: 'center', fontWeight: '600' }}>Estado</th>
                      <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: '600' }}>Alerta</th>
                    </tr>
                  </thead>
                  <tbody>
                    {alertsData.map((alert, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #dee2e6', backgroundColor: alert.status === 'negative' ? '#f8d7da' : '#fff3cd' }}>
                        <td style={{ padding: '12px 8px' }}>{alert.medicineCode}</td>
                        <td style={{ padding: '12px 8px' }}>{alert.medicineName}</td>
                        <td style={{ padding: '12px 8px', textAlign: 'right', color: getMarginColor(alert.profitMargin), fontWeight: '600' }}>
                          {alert.profitMargin.toFixed(2)}%
                        </td>
                        <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                          <span style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: '600',
                            backgroundColor: alert.status === 'negative' ? '#f8d7da' : '#fff3cd',
                            color: alert.status === 'negative' ? '#721c24' : '#856404'
                          }}>
                            {alert.status === 'negative' ? '🔴 Negativo' : '🟡 Bajo'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 8px' }}>{alert.alert}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfitabilityAnalysis;

