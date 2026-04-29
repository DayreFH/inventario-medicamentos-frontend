import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/http';
import ComboBox from '../components/ComboBox';

export default function ReceiptsHistory() {
  const navigate = useNavigate();

  const [medicines, setMedicines] = useState([]);
  const [selectedMedicine, setSelectedMedicine] = useState(null);

  const [receipts, setReceipts] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await api.get('/medicines?limit=1000');
        if (!mounted) return;
        setMedicines(Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : []));
      } catch (e) {
        // No bloquea la pantalla; sin lista no hay filtro por select.
        if (!mounted) return;
        setMedicines([]);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const filteredMedicines = useMemo(() => medicines, [medicines]);

  useEffect(() => {
    setPage(1);
  }, [selectedMedicine?.id]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!selectedMedicine?.id) {
        setReceipts([]);
        setPagination(null);
        setError(null);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const { data } = await api.get('/receipts', {
          params: {
            medicineId: Number(selectedMedicine.id),
            page,
            limit: 20
          }
        });
        if (!mounted) return;
        setReceipts(Array.isArray(data?.data) ? data.data : []);
        setPagination(data?.pagination ?? null);
      } catch (e) {
        if (!mounted) return;
        setError(e?.response?.data?.detail || e?.message || 'No se pudo cargar el historial');
        setReceipts([]);
        setPagination(null);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [selectedMedicine?.id, page]);

  return (
    <div style={{ padding: '16px' }}>
      <div style={{
        backgroundColor: '#2c3e50',
        color: 'white',
        padding: '12px 16px',
        borderRadius: '8px',
        marginBottom: '16px'
      }}>
        <div style={{ fontSize: '18px', fontWeight: 700 }}>Historial de compras</div>
        <div style={{ fontSize: '12px', opacity: 0.85 }}>
          Busca un medicamento y edita la entrada que corresponde.
        </div>
      </div>

      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        padding: '12px',
        marginBottom: '16px'
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '12px', alignItems: 'end' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px', fontWeight: 600 }}>
              Medicamento
            </label>
            <ComboBox
              items={filteredMedicines}
              value={selectedMedicine}
              onChange={(m) => setSelectedMedicine(m || null)}
              getItemKey={(m) => m.id}
              getItemLabel={(m) => `${m.codigo} - ${m.nombreComercial}`}
              inputPlaceholder="Escribe nombre o código..."
              maxResults={30}
              styles={{
                input: {
                  padding: '8px 10px',
                  borderRadius: '6px',
                  fontSize: '13px'
                },
                dropdown: {
                  borderRadius: '8px'
                }
              }}
            />
          </div>

          <div style={{ textAlign: 'right', fontSize: '12px', color: '#555' }}>
            {selectedMedicine?.id && (
              <div>
                {loading ? 'Cargando...' : (
                  <>
                    Resultados: <b>{pagination?.total ?? receipts.length}</b>
                  </>
                )}
              </div>
            )}
            {error && (
              <div style={{ color: '#b91c1c', marginTop: '6px' }}>
                {String(error)}
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        overflow: 'hidden'
      }}>
        <div style={{ padding: '12px 12px 0 12px', fontWeight: 700, color: '#2c3e50' }}>
          Entradas encontradas
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#f3f4f6' }}>
                <th style={{ textAlign: 'left', padding: '10px', borderBottom: '1px solid #e5e7eb' }}>Fecha</th>
                <th style={{ textAlign: 'left', padding: '10px', borderBottom: '1px solid #e5e7eb' }}>Proveedor</th>
                <th style={{ textAlign: 'left', padding: '10px', borderBottom: '1px solid #e5e7eb' }}>Items</th>
                <th style={{ textAlign: 'right', padding: '10px', borderBottom: '1px solid #e5e7eb' }}>Acción</th>
              </tr>
            </thead>
            <tbody>
              {!selectedMedicine?.id && (
                <tr>
                  <td colSpan={4} style={{ padding: '14px', color: '#6b7280' }}>
                    Selecciona un medicamento para ver las entradas.
                  </td>
                </tr>
              )}
              {selectedMedicine?.id && !loading && receipts.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ padding: '14px', color: '#6b7280' }}>
                    No se encontraron entradas para este medicamento.
                  </td>
                </tr>
              )}
              {receipts.map(r => (
                <tr key={r.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: '10px' }}>
                    {r?.date ? new Date(r.date).toLocaleDateString() : '-'}
                  </td>
                  <td style={{ padding: '10px' }}>
                    {r?.supplier?.name ?? '-'}
                  </td>
                  <td style={{ padding: '10px' }}>
                    {Array.isArray(r?.receiptitem) ? r.receiptitem.length : 0}
                  </td>
                  <td style={{ padding: '10px', textAlign: 'right' }}>
                    <button
                      onClick={() => navigate(`/receipts/${r.id}/edit`)}
                      style={{
                        padding: '6px 10px',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        background: 'white',
                        cursor: 'pointer',
                        fontWeight: 600
                      }}
                    >
                      Editar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {selectedMedicine?.id && pagination && (
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px',
            background: '#fafafa'
          }}>
            <button
              disabled={!pagination?.hasPrev}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              style={{
                padding: '6px 10px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                background: pagination?.hasPrev ? 'white' : '#f3f4f6',
                cursor: pagination?.hasPrev ? 'pointer' : 'not-allowed',
                color: '#111827'
              }}
            >
              Anterior
            </button>
            <div style={{ fontSize: '12px', color: '#4b5563' }}>
              Página <b>{pagination.page}</b> de <b>{pagination.totalPages}</b>
            </div>
            <button
              disabled={!pagination?.hasNext}
              onClick={() => setPage(p => p + 1)}
              style={{
                padding: '6px 10px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                background: pagination?.hasNext ? 'white' : '#f3f4f6',
                cursor: pagination?.hasNext ? 'pointer' : 'not-allowed',
                color: '#111827'
              }}
            >
              Siguiente
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

