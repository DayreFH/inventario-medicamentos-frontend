import { useEffect, useState } from 'react';
import api from '../api/http';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

// Registrar componentes de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function DashboardUnified() {
  const [period, setPeriod] = useState('today');
  const [currency, setCurrency] = useState('USD'); // 'USD' | 'MN' | 'BOTH'
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMetrics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period]);

  const loadMetrics = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/dashboard/metrics', { params: { period } });
      setMetrics(data);
    } catch (error) {
      console.error('Error cargando métricas del dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (valueUSD, valueMN) => {
    if (currency === 'USD') {
      return `$${valueUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    } else if (currency === 'MN') {
      return `$${valueMN.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    } else {
      return (
        <div>
          <div style={{ fontSize: '16px' }}>USD ${valueUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          <div style={{ fontSize: '12px', color: '#6c757d', marginTop: '2px' }}>
            MN ${valueMN.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
      );
    }
  };

  const getGrowthIcon = (growth) => {
    if (growth > 0) return '↗️';
    if (growth < 0) return '↘️';
    return '→';
  };

  const getGrowthColor = (growth) => {
    if (growth > 0) return '#28a745';
    if (growth < 0) return '#dc3545';
    return '#6c757d';
  };

  // Preparar datos del gráfico de tendencia
  const trendChartData = metrics ? {
    labels: metrics.trend.map(t => {
      const date = new Date(t.date);
      return `${date.getDate()} ${['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'][date.getMonth()]}`;
    }),
    datasets: [{
      label: currency === 'MN' ? 'Ventas (MN)' : 'Ventas (USD)',
      data: metrics.trend.map(t => currency === 'MN' ? t.revenueMN : t.revenueUSD),
      borderColor: '#007bff',
      backgroundColor: 'rgba(0, 123, 255, 0.1)',
      fill: true,
      tension: 0.4,
      pointRadius: 4,
      pointHoverRadius: 6,
      pointBackgroundColor: '#007bff',
      pointBorderColor: '#fff',
      pointBorderWidth: 2
    }]
  } : null;

  const trendChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleFont: { size: 13 },
        bodyFont: { size: 12 },
        callbacks: {
          label: function(context) {
            return `Ventas: $${context.parsed.y.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return '$' + value.toLocaleString('en-US');
          }
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    }
  };

  if (loading) {
    return (
      <div style={{
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f5f5f5'
      }}>
        <div style={{ textAlign: 'center', color: '#6c757d' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
          <div style={{ fontSize: '18px', fontWeight: '500' }}>Cargando dashboard...</div>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div style={{
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f5f5f5'
      }}>
        <div style={{ textAlign: 'center', color: '#dc3545' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
          <div style={{ fontSize: '18px', fontWeight: '500' }}>Error cargando métricas</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      height: '100%',
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#f5f5f5',
      overflow: 'hidden'
    }}>
      <div style={{
        flex: 1,
        overflowY: 'auto',
        overflowX: 'hidden',
        padding: '16px'
      }}>
        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ color: '#2c3e50', margin: 0, fontSize: '28px', fontWeight: '600', marginBottom: '8px' }}>
            📊 Dashboard Principal
          </h1>
          <p style={{ color: '#6c757d', margin: 0 }}>
            Visión general del negocio en tiempo real
          </p>
        </div>

        {/* Filtros */}
        <div style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '24px',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={() => setPeriod('today')}
            style={{
              padding: '10px 20px',
              border: '1px solid #dee2e6',
              borderRadius: '6px',
              backgroundColor: period === 'today' ? '#007bff' : 'white',
              color: period === 'today' ? 'white' : '#495057',
              cursor: 'pointer',
              fontWeight: '500',
              fontSize: '14px'
            }}
          >
            Hoy
          </button>
          <button
            onClick={() => setPeriod('week')}
            style={{
              padding: '10px 20px',
              border: '1px solid #dee2e6',
              borderRadius: '6px',
              backgroundColor: period === 'week' ? '#007bff' : 'white',
              color: period === 'week' ? 'white' : '#495057',
              cursor: 'pointer',
              fontWeight: '500',
              fontSize: '14px'
            }}
          >
            Esta Semana
          </button>
          <button
            onClick={() => setPeriod('month')}
            style={{
              padding: '10px 20px',
              border: '1px solid #dee2e6',
              borderRadius: '6px',
              backgroundColor: period === 'month' ? '#007bff' : 'white',
              color: period === 'month' ? 'white' : '#495057',
              cursor: 'pointer',
              fontWeight: '500',
              fontSize: '14px'
            }}
          >
            Este Mes
          </button>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: '14px', color: '#6c757d', fontWeight: '500' }}>Moneda:</span>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              style={{
                padding: '10px 16px',
                border: '1px solid #dee2e6',
                borderRadius: '6px',
                backgroundColor: 'white',
                cursor: 'pointer',
                fontWeight: '500',
                fontSize: '14px'
              }}
            >
              <option value="USD">💵 USD</option>
              <option value="MN">💴 MN</option>
              <option value="BOTH">💵💴 Ambas</option>
            </select>
          </div>
        </div>

        {/* Métricas Principales */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '16px',
          marginBottom: '24px'
        }}>
          {/* Ventas */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            border: '1px solid #e9ecef'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '32px', marginRight: '12px' }}>💰</span>
              <div>
                <div style={{ fontSize: '12px', color: '#6c757d', fontWeight: '500' }}>VENTAS</div>
              </div>
            </div>
            <div style={{ fontSize: currency === 'BOTH' ? '20px' : '28px', fontWeight: '700', color: '#007bff', marginBottom: '8px' }}>
              {formatCurrency(metrics.sales.totalUSD, metrics.sales.totalMN)}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', fontSize: '13px' }}>
              <span style={{ marginRight: '6px', fontSize: '16px' }}>{getGrowthIcon(metrics.sales.growthPercent)}</span>
              <span style={{ color: getGrowthColor(metrics.sales.growthPercent), fontWeight: '600' }}>
                {Math.abs(metrics.sales.growthPercent).toFixed(1)}%
              </span>
              <span style={{ color: '#6c757d', marginLeft: '6px' }}>vs período anterior</span>
            </div>
          </div>

          {/* Costos */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            border: '1px solid #e9ecef'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '32px', marginRight: '12px' }}>💸</span>
              <div>
                <div style={{ fontSize: '12px', color: '#6c757d', fontWeight: '500' }}>COSTOS</div>
              </div>
            </div>
            <div style={{ fontSize: currency === 'BOTH' ? '20px' : '28px', fontWeight: '700', color: '#dc3545', marginBottom: '8px' }}>
              {formatCurrency(metrics.costs.totalUSD, metrics.costs.totalMN)}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', fontSize: '13px' }}>
              <span style={{ marginRight: '6px', fontSize: '16px' }}>{getGrowthIcon(metrics.costs.growthPercent)}</span>
              <span style={{ color: getGrowthColor(metrics.costs.growthPercent), fontWeight: '600' }}>
                {Math.abs(metrics.costs.growthPercent).toFixed(1)}%
              </span>
              <span style={{ color: '#6c757d', marginLeft: '6px' }}>vs período anterior</span>
            </div>
          </div>

          {/* Ganancia */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            border: '1px solid #e9ecef'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '32px', marginRight: '12px' }}>💵</span>
              <div>
                <div style={{ fontSize: '12px', color: '#6c757d', fontWeight: '500' }}>GANANCIA</div>
              </div>
            </div>
            <div style={{ fontSize: currency === 'BOTH' ? '20px' : '28px', fontWeight: '700', color: '#28a745', marginBottom: '8px' }}>
              {formatCurrency(metrics.profit.totalUSD, metrics.profit.totalMN)}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', fontSize: '13px' }}>
              <span style={{ marginRight: '6px', fontSize: '16px' }}>{getGrowthIcon(metrics.profit.growthPercent)}</span>
              <span style={{ color: getGrowthColor(metrics.profit.growthPercent), fontWeight: '600' }}>
                {Math.abs(metrics.profit.growthPercent).toFixed(1)}%
              </span>
              <span style={{ color: '#6c757d', marginLeft: '6px' }}>vs período anterior</span>
            </div>
          </div>

          {/* Margen */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            border: '1px solid #e9ecef'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '32px', marginRight: '12px' }}>📊</span>
              <div>
                <div style={{ fontSize: '12px', color: '#6c757d', fontWeight: '500' }}>MARGEN</div>
              </div>
            </div>
            <div style={{ fontSize: '28px', fontWeight: '700', color: '#17a2b8', marginBottom: '8px' }}>
              {metrics.profitMargin.current.toFixed(1)}%
            </div>
            <div style={{ display: 'flex', alignItems: 'center', fontSize: '13px' }}>
              <span style={{ marginRight: '6px', fontSize: '16px' }}>{getGrowthIcon(metrics.profitMargin.growth)}</span>
              <span style={{ color: getGrowthColor(metrics.profitMargin.growth), fontWeight: '600' }}>
                {Math.abs(metrics.profitMargin.growth).toFixed(1)}pp
              </span>
              <span style={{ color: '#6c757d', marginLeft: '6px' }}>vs período anterior</span>
            </div>
          </div>
        </div>

        {/* Top Productos y Clientes */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '16px',
          marginBottom: '24px'
        }}>
          {/* Top 5 Medicamentos */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            border: '1px solid #e9ecef'
          }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600', color: '#2c3e50', display: 'flex', alignItems: 'center' }}>
              <span style={{ marginRight: '8px' }}>💊</span>
              Top 5 Medicamentos Más Vendidos
            </h3>
            {metrics.topMedicines.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px', color: '#6c757d' }}>
                Sin ventas en este período
              </div>
            ) : (
              <div>
                {metrics.topMedicines.map((med, idx) => (
                  <div key={med.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '12px 0',
                    borderBottom: idx < metrics.topMedicines.length - 1 ? '1px solid #f0f0f0' : 'none'
                  }}>
                    <div style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      backgroundColor: idx === 0 ? '#ffd700' : idx === 1 ? '#c0c0c0' : idx === 2 ? '#cd7f32' : '#e9ecef',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: '700',
                      fontSize: '12px',
                      color: idx < 3 ? 'white' : '#6c757d',
                      marginRight: '12px',
                      flexShrink: 0
                    }}>
                      {idx + 1}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: '500', color: '#2c3e50', fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {med.name}
                      </div>
                      <div style={{ fontSize: '12px', color: '#6c757d' }}>
                        {med.code}
                      </div>
                    </div>
                    <div style={{ fontWeight: '700', color: '#007bff', fontSize: '16px', marginLeft: '12px' }}>
                      {med.quantitySold}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Top 5 Clientes */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            border: '1px solid #e9ecef'
          }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600', color: '#2c3e50', display: 'flex', alignItems: 'center' }}>
              <span style={{ marginRight: '8px' }}>👥</span>
              Clientes Más Frecuentes
            </h3>
            {metrics.topCustomers.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px', color: '#6c757d' }}>
                Sin ventas en este período
              </div>
            ) : (
              <div>
                {metrics.topCustomers.map((cust, idx) => (
                  <div key={cust.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '12px 0',
                    borderBottom: idx < metrics.topCustomers.length - 1 ? '1px solid #f0f0f0' : 'none'
                  }}>
                    <div style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      backgroundColor: idx === 0 ? '#ffd700' : idx === 1 ? '#c0c0c0' : idx === 2 ? '#cd7f32' : '#e9ecef',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: '700',
                      fontSize: '12px',
                      color: idx < 3 ? 'white' : '#6c757d',
                      marginRight: '12px',
                      flexShrink: 0
                    }}>
                      {idx + 1}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: '500', color: '#2c3e50', fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {cust.name}
                      </div>
                    </div>
                    <div style={{ fontWeight: '700', color: '#28a745', fontSize: '16px', marginLeft: '12px' }}>
                      {cust.purchaseCount} {cust.purchaseCount === 1 ? 'compra' : 'compras'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Alertas Críticas */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          border: '1px solid #e9ecef',
          marginBottom: '24px'
        }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600', color: '#2c3e50', display: 'flex', alignItems: 'center' }}>
            <span style={{ marginRight: '8px' }}>⚠️</span>
            Alertas Críticas
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '12px'
          }}>
            <div style={{
              padding: '16px',
              borderRadius: '8px',
              backgroundColor: metrics.alerts.lowStock > 0 ? '#fff3cd' : '#d4edda',
              border: `1px solid ${metrics.alerts.lowStock > 0 ? '#ffc107' : '#28a745'}`
            }}>
              <div style={{ fontSize: '24px', fontWeight: '700', color: metrics.alerts.lowStock > 0 ? '#856404' : '#155724', marginBottom: '4px' }}>
                {metrics.alerts.lowStock}
              </div>
              <div style={{ fontSize: '13px', color: metrics.alerts.lowStock > 0 ? '#856404' : '#155724', fontWeight: '500' }}>
                🔴 Stock Crítico
              </div>
            </div>
            <div style={{
              padding: '16px',
              borderRadius: '8px',
              backgroundColor: metrics.alerts.expiringSoon > 0 ? '#fff3cd' : '#d4edda',
              border: `1px solid ${metrics.alerts.expiringSoon > 0 ? '#ffc107' : '#28a745'}`
            }}>
              <div style={{ fontSize: '24px', fontWeight: '700', color: metrics.alerts.expiringSoon > 0 ? '#856404' : '#155724', marginBottom: '4px' }}>
                {metrics.alerts.expiringSoon}
              </div>
              <div style={{ fontSize: '13px', color: metrics.alerts.expiringSoon > 0 ? '#856404' : '#155724', fontWeight: '500' }}>
                🟡 Próximos a Caducar
              </div>
            </div>
            <div style={{
              padding: '16px',
              borderRadius: '8px',
              backgroundColor: metrics.alerts.negativeMargin > 0 ? '#f8d7da' : '#d4edda',
              border: `1px solid ${metrics.alerts.negativeMargin > 0 ? '#dc3545' : '#28a745'}`
            }}>
              <div style={{ fontSize: '24px', fontWeight: '700', color: metrics.alerts.negativeMargin > 0 ? '#721c24' : '#155724', marginBottom: '4px' }}>
                {metrics.alerts.negativeMargin}
              </div>
              <div style={{ fontSize: '13px', color: metrics.alerts.negativeMargin > 0 ? '#721c24' : '#155724', fontWeight: '500' }}>
                🔴 Margen Negativo
              </div>
            </div>
            <div style={{
              padding: '16px',
              borderRadius: '8px',
              backgroundColor: metrics.alerts.noMovement > 0 ? '#fff3cd' : '#d4edda',
              border: `1px solid ${metrics.alerts.noMovement > 0 ? '#ffc107' : '#28a745'}`
            }}>
              <div style={{ fontSize: '24px', fontWeight: '700', color: metrics.alerts.noMovement > 0 ? '#856404' : '#155724', marginBottom: '4px' }}>
                {metrics.alerts.noMovement}
              </div>
              <div style={{ fontSize: '13px', color: metrics.alerts.noMovement > 0 ? '#856404' : '#155724', fontWeight: '500' }}>
                🟡 Sin Movimiento
              </div>
            </div>
          </div>
        </div>

        {/* Gráfico de Tendencia y Total Ventas */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr',
          gap: '16px',
          marginBottom: '24px'
        }}>
          {/* Gráfico de Tendencia */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            border: '1px solid #e9ecef'
          }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600', color: '#2c3e50', display: 'flex', alignItems: 'center' }}>
              <span style={{ marginRight: '8px' }}>📈</span>
              Tendencia de Ventas (Últimos 7 Días)
            </h3>
            <div style={{ height: '250px' }}>
              {trendChartData && <Line data={trendChartData} options={trendChartOptions} />}
            </div>
          </div>

          {/* Total Ventas */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            border: '1px solid #e9ecef',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '8px' }}>📦</div>
            <div style={{ fontSize: '48px', fontWeight: '700', color: '#007bff', marginBottom: '8px' }}>
              {metrics.sales.count}
            </div>
            <div style={{ fontSize: '16px', color: '#6c757d', fontWeight: '500', textAlign: 'center' }}>
              Total de Ventas<br/>Realizadas
            </div>
            <div style={{ marginTop: '16px', fontSize: '14px', color: '#6c757d', textAlign: 'center' }}>
              {metrics.itemsSold} items vendidos
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

