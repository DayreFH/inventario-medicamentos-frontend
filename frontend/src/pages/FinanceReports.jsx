import { useEffect, useMemo, useState } from 'react';
import api from '../api/http';

export default function FinanceReports() {
  const [view, setView] = useState('byMedicine'); // 'byMedicine' | 'byParty'
  const [type, setType] = useState('purchases'); // 'sales' | 'purchases' (por defecto compras para ver ENTRADAS)
  const [currency, setCurrency] = useState('BOTH'); // 'USD' | 'MN' | 'BOTH'
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  const endpoint = useMemo(() => {
    if (view === 'byMedicine') {
      return type === 'sales' ? '/reports/sales-items-by-period' : '/reports/purchases-items-by-period';
    }
    // byParty (cliente/proveedor)
    return type === 'sales' ? '/reports/sales-items-by-period' : '/reports/purchases-items-by-period';
  }, [type, view]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = {};
      if (start) params.start = start;
      if (end) params.end = end;
      const { data } = await api.get(endpoint, { params });
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Error cargando reportes:', e);
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Cargar por defecto últimos 30 días
    const today = new Date();
    const from = new Date();
    from.setDate(today.getDate() - 30);
    const toIso = d => d.toISOString().split('T')[0];
    setStart(toIso(from));
    setEnd(toIso(today));
  }, []);

  useEffect(() => {
    if (start && end) {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint, start, end]);

  // Helper para formatear moneda
  const formatCurrency = (valueUSD, valueMN) => {
    if (currency === 'USD') {
      return `USD $${(valueUSD || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    } else if (currency === 'MN') {
      return `MN $${(valueMN || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    } else {
      // BOTH
      return `USD $${(valueUSD || 0).toFixed(2)} / MN $${(valueMN || 0).toFixed(2)}`;
    }
  };

  const handleExportCSV = () => {
    if (!rows || rows.length === 0) return;
    let headers = [];
    if (view === 'byMedicine') {
      headers = type === 'sales'
        ? ['ID', 'Fecha', 'Medicamento', 'Fecha caducidad', 'Cantidad', 'Precio Unit USD', 'Precio Unit MN', 'Total Venta']
        : ['ID', 'Fecha', 'Medicamento', 'Fecha caducidad', 'Cantidad', 'Costo Unit DOP'];
    } else {
      headers = type === 'sales'
        ? ['ID', 'Fecha', 'Cliente', 'Medicamento', 'Cantidad', 'Precio Unit USD', 'Precio Unit MN', 'Total Venta']
        : ['ID', 'Fecha', 'Proveedor', 'Medicamento', 'Cantidad', 'Costo Unit DOP'];
    }
    const lines = [];
    // Usar punto y coma como separador para compatibilidad con Excel en español
    lines.push(headers.join(';'));
    for (const r of rows) {
      if (view === 'byMedicine') {
        if (type === 'sales') {
          const totalVenta = r.tipoVenta === 'USD' 
            ? (r.qty * Number(r.priceUSD || 0)).toFixed(2)
            : (r.qty * Number(r.priceMN || 0)).toFixed(2);
          lines.push([
            r.id, 
            new Date(r.date).toISOString().split('T')[0], 
            `"${r.medicineName || ''}"`, 
            (r.expirationDate ? new Date(r.expirationDate).toISOString().split('T')[0] : ''), 
            r.qty,
            Number(r.priceUSD || 0).toFixed(2),
            Number(r.priceMN || 0).toFixed(2),
            `${r.tipoVenta || 'USD'} $${totalVenta}`
          ].join(';'));
        } else {
          lines.push([r.id, new Date(r.date).toISOString().split('T')[0], `"${r.medicineName || ''}"`, (r.expirationDate ? new Date(r.expirationDate).toISOString().split('T')[0] : ''), r.qty, Number(r.unitCostDOP || 0).toFixed(2)].join(';'));
        }
      } else {
        if (type === 'sales') {
          const totalVenta = r.tipoVenta === 'USD' 
            ? (r.qty * Number(r.priceUSD || 0)).toFixed(2)
            : (r.qty * Number(r.priceMN || 0)).toFixed(2);
          lines.push([
            r.id, 
            new Date(r.date).toISOString().split('T')[0], 
            `"${r.customerName || ''}"`, 
            `"${r.medicineName || ''}"`, 
            r.qty,
            Number(r.priceUSD || 0).toFixed(2),
            Number(r.priceMN || 0).toFixed(2),
            `${r.tipoVenta || 'USD'} $${totalVenta}`
          ].join(';'));
        } else {
          lines.push([r.id, new Date(r.date).toISOString().split('T')[0], `"${r.supplierName || ''}"`, `"${r.medicineName || ''}"`, r.qty, Number(r.unitCostDOP || 0).toFixed(2)].join(';'));
        }
      }
    }
    // Agregar BOM (Byte Order Mark) para que Excel reconozca UTF-8
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const fileBase = (view === 'byMedicine')
      ? (type === 'sales' ? 'ventas_periodo_medicamentos' : 'compras_periodo_medicamentos')
      : (type === 'sales' ? 'ventas_periodo_clientes' : 'compras_periodo_proveedores');
    link.download = `${fileBase}_${start}_a_${end}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

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
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ color: '#2c3e50', margin: 0, fontSize: '28px', fontWeight: '600', marginBottom: '8px' }}>
          Finanzas · Reporte Financiero
        </h1>
        <p style={{ color: '#6c757d', margin: 0 }}>
          Reportes por período (por medicamento o por cliente/proveedor) y exportación CSV
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: type === 'sales' ? 'repeat(6, minmax(180px, 1fr))' : 'repeat(5, minmax(200px, 1fr))',
        gap: '12px',
        alignItems: 'end',
        marginBottom: '16px'
      }}>
        <div>
          <label style={{ display: 'block', fontSize: 12, color: '#6c757d', marginBottom: 6, fontWeight: '500' }}>Tipo</label>
          <select
            value={type}
            onChange={e => setType(e.target.value)}
            style={{ width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid #dee2e6', fontSize: '14px' }}
          >
            <option value="sales">Ventas</option>
            <option value="purchases">Compras</option>
          </select>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 12, color: '#6c757d', marginBottom: 6, fontWeight: '500' }}>Vista</label>
          <select
            value={view}
            onChange={e => setView(e.target.value)}
            style={{ width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid #dee2e6', fontSize: '14px' }}
          >
            <option value="byMedicine">Por medicamento</option>
            <option value="byParty">Por cliente/proveedor</option>
          </select>
        </div>
        {type === 'sales' && (
          <div>
            <label style={{ display: 'block', fontSize: 12, color: '#6c757d', marginBottom: 6, fontWeight: '500' }}>Moneda</label>
            <select
              value={currency}
              onChange={e => setCurrency(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid #dee2e6', fontSize: '14px' }}
            >
              <option value="BOTH">💵💴 Ambas</option>
              <option value="USD">💵 USD</option>
              <option value="MN">💴 MN</option>
            </select>
          </div>
        )}
        <div>
          <label style={{ display: 'block', fontSize: 12, color: '#6c757d', marginBottom: 6, fontWeight: '500' }}>Desde</label>
          <input type="date" value={start} onChange={e => setStart(e.target.value)}
            style={{ width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid #dee2e6', fontSize: '14px' }} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 12, color: '#6c757d', marginBottom: 6, fontWeight: '500' }}>Hasta</label>
          <input type="date" value={end} onChange={e => setEnd(e.target.value)}
            style={{ width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid #dee2e6', fontSize: '14px' }} />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={fetchData} style={{ padding: '10px 16px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: '600', fontSize: '14px' }}>🔍 Consultar</button>
          <button onClick={handleExportCSV} disabled={!rows.length} style={{ padding: '10px 16px', backgroundColor: rows.length ? '#10b981' : '#94d3a2', color: 'white', border: 'none', borderRadius: 6, cursor: rows.length ? 'pointer' : 'not-allowed', fontWeight: '600', fontSize: '14px' }}>📊 Exportar</button>
        </div>
      </div>

      <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e9ecef', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#6c757d' }}>Cargando...</div>
        ) : rows.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#6c757d' }}>Sin datos para el período seleccionado</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#475569' }}>Fecha</th>
                {view === 'byMedicine' ? (
                  type === 'sales' ? (
                    <>
                      <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#475569' }}>Medicamento</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#475569' }}>Fecha caducidad</th>
                      <th style={{ padding: '12px', textAlign: 'right', fontSize: '12px', fontWeight: '600', color: '#475569' }}>Cantidad</th>
                      <th style={{ padding: '12px', textAlign: 'right', fontSize: '12px', fontWeight: '600', color: '#475569' }}>Precio Unit.</th>
                      <th style={{ padding: '12px', textAlign: 'right', fontSize: '12px', fontWeight: '600', color: '#475569' }}>Total Venta</th>
                    </>
                  ) : (
                    <>
                      <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#475569' }}>Medicamento</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#475569' }}>Fecha caducidad</th>
                      <th style={{ padding: '12px', textAlign: 'right', fontSize: '12px', fontWeight: '600', color: '#475569' }}>Cantidad</th>
                      <th style={{ padding: '12px', textAlign: 'right', fontSize: '12px', fontWeight: '600', color: '#475569' }}>Costo Unit DOP</th>
                    </>
                  )
                ) : (
                  type === 'sales' ? (
                    <>
                      <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#475569' }}>Cliente</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#475569' }}>Medicamento</th>
                      <th style={{ padding: '12px', textAlign: 'right', fontSize: '12px', fontWeight: '600', color: '#475569' }}>Cantidad</th>
                      <th style={{ padding: '12px', textAlign: 'right', fontSize: '12px', fontWeight: '600', color: '#475569' }}>Precio Unit.</th>
                      <th style={{ padding: '12px', textAlign: 'right', fontSize: '12px', fontWeight: '600', color: '#475569' }}>Total Venta</th>
                    </>
                  ) : (
                    <>
                      <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#475569' }}>Proveedor</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#475569' }}>Medicamento</th>
                      <th style={{ padding: '12px', textAlign: 'right', fontSize: '12px', fontWeight: '600', color: '#475569' }}>Cantidad</th>
                      <th style={{ padding: '12px', textAlign: 'right', fontSize: '12px', fontWeight: '600', color: '#475569' }}>Costo Unit DOP</th>
                    </>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '12px', fontSize: '14px', color: '#1e293b' }}>{new Date(r.date).toLocaleDateString('es-DO')}</td>
                  {view === 'byMedicine' ? (
                    type === 'sales' ? (
                      <>
                        <td style={{ padding: '12px', fontSize: '14px', color: '#1e293b' }}>{r.medicineName}</td>
                        <td style={{ padding: '12px', fontSize: '14px', color: '#64748b' }}>{r.expirationDate ? new Date(r.expirationDate).toLocaleDateString('es-DO') : '—'}</td>
                        <td style={{ padding: '12px', textAlign: 'right', fontWeight: 600, fontSize: '14px', color: '#1e293b' }}>{r.qty}</td>
                        <td style={{ padding: '12px', textAlign: 'right', fontWeight: 600, fontSize: '14px', color: '#64748b' }}>
                          {formatCurrency(r.priceUSD, r.priceMN)}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right', fontWeight: 600, fontSize: '14px', color: '#10b981' }}>
                          {r.tipoVenta === 'USD' 
                            ? `USD $${(r.qty * r.priceUSD).toFixed(2)}`
                            : `MN $${(r.qty * r.priceMN).toFixed(2)}`
                          }
                        </td>
                      </>
                    ) : (
                      <>
                        <td style={{ padding: '12px', fontSize: '14px', color: '#1e293b' }}>{r.medicineName}</td>
                        <td style={{ padding: '12px', fontSize: '14px', color: '#64748b' }}>{r.expirationDate ? new Date(r.expirationDate).toLocaleDateString('es-DO') : '—'}</td>
                        <td style={{ padding: '12px', textAlign: 'right', fontSize: '14px', color: '#1e293b' }}>{r.qty}</td>
                        <td style={{ padding: '12px', textAlign: 'right', fontSize: '14px', color: '#ef4444' }}>${Number(r.unitCostDOP || 0).toFixed(2)}</td>
                      </>
                    )
                  ) : (
                    type === 'sales' ? (
                      <>
                        <td style={{ padding: '12px', fontSize: '14px', color: '#1e293b' }}>{r.customerName}</td>
                        <td style={{ padding: '12px', fontSize: '14px', color: '#1e293b' }}>{r.medicineName}</td>
                        <td style={{ padding: '12px', textAlign: 'right', fontWeight: 600, fontSize: '14px', color: '#1e293b' }}>{r.qty}</td>
                        <td style={{ padding: '12px', textAlign: 'right', fontWeight: 600, fontSize: '14px', color: '#64748b' }}>
                          {formatCurrency(r.priceUSD, r.priceMN)}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right', fontWeight: 600, fontSize: '14px', color: '#10b981' }}>
                          {r.tipoVenta === 'USD' 
                            ? `USD $${(r.qty * r.priceUSD).toFixed(2)}`
                            : `MN $${(r.qty * r.priceMN).toFixed(2)}`
                          }
                        </td>
                      </>
                    ) : (
                      <>
                        <td style={{ padding: '12px', fontSize: '14px', color: '#1e293b' }}>{r.supplierName}</td>
                        <td style={{ padding: '12px', fontSize: '14px', color: '#1e293b' }}>{r.medicineName}</td>
                        <td style={{ padding: '12px', textAlign: 'right', fontSize: '14px', color: '#1e293b' }}>{r.qty}</td>
                        <td style={{ padding: '12px', textAlign: 'right', fontSize: '14px', color: '#ef4444' }}>${Number(r.unitCostDOP || 0).toFixed(2)}</td>
                      </>
                    )
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      </div>
    </div>
  );
}


