import { useState, useCallback, useEffect, useRef } from 'react';
import api from '../../api/http';

const emptyForm = () => ({
  codigo: '',
  nombreComercial: '',
  nombreGenerico: '',
  formaFarmaceutica: 'comprimidos',
  concentracion: 'mg',
  presentacion: 'blister',
  pesoKg: ''
});

const DatosTab = ({
  medicines,
  onRefresh,
  loading,
  medicineIdFromSearch = null,
  onConsumedMedicineFromSearch
}) => {
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const editingIdRef = useRef(editingId);
  editingIdRef.current = editingId;

  const applyMedicineForEdit = useCallback((medicine) => {
    setEditingId(medicine.id);
    setForm({
      codigo: String(medicine.codigo ?? ''),
      nombreComercial: medicine.nombreComercial,
      nombreGenerico: medicine.nombreGenerico,
      formaFarmaceutica: medicine.formaFarmaceutica,
      concentracion: medicine.concentracion,
      presentacion: medicine.presentacion,
      pesoKg: medicine.pesoKg != null && medicine.pesoKg !== '' ? String(medicine.pesoKg) : ''
    });
  }, []);

  const fetchSuggestedCodigo = useCallback(async () => {
    try {
      const { data } = await api.get('/medicines/next-codigo');
      if (data?.codigo == null) return;
      setForm((f) => {
        if (editingIdRef.current) return f;
        return { ...f, codigo: String(data.codigo) };
      });
    } catch (e) {
      console.error('No se pudo obtener código sugerido:', e);
    }
  }, []);

  useEffect(() => {
    if (medicineIdFromSearch) return;
    fetchSuggestedCodigo();
  }, [fetchSuggestedCodigo, medicineIdFromSearch]);

  useEffect(() => {
    const raw = (medicineIdFromSearch ?? '').trim();
    if (!raw) return;

    const id = Number(raw);
    if (!Number.isInteger(id) || id < 1) {
      onConsumedMedicineFromSearch?.();
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const { data } = await api.get(`/medicines/${id}`);
        if (cancelled) return;
        applyMedicineForEdit(data);
      } catch (error) {
        if (!cancelled) {
          const msg =
            error?.response?.data?.detail ||
            error?.response?.data?.error ||
            'No se pudo cargar el medicamento';
          alert(msg);
        }
      } finally {
        if (!cancelled) {
          onConsumedMedicineFromSearch?.();
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [medicineIdFromSearch, applyMedicineForEdit, onConsumedMedicineFromSearch]);

  const formasFarmaceuticas = [
    { value: 'comprimidos', label: 'Comprimidos' },
    { value: 'capsulas', label: 'Cápsulas' },
    { value: 'jarabe', label: 'Jarabe' },
    { value: 'suspension', label: 'Suspensión' },
    { value: 'inyectables', label: 'Inyectables' },
    { value: 'unguentos', label: 'Ungüentos' },
    { value: 'gel', label: 'Gel' },
    { value: 'pomadas', label: 'Pomadas' },
    { value: 'soluciones', label: 'Soluciones' },
    { value: 'ovulos', label: 'Óvulos' },
    { value: 'supositorios', label: 'Supositorios' },
    { value: 'otros', label: 'Otros' }
  ];

  const concentraciones = [
    { value: 'mg', label: 'mg' },
    { value: 'ml', label: 'ml' },
    { value: 'ui', label: 'UI' },
    { value: 'estandar', label: 'Estándar' }
  ];

  const presentaciones = [
    { value: 'blister', label: 'Blister' },
    { value: 'tubo', label: 'Tubo' },
    { value: 'frasco', label: 'Frasco' },
    { value: 'sobres', label: 'Sobres' },
    { value: 'ampollas', label: 'Ampollas' },
    { value: 'otros', label: 'Otros' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editingId && !String(form.codigo ?? '').trim()) {
      alert('El código es obligatorio al editar.');
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        await api.put(`/medicines/${editingId}`, form);
      } else {
        const payload = {
          ...form,
          codigo: String(form.codigo ?? '').trim()
        };
        await api.post('/medicines', payload);
      }
      setForm(emptyForm());
      setEditingId(null);
      onRefresh();
      fetchSuggestedCodigo();
    } catch (error) {
      const msg = error?.response?.data?.detail || error?.response?.data?.error || 'Error al guardar';
      alert(msg);
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (medicine) => applyMedicineForEdit(medicine);

  const cancelEdit = () => {
    setEditingId(null);
    setForm(emptyForm());
    fetchSuggestedCodigo();
  };

  const deleteMedicine = async (id) => {
    if (!confirm('¿Eliminar este medicamento?')) return;
    try {
      await api.delete(`/medicines/${id}`);
      onRefresh();
    } catch (error) {
      const msg = error?.response?.data?.detail || error?.response?.data?.error || 'Error al eliminar';
      alert(msg);
    }
  };

  return (
    <div style={{ 
      padding: '24px 0', 
      flex: 1, 
      overflow: 'auto',
      minHeight: '0'
    }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', padding: '0 24px' }}>
        {/* Formulario */}
        <div>
          <h3 style={{ color: '#495057', marginBottom: '16px' }}>
            {editingId ? 'Editar Medicamento' : 'Agregar Nuevo Medicamento'}
          </h3>
          <form onSubmit={handleSubmit} style={{
            backgroundColor: '#f8f9fa',
            padding: '20px',
            borderRadius: '8px',
            border: '1px solid #e9ecef'
          }}>
            <div style={{ display: 'grid', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500', color: '#495057' }}>
                  Código {editingId ? '*' : '(siguiente sugerido, editable)'}
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={form.codigo}
                  onChange={(e) => setForm({...form, codigo: e.target.value})}
                  required={!!editingId}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #ced4da',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500', color: '#495057' }}>
                  Nombre Comercial *
                </label>
                <input
                  type="text"
                  value={form.nombreComercial}
                  onChange={(e) => setForm({...form, nombreComercial: e.target.value})}
                  required
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #ced4da',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500', color: '#495057' }}>
                  Nombre Genérico *
                </label>
                <input
                  type="text"
                  value={form.nombreGenerico}
                  onChange={(e) => setForm({...form, nombreGenerico: e.target.value})}
                  required
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #ced4da',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500', color: '#495057' }}>
                    Forma Farmacéutica
                  </label>
                  <select
                    value={form.formaFarmaceutica}
                    onChange={(e) => setForm({...form, formaFarmaceutica: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #ced4da',
                      borderRadius: '4px',
                      fontSize: '14px'
                    }}
                  >
                    {formasFarmaceuticas.map(f => (
                      <option key={f.value} value={f.value}>{f.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500', color: '#495057' }}>
                    Concentración
                  </label>
                  <select
                    value={form.concentracion}
                    onChange={(e) => setForm({...form, concentracion: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #ced4da',
                      borderRadius: '4px',
                      fontSize: '14px'
                    }}
                  >
                    {concentraciones.map(c => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500', color: '#495057' }}>
                  Presentación
                </label>
                <select
                  value={form.presentacion}
                  onChange={(e) => setForm({...form, presentacion: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #ced4da',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                >
                  {presentaciones.map(p => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500', color: '#495057' }}>
                    Peso (Kg)
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    value={form.pesoKg}
                    onChange={(e) => setForm({...form, pesoKg: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #ced4da',
                      borderRadius: '4px',
                      fontSize: '14px'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    flex: 1,
                    padding: '10px 20px',
                    backgroundColor: '#1976d2',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: saving ? 'not-allowed' : 'pointer',
                    opacity: saving ? 0.7 : 1
                  }}
                >
                  {saving ? 'Guardando...' : (editingId ? 'Actualizar' : 'Guardar')}
                </button>
                {editingId && (
                  <button
                    type="button"
                    onClick={cancelEdit}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: '#6c757d',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer'
                    }}
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>

        {/* Lista de medicamentos */}
        <div>
          <h3 style={{ color: '#495057', marginBottom: '16px' }}>
            Medicamentos Registrados
          </h3>
          <div style={{
            backgroundColor: '#f8f9fa',
            borderRadius: '8px',
            border: '1px solid #e9ecef',
            maxHeight: '500px',
            overflow: 'auto'
          }}>
            {loading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#6c757d' }}>
                Cargando medicamentos...
              </div>
            ) : medicines.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#6c757d' }}>
                No hay medicamentos registrados
              </div>
            ) : (
              <div style={{ padding: '16px' }}>
                {medicines.map(medicine => (
                  <div
                    key={medicine.id}
                    style={{
                      backgroundColor: 'white',
                      padding: '16px',
                      marginBottom: '12px',
                      borderRadius: '6px',
                      border: '1px solid #e9ecef',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                          <span style={{
                            backgroundColor: '#e3f2fd',
                            color: '#1976d2',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: '600'
                          }}>
                            {medicine.codigo}
                          </span>
                          <span style={{ fontSize: '12px', color: '#6c757d' }}>
                            Stock: {medicine.stock}
                          </span>
                        </div>
                        <h4 style={{ margin: '0 0 4px 0', color: '#2c3e50', fontSize: '16px' }}>
                          {medicine.nombreComercial}
                        </h4>
                        <p style={{ margin: '0 0 8px 0', color: '#6c757d', fontSize: '14px' }}>
                          {medicine.nombreGenerico}
                        </p>
                        <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: '#6c757d' }}>
                          <span>{medicine.formaFarmaceutica}</span>
                          <span>•</span>
                          <span>{medicine.concentracion}</span>
                          <span>•</span>
                          <span>{medicine.presentacion}</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => startEdit(medicine)}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#17a2b8',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '12px',
                            cursor: 'pointer'
                          }}
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => deleteMedicine(medicine.id)}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#dc3545',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '12px',
                            cursor: 'pointer'
                          }}
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DatosTab;
