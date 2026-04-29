import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/http';
import ComboBox from '../components/ComboBox';

function receiptComboLabel(r) {
  const n = Array.isArray(r?.receiptitem) ? r.receiptitem.length : 0;
  const sup = r?.supplier?.name ?? '-';
  const d = r?.date ? new Date(r.date).toLocaleDateString() : '-';
  return `#${r.id} — ${sup} — ${n} ítems (${d})`;
}

function receiptSearchText(r) {
  const sup = r?.supplier?.name ?? '';
  const d = r?.date ? new Date(r.date).toLocaleDateString() : '';
  return `${r.id} ${sup} ${d}`.trim();
}

export default function ReceiptsHistory() {
  const navigate = useNavigate();

  const [medicines, setMedicines] = useState([]);
  const [selectedMedicine, setSelectedMedicine] = useState(null);

  /** YYYY-MM-DD vacío = sin filtrar por día (mismo comportamiento que antes) */
  const [filterDay, setFilterDay] = useState('');

  const [receipts, setReceipts] = useState([]);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
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
  }, [selectedMedicine?.id, filterDay]);

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
        const dayParam = filterDay.trim();
        const { data } = await api.get('/receipts', {
          params: {
            medicineId: Number(selectedMedicine.id),
            page,
            limit: 20,
            ...(dayParam ? { day: dayParam } : {})
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
  }, [selectedMedicine?.id, page, filterDay]);

  useEffect(() => {
    setSelectedReceipt((prev) => {
      if (!prev) return null;
      return receipts.some((r) => r.id === prev.id) ? prev : null;
    });
  }, [receipts]);

  const openEdit = () => {
    if (!selectedReceipt?.id) return;
    navigate(`/receipts/${selectedReceipt.id}/edit`);
  };

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
          Elige medicamento; opcionalmente un día; luego la entrada y abre la edición.
        </div>
      </div>

      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        padding: '12px',
        marginBottom: '16px'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 200px 1fr',
          gap: '16px',
          alignItems: 'end'
        }}>
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

          <div>
            <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px', fontWeight: 600 }}>
              Fecha de la entrada
            </label>
            <input
              type="date"
              value={filterDay}
              onChange={(e) => setFilterDay(e.target.value)}
              disabled={!selectedMedicine?.id}
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: '6px',
                fontSize: '13px',
                border: '1px solid #ced4da',
                boxSizing: 'border-box'
              }}
            />
            <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>
              Vacío = cualquier día
            </div>
          </div>

          <div style={{ textAlign: 'right', fontSize: '12px', color: '#555' }}>
            {selectedMedicine?.id && (
              <div>
                {loading ? 'Cargando...' : (
                  <>
                    Entradas: <b>{pagination?.total ?? receipts.length}</b>
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
        overflow: 'visible'
      }}>
        <div style={{ padding: '12px 12px 0 12px', fontWeight: 700, color: '#2c3e50' }}>
          Entrada a editar
        </div>

        <div style={{ padding: '12px 16px 16px 16px' }}>
          {!selectedMedicine?.id && (
            <div style={{ padding: '8px 0', color: '#6b7280', fontSize: '13px' }}>
              Selecciona un medicamento para listar entradas.
            </div>
          )}

          {selectedMedicine?.id && !loading && receipts.length === 0 && (
            <div style={{ padding: '8px 0', color: '#6b7280', fontSize: '13px' }}>
              {filterDay.trim()
                ? 'No hay entradas ese día con este medicamento.'
                : 'No se encontraron entradas para este medicamento.'}
            </div>
          )}

          {selectedMedicine?.id && receipts.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '12px', alignItems: 'end' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px', fontWeight: 600 }}>
                  Entrada (esta página)
                </label>
                <ComboBox
                  items={receipts}
                  value={selectedReceipt}
                  onChange={(r) => setSelectedReceipt(r || null)}
                  getItemKey={(r) => r.id}
                  getItemLabel={receiptComboLabel}
                  getSearchText={receiptSearchText}
                  inputPlaceholder="Busca por #id, proveedor o fecha..."
                  maxResults={30}
                  disabled={loading}
                  styles={{
                    root: { position: 'relative', zIndex: 2 },
                    input: {
                      padding: '8px 10px',
                      borderRadius: '6px',
                      fontSize: '13px'
                    },
                    dropdown: {
                      borderRadius: '8px',
                      zIndex: 100
                    }
                  }}
                />
              </div>
              <button
                type="button"
                disabled={!selectedReceipt?.id}
                onClick={openEdit}
                style={{
                  padding: '10px 18px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: selectedReceipt?.id ? '#1976d2' : '#e5e7eb',
                  color: selectedReceipt?.id ? 'white' : '#9ca3af',
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: selectedReceipt?.id ? 'pointer' : 'not-allowed',
                  whiteSpace: 'nowrap'
                }}
              >
                Abrir edición
              </button>
            </div>
          )}

          {selectedMedicine?.id && pagination && pagination.totalPages > 1 && (
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '16px',
              paddingTop: '12px',
              borderTop: '1px solid #f0f0f0'
            }}>
              <button
                disabled={!pagination?.hasPrev}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
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
                onClick={() => setPage((p) => p + 1)}
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
    </div>
  );
}
