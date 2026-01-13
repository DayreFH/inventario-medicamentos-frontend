import { useState, useEffect } from 'react';
import api from '../api/http';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const ExecutiveReports = () => {
  // Estados para tabs
  const [activeSubTab, setActiveSubTab] = useState('monthly'); // monthly | comparative

  // Estados para Facturación Mensual
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [monthlyData, setMonthlyData] = useState(null);
  const [loadingMonthly, setLoadingMonthly] = useState(false);
  const [currencyMonthly, setCurrencyMonthly] = useState('BOTH'); // USD | MN | BOTH

  // Estados para Análisis Comparativo
  const [period1Start, setPeriod1Start] = useState('');
  const [period1End, setPeriod1End] = useState('');
  const [period2Start, setPeriod2Start] = useState('');
  const [period2End, setPeriod2End] = useState('');
  const [comparativeData, setComparativeData] = useState(null);
  const [loadingComparative, setLoadingComparative] = useState(false);
  const [currencyComparative, setCurrencyComparative] = useState('BOTH'); // USD | MN | BOTH

  // Cargar facturación mensual al cambiar año
  useEffect(() => {
    if (activeSubTab === 'monthly') {
      loadMonthlyInvoicing();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedYear, activeSubTab]);

  // Inicializar fechas para comparativo
  useEffect(() => {
    if (activeSubTab === 'comparative' && !period1Start) {
      const today = new Date();
      const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      const thisMonthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);

      setPeriod1Start(thisMonthStart.toISOString().split('T')[0]);
      setPeriod1End(thisMonthEnd.toISOString().split('T')[0]);
      setPeriod2Start(lastMonthStart.toISOString().split('T')[0]);
      setPeriod2End(lastMonthEnd.toISOString().split('T')[0]);
    }
  }, [activeSubTab, period1Start]);

  const loadMonthlyInvoicing = async () => {
    setLoadingMonthly(true);
    try {
      const { data } = await api.get('/reports/monthly-invoicing', {
        params: { year: selectedYear }
      });
      setMonthlyData(data);
    } catch (error) {
      console.error('Error cargando facturación mensual:', error);
      setMonthlyData(null);
    } finally {
      setLoadingMonthly(false);
    }
  };

  const loadComparativeAnalysis = async () => {
    if (!period1Start || !period1End || !period2Start || !period2End) {
      alert('Por favor completa todas las fechas');
      return;
    }

    setLoadingComparative(true);
    try {
      const { data } = await api.get('/reports/comparative-analysis', {
        params: {
          period1Start,
          period1End,
          period2Start,
          period2End
        }
      });
      setComparativeData(data);
    } catch (error) {
      console.error('Error cargando análisis comparativo:', error);
      alert('Error al cargar análisis comparativo');
      setComparativeData(null);
    } finally {
      setLoadingComparative(false);
    }
  };

  const formatCurrency = (value, type = 'USD') => {
    const currencySymbol = type === 'USD' ? 'USD $' : 'MN $';
    return `${currencySymbol}${new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value || 0)}`;
  };

  const formatBothCurrencies = (valueUSD, valueMN) => {
    return (
      <div>
        <div style={{ fontSize: '20px', color: '#3b82f6' }}>{formatCurrency(valueUSD, 'USD')}</div>
        <div style={{ fontSize: '16px', color: '#f59e0b', marginTop: '4px' }}>
          {formatCurrency(valueMN, 'MN')}
        </div>
      </div>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Generar años disponibles (últimos 5 años)
  const availableYears = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  // Datos para gráfico de líneas (Facturación Mensual)
  const monthlyChartData = monthlyData ? {
    labels: monthlyData.monthlyData.map(m => m.monthName),
    datasets: currencyMonthly === 'BOTH' ? [
      {
        label: 'Total Facturado USD',
        data: monthlyData.monthlyData.map(m => m.totalUSD || 0),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4
      },
      {
        label: 'Total Facturado MN',
        data: monthlyData.monthlyData.map(m => m.totalMN || 0),
        borderColor: 'rgb(245, 158, 11)',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        tension: 0.4
      }
    ] : [
      {
        label: `Total Facturado ${currencyMonthly}`,
        data: monthlyData.monthlyData.map(m => 
          currencyMonthly === 'USD' ? (m.totalUSD || 0) : (m.totalMN || 0)
        ),
        borderColor: currencyMonthly === 'USD' ? 'rgb(59, 130, 246)' : 'rgb(245, 158, 11)',
        backgroundColor: currencyMonthly === 'USD' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(245, 158, 11, 0.1)',
        tension: 0.4
      }
    ]
  } : null;

  const monthlyChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top'
      },
      title: {
        display: true,
        text: `Facturación Mensual ${selectedYear}`
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return '$' + value.toLocaleString();
          }
        }
      }
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      {/* Sub-tabs */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '24px',
        borderBottom: '2px solid #e2e8f0',
        paddingBottom: '8px'
      }}>
        <button
          onClick={() => setActiveSubTab('monthly')}
          style={{
            padding: '10px 20px',
            border: 'none',
            backgroundColor: activeSubTab === 'monthly' ? '#3b82f6' : 'transparent',
            color: activeSubTab === 'monthly' ? 'white' : '#64748b',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: activeSubTab === 'monthly' ? '600' : '400',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          📅 Facturación Mensual
        </button>
        <button
          onClick={() => setActiveSubTab('comparative')}
          style={{
            padding: '10px 20px',
            border: 'none',
            backgroundColor: activeSubTab === 'comparative' ? '#3b82f6' : 'transparent',
            color: activeSubTab === 'comparative' ? 'white' : '#64748b',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: activeSubTab === 'comparative' ? '600' : '400',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          📊 Análisis Comparativo
        </button>
      </div>

      {/* FACTURACIÓN MENSUAL */}
      {activeSubTab === 'monthly' && (
        <div>
          {/* Selector de año y moneda */}
          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            marginBottom: '24px',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#475569', marginBottom: '8px' }}>
                  Seleccionar Año
                </label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                >
                  {availableYears.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#475569', marginBottom: '8px' }}>
                  Moneda
                </label>
                <select
                  value={currencyMonthly}
                  onChange={(e) => setCurrencyMonthly(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                >
                  <option value="BOTH">💵💴 Ambas</option>
                  <option value="USD">💵 USD</option>
                  <option value="MN">💴 MN</option>
                </select>
              </div>
            </div>
          </div>

          {loadingMonthly ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
              Cargando facturación mensual...
            </div>
          ) : monthlyData ? (
            <div style={{ display: 'grid', gap: '24px' }}>
              {/* Resumen del año */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                <div style={{
                  backgroundColor: 'white',
                  padding: '20px',
                  borderRadius: '8px',
                  border: '2px solid #3b82f6'
                }}>
                  <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '8px' }}>
                    💰 Total Facturado {selectedYear}
                  </div>
                  <div style={{ fontSize: currencyMonthly === 'BOTH' ? '20px' : '28px', fontWeight: '700', color: '#3b82f6' }}>
                    {currencyMonthly === 'BOTH' 
                      ? formatBothCurrencies(monthlyData.yearTotal.totalUSD || 0, monthlyData.yearTotal.totalMN || 0)
                      : formatCurrency(
                          currencyMonthly === 'USD' ? monthlyData.yearTotal.totalUSD : monthlyData.yearTotal.totalMN,
                          currencyMonthly
                        )
                    }
                  </div>
                  {currencyMonthly === 'USD' && monthlyData.comparison.growthPercentageUSD !== 0 && (
                    <div style={{
                      fontSize: '12px',
                      color: monthlyData.comparison.growthPercentageUSD > 0 ? '#10b981' : '#ef4444',
                      marginTop: '4px'
                    }}>
                      {monthlyData.comparison.growthPercentageUSD > 0 ? '↑' : '↓'} {Math.abs(monthlyData.comparison.growthPercentageUSD)}% vs {monthlyData.comparison.previousYear}
                    </div>
                  )}
                  {currencyMonthly === 'MN' && monthlyData.comparison.growthPercentageMN !== 0 && (
                    <div style={{
                      fontSize: '12px',
                      color: monthlyData.comparison.growthPercentageMN > 0 ? '#10b981' : '#ef4444',
                      marginTop: '4px'
                    }}>
                      {monthlyData.comparison.growthPercentageMN > 0 ? '↑' : '↓'} {Math.abs(monthlyData.comparison.growthPercentageMN)}% vs {monthlyData.comparison.previousYear}
                    </div>
                  )}
                  {currencyMonthly === 'BOTH' && (
                    <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                      <div>USD: {monthlyData.comparison.growthPercentageUSD > 0 ? '↑' : '↓'} {Math.abs(monthlyData.comparison.growthPercentageUSD)}%</div>
                      <div>MN: {monthlyData.comparison.growthPercentageMN > 0 ? '↑' : '↓'} {Math.abs(monthlyData.comparison.growthPercentageMN)}%</div>
                    </div>
                  )}
                </div>

                <div style={{
                  backgroundColor: 'white',
                  padding: '20px',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0'
                }}>
                  <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '8px' }}>
                    📄 Facturas Emitidas
                  </div>
                  <div style={{ fontSize: currencyMonthly === 'BOTH' ? '20px' : '28px', fontWeight: '700', color: '#1e293b' }}>
                    {currencyMonthly === 'BOTH' 
                      ? (
                        <div>
                          <div style={{ fontSize: '20px', color: '#3b82f6' }}>USD: {monthlyData.yearTotal.invoiceCountUSD || 0}</div>
                          <div style={{ fontSize: '16px', color: '#f59e0b', marginTop: '4px' }}>MN: {monthlyData.yearTotal.invoiceCountMN || 0}</div>
                        </div>
                      )
                      : (currencyMonthly === 'USD' ? monthlyData.yearTotal.invoiceCountUSD : monthlyData.yearTotal.invoiceCountMN) || 0
                    }
                  </div>
                </div>

                <div style={{
                  backgroundColor: 'white',
                  padding: '20px',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0'
                }}>
                  <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '8px' }}>
                    🏛️ ITBIS Cobrado
                  </div>
                  <div style={{ fontSize: currencyMonthly === 'BOTH' ? '20px' : '28px', fontWeight: '700', color: '#1e293b' }}>
                    {currencyMonthly === 'BOTH' 
                      ? formatBothCurrencies(monthlyData.yearTotal.itbisAmountUSD || 0, monthlyData.yearTotal.itbisAmountMN || 0)
                      : formatCurrency(
                          currencyMonthly === 'USD' ? monthlyData.yearTotal.itbisAmountUSD : monthlyData.yearTotal.itbisAmountMN,
                          currencyMonthly
                        )
                    }
                  </div>
                </div>

                <div style={{
                  backgroundColor: 'white',
                  padding: '20px',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0'
                }}>
                  <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '8px' }}>
                    🎁 Descuentos Aplicados
                  </div>
                  <div style={{ fontSize: currencyMonthly === 'BOTH' ? '20px' : '28px', fontWeight: '700', color: '#ef4444' }}>
                    {currencyMonthly === 'BOTH' 
                      ? formatBothCurrencies(monthlyData.yearTotal.discountAmountUSD || 0, monthlyData.yearTotal.discountAmountMN || 0)
                      : formatCurrency(
                          currencyMonthly === 'USD' ? monthlyData.yearTotal.discountAmountUSD : monthlyData.yearTotal.discountAmountMN,
                          currencyMonthly
                        )
                    }
                  </div>
                </div>
              </div>

              {/* Gráfico de líneas */}
              <div style={{
                backgroundColor: 'white',
                padding: '20px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                height: '400px'
              }}>
                {monthlyChartData && (
                  <Line data={monthlyChartData} options={monthlyChartOptions} />
                )}
              </div>

              {/* Tabla mensual */}
              <div style={{
                backgroundColor: 'white',
                padding: '20px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0'
              }}>
                <h4 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600', color: '#1e293b' }}>
                  Detalle Mensual
                </h4>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ backgroundColor: '#f8fafc' }}>
                      <tr>
                        <th style={{ padding: '10px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#475569', borderBottom: '1px solid #e2e8f0' }}>
                          Mes
                        </th>
                        <th style={{ padding: '10px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: '#475569', borderBottom: '1px solid #e2e8f0' }}>
                          Facturas
                        </th>
                        <th style={{ padding: '10px', textAlign: 'right', fontSize: '12px', fontWeight: '600', color: '#475569', borderBottom: '1px solid #e2e8f0' }}>
                          Subtotal
                        </th>
                        <th style={{ padding: '10px', textAlign: 'right', fontSize: '12px', fontWeight: '600', color: '#475569', borderBottom: '1px solid #e2e8f0' }}>
                          ITBIS
                        </th>
                        <th style={{ padding: '10px', textAlign: 'right', fontSize: '12px', fontWeight: '600', color: '#475569', borderBottom: '1px solid #e2e8f0' }}>
                          Descuento
                        </th>
                        <th style={{ padding: '10px', textAlign: 'right', fontSize: '12px', fontWeight: '600', color: '#475569', borderBottom: '1px solid #e2e8f0' }}>
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {monthlyData.monthlyData.map((month, index) => (
                        <tr key={index} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '10px', fontSize: '14px', color: '#475569', textTransform: 'capitalize' }}>
                            {month.monthName}
                          </td>
                          <td style={{ padding: '10px', fontSize: '14px', color: '#1e293b', textAlign: 'center', fontWeight: '600' }}>
                            {currencyMonthly === 'BOTH' 
                              ? `${month.invoiceCountUSD || 0} / ${month.invoiceCountMN || 0}`
                              : (currencyMonthly === 'USD' ? month.invoiceCountUSD : month.invoiceCountMN) || 0
                            }
                          </td>
                          <td style={{ padding: '10px', fontSize: currencyMonthly === 'BOTH' ? '11px' : '14px', color: '#475569', textAlign: 'right' }}>
                            {currencyMonthly === 'BOTH' 
                              ? (
                                <div>
                                  <div>{formatCurrency(month.subtotalUSD || 0, 'USD')}</div>
                                  <div style={{ color: '#f59e0b' }}>{formatCurrency(month.subtotalMN || 0, 'MN')}</div>
                                </div>
                              )
                              : formatCurrency(
                                  currencyMonthly === 'USD' ? month.subtotalUSD : month.subtotalMN,
                                  currencyMonthly
                                )
                            }
                          </td>
                          <td style={{ padding: '10px', fontSize: currencyMonthly === 'BOTH' ? '11px' : '14px', color: '#475569', textAlign: 'right' }}>
                            {currencyMonthly === 'BOTH' 
                              ? (
                                <div>
                                  <div>{formatCurrency(month.itbisAmountUSD || 0, 'USD')}</div>
                                  <div style={{ color: '#f59e0b' }}>{formatCurrency(month.itbisAmountMN || 0, 'MN')}</div>
                                </div>
                              )
                              : formatCurrency(
                                  currencyMonthly === 'USD' ? month.itbisAmountUSD : month.itbisAmountMN,
                                  currencyMonthly
                                )
                            }
                          </td>
                          <td style={{ padding: '10px', fontSize: currencyMonthly === 'BOTH' ? '11px' : '14px', color: '#ef4444', textAlign: 'right' }}>
                            {currencyMonthly === 'BOTH' 
                              ? (
                                <div>
                                  <div>{formatCurrency(month.discountAmountUSD || 0, 'USD')}</div>
                                  <div style={{ color: '#f59e0b' }}>{formatCurrency(month.discountAmountMN || 0, 'MN')}</div>
                                </div>
                              )
                              : formatCurrency(
                                  currencyMonthly === 'USD' ? month.discountAmountUSD : month.discountAmountMN,
                                  currencyMonthly
                                )
                            }
                          </td>
                          <td style={{ padding: '10px', fontSize: currencyMonthly === 'BOTH' ? '11px' : '14px', color: '#10b981', textAlign: 'right', fontWeight: '600' }}>
                            {currencyMonthly === 'BOTH' 
                              ? (
                                <div>
                                  <div>{formatCurrency(month.totalUSD || 0, 'USD')}</div>
                                  <div style={{ color: '#f59e0b' }}>{formatCurrency(month.totalMN || 0, 'MN')}</div>
                                </div>
                              )
                              : formatCurrency(
                                  currencyMonthly === 'USD' ? month.totalUSD : month.totalMN,
                                  currencyMonthly
                                )
                            }
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
              No hay datos de facturación para el año seleccionado
            </div>
          )}
        </div>
      )}

      {/* ANÁLISIS COMPARATIVO */}
      {activeSubTab === 'comparative' && (
        <div>
          {/* Filtros de períodos */}
          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            marginBottom: '24px',
            border: '1px solid #e2e8f0'
          }}>
            {/* Selector de moneda */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#475569', marginBottom: '8px' }}>
                Moneda
              </label>
              <select
                value={currencyComparative}
                onChange={(e) => setCurrencyComparative(e.target.value)}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  fontSize: '14px',
                  minWidth: '200px'
                }}
              >
                <option value="BOTH">💵💴 Ambas</option>
                <option value="USD">💵 USD</option>
                <option value="MN">💴 MN</option>
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '16px' }}>
              {/* Período 1 */}
              <div>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '600', color: '#3b82f6' }}>
                  📅 Período 1 (Actual)
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: '#475569', marginBottom: '6px' }}>
                      Fecha Inicio
                    </label>
                    <input
                      type="date"
                      value={period1Start}
                      onChange={(e) => setPeriod1Start(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px',
                        border: '1px solid #cbd5e1',
                        borderRadius: '6px',
                        fontSize: '14px',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: '#475569', marginBottom: '6px' }}>
                      Fecha Fin
                    </label>
                    <input
                      type="date"
                      value={period1End}
                      onChange={(e) => setPeriod1End(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px',
                        border: '1px solid #cbd5e1',
                        borderRadius: '6px',
                        fontSize: '14px',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Período 2 */}
              <div>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '600', color: '#64748b' }}>
                  📅 Período 2 (Comparación)
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: '#475569', marginBottom: '6px' }}>
                      Fecha Inicio
                    </label>
                    <input
                      type="date"
                      value={period2Start}
                      onChange={(e) => setPeriod2Start(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px',
                        border: '1px solid #cbd5e1',
                        borderRadius: '6px',
                        fontSize: '14px',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: '#475569', marginBottom: '6px' }}>
                      Fecha Fin
                    </label>
                    <input
                      type="date"
                      value={period2End}
                      onChange={(e) => setPeriod2End(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px',
                        border: '1px solid #cbd5e1',
                        borderRadius: '6px',
                        fontSize: '14px',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={loadComparativeAnalysis}
              disabled={loadingComparative}
              style={{
                padding: '10px 24px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: loadingComparative ? 'not-allowed' : 'pointer',
                opacity: loadingComparative ? 0.6 : 1
              }}
            >
              {loadingComparative ? 'Analizando...' : '🔍 Comparar Períodos'}
            </button>
          </div>

          {loadingComparative ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
              Analizando períodos...
            </div>
          ) : comparativeData ? (
            <div style={{ display: 'grid', gap: '24px' }}>
              {/* Tarjetas de comparación */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
                {/* Facturación */}
                <div style={{
                  backgroundColor: 'white',
                  padding: '20px',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0'
                }}>
                  <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '12px' }}>
                    💰 Facturación Total {currencyComparative !== 'BOTH' && `(${currencyComparative})`}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div>
                      <div style={{ fontSize: '11px', color: '#3b82f6', marginBottom: '4px' }}>Período 1</div>
                      <div style={{ fontSize: currencyComparative === 'BOTH' ? '14px' : '20px', fontWeight: '700', color: '#1e293b' }}>
                        {currencyComparative === 'BOTH' ? (
                          <div>
                            <div style={{ color: '#3b82f6' }}>{formatCurrency(comparativeData.period1.data.invoices.totalUSD || 0, 'USD')}</div>
                            <div style={{ color: '#f59e0b', fontSize: '12px' }}>{formatCurrency(comparativeData.period1.data.invoices.totalMN || 0, 'MN')}</div>
                          </div>
                        ) : formatCurrency(
                          currencyComparative === 'USD' ? comparativeData.period1.data.invoices.totalUSD : comparativeData.period1.data.invoices.totalMN,
                          currencyComparative
                        )}
                      </div>
                    </div>
                    <div style={{ fontSize: '24px' }}>
                      {(currencyComparative === 'USD' ? comparativeData.comparison.invoices.totalUSD?.percentage : 
                        currencyComparative === 'MN' ? comparativeData.comparison.invoices.totalMN?.percentage :
                        comparativeData.comparison.invoices.total.percentage) > 0 ? '📈' : '📉'}
                    </div>
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>Período 2</div>
                  <div style={{ fontSize: currencyComparative === 'BOTH' ? '12px' : '16px', fontWeight: '600', color: '#64748b', marginBottom: '8px' }}>
                    {currencyComparative === 'BOTH' ? (
                      <div>
                        <div style={{ color: '#3b82f6' }}>{formatCurrency(comparativeData.period2.data.invoices.totalUSD || 0, 'USD')}</div>
                        <div style={{ color: '#f59e0b', fontSize: '11px' }}>{formatCurrency(comparativeData.period2.data.invoices.totalMN || 0, 'MN')}</div>
                      </div>
                    ) : formatCurrency(
                      currencyComparative === 'USD' ? comparativeData.period2.data.invoices.totalUSD : comparativeData.period2.data.invoices.totalMN,
                      currencyComparative
                    )}
                  </div>
                  <div style={{
                    padding: '8px',
                    backgroundColor: (currencyComparative === 'USD' ? comparativeData.comparison.invoices.totalUSD?.percentage : 
                      currencyComparative === 'MN' ? comparativeData.comparison.invoices.totalMN?.percentage :
                      comparativeData.comparison.invoices.total.percentage) > 0 ? '#dcfce7' : '#fee2e2',
                    borderRadius: '4px',
                    textAlign: 'center'
                  }}>
                    {currencyComparative === 'BOTH' ? (
                      <div style={{ fontSize: '12px', fontWeight: '700' }}>
                        <div style={{ color: comparativeData.comparison.invoices.totalUSD?.percentage > 0 ? '#166534' : '#991b1b' }}>
                          USD: {comparativeData.comparison.invoices.totalUSD?.percentage > 0 ? '+' : ''}{comparativeData.comparison.invoices.totalUSD?.percentage}%
                        </div>
                        <div style={{ color: comparativeData.comparison.invoices.totalMN?.percentage > 0 ? '#166534' : '#991b1b', marginTop: '4px' }}>
                          MN: {comparativeData.comparison.invoices.totalMN?.percentage > 0 ? '+' : ''}{comparativeData.comparison.invoices.totalMN?.percentage}%
                        </div>
                      </div>
                    ) : (
                      <span style={{
                        fontSize: '14px',
                        fontWeight: '700',
                        color: (currencyComparative === 'USD' ? comparativeData.comparison.invoices.totalUSD?.percentage : comparativeData.comparison.invoices.totalMN?.percentage) > 0 ? '#166534' : '#991b1b'
                      }}>
                        {(currencyComparative === 'USD' ? comparativeData.comparison.invoices.totalUSD?.percentage : comparativeData.comparison.invoices.totalMN?.percentage) > 0 ? '+' : ''}
                        {currencyComparative === 'USD' ? comparativeData.comparison.invoices.totalUSD?.percentage : comparativeData.comparison.invoices.totalMN?.percentage}%
                      </span>
                    )}
                  </div>
                </div>

                {/* Ventas */}
                <div style={{
                  backgroundColor: 'white',
                  padding: '20px',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0'
                }}>
                  <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '12px' }}>
                    🛒 Número de Ventas {currencyComparative !== 'BOTH' && `(${currencyComparative})`}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div>
                      <div style={{ fontSize: '11px', color: '#3b82f6', marginBottom: '4px' }}>Período 1</div>
                      <div style={{ fontSize: currencyComparative === 'BOTH' ? '14px' : '20px', fontWeight: '700', color: '#1e293b' }}>
                        {currencyComparative === 'BOTH' ? (
                          <div>
                            <div style={{ color: '#3b82f6' }}>USD: {comparativeData.period1.data.sales.countUSD || 0}</div>
                            <div style={{ color: '#f59e0b', fontSize: '12px' }}>MN: {comparativeData.period1.data.sales.countMN || 0}</div>
                          </div>
                        ) : (currencyComparative === 'USD' ? comparativeData.period1.data.sales.countUSD : comparativeData.period1.data.sales.countMN) || 0}
                      </div>
                    </div>
                    <div style={{ fontSize: '24px' }}>
                      {(currencyComparative === 'USD' ? comparativeData.comparison.sales.countUSD?.percentage : 
                        currencyComparative === 'MN' ? comparativeData.comparison.sales.countMN?.percentage :
                        comparativeData.comparison.sales.count.percentage) > 0 ? '📈' : '📉'}
                    </div>
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>Período 2</div>
                  <div style={{ fontSize: currencyComparative === 'BOTH' ? '12px' : '16px', fontWeight: '600', color: '#64748b', marginBottom: '8px' }}>
                    {currencyComparative === 'BOTH' ? (
                      <div>
                        <div style={{ color: '#3b82f6' }}>USD: {comparativeData.period2.data.sales.countUSD || 0}</div>
                        <div style={{ color: '#f59e0b', fontSize: '11px' }}>MN: {comparativeData.period2.data.sales.countMN || 0}</div>
                      </div>
                    ) : (currencyComparative === 'USD' ? comparativeData.period2.data.sales.countUSD : comparativeData.period2.data.sales.countMN) || 0}
                  </div>
                  <div style={{
                    padding: '8px',
                    backgroundColor: (currencyComparative === 'USD' ? comparativeData.comparison.sales.countUSD?.percentage : 
                      currencyComparative === 'MN' ? comparativeData.comparison.sales.countMN?.percentage :
                      comparativeData.comparison.sales.count.percentage) > 0 ? '#dcfce7' : '#fee2e2',
                    borderRadius: '4px',
                    textAlign: 'center'
                  }}>
                    {currencyComparative === 'BOTH' ? (
                      <div style={{ fontSize: '12px', fontWeight: '700' }}>
                        <div style={{ color: comparativeData.comparison.sales.countUSD?.percentage > 0 ? '#166534' : '#991b1b' }}>
                          USD: {comparativeData.comparison.sales.countUSD?.percentage > 0 ? '+' : ''}{comparativeData.comparison.sales.countUSD?.percentage}%
                        </div>
                        <div style={{ color: comparativeData.comparison.sales.countMN?.percentage > 0 ? '#166534' : '#991b1b', marginTop: '4px' }}>
                          MN: {comparativeData.comparison.sales.countMN?.percentage > 0 ? '+' : ''}{comparativeData.comparison.sales.countMN?.percentage}%
                        </div>
                      </div>
                    ) : (
                      <span style={{
                        fontSize: '14px',
                        fontWeight: '700',
                        color: (currencyComparative === 'USD' ? comparativeData.comparison.sales.countUSD?.percentage : comparativeData.comparison.sales.countMN?.percentage) > 0 ? '#166534' : '#991b1b'
                      }}>
                        {(currencyComparative === 'USD' ? comparativeData.comparison.sales.countUSD?.percentage : comparativeData.comparison.sales.countMN?.percentage) > 0 ? '+' : ''}
                        {currencyComparative === 'USD' ? comparativeData.comparison.sales.countUSD?.percentage : comparativeData.comparison.sales.countMN?.percentage}%
                      </span>
                    )}
                  </div>
                </div>

                {/* Compras */}
                <div style={{
                  backgroundColor: 'white',
                  padding: '20px',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0'
                }}>
                  <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '12px' }}>
                    📦 Compras Realizadas
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div>
                      <div style={{ fontSize: '11px', color: '#3b82f6', marginBottom: '4px' }}>Período 1</div>
                      <div style={{ fontSize: '20px', fontWeight: '700', color: '#1e293b' }}>
                        {formatCurrency(comparativeData.period1.data.purchases.totalAmount)}
                      </div>
                    </div>
                    <div style={{ fontSize: '24px' }}>
                      {comparativeData.comparison.purchases.totalAmount.percentage > 0 ? '📈' : '📉'}
                    </div>
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>Período 2</div>
                  <div style={{ fontSize: '16px', fontWeight: '600', color: '#64748b', marginBottom: '8px' }}>
                    {formatCurrency(comparativeData.period2.data.purchases.totalAmount)}
                  </div>
                  <div style={{
                    padding: '8px',
                    backgroundColor: comparativeData.comparison.purchases.totalAmount.percentage > 0 ? '#fee2e2' : '#dcfce7',
                    borderRadius: '4px',
                    textAlign: 'center'
                  }}>
                    <span style={{
                      fontSize: '14px',
                      fontWeight: '700',
                      color: comparativeData.comparison.purchases.totalAmount.percentage > 0 ? '#991b1b' : '#166534'
                    }}>
                      {comparativeData.comparison.purchases.totalAmount.percentage > 0 ? '+' : ''}
                      {comparativeData.comparison.purchases.totalAmount.percentage}%
                    </span>
                  </div>
                </div>

                {/* Clientes */}
                <div style={{
                  backgroundColor: 'white',
                  padding: '20px',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0'
                }}>
                  <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '12px' }}>
                    👥 Clientes Únicos
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div>
                      <div style={{ fontSize: '11px', color: '#3b82f6', marginBottom: '4px' }}>Período 1</div>
                      <div style={{ fontSize: '20px', fontWeight: '700', color: '#1e293b' }}>
                        {comparativeData.period1.data.customers.unique}
                      </div>
                    </div>
                    <div style={{ fontSize: '24px' }}>
                      {comparativeData.comparison.customers.unique.percentage > 0 ? '📈' : '📉'}
                    </div>
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>Período 2</div>
                  <div style={{ fontSize: '16px', fontWeight: '600', color: '#64748b', marginBottom: '8px' }}>
                    {comparativeData.period2.data.customers.unique}
                  </div>
                  <div style={{
                    padding: '8px',
                    backgroundColor: comparativeData.comparison.customers.unique.percentage > 0 ? '#dcfce7' : '#fee2e2',
                    borderRadius: '4px',
                    textAlign: 'center'
                  }}>
                    <span style={{
                      fontSize: '14px',
                      fontWeight: '700',
                      color: comparativeData.comparison.customers.unique.percentage > 0 ? '#166534' : '#991b1b'
                    }}>
                      {comparativeData.comparison.customers.unique.percentage > 0 ? '+' : ''}
                      {comparativeData.comparison.customers.unique.percentage}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Resumen textual */}
              <div style={{
                backgroundColor: 'white',
                padding: '20px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0'
              }}>
                <h4 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600', color: '#1e293b' }}>
                  📋 Resumen Comparativo
                </h4>
                <div style={{ display: 'grid', gap: '12px', fontSize: '14px', color: '#475569' }}>
                  <div>
                    <strong>Período 1:</strong> {formatDate(comparativeData.period1.start)} - {formatDate(comparativeData.period1.end)}
                  </div>
                  <div>
                    <strong>Período 2:</strong> {formatDate(comparativeData.period2.start)} - {formatDate(comparativeData.period2.end)}
                  </div>
                  <div style={{ marginTop: '8px', padding: '12px', backgroundColor: '#f8fafc', borderRadius: '6px' }}>
                    {comparativeData.comparison.invoices.total.percentage > 0 ? (
                      <span style={{ color: '#10b981' }}>
                        ✅ La facturación aumentó un <strong>{comparativeData.comparison.invoices.total.percentage}%</strong> respecto al período anterior.
                      </span>
                    ) : comparativeData.comparison.invoices.total.percentage < 0 ? (
                      <span style={{ color: '#ef4444' }}>
                        ⚠️ La facturación disminuyó un <strong>{Math.abs(comparativeData.comparison.invoices.total.percentage)}%</strong> respecto al período anterior.
                      </span>
                    ) : (
                      <span style={{ color: '#64748b' }}>
                        ➡️ La facturación se mantuvo igual en ambos períodos.
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div style={{
              backgroundColor: 'white',
              padding: '40px',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '600', color: '#1e293b' }}>
                Análisis Comparativo
              </h3>
              <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>
                Selecciona dos períodos y haz clic en "Comparar Períodos" para ver el análisis
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ExecutiveReports;

