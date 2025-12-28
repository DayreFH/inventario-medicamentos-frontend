import { useState, useEffect } from 'react';
import api from '../api/http';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const InventoryReports = () => {
  // Estados para tabs
  const [activeSubTab, setActiveSubTab] = useState('movements'); // movements | expiring | rotation | valuation

  // Estados para filtros
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedMedicine, setSelectedMedicine] = useState('');

  // Estados para datos
  const [movements, setMovements] = useState([]);
  const [expiringMeds, setExpiringMeds] = useState([]);
  const [rotation, setRotation] = useState({ topSelling: [], lowSelling: [], noMovement: [] });
  const [valuation, setValuation] = useState({ total: 0, byMedicine: [], bySupplier: [] });
  const [medicines, setMedicines] = useState([]);

  // Estados de carga
  const [loading, setLoading] = useState(false);

  // Cargar medicamentos para filtros
  useEffect(() => {
    loadMedicines();
  }, []);

  // Cargar datos según el tab activo
  useEffect(() => {
    if (activeSubTab === 'movements') {
      loadMovements();
    } else if (activeSubTab === 'expiring') {
      loadExpiringMedicines();
    } else if (activeSubTab === 'rotation') {
      loadRotation();
    } else if (activeSubTab === 'valuation') {
      loadValuation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSubTab, startDate, endDate, selectedMedicine]);

  const loadMedicines = async () => {
    try {
      const { data } = await api.get('/medicines');
      setMedicines(data || []);
    } catch (error) {
      console.error('Error cargando medicamentos:', error);
      setMedicines([]);
    }
  };

  const loadMovements = async () => {
    setLoading(true);
    try {
      // Obtener entradas y salidas
      const params = {};
      if (startDate) params.start = startDate;
      if (endDate) params.end = endDate;

      const [salesResponse, purchasesResponse] = await Promise.all([
        api.get('/reports/sales-items-by-period', { params }),
        api.get('/reports/purchases-items-by-period', { params })
      ]);

      // Combinar y formatear
      const salesData = (salesResponse.data || []).map(item => ({
        ...item,
        type: 'Salida',
        date: new Date(item.date),
        party: item.customerName
      }));

      const purchasesData = (purchasesResponse.data || []).map(item => ({
        ...item,
        type: 'Entrada',
        date: new Date(item.date),
        party: item.supplierName
      }));

      const combined = [...salesData, ...purchasesData]
        .filter(item => !selectedMedicine || item.medicineId === Number(selectedMedicine))
        .sort((a, b) => b.date - a.date);

      setMovements(combined);
    } catch (error) {
      console.error('Error cargando movimientos:', error);
      setMovements([]);
    } finally {
      setLoading(false);
    }
  };

  const loadExpiringMedicines = async () => {
    setLoading(true);
    try {
      const [alertsResponse, upcomingResponse] = await Promise.all([
        api.get('/reports/expiry-alerts'),
        api.get('/reports/expiry-upcoming')
      ]);

      const combined = [...(alertsResponse.data || []), ...(upcomingResponse.data || [])]
        .sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);

      setExpiringMeds(combined);
    } catch (error) {
      console.error('Error cargando medicamentos por vencer:', error);
      setExpiringMeds([]);
    } finally {
      setLoading(false);
    }
  };

  const loadRotation = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/reports/inventory-rotation', {
        params: {
          start: startDate,
          end: endDate
        }
      });
      setRotation(data || { topSelling: [], lowSelling: [], noMovement: [] });
    } catch (error) {
      console.error('Error cargando rotación:', error);
      setRotation({ topSelling: [], lowSelling: [], noMovement: [] });
    } finally {
      setLoading(false);
    }
  };

  const loadValuation = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/reports/inventory-valuation');
      setValuation(data || { total: 0, byMedicine: [], bySupplier: [] });
    } catch (error) {
      console.error('Error cargando valorización:', error);
      setValuation({ total: 0, byMedicine: [], bySupplier: [] });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: 'USD'
    }).format(value || 0);
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const exportToExcel = () => {
    let data = [];
    let filename = '';

    if (activeSubTab === 'movements') {
      data = (movements || []).map(m => ({
        Fecha: formatDate(m.date),
        Tipo: m.type,
        Medicamento: m.medicineName,
        Código: m.medicineCode,
        Cantidad: m.qty,
        'Cliente/Proveedor': m.party
      }));
      filename = 'movimientos-stock';
    } else if (activeSubTab === 'expiring') {
      data = (expiringMeds || []).map(m => ({
        Código: m.medicineCode,
        Medicamento: m.medicineName,
        Stock: m.stock,
        'Fecha Vencimiento': formatDate(m.expiryDate),
        'Días Restantes': m.daysUntilExpiry
      }));
      filename = 'medicamentos-por-vencer';
    } else if (activeSubTab === 'rotation') {
      data = (rotation.topSelling || []).map(m => ({
        Medicamento: m.medicineName,
        'Total Vendido': m.totalSold,
        'Última Venta': formatDate(m.lastSale)
      }));
      filename = 'rotacion-inventario';
    } else if (activeSubTab === 'valuation') {
      data = (valuation.byMedicine || []).map(m => ({
        Medicamento: m.medicineName,
        Stock: m.stock,
        'Precio Compra': formatCurrency(m.unitCost),
        'Valor Total': formatCurrency(m.totalValue)
      }));
      filename = 'valorizacion-inventario';
    }

    if (data.length === 0) {
      alert('No hay datos para exportar');
      return;
    }

    // Convertir a CSV
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(';'),
      ...data.map(row => headers.map(h => row[h]).join(';'))
    ].join('\n');

    // Agregar BOM para Excel
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
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
          onClick={() => setActiveSubTab('movements')}
          style={{
            padding: '10px 20px',
            border: 'none',
            backgroundColor: activeSubTab === 'movements' ? '#3b82f6' : 'transparent',
            color: activeSubTab === 'movements' ? 'white' : '#64748b',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: activeSubTab === 'movements' ? '600' : '400',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          📦 Movimientos de Stock
        </button>
        <button
          onClick={() => setActiveSubTab('expiring')}
          style={{
            padding: '10px 20px',
            border: 'none',
            backgroundColor: activeSubTab === 'expiring' ? '#3b82f6' : 'transparent',
            color: activeSubTab === 'expiring' ? 'white' : '#64748b',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: activeSubTab === 'expiring' ? '600' : '400',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          ⏰ Por Vencer
        </button>
        <button
          onClick={() => setActiveSubTab('rotation')}
          style={{
            padding: '10px 20px',
            border: 'none',
            backgroundColor: activeSubTab === 'rotation' ? '#3b82f6' : 'transparent',
            color: activeSubTab === 'rotation' ? 'white' : '#64748b',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: activeSubTab === 'rotation' ? '600' : '400',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          🔄 Rotación
        </button>
        <button
          onClick={() => setActiveSubTab('valuation')}
          style={{
            padding: '10px 20px',
            border: 'none',
            backgroundColor: activeSubTab === 'valuation' ? '#3b82f6' : 'transparent',
            color: activeSubTab === 'valuation' ? 'white' : '#64748b',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: activeSubTab === 'valuation' ? '600' : '400',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          💰 Valorización
        </button>
      </div>

      {/* Filtros */}
      {(activeSubTab === 'movements' || activeSubTab === 'rotation') && (
        <div style={{
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '24px',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#475569', marginBottom: '6px' }}>
                Fecha Inicio
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
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
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#475569', marginBottom: '6px' }}>
                Fecha Fin
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
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
            {activeSubTab === 'movements' && (
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#475569', marginBottom: '6px' }}>
                  Medicamento
                </label>
                <select
                  value={selectedMedicine}
                  onChange={(e) => setSelectedMedicine(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="">Todos</option>
                  {Array.isArray(medicines) && medicines.map(med => (
                    <option key={med.id} value={med.id}>
                      {med.nombreComercial}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Contenido según el tab */}
      {activeSubTab === 'movements' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#1e293b' }}>
              Movimientos de Stock
            </h3>
            <button
              onClick={exportToExcel}
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
              📥 Exportar Excel
            </button>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
              Cargando movimientos...
            </div>
          ) : movements.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
              No hay movimientos en el período seleccionado
            </div>
          ) : (
            <div style={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead style={{ backgroundColor: '#f8fafc' }}>
                    <tr>
                      <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#475569', borderBottom: '1px solid #e2e8f0' }}>
                        Fecha
                      </th>
                      <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#475569', borderBottom: '1px solid #e2e8f0' }}>
                        Tipo
                      </th>
                      <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#475569', borderBottom: '1px solid #e2e8f0' }}>
                        Medicamento
                      </th>
                      <th style={{ padding: '12px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: '#475569', borderBottom: '1px solid #e2e8f0' }}>
                        Cantidad
                      </th>
                      <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#475569', borderBottom: '1px solid #e2e8f0' }}>
                        Cliente/Proveedor
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.isArray(movements) && movements.map((mov, index) => (
                      <tr key={index} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '12px', fontSize: '14px', color: '#1e293b' }}>
                          {formatDate(mov.date)}
                        </td>
                        <td style={{ padding: '12px', fontSize: '14px' }}>
                          <span style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: '500',
                            backgroundColor: mov.type === 'Entrada' ? '#dcfce7' : '#fee2e2',
                            color: mov.type === 'Entrada' ? '#166534' : '#991b1b'
                          }}>
                            {mov.type}
                          </span>
                        </td>
                        <td style={{ padding: '12px', fontSize: '14px', color: '#475569' }}>
                          {mov.medicineName}
                          <div style={{ fontSize: '12px', color: '#94a3b8' }}>{mov.medicineCode}</div>
                        </td>
                        <td style={{ padding: '12px', fontSize: '14px', color: '#1e293b', textAlign: 'center', fontWeight: '600' }}>
                          {mov.qty}
                        </td>
                        <td style={{ padding: '12px', fontSize: '14px', color: '#475569' }}>
                          {mov.party}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {activeSubTab === 'expiring' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#1e293b' }}>
              Medicamentos por Vencer
            </h3>
            <button
              onClick={exportToExcel}
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
              📥 Exportar Excel
            </button>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
              Cargando medicamentos...
            </div>
          ) : expiringMeds.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
              ✅ No hay medicamentos próximos a vencer
            </div>
          ) : (
            <div style={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead style={{ backgroundColor: '#f8fafc' }}>
                    <tr>
                      <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#475569', borderBottom: '1px solid #e2e8f0' }}>
                        Medicamento
                      </th>
                      <th style={{ padding: '12px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: '#475569', borderBottom: '1px solid #e2e8f0' }}>
                        Stock
                      </th>
                      <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#475569', borderBottom: '1px solid #e2e8f0' }}>
                        Fecha Vencimiento
                      </th>
                      <th style={{ padding: '12px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: '#475569', borderBottom: '1px solid #e2e8f0' }}>
                        Días Restantes
                      </th>
                      <th style={{ padding: '12px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: '#475569', borderBottom: '1px solid #e2e8f0' }}>
                        Estado
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.isArray(expiringMeds) && expiringMeds.map((med, index) => {
                      const isExpired = med.daysUntilExpiry <= 0;
                      const isCritical = med.daysUntilExpiry > 0 && med.daysUntilExpiry <= 30;
                      const isWarning = med.daysUntilExpiry > 30 && med.daysUntilExpiry <= 60;

                      return (
                        <tr key={index} style={{ 
                          borderBottom: '1px solid #f1f5f9',
                          backgroundColor: isExpired ? '#fee2e2' : isCritical ? '#fef3c7' : 'white'
                        }}>
                          <td style={{ padding: '12px', fontSize: '14px', color: '#475569' }}>
                            {med.medicineName}
                            <div style={{ fontSize: '12px', color: '#94a3b8' }}>{med.medicineCode}</div>
                          </td>
                          <td style={{ padding: '12px', fontSize: '14px', color: '#1e293b', textAlign: 'center', fontWeight: '600' }}>
                            {med.stock}
                          </td>
                          <td style={{ padding: '12px', fontSize: '14px', color: '#475569' }}>
                            {formatDate(med.expiryDate)}
                          </td>
                          <td style={{ padding: '12px', fontSize: '14px', textAlign: 'center', fontWeight: '600' }}>
                            <span style={{
                              color: isExpired ? '#991b1b' : isCritical ? '#92400e' : '#166534'
                            }}>
                              {med.daysUntilExpiry}
                            </span>
                          </td>
                          <td style={{ padding: '12px', textAlign: 'center' }}>
                            <span style={{
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontSize: '12px',
                              fontWeight: '500',
                              backgroundColor: isExpired ? '#fecaca' : isCritical ? '#fde68a' : '#bbf7d0',
                              color: isExpired ? '#991b1b' : isCritical ? '#92400e' : '#166534'
                            }}>
                              {isExpired ? '🔴 VENCIDO' : isCritical ? '🟡 CRÍTICO' : '🟢 ALERTA'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {activeSubTab === 'rotation' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#1e293b' }}>
              Rotación de Inventario
            </h3>
            <button
              onClick={exportToExcel}
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
              📥 Exportar Excel
            </button>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
              Cargando rotación...
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '24px' }}>
              {/* Top 20 Más Vendidos */}
              <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <h4 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600', color: '#10b981' }}>
                  🔥 Top 20 Más Vendidos
                </h4>
                {rotation.topSelling && rotation.topSelling.length > 0 ? (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead style={{ backgroundColor: '#f8fafc' }}>
                        <tr>
                          <th style={{ padding: '10px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#475569', borderBottom: '1px solid #e2e8f0' }}>
                            #
                          </th>
                          <th style={{ padding: '10px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#475569', borderBottom: '1px solid #e2e8f0' }}>
                            Medicamento
                          </th>
                          <th style={{ padding: '10px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: '#475569', borderBottom: '1px solid #e2e8f0' }}>
                            Total Vendido
                          </th>
                          <th style={{ padding: '10px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: '#475569', borderBottom: '1px solid #e2e8f0' }}>
                            Stock Actual
                          </th>
                          <th style={{ padding: '10px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#475569', borderBottom: '1px solid #e2e8f0' }}>
                            Última Venta
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {Array.isArray(rotation.topSelling) && rotation.topSelling.map((item, index) => (
                          <tr key={index} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '10px', fontSize: '14px', color: '#64748b', fontWeight: '600' }}>
                              {index + 1}
                            </td>
                            <td style={{ padding: '10px', fontSize: '14px', color: '#475569' }}>
                              {item.medicineName}
                              <div style={{ fontSize: '12px', color: '#94a3b8' }}>{item.medicineCode}</div>
                            </td>
                            <td style={{ padding: '10px', fontSize: '14px', color: '#10b981', textAlign: 'center', fontWeight: '600' }}>
                              {item.totalSold}
                            </td>
                            <td style={{ padding: '10px', fontSize: '14px', color: '#1e293b', textAlign: 'center' }}>
                              {item.stock}
                            </td>
                            <td style={{ padding: '10px', fontSize: '14px', color: '#475569' }}>
                              {formatDate(item.lastSale)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>
                    No hay datos de ventas en el período seleccionado
                  </p>
                )}
              </div>

              {/* Menos Vendidos */}
              <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <h4 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600', color: '#f59e0b' }}>
                  📉 Productos con Baja Rotación
                </h4>
                {rotation.lowSelling && rotation.lowSelling.length > 0 ? (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead style={{ backgroundColor: '#f8fafc' }}>
                        <tr>
                          <th style={{ padding: '10px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#475569', borderBottom: '1px solid #e2e8f0' }}>
                            Medicamento
                          </th>
                          <th style={{ padding: '10px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: '#475569', borderBottom: '1px solid #e2e8f0' }}>
                            Total Vendido
                          </th>
                          <th style={{ padding: '10px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: '#475569', borderBottom: '1px solid #e2e8f0' }}>
                            Stock Actual
                          </th>
                          <th style={{ padding: '10px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#475569', borderBottom: '1px solid #e2e8f0' }}>
                            Última Venta
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {Array.isArray(rotation.lowSelling) && rotation.lowSelling.map((item, index) => (
                          <tr key={index} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '10px', fontSize: '14px', color: '#475569' }}>
                              {item.medicineName}
                              <div style={{ fontSize: '12px', color: '#94a3b8' }}>{item.medicineCode}</div>
                            </td>
                            <td style={{ padding: '10px', fontSize: '14px', color: '#f59e0b', textAlign: 'center', fontWeight: '600' }}>
                              {item.totalSold}
                            </td>
                            <td style={{ padding: '10px', fontSize: '14px', color: '#1e293b', textAlign: 'center' }}>
                              {item.stock}
                            </td>
                            <td style={{ padding: '10px', fontSize: '14px', color: '#475569' }}>
                              {formatDate(item.lastSale)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>
                    No hay datos disponibles
                  </p>
                )}
              </div>

              {/* Sin Movimiento */}
              {rotation.noMovement && rotation.noMovement.length > 0 && (
                <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <h4 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600', color: '#ef4444' }}>
                    ⚠️ Sin Movimiento (Supera Umbral)
                  </h4>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead style={{ backgroundColor: '#f8fafc' }}>
                        <tr>
                          <th style={{ padding: '10px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#475569', borderBottom: '1px solid #e2e8f0' }}>
                            Medicamento
                          </th>
                          <th style={{ padding: '10px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: '#475569', borderBottom: '1px solid #e2e8f0' }}>
                            Stock
                          </th>
                          <th style={{ padding: '10px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: '#475569', borderBottom: '1px solid #e2e8f0' }}>
                            Días sin Movimiento
                          </th>
                          <th style={{ padding: '10px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#475569', borderBottom: '1px solid #e2e8f0' }}>
                            Último Movimiento
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {Array.isArray(rotation.noMovement) && rotation.noMovement.map((item, index) => (
                          <tr key={index} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '10px', fontSize: '14px', color: '#475569' }}>
                              {item.medicineName}
                              <div style={{ fontSize: '12px', color: '#94a3b8' }}>{item.medicineCode}</div>
                            </td>
                            <td style={{ padding: '10px', fontSize: '14px', color: '#1e293b', textAlign: 'center' }}>
                              {item.stock}
                            </td>
                            <td style={{ padding: '10px', fontSize: '14px', color: '#ef4444', textAlign: 'center', fontWeight: '600' }}>
                              {item.daysIdle}
                            </td>
                            <td style={{ padding: '10px', fontSize: '14px', color: '#475569' }}>
                              {formatDate(item.lastMovement)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {activeSubTab === 'valuation' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#1e293b' }}>
              Valorización de Inventario
            </h3>
            <button
              onClick={exportToExcel}
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
              📥 Exportar Excel
            </button>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
              Cargando valorización...
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '24px' }}>
              {/* Valor Total */}
              <div style={{
                backgroundColor: 'white',
                padding: '24px',
                borderRadius: '8px',
                border: '2px solid #10b981',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '8px' }}>
                  💰 Valor Total del Inventario
                </div>
                <div style={{ fontSize: '36px', fontWeight: '700', color: '#10b981' }}>
                  {formatCurrency(valuation.total)}
                </div>
                <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
                  Basado en precio de compra × stock actual
                </div>
              </div>

              {/* Tabla por Medicamento */}
              <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <h4 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600', color: '#1e293b' }}>
                  📊 Valorización por Medicamento
                </h4>
                {valuation.byMedicine && valuation.byMedicine.length > 0 ? (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead style={{ backgroundColor: '#f8fafc' }}>
                        <tr>
                          <th style={{ padding: '10px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#475569', borderBottom: '1px solid #e2e8f0' }}>
                            Medicamento
                          </th>
                          <th style={{ padding: '10px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: '#475569', borderBottom: '1px solid #e2e8f0' }}>
                            Stock
                          </th>
                          <th style={{ padding: '10px', textAlign: 'right', fontSize: '12px', fontWeight: '600', color: '#475569', borderBottom: '1px solid #e2e8f0' }}>
                            Precio Compra
                          </th>
                          <th style={{ padding: '10px', textAlign: 'right', fontSize: '12px', fontWeight: '600', color: '#475569', borderBottom: '1px solid #e2e8f0' }}>
                            Valor Total
                          </th>
                          <th style={{ padding: '10px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#475569', borderBottom: '1px solid #e2e8f0' }}>
                            Proveedor
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {Array.isArray(valuation.byMedicine) && valuation.byMedicine.map((item, index) => (
                          <tr key={index} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '10px', fontSize: '14px', color: '#475569' }}>
                              {item.medicineName}
                              <div style={{ fontSize: '12px', color: '#94a3b8' }}>{item.medicineCode}</div>
                            </td>
                            <td style={{ padding: '10px', fontSize: '14px', color: '#1e293b', textAlign: 'center', fontWeight: '600' }}>
                              {item.stock}
                            </td>
                            <td style={{ padding: '10px', fontSize: '14px', color: '#475569', textAlign: 'right' }}>
                              {formatCurrency(item.unitCost)}
                            </td>
                            <td style={{ padding: '10px', fontSize: '14px', color: '#10b981', textAlign: 'right', fontWeight: '600' }}>
                              {formatCurrency(item.totalValue)}
                            </td>
                            <td style={{ padding: '10px', fontSize: '14px', color: '#475569' }}>
                              {item.supplierName}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>
                    No hay medicamentos con stock
                  </p>
                )}
              </div>

              {/* Tabla por Proveedor */}
              {valuation.bySupplier && valuation.bySupplier.length > 0 && (
                <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <h4 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600', color: '#1e293b' }}>
                    🏢 Valorización por Proveedor
                  </h4>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead style={{ backgroundColor: '#f8fafc' }}>
                        <tr>
                          <th style={{ padding: '10px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#475569', borderBottom: '1px solid #e2e8f0' }}>
                            Proveedor
                          </th>
                          <th style={{ padding: '10px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: '#475569', borderBottom: '1px solid #e2e8f0' }}>
                            # Medicamentos
                          </th>
                          <th style={{ padding: '10px', textAlign: 'right', fontSize: '12px', fontWeight: '600', color: '#475569', borderBottom: '1px solid #e2e8f0' }}>
                            Valor Total
                          </th>
                          <th style={{ padding: '10px', textAlign: 'right', fontSize: '12px', fontWeight: '600', color: '#475569', borderBottom: '1px solid #e2e8f0' }}>
                            % del Total
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {Array.isArray(valuation.bySupplier) && valuation.bySupplier.map((item, index) => {
                          const percentage = valuation.total > 0 ? (item.totalValue / valuation.total * 100).toFixed(1) : 0;
                          return (
                            <tr key={index} style={{ borderBottom: '1px solid #f1f5f9' }}>
                              <td style={{ padding: '10px', fontSize: '14px', color: '#475569', fontWeight: '500' }}>
                                {item.supplierName}
                              </td>
                              <td style={{ padding: '10px', fontSize: '14px', color: '#1e293b', textAlign: 'center' }}>
                                {item.medicineCount}
                              </td>
                              <td style={{ padding: '10px', fontSize: '14px', color: '#10b981', textAlign: 'right', fontWeight: '600' }}>
                                {formatCurrency(item.totalValue)}
                              </td>
                              <td style={{ padding: '10px', fontSize: '14px', color: '#64748b', textAlign: 'right' }}>
                                {percentage}%
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default InventoryReports;

