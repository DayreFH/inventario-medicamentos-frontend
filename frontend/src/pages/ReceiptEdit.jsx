import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/http';

function toDateInputValue(dateLike) {
  if (!dateLike) return '';
  const d = new Date(dateLike);
  if (Number.isNaN(d.getTime())) return '';
  const yyyy = String(d.getFullYear());
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export default function ReceiptEdit() {
  const { id } = useParams();
  const navigate = useNavigate();

  const receiptId = Number(id);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [saveError, setSaveError] = useState(null);
  const [receipt, setReceipt] = useState(null);

  const [header, setHeader] = useState({ date: '', notes: '' });
  const [items, setItems] = useState([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const { data } = await api.get(`/receipts/${receiptId}`);
        if (!mounted) return;
        setReceipt(data);
        setHeader({
          date: toDateInputValue(data?.date),
          notes: data?.notes ?? ''
        });
        setItems(
          Array.isArray(data?.receiptitem)
            ? data.receiptitem.map((it) => ({
                id: it.id,
                medicineId: it.medicineId,
                medicine: it.medicines,
                qty: Number(it.qty ?? 0),
                unit_cost: Number(it.unit_cost ?? 0),
                lot: it.lot ?? '',
                expirationDate: toDateInputValue(it.expirationDate),
                weight_kg: Number(it.weight_kg ?? 0)
              }))
            : []
        );
      } catch (e) {
        if (!mounted) return;
        setError(e?.response?.data?.detail || e?.message || 'No se pudo cargar la entrada');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [receiptId]);

  const supplierLabel = useMemo(() => {
    const s = receipt?.supplier;
    if (!s) return '-';
    return s.name || s.nombre || '-';
  }, [receipt]);

  const onItemChange = (itemId, patch) => {
    setItems(prev => prev.map(it => (it.id === itemId ? { ...it, ...patch } : it)));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setSaveError(null);

      const payload = {
        date: header.date || undefined,
        notes: header.notes ?? null,
        items: items.map(it => ({
          medicineId: it.medicineId,
          qty: Number(it.qty ?? 0),
          unit_cost: Number(it.unit_cost ?? 0),
          weight_kg: Number(it.weight_kg ?? 0),
          lot: it.lot ?? null,
          expirationDate: it.expirationDate || null
        }))
      };

      await api.put(`/receipts/${receiptId}`, payload);
      navigate('/receipts/history');
    } catch (e) {
      const status = e?.response?.status;
      const detail = e?.response?.data?.detail || e?.response?.data?.error || e?.message;
      if (status === 409) {
        setSaveError(detail || 'No se pudo guardar: el cambio dejaría stock negativo.');
      } else {
        setSaveError(detail || 'No se pudo guardar la entrada.');
      }
    } finally {
      setSaving(false);
    }
  };

  if (!Number.isFinite(receiptId)) {
    return (
      <div style={{ padding: '16px' }}>
        ID inválido.
      </div>
    );
  }

  return (
    <div style={{ padding: '16px' }}>
      <div style={{
        backgroundColor: '#2c3e50',
        color: 'white',
        padding: '12px 16px',
        borderRadius: '8px',
        marginBottom: '16px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
          <div>
            <div style={{ fontSize: '18px', fontWeight: 700 }}>Editar entrada #{receiptId}</div>
            <div style={{ fontSize: '12px', opacity: 0.85 }}>Proveedor: {supplierLabel}</div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => navigate('/receipts/history')}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.35)',
                background: 'transparent',
                color: 'white',
                cursor: 'pointer',
                fontWeight: 700
              }}
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving || loading}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid #2563eb',
                background: saving ? '#93c5fd' : '#3b82f6',
                color: 'white',
                cursor: saving ? 'not-allowed' : 'pointer',
                fontWeight: 700
              }}
            >
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </div>
      </div>

      {loading && (
        <div style={{ color: '#6b7280' }}>Cargando...</div>
      )}
      {error && (
        <div style={{ color: '#b91c1c', marginBottom: '12px' }}>{String(error)}</div>
      )}
      {saveError && (
        <div style={{ color: '#b91c1c', marginBottom: '12px' }}>{String(saveError)}</div>
      )}

      {!loading && receipt && (
        <>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            padding: '12px',
            marginBottom: '16px'
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px', fontWeight: 600 }}>
                  Fecha
                </label>
                <input
                  type="date"
                  value={header.date}
                  onChange={(e) => setHeader(h => ({ ...h, date: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    border: '1px solid #ccc',
                    borderRadius: '6px',
                    fontSize: '13px'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px', fontWeight: 600 }}>
                  Nota (motivo de corrección)
                </label>
                <input
                  type="text"
                  value={header.notes}
                  onChange={(e) => setHeader(h => ({ ...h, notes: e.target.value }))}
                  placeholder="Ej: Se corrigió cantidad (cajas vs blister)"
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    border: '1px solid #ccc',
                    borderRadius: '6px',
                    fontSize: '13px'
                  }}
                />
              </div>
            </div>
          </div>

          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            overflow: 'hidden'
          }}>
            <div style={{ padding: '12px', fontWeight: 700, color: '#2c3e50' }}>
              Ítems de la entrada
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: '#f3f4f6' }}>
                    <th style={{ textAlign: 'left', padding: '10px', borderBottom: '1px solid #e5e7eb' }}>Medicamento</th>
                    <th style={{ textAlign: 'left', padding: '10px', borderBottom: '1px solid #e5e7eb' }}>Presentación</th>
                    <th style={{ textAlign: 'right', padding: '10px', borderBottom: '1px solid #e5e7eb' }}>Cantidad</th>
                    <th style={{ textAlign: 'right', padding: '10px', borderBottom: '1px solid #e5e7eb' }}>Costo unitario</th>
                    <th style={{ textAlign: 'left', padding: '10px', borderBottom: '1px solid #e5e7eb' }}>Lote</th>
                    <th style={{ textAlign: 'left', padding: '10px', borderBottom: '1px solid #e5e7eb' }}>Vencimiento</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(it => (
                    <tr key={it.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                      <td style={{ padding: '10px' }}>
                        {it?.medicine?.codigo} - {it?.medicine?.nombreComercial}
                      </td>
                      <td style={{ padding: '10px', color: '#374151' }}>
                        {String(it?.medicine?.presentacion ?? '-')}
                      </td>
                      <td style={{ padding: '10px', textAlign: 'right' }}>
                        <input
                          type="number"
                          value={it.qty}
                          onChange={(e) => onItemChange(it.id, { qty: Number.parseInt(e.target.value, 10) || 0 })}
                          style={{
                            width: '110px',
                            padding: '6px 8px',
                            border: '1px solid #ccc',
                            borderRadius: '6px',
                            fontSize: '13px',
                            textAlign: 'right'
                          }}
                          title="La cantidad se contabiliza en la unidad de presentación del producto."
                        />
                      </td>
                      <td style={{ padding: '10px', textAlign: 'right' }}>
                        <input
                          type="number"
                          step="0.01"
                          value={it.unit_cost}
                          onChange={(e) => onItemChange(it.id, { unit_cost: Number(e.target.value) || 0 })}
                          style={{
                            width: '130px',
                            padding: '6px 8px',
                            border: '1px solid #ccc',
                            borderRadius: '6px',
                            fontSize: '13px',
                            textAlign: 'right'
                          }}
                        />
                      </td>
                      <td style={{ padding: '10px' }}>
                        <input
                          type="text"
                          value={it.lot}
                          onChange={(e) => onItemChange(it.id, { lot: e.target.value })}
                          style={{
                            width: '150px',
                            padding: '6px 8px',
                            border: '1px solid #ccc',
                            borderRadius: '6px',
                            fontSize: '13px'
                          }}
                        />
                      </td>
                      <td style={{ padding: '10px' }}>
                        <input
                          type="date"
                          value={it.expirationDate}
                          onChange={(e) => onItemChange(it.id, { expirationDate: e.target.value })}
                          style={{
                            width: '150px',
                            padding: '6px 8px',
                            border: '1px solid #ccc',
                            borderRadius: '6px',
                            fontSize: '13px'
                          }}
                        />
                      </td>
                    </tr>
                  ))}
                  {items.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ padding: '14px', color: '#6b7280' }}>
                        Esta entrada no tiene ítems.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

